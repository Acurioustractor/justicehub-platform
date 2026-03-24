import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/basecamps/funding-context?state=NT&org_id=xxx
 *
 * Returns funding transparency data for a Basecamp's state.
 */
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');
  const orgId = request.nextUrl.searchParams.get('org_id');

  if (!state) {
    return NextResponse.json({ error: 'state required' }, { status: 400 });
  }

  const supabase = createServiceClient() as any;

  try {
    // Top recipients in this state — paginate through all records
    const orgTotals: Record<string, number> = {};
    let stateTotal = 0;
    let offset = 0;
    const pageSize = 10000;
    let hasMore = true;

    while (hasMore) {
      const { data: rows } = await supabase
        .from('justice_funding')
        .select('alma_organization_id, amount_dollars')
        .eq('state', state)
        .gt('amount_dollars', 0)
        .not('alma_organization_id', 'is', null)
        .range(offset, offset + pageSize - 1);

      for (const row of rows || []) {
        const amt = Number(row.amount_dollars) || 0;
        stateTotal += amt;
        if (row.alma_organization_id) {
          orgTotals[row.alma_organization_id] = (orgTotals[row.alma_organization_id] || 0) + amt;
        }
      }
      hasMore = (rows?.length || 0) === pageSize;
      offset += pageSize;
    }

    // Get org names for top 10
    const topOrgIds = Object.entries(orgTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const { data: orgDetails } = await supabase
      .from('organizations')
      .select('id, name, is_indigenous_org')
      .in('id', topOrgIds);

    const orgMap: Record<string, { name: string; isIndigenous: boolean }> = {};
    for (const o of orgDetails || []) {
      orgMap[o.id] = { name: o.name, isIndigenous: o.is_indigenous_org || false };
    }

    const topRecipients = topOrgIds.map((id) => ({
      id,
      name: orgMap[id]?.name || 'Unknown',
      total: orgTotals[id] || 0,
      isIndigenous: orgMap[id]?.isIndigenous || false,
    }));

    // This org's total
    const orgTotal = orgId ? (orgTotals[orgId] || 0) : 0;

    // Indigenous vs non-indigenous split
    let indigenousFunding = 0;
    let nonIndigenousFunding = 0;
    // Get all orgs with funding in this state
    const allFundedOrgIds = Object.keys(orgTotals);
    if (allFundedOrgIds.length > 0) {
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id, is_indigenous_org')
        .in('id', allFundedOrgIds.slice(0, 1000));

      const indigenousSet = new Set(
        (allOrgs || []).filter((o: any) => o.is_indigenous_org).map((o: any) => o.id)
      );

      for (const [oid, amt] of Object.entries(orgTotals)) {
        if (indigenousSet.has(oid)) {
          indigenousFunding += amt;
        } else {
          nonIndigenousFunding += amt;
        }
      }
    }

    // ALMA intervention count for this state
    const { count: almaCount } = await supabase
      .from('alma_interventions')
      .select('id, operating_organization_id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated');
    // Note: can't easily filter by state without join, so we return national count
    // TODO: add state-filtered count via RPC

    // Indigenous org count in state
    const { count: indigenousOrgCount } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_indigenous_org', true);

    return NextResponse.json({
      state,
      stateTotal,
      orgTotal,
      topRecipients,
      indigenousFunding,
      nonIndigenousFunding,
      almaInterventionCount: almaCount || 0,
      indigenousOrgCount: indigenousOrgCount || 0,
    });
  } catch (err: any) {
    console.error('GET /api/basecamps/funding-context error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
