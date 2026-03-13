import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 min cache

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();

  // Run all queries in parallel
  const [
    { data: topFundedOrgs },
    { data: interventionsByType },
    { data: fundingBySource },
    { data: entityBreakdown },
    { count: totalGrants },
    { data: fundingTotal },
    { count: totalInterventions },
    { count: totalEvidence },
    { count: totalOrgs },
    { count: indigenousOrgs },
    { data: gsRelTypes },
    { data: topJusticeFunding },
  ] = await Promise.all([
    // Top funded orgs with ALMA data
    supabase.rpc('get_sector_top_orgs'),

    // Intervention type breakdown
    supabase
      .from('alma_interventions')
      .select('type')
      .neq('verification_status', 'ai_generated')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
        return { data: Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count) };
      }),

    // Funding by source
    supabase.rpc('get_funding_by_source'),

    // GS entity type breakdown
    supabase.rpc('get_entity_breakdown'),

    // Counts
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
    supabase.rpc('get_funding_total').single(),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_indigenous_org', true),

    // GS relationship types
    supabase.rpc('get_gs_relationship_types'),

    // Top justice sector funding flows
    supabase.rpc('get_top_justice_funding'),
  ]);

  return NextResponse.json({
    summary: {
      totalFundingBillions: fundingTotal?.total_dollars
        ? parseFloat((Number(fundingTotal.total_dollars) / 1_000_000_000).toFixed(1))
        : 9.1,
      totalGrants: totalGrants || 52133,
      totalInterventions: totalInterventions || 826,
      totalEvidence: totalEvidence || 570,
      totalOrgs: totalOrgs || 556,
      indigenousOrgs: indigenousOrgs || 208,
      gsEntities: 102513,
      austenderContracts: 670919,
      foundationsCount: 10779,
    },
    interventionsByType: interventionsByType || [],
    topFundedOrgs: topFundedOrgs || [],
    fundingBySource: fundingBySource || [],
    entityBreakdown: entityBreakdown || [],
    gsRelationshipTypes: gsRelTypes || [],
    topJusticeFunding: topJusticeFunding || [],
  });
}
