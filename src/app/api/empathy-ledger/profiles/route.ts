import { NextRequest, NextResponse } from 'next/server';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';

// Create JusticeHub client for fallback
function getJusticeHubClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

/**
 * GET /api/empathy-ledger/profiles
 *
 * Fetches storyteller profiles from Empathy Ledger with full consent controls.
 * Only returns storytellers that:
 * 1. Have justicehub_enabled = true (opted in to JusticeHub display)
 * 2. Are active (is_active = true)
 *
 * Query params:
 *   - limit: number of profiles to return (default: 20)
 *   - featured: if 'true', only return justicehub_featured profiles
 *   - include_stories: if 'true', include count of public stories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured') === 'true';
    const includeStories = searchParams.get('include_stories') === 'true';

    // Query storytellers table (where justicehub_enabled lives)
    let query = empathyLedgerClient
      .from('storytellers')
      .select(`
        id,
        display_name,
        bio,
        avatar_url,
        cultural_background,
        location,
        justicehub_enabled,
        is_justicehub_featured,
        is_featured,
        is_active,
        created_at
      `)
      .eq('justicehub_enabled', true)
      .eq('is_active', true);

    if (featured) {
      query = query.eq('is_justicehub_featured', true);
    }

    query = query
      .order('is_justicehub_featured', { ascending: false })
      .order('display_name')
      .limit(limit);

    const { data: profiles, error } = await query;

    // If RLS recursion error, fall back to JusticeHub synced profiles
    if (error?.code === '42P17') {
      console.warn('Empathy Ledger RLS recursion - falling back to JusticeHub profiles');

      const jhClient = getJusticeHubClient();
      if (!jhClient) {
        return NextResponse.json(
          { success: false, error: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Query JusticeHub's synced profiles
      let jhQuery = jhClient
        .from('public_profiles')
        .select('*')
        .eq('synced_from_empathy_ledger', true)
        .eq('is_public', true);

      if (featured) {
        jhQuery = jhQuery.eq('is_featured', true);
      }

      jhQuery = jhQuery
        .order('is_featured', { ascending: false })
        .order('full_name')
        .limit(limit);

      const { data: jhProfiles, error: jhError } = await jhQuery;

      if (jhError) {
        console.error('JusticeHub fallback failed:', jhError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch profiles' },
          { status: 500 }
        );
      }

      // Map JusticeHub profile format to match expected response
      const mappedProfiles = (jhProfiles || []).map(p => ({
        id: p.empathy_ledger_profile_id || p.id,
        display_name: p.full_name,
        bio: p.bio,
        avatar_url: p.photo_url,
        justicehub_role: p.role_tags?.[0] || null,
        justicehub_featured: p.is_featured,
        location: p.location,
        created_at: p.created_at
      }));

      return NextResponse.json({
        success: true,
        profiles: mappedProfiles,
        count: mappedProfiles.length,
        source: 'justicehub_synced',
        consent_info: {
          consent_level: 'justicehub_enabled',
          description: 'Profiles synced from Empathy Ledger with consent'
        }
      });
    }

    if (error) {
      console.error('Error fetching profiles from Empathy Ledger:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // If includeStories, fetch story counts for each storyteller
    let enrichedProfiles = profiles || [];

    if (includeStories && profiles && profiles.length > 0) {
      const storytellerIds = profiles.map(p => p.id);

      // Get story counts (only published, public stories)
      const { data: storyCounts } = await empathyLedgerClient
        .from('stories')
        .select('storyteller_id')
        .in('storyteller_id', storytellerIds)
        .eq('status', 'published')
        .eq('visibility', 'public');

      // Count stories per storyteller
      const storyCountMap: Record<string, number> = {};
      (storyCounts || []).forEach(story => {
        if (story.storyteller_id) {
          storyCountMap[story.storyteller_id] = (storyCountMap[story.storyteller_id] || 0) + 1;
        }
      });

      enrichedProfiles = profiles.map(profile => ({
        ...profile,
        story_count: storyCountMap[profile.id] || 0
      }));
    }

    return NextResponse.json({
      success: true,
      profiles: enrichedProfiles,
      count: enrichedProfiles.length,
      consent_info: {
        consent_level: 'justicehub_enabled',
        description: 'All profiles have explicitly opted in to be displayed on JusticeHub'
      }
    });

  } catch (error: unknown) {
    console.error('Empathy Ledger profiles API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profiles';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
