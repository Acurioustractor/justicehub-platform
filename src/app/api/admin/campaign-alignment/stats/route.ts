import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/admin/campaign-alignment/stats
 * Returns aggregate counts by category, list, outreach status, and last run info.
 */
export async function GET() {
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

    const service = createServiceClient();

    // Count queries — avoids Supabase's 1000-row default limit
    const categories = ['ally', 'potential_ally', 'neutral', 'opponent', 'unknown'];
    const lists = ['allies_to_activate', 'funders_to_pitch', 'decision_makers', 'opponents_to_understand', 'warm_intros'];
    const statuses = ['pending', 'contacted', 'responded', 'meeting_scheduled', 'committed'];
    const types = ['organization', 'person'];

    const countQuery = (field: string, value: string) =>
      service.from('campaign_alignment_entities').select('id', { count: 'exact', head: true }).eq(field, value);

    const [totalResult, ...countResults] = await Promise.all([
      service.from('campaign_alignment_entities').select('id', { count: 'exact', head: true }),
      ...categories.map(c => countQuery('alignment_category', c)),
      ...lists.map(l => countQuery('campaign_list', l)),
      ...statuses.map(s => countQuery('outreach_status', s)),
      ...types.map(t => countQuery('entity_type', t)),
    ]);

    let idx = 0;
    const byCategory: Record<string, number> = {};
    for (const c of categories) { byCategory[c] = countResults[idx++]?.count || 0; }
    const byList: Record<string, number> = {};
    for (const l of lists) { byList[l] = countResults[idx++]?.count || 0; }
    const byOutreach: Record<string, number> = {};
    for (const s of statuses) { byOutreach[s] = countResults[idx++]?.count || 0; }
    const byType: Record<string, number> = {};
    for (const t of types) { byType[t] = countResults[idx++]?.count || 0; }

    // Last run
    const { data: lastRun } = await service
      .from('campaign_alignment_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      total: totalResult.count || 0,
      by_category: byCategory,
      by_list: byList,
      by_outreach: byOutreach,
      by_type: byType,
      last_run: lastRun,
    });
  } catch (error) {
    console.error('Campaign stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
