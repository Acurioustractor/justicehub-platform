import { createClient } from '@supabase/supabase-js';

/**
 * Empathy Ledger Supabase Client
 * Multi-tenant cultural storytelling platform
 *
 * ## Consent Model
 *
 * Empathy Ledger uses a three-tier consent model for content sharing:
 *
 * 1. **Strictly Private** (privacy_level: 'private')
 *    - Only visible to the storyteller and authorized organization staff
 *    - Never synced to external platforms like JusticeHub
 *
 * 2. **Community Controlled** (privacy_level: 'community')
 *    - Visible within the organization's community
 *    - May require elder approval before broader sharing
 *    - Not exposed to public APIs
 *
 * 3. **Public Knowledge Commons** (privacy_level: 'public' AND is_public: true)
 *    - Explicitly consented for public display
 *    - Can be syndicated to JusticeHub and other platforms
 *    - Includes cultural warnings and attribution
 *
 * ## JusticeHub Integration
 *
 * For profiles to appear on JusticeHub, they must have:
 * - justicehub_enabled = true (opt-in flag)
 *
 * For stories to appear on JusticeHub, they must have:
 * - is_public = true
 * - privacy_level = 'public'
 *
 * Additional cultural controls:
 * - cultural_warnings: Array of warnings to display before content
 * - requires_elder_approval: If true, must have elder_approved_at set
 * - cultural_sensitivity_level: Indicates level of cultural sensitivity
 */
export const empathyLedgerClient = createClient(
  process.env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs'
);

/**
 * Consent levels for privacy control
 */
export type ConsentLevel = 'private' | 'community' | 'public';

/**
 * Consent info returned with API responses
 */
export interface ConsentInfo {
  privacy_level: ConsentLevel;
  is_public: boolean;
  justicehub_enabled?: boolean;
  elder_approval_required?: boolean;
  description: string;
}

// Type definitions based on Empathy Ledger schema
export interface EmpathyLedgerOrganization {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  website_url?: string;
  contact_email?: string;
  logo_url?: string;
  cultural_protocols?: any;
  cultural_significance?: string;
  indigenous_controlled?: boolean;
  traditional_country?: string;
  language_groups?: string[];
  service_locations?: string[];
  coordinates?: { lat: number; lng: number };
  empathy_ledger_enabled?: boolean;
  elder_approval_required?: boolean;
}

/**
 * Empathy Ledger Story
 *
 * Consent Controls:
 * - is_public: Must be true for story to be visible outside organization
 * - privacy_level: Must be 'public' for JusticeHub syndication
 * - requires_elder_approval: If true, elder_approved_at must be set
 * - has_explicit_consent: Indicates storyteller gave explicit consent
 *
 * Cultural Safety:
 * - cultural_warnings: Array of warnings to show before content
 * - cultural_sensitivity_level: Level of cultural sensitivity (e.g., 'low', 'medium', 'high')
 */
export interface EmpathyLedgerStory {
  id: string;
  tenant_id: string;
  author_id?: string;
  storyteller_id?: string;
  organization_id?: string;
  project_id?: string;
  service_id?: string; // Link to JusticeHub service
  title: string;
  content: string;
  summary?: string;
  story_image_url?: string;
  media_urls?: string[];
  themes?: string[];
  story_category?: string;
  story_type?: string;
  // Core consent controls
  privacy_level: ConsentLevel;
  is_public: boolean;
  is_featured?: boolean;
  // Cultural safety controls
  cultural_sensitivity_level?: string;
  cultural_warnings?: string[];
  // Elder approval workflow
  requires_elder_approval?: boolean;
  elder_approved_by?: string;
  elder_approved_at?: string;
  // Explicit consent tracking
  has_explicit_consent?: boolean;
  consent_details?: Record<string, unknown>;
  // Location data
  location_text?: string;
  latitude?: number;
  longitude?: number;
  // Timestamps
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a story can be displayed on JusticeHub
 * Enforces all consent requirements
 */
export function canDisplayOnJusticeHub(story: EmpathyLedgerStory): boolean {
  // Must be public
  if (!story.is_public) return false;
  if (story.privacy_level !== 'public') return false;

  // If elder approval required, must have been approved
  if (story.requires_elder_approval && !story.elder_approved_at) return false;

  return true;
}

/**
 * Check if a story has cultural warnings that should be shown
 */
export function hasCulturalWarnings(story: EmpathyLedgerStory): boolean {
  return !!(story.cultural_warnings && story.cultural_warnings.length > 0);
}

/**
 * Get consent status for a story
 */
export function getStoryConsentStatus(story: EmpathyLedgerStory): {
  canDisplay: boolean;
  requiresElderApproval: boolean;
  isElderApproved: boolean;
  hasCulturalWarnings: boolean;
  consentLevel: ConsentLevel;
} {
  return {
    canDisplay: canDisplayOnJusticeHub(story),
    requiresElderApproval: !!story.requires_elder_approval,
    isElderApproved: !!story.elder_approved_at,
    hasCulturalWarnings: hasCulturalWarnings(story),
    consentLevel: story.privacy_level
  };
}

/**
 * Empathy Ledger Profile
 *
 * Consent Control:
 * - justicehub_enabled: Must be true for profile to appear on JusticeHub
 * - justicehub_featured: If true, profile is featured on JusticeHub
 * - justicehub_role: Role displayed on JusticeHub (e.g., "Youth Advocate")
 */
export interface EmpathyLedgerProfile {
  id: string;
  user_id?: string;
  tenant_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  primary_organization_id?: string;
  // JusticeHub consent controls
  justicehub_enabled?: boolean;
  justicehub_featured?: boolean;
  justicehub_role?: string;
  justicehub_synced_at?: string;
}

export interface EmpathyLedgerProject {
  id: string;
  tenant_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  location?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for fetching Empathy Ledger data

/**
 * Get public stories linked to a JusticeHub service
 * Note: Avoided profile join due to RLS recursion issue in Empathy Ledger
 */
export async function getStoriesForService(serviceId: string) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(*)
    `)
    .eq('service_id', serviceId)
    .eq('is_public', true)
    .eq('privacy_level', 'public');

  if (error) {
    console.error('Error fetching Empathy Ledger stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get Indigenous-controlled organizations
 */
export async function getIndigenousOrganizations() {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('indigenous_controlled', true)
    .eq('empathy_ledger_enabled', true);

  if (error) {
    console.error('Error fetching Indigenous organizations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get public stories with cultural context
 * Note: Avoided profile join due to RLS recursion issue in Empathy Ledger
 */
export async function getPublicStories(limit = 10) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(name, slug, traditional_country, indigenous_controlled)
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching public stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get featured public stories for homepage display
 * Note: We avoid joining on organizations due to RLS policy issues in Empathy Ledger
 * Priority: 1) Featured stories with images, 2) Stories with images, 3) Featured stories, 4) Recent stories
 * Images are prioritized for visual appeal on the homepage
 */
export async function getFeaturedStories(limit = 3) {
  // First try to get featured stories with images (best of both worlds)
  let { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      id,
      title,
      summary,
      content,
      story_image_url,
      story_category,
      is_featured,
      published_at
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .eq('is_featured', true)
    .not('story_image_url', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  // If not enough, get any stories with images (prioritize visual content)
  if (!data || data.length < limit) {
    const existingIds = (data || []).map(s => s.id);
    const remaining = limit - (data?.length || 0);

    const { data: withImages } = await empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_category,
        is_featured,
        published_at
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .not('story_image_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(remaining + existingIds.length);

    if (withImages) {
      const newStories = withImages.filter(s => !existingIds.includes(s.id));
      data = [...(data || []), ...newStories.slice(0, remaining)];
    }
  }

  // If still not enough, get featured stories without images
  if (!data || data.length < limit) {
    const existingIds = (data || []).map(s => s.id);
    const remaining = limit - (data?.length || 0);

    const { data: featured } = await empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_category,
        is_featured,
        published_at
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(remaining + existingIds.length);

    if (featured) {
      const newStories = featured.filter(s => !existingIds.includes(s.id));
      data = [...(data || []), ...newStories.slice(0, remaining)];
    }
  }

  // Final fallback: get most recent public stories
  if (!data || data.length < limit) {
    const existingIds = (data || []).map(s => s.id);
    const remaining = limit - (data?.length || 0);

    const { data: recent, error: recentError } = await empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_category,
        is_featured,
        published_at
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .order('published_at', { ascending: false })
      .limit(remaining + existingIds.length);

    if (recent) {
      const newStories = recent.filter(s => !existingIds.includes(s.id));
      data = [...(data || []), ...newStories.slice(0, remaining)];
    }
    if (recentError) error = recentError;
  }

  if (error) {
    console.error('Error fetching featured stories:', error);
    return [];
  }

  // Create excerpt from content if no summary
  return (data || []).map(story => ({
    ...story,
    excerpt: story.summary || (story.content ? story.content.substring(0, 200) + '...' : '')
  }));
}

// Justice-related keywords for filtering stories for JusticeHub
// Using specific keywords to avoid false positives from partial matching
const JUSTICE_KEYWORDS = [
  // Direct justice terms
  'justice', 'juvenile', 'incarceration', 'rehabilitation', 'restorative',
  'recidivism', 'court', 'legal', 'prison', 'detention',
  // Youth-specific
  'youth empowerment', 'youth advocacy', 'youth engagement', 'youth rehabilitation',
  'young people', 'at-risk youth', 'youth support',
  // Support services
  'drug and alcohol', 'homelessness', 'mental health',
  // Family
  'family healing', 'family support',
  // Community safety
  'community safety', 'crime prevention',
  // Indigenous context
  'indigenous justice', 'cultural healing'
];

/**
 * Check if a story is justice-related based on themes, category, or service link
 * Uses keyword matching to identify relevant content
 */
function isJusticeRelatedStory(story: {
  service_id?: string | null;
  themes?: string[] | null;
  story_category?: string | null;
  story_type?: string | null;
  title?: string | null;
}): boolean {
  // Has service link (linked to JusticeHub service)
  if (story.service_id) return true;

  // Check title for justice keywords
  const title = (story.title || '').toLowerCase();
  if (JUSTICE_KEYWORDS.some(kw => title.includes(kw.toLowerCase()))) {
    return true;
  }

  // Check themes for justice keywords
  if (story.themes?.some(theme => {
    const themeLower = theme.toLowerCase();
    return JUSTICE_KEYWORDS.some(kw => themeLower.includes(kw.toLowerCase()));
  })) {
    return true;
  }

  // Story category contains justice
  if (story.story_category?.toLowerCase().includes('justice')) {
    return true;
  }

  // Story type indicates legal/justice context
  const storyType = (story.story_type || '').toLowerCase();
  if (storyType.includes('legal') || storyType.includes('court') || storyType.includes('justice')) {
    return true;
  }

  return false;
}

/**
 * Check if content looks like a raw transcript (not curated)
 */
function isRawTranscript(story: { title?: string; summary?: string; content?: string }): boolean {
  const title = story.title || '';
  const summary = story.summary || '';
  const content = story.content || '';

  // "Key Story" titles are raw transcripts
  if (title.includes('Key Story')) return true;

  // Content/summary starting with timestamps like [00:00:00] or names followed by ===
  if (/^\[?\d{2}:\d{2}/.test(summary) || /^\[?\d{2}:\d{2}/.test(content)) return true;
  if (/^[A-Z][a-z]+ [A-Z][a-z]*\s*===/.test(summary) || /^[A-Z][a-z]+ [A-Z][a-z]*\s*===/.test(content)) return true;

  // Summary that looks like dialogue/transcript
  if (/^["']?text["']?\s*:\s*["']/.test(summary)) return true;

  // Very short non-descriptive summaries that are just the title repeated
  if (summary && summary === title) return true;

  return false;
}

/**
 * Get featured stories for JusticeHub homepage
 * Prioritizes: 1) justicehub_featured flag, 2) stories with images, 3) curated content
 * Filters out raw transcripts and poor quality content
 */
export async function getFeaturedJusticeStories(limit = 6) {
  // Fetch more stories than needed so we can filter
  const fetchLimit = limit * 10;

  // Try to get justicehub_featured stories first (if field exists)
  let { data: featuredStories } = await empathyLedgerClient
    .from('stories')
    .select(`
      id, title, summary, content, story_image_url, story_category,
      story_type, is_featured, published_at, themes, service_id
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .not('title', 'like', '%Key Story%')
    .order('published_at', { ascending: false })
    .limit(fetchLimit);

  if (!featuredStories) featuredStories = [];

  // Filter out raw transcripts and poor content
  const qualityStories = featuredStories.filter(story => !isRawTranscript(story));

  // Score and sort stories
  const scored = qualityStories.map(story => {
    let score = 0;
    // Has image - highest priority for visual appeal
    if (story.story_image_url) score += 100;
    // Has proper summary (not just title repeated)
    if (story.summary && story.summary !== story.title && story.summary.length > 50) score += 50;
    // Is featured in EL
    if (story.is_featured) score += 30;
    // Has service link (connected to JusticeHub)
    if (story.service_id) score += 40;
    // Justice-related themes
    if (isJusticeRelatedStory(story)) score += 20;

    return { ...story, _score: score };
  });

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score);

  // Return top results with clean excerpt
  return scored.slice(0, limit).map(story => {
    // Clean up excerpt - don't show transcript-style content
    let excerpt = story.summary || '';
    if (!excerpt || excerpt.length < 20) {
      excerpt = story.content ? story.content.substring(0, 200) : '';
    }
    // Remove any leading quotes or "text": patterns
    excerpt = excerpt.replace(/^["']?text["']?\s*:\s*["']?/, '').trim();
    if (excerpt.length > 200) excerpt = excerpt.substring(0, 200) + '...';

    return {
      id: story.id,
      title: story.title,
      summary: story.summary,
      content: story.content,
      story_image_url: story.story_image_url,
      story_category: story.story_category,
      is_featured: story.is_featured,
      published_at: story.published_at,
      themes: story.themes,
      service_id: story.service_id,
      excerpt
    };
  });
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

/**
 * Get stories for an organization
 * Note: Avoided profile join due to RLS recursion issue in Empathy Ledger
 */
export async function getStoriesForOrganization(orgId: string, publicOnly = true) {
  let query = empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('organization_id', orgId);

  if (publicOnly) {
    query = query.eq('is_public', true).eq('privacy_level', 'public');
  }

  const { data, error } = await query.order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Search stories with cultural sensitivity filters
 * Note: Avoided profile join due to RLS recursion issue in Empathy Ledger
 */
export async function searchStories(searchTerm: string, includeWarnings = false) {
  let query = empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(name, slug, indigenous_controlled)
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .textSearch('content', searchTerm);

  if (!includeWarnings) {
    query = query.or('cultural_warnings.is.null,cultural_warnings.eq.{}');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get projects for display on JusticeHub
 */
export async function getPublicProjects() {
  const { data, error } = await empathyLedgerClient
    .from('projects')
    .select(`
      *,
      organization:organizations!projects_organization_id_fkey(name, slug, indigenous_controlled, traditional_country)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if cultural protocols should be displayed
 */
export function shouldShowCulturalWarning(story: EmpathyLedgerStory): boolean {
  return !!(
    story.cultural_warnings &&
    story.cultural_warnings.length > 0 &&
    story.cultural_sensitivity_level !== 'public'
  );
}

/**
 * Format cultural protocols for display
 */
export function formatCulturalProtocols(org: EmpathyLedgerOrganization): string[] {
  if (!org.cultural_protocols) return [];

  // Parse JSON if it's a string
  const protocols = typeof org.cultural_protocols === 'string'
    ? JSON.parse(org.cultural_protocols)
    : org.cultural_protocols;

  return Array.isArray(protocols) ? protocols : [];
}
