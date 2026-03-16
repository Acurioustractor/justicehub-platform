import { NextRequest, NextResponse } from 'next/server';
import { getStorytellers, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/profiles
 *
 * Fetches storyteller profiles from Empathy Ledger v2 API.
 * The v2 API returns all storytellers linked to the JusticeHub org.
 *
 * Query params:
 *   - limit: number of profiles to return (default: 20)
 *   - featured: if 'true', only return featured profiles (NYI — returns all)
 *   - include_stories: if 'true', include story counts (already in v2 response)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isV2Configured) {
      return NextResponse.json({
        success: true,
        profiles: [],
        count: 0,
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
        consent_info: {
          consent_level: 'justicehub_enabled',
          description: 'Empathy Ledger is not configured in this environment',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getStorytellers({ limit });

    // Map v2 response to legacy format expected by JusticeHub frontend
    const enrichedProfiles = result.data.map(st => ({
      id: st.id,
      profile_id: st.id,
      display_name: st.displayName,
      bio: st.bio,
      avatar_url: st.avatarUrl,
      public_avatar_url: st.avatarUrl,
      cultural_background: st.culturalBackground,
      location: st.location,
      justicehub_enabled: true,
      is_justicehub_featured: false,
      is_featured: false,
      is_active: st.isActive,
      tags: [],
      created_at: st.createdAt,
      story_count: st.storyCount,
    }));

    return NextResponse.json({
      success: true,
      profiles: enrichedProfiles,
      count: result.pagination.total,
      source: 'empathy_ledger',
      consent_info: {
        consent_level: 'justicehub_enabled',
        description: 'All profiles are linked to the JusticeHub organization'
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
