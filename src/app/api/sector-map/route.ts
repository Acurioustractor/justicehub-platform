import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 min cache

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();

  // Fast queries that reliably complete within PostgREST timeout
  const [countResults, cacheResult, topOrgsResult] = await Promise.allSettled([
    Promise.all([
      supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
      supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_indigenous_org', true),
    ]),
    // Pre-computed data from sector_map_cache (populated by scripts/populate-sector-cache.mjs)
    supabase.from('sector_map_cache').select('key, data, updated_at'),
    // Top orgs RPC is fast (~30 rows)
    supabase.rpc('get_sector_top_orgs'),
  ]);

  // Extract counts with fallbacks
  const counts = countResults.status === 'fulfilled' ? countResults.value : [];
  const totalGrants = counts[0]?.count || 71087;
  const totalInterventions = counts[1]?.count || 981;
  const totalEvidence = counts[2]?.count || 570;
  const totalOrgs = counts[3]?.count || 18304;
  const indigenousOrgs = counts[4]?.count || 1853;

  // Extract cache + check staleness
  const cacheRows = cacheResult.status === 'fulfilled' ? (cacheResult.value.data || []) : [];
  const cache: Record<string, any> = {};
  let oldestUpdate: string | null = null;
  for (const row of cacheRows) {
    cache[row.key] = row.data;
    if (row.updated_at && (!oldestUpdate || row.updated_at < oldestUpdate)) {
      oldestUpdate = row.updated_at;
    }
  }

  const topFundedOrgs = topOrgsResult.status === 'fulfilled' ? (topOrgsResult.value.data || []) : [];

  // Funding total from cache
  const fundingTotalBillions = cache.funding_total?.total_billions || 97.9;
  const gs = cache.gs_counts || {};

  // Staleness: warn if cache is older than 48 hours
  let cacheStale = false;
  if (cacheRows.length === 0) {
    cacheStale = true;
  } else if (oldestUpdate) {
    const ageMs = Date.now() - new Date(oldestUpdate).getTime();
    cacheStale = ageMs > 48 * 60 * 60 * 1000;
  }

  return NextResponse.json({
    summary: {
      totalFundingBillions: fundingTotalBillions,
      totalGrants,
      totalInterventions,
      totalEvidence,
      totalOrgs,
      indigenousOrgs,
      gsEntities: gs.entities || 145024,
      austenderContracts: gs.austender_contracts || 670919,
      foundationsCount: gs.foundations || 10779,
    },
    interventionsByType: cache.intervention_types || [],
    topFundedOrgs,
    fundingBySource: cache.funding_by_source || [],
    entityBreakdown: cache.entity_breakdown || [],
    gsRelationshipTypes: cache.relationship_types || [],
    topJusticeFunding: cache.top_justice_funding || [],
    _meta: { cacheStale, cacheKeys: cacheRows.length },
  });
}
