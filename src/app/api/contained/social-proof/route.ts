import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/contained/social-proof
 *
 * Public endpoint returning live social proof stats for
 * display on the CONTAINED pages. Cached for 5 minutes.
 *
 * Returns: visitor count, nominations, MP letters, reflections, programs.
 */
export async function GET() {
  try {
    const supabase = createServiceClient() as any;

    // Run all queries in parallel
    const [
      reflectionsResult,
      nominationsResult,
      mpLettersResult,
      uniqueMPsResult,
      interventionsResult,
      subscribersResult,
    ] = await Promise.all([
      // Total CONTAINED visitors (reactions)
      supabase
        .from('community_reflections')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>type', 'contained_reaction'),

      // Total nominations
      supabase
        .from('campaign_alignment_entities')
        .select('id', { count: 'exact', head: true })
        .eq('outreach_status', 'nominated'),

      // Total MP letters sent
      supabase
        .from('community_reflections')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>type', 'mp_letter'),

      // Unique MPs contacted
      supabase
        .from('community_reflections')
        .select('metadata->>mp_name')
        .eq('metadata->>type', 'mp_letter')
        .not('metadata->mp_name', 'is', null),

      // Total verified interventions
      supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated'),

      // Newsletter subscribers
      supabase
        .from('newsletter_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    // Count unique MPs
    const uniqueMPNames = new Set(
      (uniqueMPsResult.data || [])
        .map((r: any) => r.mp_name?.toLowerCase())
        .filter(Boolean)
    );

    const stats = {
      visitors: reflectionsResult.count || 0,
      nominations: nominationsResult.count || 0,
      mp_letters_sent: mpLettersResult.count || 0,
      unique_mps_contacted: uniqueMPNames.size,
      verified_programs: interventionsResult.count || 0,
      newsletter_subscribers: subscribersResult.count || 0,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('[Social proof] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
