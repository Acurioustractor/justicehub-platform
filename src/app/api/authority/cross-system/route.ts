import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. SEIFA/poverty analysis: orgs by disadvantage decile with funding
    const { data: seifaRows, error: seifaErr } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          gs.seifa_irsd_decile as decile,
          COUNT(DISTINCT o.id) as org_count,
          COALESCE(SUM(jf.amount_dollars), 0) as total_funding,
          COUNT(DISTINCT jf.id) as grant_count
        FROM organizations o
        JOIN gs_entities gs ON gs.id = o.gs_entity_id
        LEFT JOIN justice_funding jf ON jf.alma_organization_id = o.id
        WHERE gs.seifa_irsd_decile IS NOT NULL
        GROUP BY gs.seifa_irsd_decile
        ORDER BY gs.seifa_irsd_decile
      `
    });

    if (seifaErr) throw new Error(`SEIFA query: ${seifaErr.message || JSON.stringify(seifaErr)}`);

    // 2. Cross-system research findings (disability, child protection, NDIS)
    const { data: findings, error: findingsErr } = await supabase.rpc('exec_sql', {
      query: `
        SELECT content, sources, finding_type, confidence
        FROM alma_research_findings
        WHERE content::text ILIKE '%ndis%'
           OR content::text ILIKE '%child protection%'
           OR content::text ILIKE '%disability%'
           OR content::text ILIKE '%cognitive%'
           OR content::text ILIKE '%fasd%'
           OR content::text ILIKE '%fetal alcohol%'
        ORDER BY confidence DESC NULLS LAST
        LIMIT 30
      `
    });

    if (findingsErr) throw new Error(`Findings query: ${findingsErr.message || JSON.stringify(findingsErr)}`);

    // Process SEIFA data
    const byDecile = (seifaRows || []).map((r: { decile: number; org_count: number; total_funding: number; grant_count: number }) => ({
      decile: Number(r.decile),
      orgCount: Number(r.org_count),
      totalFunding: Number(r.total_funding),
      grantCount: Number(r.grant_count),
    }));

    const bottom3 = byDecile.filter(d => d.decile <= 3);
    const top3 = byDecile.filter(d => d.decile >= 8);
    const bottom3Funding = bottom3.reduce((s, d) => s + d.totalFunding, 0);
    const top3Funding = top3.reduce((s, d) => s + d.totalFunding, 0);
    const bottom3Orgs = bottom3.reduce((s, d) => s + d.orgCount, 0);
    const top3Orgs = top3.reduce((s, d) => s + d.orgCount, 0);

    // Categorize findings
    const disabilityFindings = (findings || []).filter((f: { content: unknown }) => {
      const text = JSON.stringify(f.content).toLowerCase();
      return text.includes('disability') || text.includes('cognitive') || text.includes('fasd') || text.includes('fetal alcohol');
    });
    const childProtectionFindings = (findings || []).filter((f: { content: unknown }) => {
      const text = JSON.stringify(f.content).toLowerCase();
      return text.includes('child protection') || text.includes('out-of-home') || text.includes('care system');
    });
    const ndisFindings = (findings || []).filter((f: { content: unknown }) => {
      const text = JSON.stringify(f.content).toLowerCase();
      return text.includes('ndis');
    });

    // 3. LGA cross-system heatmap data (top 50 by pipeline intensity)
    const { data: lgaRows, error: lgaErr } = await supabase
      .from('lga_cross_system_stats')
      .select('lga_code, lga_name, state, avg_icsea, detention_beds, detention_facility_count, youth_offenders, youth_offender_rate, jh_funding_tracked, jh_org_count, pipeline_intensity')
      .not('pipeline_intensity', 'is', null)
      .order('pipeline_intensity', { ascending: false })
      .limit(50);

    if (lgaErr) console.error('LGA query error:', lgaErr.message);

    const lgaHeatmap = (lgaRows || []).map((r: Record<string, unknown>) => ({
      lgaCode: r.lga_code as string,
      lgaName: r.lga_name as string,
      state: r.state as string,
      avgIcsea: r.avg_icsea as number | null,
      detentionBeds: r.detention_beds as number,
      youthOffenders: r.youth_offenders as number,
      youthOffenderRate: r.youth_offender_rate as number | null,
      jhFunding: r.jh_funding_tracked as number,
      jhOrgCount: r.jh_org_count as number,
      pipelineIntensity: r.pipeline_intensity as number,
    }));

    return NextResponse.json(
      {
        disability: {
          cognitiveDisabilityPct: '40-90%',
          fasdPrevalence: '36%',
          ndisGap: 'Most detained youth with disability are not NDIS participants',
          findingsCount: disabilityFindings.length,
          findings: disabilityFindings.slice(0, 5),
        },
        childProtection: {
          crossoverPct: '~50%',
          description: 'Approximately half of children in youth detention have prior child protection involvement',
          findingsCount: childProtectionFindings.length,
          findings: childProtectionFindings.slice(0, 5),
        },
        ndis: {
          findingsCount: ndisFindings.length,
          findings: ndisFindings.slice(0, 5),
        },
        poverty: {
          byDecile,
          bottom3: { orgCount: bottom3Orgs, totalFunding: bottom3Funding },
          top3: { orgCount: top3Orgs, totalFunding: top3Funding },
          disparity: top3Funding > 0 && bottom3Funding > 0
            ? (top3Funding / top3Orgs) / (bottom3Funding / bottom3Orgs)
            : null,
        },
        lgaHeatmap,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('cross-system error:', err);
    return NextResponse.json(
      { error: 'Failed to load cross-system data' },
      { status: 500 }
    );
  }
}
