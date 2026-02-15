import { empathyLedgerClient, EmpathyLedgerStory, EmpathyLedgerProfile } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';

// Lazy-load client to avoid build-time errors
let justiceHubClient: ReturnType<typeof createClient> | null = null;

function getJusticeHubClient() {
  if (!justiceHubClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase credentials not configured for JusticeHub client');
      // Return a dummy client during build time
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }

    justiceHubClient = createClient(url, key);
  }
  return justiceHubClient;
}

// Justice-related themes/tags (updated to match actual Empathy Ledger data)
const JUSTICE_THEMES = [
  // Direct justice themes
  'youth-justice',
  'Justice',
  'Justice Reinvestment',
  'indigenous justice reform',
  'preventing justice system involvement',
  'preventive justice',
  'recidivism_reduction',

  // Related support themes
  'Drug and Alcohol',
  'Homelessness',
  'homelessness support',
  'mental_health',

  // Family & youth themes
  'Family',
  'family_healing',
  'family_support',
  'youth empowerment',
  'youth-advocacy',
  'youth_empowerment',

  // Community safety
  'community_safety',

  // Legacy themes (keep for future compatibility)
  'juvenile-justice',
  'incarceration',
  'rehabilitation',
  'restorative-justice',
  'community-justice'
];

/**
 * Check if a story is justice-related
 */
export function isJusticeRelated(story: EmpathyLedgerStory): boolean {
  // Has service link (linked to JusticeHub service)
  if (story.service_id) return true;

  // Has justice theme (flexible matching - case insensitive and partial)
  if (story.themes?.some(theme =>
    JUSTICE_THEMES.some(jt =>
      theme.toLowerCase().includes(jt.toLowerCase()) ||
      jt.toLowerCase().includes(theme.toLowerCase())
    )
  )) {
    return true;
  }

  // Story category is youth justice
  if (story.story_category?.toLowerCase().includes('justice')) {
    return true;
  }

  // Story type indicates legal/justice context
  if (story.story_type?.toLowerCase().includes('legal') ||
      story.story_type?.toLowerCase().includes('court') ||
      story.story_type?.toLowerCase().includes('justice')) {
    return true;
  }

  return false;
}

/**
 * Get full profile data with justice-related stories
 * Note: Due to RLS recursion issue on profiles table, we fetch profile data via stories
 */
export async function getProfileWithJusticeStories(empathyLedgerProfileId: string) {
  // Try direct profile fetch first (may fail due to RLS recursion)
  let profile: EmpathyLedgerProfile | null = null;

  const { data: profileData, error: profileError } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .eq('id', empathyLedgerProfileId)
    .single();

  if (!profileError && profileData) {
    profile = profileData;
  } else if (profileError?.message?.includes('infinite recursion')) {
    // Known RLS issue - create minimal profile from ID
    console.warn('Profile RLS recursion - using minimal profile data');
    profile = {
      id: empathyLedgerProfileId,
      tenant_id: '',
      display_name: undefined,
      bio: undefined,
      avatar_url: undefined,
    };
  } else {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  // Fetch their stories
  const { data: allStories } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .or(`author_id.eq.${empathyLedgerProfileId},storyteller_id.eq.${empathyLedgerProfileId}`)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false });

  // Filter to justice-related stories only
  const justiceStories = (allStories || []).filter(isJusticeRelated);

  // Get JusticeHub appearances
  const jhClient = getJusticeHubClient();
  const { data: appearances } = await jhClient
    .from('profile_appearances')
    .select('*')
    .eq('empathy_ledger_profile_id', empathyLedgerProfileId);

  return {
    profile,
    organization: null, // Organization join removed due to RLS issues
    justiceStories,
    allStories: allStories || [],
    appearances: appearances || []
  };
}

/**
 * Get profiles appearing on a specific JusticeHub item
 */
export async function getProfilesFor(type: 'program' | 'service' | 'article', id: string) {
  // Get appearances
  const jhClient = getJusticeHubClient();
  const { data: appearances } = await jhClient
    .from('profile_appearances')
    .select('*')
    .eq('appears_on_type', type)
    .eq('appears_on_id', id)
    .order('featured', { ascending: false });

  if (!appearances || appearances.length === 0) {
    return [];
  }

  // Fetch full profile data from Empathy Ledger
  const profiles = await Promise.all(
    appearances.map(async (appearance) => {
      const data = await getProfileWithJusticeStories(appearance.empathy_ledger_profile_id);
      return {
        ...data,
        appearanceRole: appearance.role,
        appearanceExcerpt: appearance.story_excerpt,
        isFeatured: appearance.featured
      };
    })
  );

  return profiles.filter(p => p !== null);
}

/**
 * Create a profile appearance (link profile to JusticeHub content)
 */
export async function createProfileAppearance(params: {
  empathyLedgerProfileId: string;
  appearsOnType: 'program' | 'service' | 'article';
  appearsOnId: string;
  role?: string;
  storyExcerpt?: string;
  featured?: boolean;
}) {
  const jhClient = getJusticeHubClient();
  const { data, error } = await jhClient
    .from('profile_appearances')
    .upsert({
      empathy_ledger_profile_id: params.empathyLedgerProfileId,
      appears_on_type: params.appearsOnType,
      appears_on_id: params.appearsOnId,
      role: params.role,
      story_excerpt: params.storyExcerpt,
      featured: params.featured || false
    }, {
      onConflict: 'empathy_ledger_profile_id,appears_on_type,appears_on_id'
    });

  if (error) {
    console.error('Error creating profile appearance:', error);
    return null;
  }

  return data;
}

/**
 * Get all justice-related stories from Empathy Ledger
 */
export async function getAllJusticeStories(limit = 1000) {
  // Get all public stories (we'll filter for justice themes afterwards)
  const { data: allStories, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }

  // Filter to justice-related only
  const justiceStories = (allStories || []).filter(isJusticeRelated);

  console.log(`Found ${justiceStories.length} justice stories out of ${allStories?.length || 0} total public stories`);

  return justiceStories;
}

/**
 * Sync stories to create profile appearances automatically
 */
export async function syncProfilesFromStories() {
  const stories = await getAllJusticeStories(100);

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (const story of stories) {
    // Need both profile and service link
    const profileId = story.author_id || story.storyteller_id;
    if (!profileId) {
      results.skipped++;
      continue;
    }

    if (story.service_id) {
      // Link to service
      const result = await createProfileAppearance({
        empathyLedgerProfileId: profileId,
        appearsOnType: 'service',
        appearsOnId: story.service_id,
        role: 'service user',
        storyExcerpt: story.summary || story.content?.substring(0, 200),
        featured: story.is_featured
      });

      if (result) {
        results.success++;
      } else {
        results.failed++;
      }
    } else {
      results.skipped++;
    }
  }

  return results;
}

/**
 * Get featured profiles for homepage/highlights
 */
export async function getFeaturedProfiles(limit = 6) {
  const jhClient = getJusticeHubClient();
  const { data: appearances } = await jhClient
    .from('profile_appearances')
    .select('empathy_ledger_profile_id')
    .eq('featured', true)
    .limit(limit);

  if (!appearances) return [];

  const profiles = await Promise.all(
    appearances.map(a => getProfileWithJusticeStories(a.empathy_ledger_profile_id))
  );

  return profiles.filter(p => p !== null);
}

/**
 * Search profiles by name or organization
 */
export async function searchProfiles(query: string) {
  const { data: profiles } = await empathyLedgerClient
    .from('profiles')
    .select(`
      *,
      organization:organizations!profiles_primary_organization_id_fkey(*)
    `)
    .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
    .limit(20);

  if (!profiles) return [];

  // Filter to those with justice stories
  const profilesWithStories = await Promise.all(
    profiles.map(async (profile) => {
      const data = await getProfileWithJusticeStories(profile.id);
      return data && data.justiceStories.length > 0 ? data : null;
    })
  );

  return profilesWithStories.filter(p => p !== null);
}
