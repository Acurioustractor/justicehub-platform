import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Step 1: Top 200 funded orgs (simple query, no CTE)
    const { data: fundingAgg, error: fundErr } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          jf.alma_organization_id as id,
          SUM(jf.amount_dollars)::bigint as total_funding,
          COUNT(DISTINCT jf.id) as grant_count
        FROM justice_funding jf
        WHERE jf.amount_dollars > 0 AND jf.alma_organization_id IS NOT NULL
        GROUP BY jf.alma_organization_id
        ORDER BY total_funding DESC
        LIMIT 200
      `
    });
    if (fundErr) throw new Error(`Funding agg: ${fundErr.message || JSON.stringify(fundErr)}`);
    if (!fundingAgg?.length) throw new Error('No funding data');

    const orgIds = fundingAgg.map((r: { id: string }) => r.id);
    const fundingMap = Object.fromEntries(
      fundingAgg.map((r: { id: string; total_funding: number; grant_count: number }) =>
        [r.id, { total_funding: Number(r.total_funding), grant_count: Number(r.grant_count) }]
      )
    );

    // Step 2: Get org details
    const { data: orgsRaw, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, state, is_indigenous_org, website, abn')
      .in('id', orgIds);
    if (orgErr) throw new Error(`Orgs: ${orgErr.message}`);

    // Step 3: Get intervention counts
    const { data: interventions, error: intErr } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          operating_organization_id as org_id,
          COUNT(*) as intervention_count,
          COUNT(*) FILTER (WHERE evidence_level LIKE 'Proven%') as proven_count,
          COUNT(*) FILTER (WHERE evidence_level LIKE 'Effective%') as effective_count,
          COUNT(*) FILTER (WHERE evidence_level LIKE 'Promising%') as promising_count,
          COUNT(*) FILTER (WHERE evidence_level LIKE 'Indigenous%') as indigenous_led_count,
          COUNT(*) FILTER (WHERE evidence_level LIKE 'Untested%') as untested_count
        FROM alma_interventions
        WHERE verification_status != 'ai_generated'
          AND operating_organization_id IS NOT NULL
        GROUP BY operating_organization_id
      `
    });
    if (intErr) console.error('Interventions query error:', intErr.message);

    const intMap = Object.fromEntries(
      (interventions || []).map((r: Record<string, unknown>) => [r.org_id as string, r])
    );

    // Combine
    const orgs = (orgsRaw || [])
      .filter((o: { name: string }) => o.name && o.name.length > 2 && !o.name.startsWith('Youth Justice -') && o.name !== 'Total')
      .map((o: { id: string; name: string; state: string | null; is_indigenous_org: boolean; website: string | null; abn: string | null }) => {
        const f = fundingMap[o.id] || { total_funding: 0, grant_count: 0 };
        const i = intMap[o.id] || {};
        return {
          id: o.id,
          name: o.name,
          state: o.state || 'Unknown',
          is_indigenous_org: o.is_indigenous_org,
          total_funding: f.total_funding,
          grant_count: f.grant_count,
          website: o.website,
          abn: o.abn,
          intervention_count: Number(i.intervention_count || 0),
          proven_count: Number(i.proven_count || 0),
          effective_count: Number(i.effective_count || 0),
          promising_count: Number(i.promising_count || 0),
          indigenous_led_count: Number(i.indigenous_led_count || 0),
          untested_count: Number(i.untested_count || 0),
        };
      })
      .sort((a: { total_funding: number }, b: { total_funding: number }) => b.total_funding - a.total_funding);

    const totalFunding = orgs.reduce((s: number, o: { total_funding: number }) => s + o.total_funding, 0);
    const totalOrgs = orgs.length;
    const withEvidence = orgs.filter((o: { intervention_count: number }) => o.intervention_count > 0).length;
    const indigenousOrgs = orgs.filter((o: { is_indigenous_org: boolean }) => o.is_indigenous_org).length;

    return NextResponse.json(
      { orgs, totalFunding, totalOrgs, withEvidence, indigenousOrgs },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('org-map error:', err);
    return NextResponse.json(
      { error: 'Failed to load org map data' },
      { status: 500 }
    );
  }
}
