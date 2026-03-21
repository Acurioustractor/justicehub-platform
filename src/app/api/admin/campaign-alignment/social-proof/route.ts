import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/admin/campaign-alignment/social-proof?limit=20
 * Returns top passionate supporters with engagement signals and location demand summary.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const service = createServiceClient();

    // Top supporters by passion score
    const { data: supporters, error } = await service
      .from('campaign_alignment_entities')
      .select('id, name, organization, position, email, passion_score, engagement_signals, warm_paths, composite_score, alignment_category')
      .gt('passion_score', 0)
      .order('passion_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Extract comment text from warm_paths for display
    const enriched = (supporters || []).map(s => {
      let comment = '';
      if (Array.isArray(s.warm_paths)) {
        for (const wp of s.warm_paths) {
          if (wp?.via === 'linkedin_comment' && (wp.comment_snippet || wp.comment)) {
            comment = wp.comment_snippet || wp.comment;
            break;
          }
        }
      }
      return { ...s, comment };
    });

    // Location demand aggregation across ALL scored entities
    const { data: allScored } = await service
      .from('campaign_alignment_entities')
      .select('engagement_signals')
      .gt('passion_score', 0);

    const locationDemand: Record<string, number> = {};
    let offersCount = 0;
    for (const entity of allScored || []) {
      const signals = entity.engagement_signals;
      if (!Array.isArray(signals)) continue;
      for (const sig of signals) {
        if (sig.type === 'location_demand') {
          locationDemand[sig.snippet] = (locationDemand[sig.snippet] || 0) + 1;
        }
        if (sig.type === 'offer') offersCount++;
      }
    }

    const locationSummary = Object.entries(locationDemand)
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      supporters: enriched,
      total_scored: allScored?.length || 0,
      offers_count: offersCount,
      location_demand: locationSummary,
    });
  } catch (error) {
    console.error('Social proof error:', error);
    return NextResponse.json({ error: 'Failed to fetch social proof' }, { status: 500 });
  }
}
