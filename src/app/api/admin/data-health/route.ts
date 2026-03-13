import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getELSyncHealth } from '@/lib/empathy-ledger/sync-health';

export const dynamic = 'force-dynamic';

interface TrackedTable {
  name: string;
  keyColumns: string[];
  domain: string;
}

const TRACKED_TABLES: TrackedTable[] = [
  // ALMA Evidence Engine
  { name: 'alma_interventions', keyColumns: ['name', 'type'], domain: 'alma' },
  { name: 'alma_evidence', keyColumns: ['title', 'evidence_type'], domain: 'alma' },
  { name: 'alma_outcomes', keyColumns: ['outcome_type'], domain: 'alma' },
  { name: 'alma_community_contexts', keyColumns: ['context_type'], domain: 'alma' },
  { name: 'alma_source_registry', keyColumns: ['name', 'url'], domain: 'alma' },
  { name: 'alma_intervention_outcomes', keyColumns: ['intervention_id'], domain: 'alma' },
  { name: 'alma_intervention_contexts', keyColumns: ['intervention_id'], domain: 'alma' },
  { name: 'alma_intervention_evidence', keyColumns: ['intervention_id'], domain: 'alma' },
  { name: 'alma_discovered_links', keyColumns: ['url'], domain: 'alma' },
  { name: 'alma_raw_content', keyColumns: ['url'], domain: 'alma' },
  { name: 'alma_ingestion_jobs', keyColumns: ['source_type', 'status'], domain: 'alma' },
  { name: 'alma_funding_opportunities', keyColumns: ['name', 'funder_name'], domain: 'alma' },
  { name: 'alma_funding_data', keyColumns: ['jurisdiction', 'amount'], domain: 'alma' },
  { name: 'alma_weekly_reports', keyColumns: ['title', 'summary'], domain: 'alma' },
  // Justice Funding
  { name: 'justice_funding', keyColumns: ['recipient_name', 'program_name'], domain: 'funding' },
  { name: 'rogs_justice_spending', keyColumns: ['rogs_section', 'measure'], domain: 'funding' },
  { name: 'state_tenders', keyColumns: ['title', 'state'], domain: 'funding' },
  // GrantScope / Public Data
  { name: 'asic_companies', keyColumns: ['company_name', 'abn'], domain: 'grantscope' },
  { name: 'asic_name_lookup', keyColumns: ['name'], domain: 'grantscope' },
  { name: 'political_donations', keyColumns: ['donor_name', 'party_name'], domain: 'grantscope' },
  { name: 'austender_contracts', keyColumns: ['agency_name', 'supplier_name'], domain: 'grantscope' },
  { name: 'gs_entities', keyColumns: ['name', 'entity_type'], domain: 'grantscope' },
  { name: 'gs_relationships', keyColumns: ['source_entity_id', 'target_entity_id'], domain: 'grantscope' },
  { name: 'ato_tax_transparency', keyColumns: ['entity_name', 'abn'], domain: 'grantscope' },
  { name: 'canonical_entities', keyColumns: ['name', 'entity_type'], domain: 'grantscope' },
  { name: 'foundations', keyColumns: ['name'], domain: 'grantscope' },
  { name: 'foundation_programs', keyColumns: ['name'], domain: 'grantscope' },
  { name: 'oric_corporations', keyColumns: ['corporation_name'], domain: 'grantscope' },
  { name: 'donor_entity_matches', keyColumns: ['donor_name'], domain: 'grantscope' },
  { name: 'asx_companies', keyColumns: ['company_name'], domain: 'grantscope' },
  { name: 'money_flows', keyColumns: ['source_name', 'target_name'], domain: 'grantscope' },
  // Geographic
  { name: 'postcode_geo', keyColumns: ['postcode', 'locality'], domain: 'geo' },
  { name: 'seifa_2021', keyColumns: ['sa1_code'], domain: 'geo' },
  { name: 'sa3_regions', keyColumns: ['sa3_name'], domain: 'geo' },
  // Charity Registry
  { name: 'acnc_charities', keyColumns: ['abn', 'charity_name'], domain: 'charity' },
  { name: 'acnc_ais', keyColumns: ['abn'], domain: 'charity' },
  // Campaign
  { name: 'campaign_nominations', keyColumns: ['nominee_name'], domain: 'campaign' },
  { name: 'campaign_donations', keyColumns: ['amount_cents'], domain: 'campaign' },
  { name: 'tour_stops', keyColumns: ['name', 'state'], domain: 'campaign' },
  { name: 'tour_reactions', keyColumns: ['reaction_type'], domain: 'campaign' },
  { name: 'tour_stories', keyColumns: ['title'], domain: 'campaign' },
  { name: 'project_backers', keyColumns: ['project_id'], domain: 'campaign' },
  // Detention Data
  { name: 'youth_detention_facilities', keyColumns: ['facility_name', 'state'], domain: 'detention' },
  // Platform Content
  { name: 'organizations', keyColumns: ['name'], domain: 'platform' },
  { name: 'services', keyColumns: ['name', 'service_type'], domain: 'platform' },
  { name: 'articles', keyColumns: ['title'], domain: 'platform' },
  { name: 'blog_posts', keyColumns: ['title'], domain: 'platform' },
  { name: 'events', keyColumns: ['title', 'event_date'], domain: 'platform' },
  { name: 'stories', keyColumns: ['title', 'status'], domain: 'platform' },
  { name: 'opportunities', keyColumns: ['title'], domain: 'platform' },
  { name: 'public_profiles', keyColumns: ['display_name'], domain: 'platform' },
  { name: 'art_innovation', keyColumns: ['title'], domain: 'platform' },
  { name: 'funding_transparency', keyColumns: [], domain: 'platform' },
  // Signal Engine
  { name: 'signal_events', keyColumns: ['event_type'], domain: 'signal' },
];

interface TableHealth {
  name: string;
  count: number;
  lastUpdated: string | null;
  healthScore: 'green' | 'yellow' | 'red';
  keyColumns: string[];
  domain: string;
}

interface EnrichmentMetric {
  label: string;
  current: number;
  total: number;
  percentage: number;
}

interface ApiHealthResult {
  endpoint: string;
  status: number | null;
  latencyMs: number;
  healthy: boolean;
  error?: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

function extractTimestamp(rows: unknown, column: 'updated_at' | 'created_at'): string | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const first = rows[0];
  if (!first || typeof first !== 'object') {
    return null;
  }
  const value = (first as Record<string, unknown>)[column];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function checkApiHealth(baseUrl: string): Promise<ApiHealthResult[]> {
  const endpoints = [
    '/api/homepage-stats',
    '/api/justice-funding?view=overview',
    '/api/justice-spending?state=QLD',
    '/api/intelligence/global-stats',
    '/api/health',
  ];

  const results: ApiHealthResult[] = [];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        signal: AbortSignal.timeout(10000),
      });
      const latency = Date.now() - start;
      results.push({
        endpoint,
        status: res.status,
        latencyMs: latency,
        healthy: res.ok,
      });
    } catch (err: any) {
      const latency = Date.now() - start;
      results.push({
        endpoint,
        status: null,
        latencyMs: latency,
        healthy: false,
        error: err.message || 'Request failed',
      });
    }
  }

  return results;
}

function generateRecommendations(
  tables: TableHealth[],
  enrichment: EnrichmentMetric[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check state tenders
  const stateTenders = tables.find(t => t.name === 'state_tenders');
  if (stateTenders && stateTenders.count === 0) {
    recs.push({
      priority: 'medium',
      title: 'Build state tender scrapers',
      description: 'state_tenders table is empty. NSW eTendering, VIC Buying for Victoria, and QLD QTenders scrapers need to be built.',
      action: 'scripts/scrape-state-tenders.mjs',
    });
  }

  // Check evidence coverage
  const evidenceCoverage = enrichment.find(e => e.label === 'Evidence coverage');
  if (evidenceCoverage && evidenceCoverage.percentage < 50) {
    recs.push({
      priority: 'high',
      title: 'Run evidence discovery agent',
      description: `Only ${evidenceCoverage.percentage}% of interventions have linked evidence. Run discovery to improve coverage.`,
      action: 'scripts/alma-discover-sources.mjs',
    });
  }

  // Check ABN coverage
  const abnCoverage = enrichment.find(e => e.label === 'Funding records with ABN');
  if (abnCoverage && abnCoverage.percentage < 80) {
    recs.push({
      priority: 'medium',
      title: 'Run ABN matching on justice funding',
      description: `Only ${abnCoverage.percentage}% of funding records have ABNs. Run the ABN bridge script.`,
      action: 'scripts/abn-bridge.mjs',
    });
  }

  // Check ACNC AIS coverage
  const aisCoverage = enrichment.find(e => e.label === 'ACNC charities with AIS financials');
  if (aisCoverage && aisCoverage.percentage < 50) {
    recs.push({
      priority: 'low',
      title: 'Import latest AIS financial data',
      description: `Only ${aisCoverage.percentage}% of ACNC charities have AIS financial data linked.`,
    });
  }

  // Check stale tables
  for (const table of tables) {
    if (table.lastUpdated && table.count > 0) {
      const lastDate = new Date(table.lastUpdated);
      if (lastDate < thirtyDaysAgo) {
        recs.push({
          priority: 'low',
          title: `${table.name} is stale`,
          description: `Last updated ${Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))} days ago. Consider refreshing.`,
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const untypedSupabase = supabase as any;
  const results: TableHealth[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const table of TRACKED_TABLES) {
    try {
      const tableName = table.name as string;
      const { count, error: countError } = await untypedSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        results.push({
          name: table.name,
          count: 0,
          lastUpdated: null,
          healthScore: 'red',
          keyColumns: table.keyColumns,
          domain: table.domain,
        });
        continue;
      }

      const rowCount = count || 0;

      let lastUpdated: string | null = null;
      const timestampCol = 'updated_at';
      const fallbackCol = 'created_at';

      const { data: latestRow } = await untypedSupabase
        .from(tableName)
        .select(timestampCol)
        .order(timestampCol, { ascending: false })
        .limit(1);

      lastUpdated = extractTimestamp(latestRow, timestampCol);
      if (!lastUpdated) {
        const { data: fallbackRow } = await untypedSupabase
          .from(tableName)
          .select(fallbackCol)
          .order(fallbackCol, { ascending: false })
          .limit(1);

        lastUpdated = extractTimestamp(fallbackRow, fallbackCol);
      }

      let healthScore: 'green' | 'yellow' | 'red' = 'red';
      if (rowCount === 0) {
        healthScore = 'red';
      } else if (lastUpdated) {
        const lastDate = new Date(lastUpdated);
        if (rowCount > 10 && lastDate > sevenDaysAgo) {
          healthScore = 'green';
        } else if (lastDate > thirtyDaysAgo) {
          healthScore = 'yellow';
        } else {
          healthScore = 'red';
        }
      } else if (rowCount > 0) {
        healthScore = 'yellow';
      }

      results.push({
        name: table.name,
        count: rowCount,
        lastUpdated,
        healthScore,
        keyColumns: table.keyColumns,
        domain: table.domain,
      });
    } catch {
      results.push({
        name: table.name,
        count: 0,
        lastUpdated: null,
        healthScore: 'red',
        keyColumns: table.keyColumns,
        domain: table.domain,
      });
    }
  }

  // Enrichment metrics
  const enrichment: EnrichmentMetric[] = [];
  const totalInterventions = results.find(t => t.name === 'alma_interventions')?.count || 0;
  const totalFunding = results.find(t => t.name === 'justice_funding')?.count || 0;
  const totalCharities = results.find(t => t.name === 'acnc_charities')?.count || 0;

  try {
    // Evidence coverage
    const { count: withEvidence } = await untypedSupabase
      .from('alma_intervention_evidence')
      .select('intervention_id', { count: 'exact', head: true });
    // Use distinct by getting unique count differently
    const { data: distinctEvidence } = await untypedSupabase
      .rpc('count_distinct_intervention_evidence');
    const evidenceCount = distinctEvidence?.[0]?.count ?? withEvidence ?? 0;
    enrichment.push({
      label: 'Evidence coverage',
      current: Math.min(evidenceCount, totalInterventions),
      total: totalInterventions,
      percentage: totalInterventions > 0 ? Math.round((Math.min(evidenceCount, totalInterventions) / totalInterventions) * 100) : 0,
    });
  } catch {
    // Fallback: use link count from table
    const evidenceLinks = results.find(t => t.name === 'alma_intervention_evidence')?.count || 0;
    enrichment.push({
      label: 'Evidence coverage',
      current: evidenceLinks,
      total: totalInterventions,
      percentage: totalInterventions > 0 ? Math.round((evidenceLinks / totalInterventions) * 100) : 0,
    });
  }

  try {
    // Outcome coverage
    const { data: distinctOutcomes } = await untypedSupabase
      .rpc('count_distinct_intervention_outcomes');
    const outcomesCount = distinctOutcomes?.[0]?.count ?? 0;
    enrichment.push({
      label: 'Outcome coverage',
      current: Math.min(outcomesCount, totalInterventions),
      total: totalInterventions,
      percentage: totalInterventions > 0 ? Math.round((Math.min(outcomesCount, totalInterventions) / totalInterventions) * 100) : 0,
    });
  } catch {
    const outcomeLinks = results.find(t => t.name === 'alma_intervention_outcomes')?.count || 0;
    enrichment.push({
      label: 'Outcome coverage',
      current: outcomeLinks,
      total: totalInterventions,
      percentage: totalInterventions > 0 ? Math.round((outcomeLinks / totalInterventions) * 100) : 0,
    });
  }

  try {
    // Funding records with ABN
    const { count: withAbn } = await untypedSupabase
      .from('justice_funding')
      .select('*', { count: 'exact', head: true })
      .not('recipient_abn', 'is', null);
    const abnCount = withAbn ?? 0;
    enrichment.push({
      label: 'Funding records with ABN',
      current: abnCount,
      total: totalFunding,
      percentage: totalFunding > 0 ? Math.round((abnCount / totalFunding) * 100) : 0,
    });
  } catch {
    enrichment.push({
      label: 'Funding records with ABN',
      current: 0,
      total: totalFunding,
      percentage: 0,
    });
  }

  try {
    // Funding records linked to ALMA orgs
    const { count: withAlmaOrg } = await untypedSupabase
      .from('justice_funding')
      .select('*', { count: 'exact', head: true })
      .not('alma_organization_id', 'is', null);
    const almaOrgCount = withAlmaOrg ?? 0;
    enrichment.push({
      label: 'Funding linked to ALMA orgs',
      current: almaOrgCount,
      total: totalFunding,
      percentage: totalFunding > 0 ? Math.round((almaOrgCount / totalFunding) * 100) : 0,
    });
  } catch {
    enrichment.push({
      label: 'Funding linked to ALMA orgs',
      current: 0,
      total: totalFunding,
      percentage: 0,
    });
  }

  try {
    // ACNC charities with AIS financials
    const { count: withAis } = await untypedSupabase
      .from('acnc_ais')
      .select('abn', { count: 'exact', head: true });
    const aisCount = withAis ?? 0;
    enrichment.push({
      label: 'ACNC charities with AIS financials',
      current: Math.min(aisCount, totalCharities),
      total: totalCharities,
      percentage: totalCharities > 0 ? Math.round((Math.min(aisCount, totalCharities) / totalCharities) * 100) : 0,
    });
  } catch {
    enrichment.push({
      label: 'ACNC charities with AIS financials',
      current: 0,
      total: totalCharities,
      percentage: 0,
    });
  }

  // Verification breakdown
  let verificationBreakdown: Record<string, number> = {};
  try {
    const { data: vData } = await untypedSupabase
      .from('alma_interventions')
      .select('verification_status');
    if (Array.isArray(vData)) {
      for (const row of vData) {
        const status = (row as any).verification_status || 'unknown';
        verificationBreakdown[status] = (verificationBreakdown[status] || 0) + 1;
      }
    }
  } catch {
    // ignore
  }

  // Provenance breakdown
  let provenanceBreakdown: Record<string, number> = {};
  try {
    const { data: pData } = await untypedSupabase
      .from('alma_interventions')
      .select('data_provenance');
    if (Array.isArray(pData)) {
      for (const row of pData) {
        const prov = (row as any).data_provenance || 'unknown';
        provenanceBreakdown[prov] = (provenanceBreakdown[prov] || 0) + 1;
      }
    }
  } catch {
    // ignore
  }

  // API health checks
  let apis: ApiHealthResult[] = [];
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    apis = await checkApiHealth(baseUrl);
  } catch {
    // ignore
  }

  // EL Sync Health
  let elSyncHealth = null;
  try {
    elSyncHealth = await getELSyncHealth();
  } catch {
    // ignore - EL may not be configured
  }

  // Recommendations
  const recommendations = generateRecommendations(results, enrichment);

  // Get latest ingestion job for scraper status
  let lastScrapeJob: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from('alma_ingestion_jobs')
      .select('id, status, source_type, source_url, started_at, completed_at, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>;
      lastScrapeJob = {
        ...row,
        job_type: row.source_type,
      };
    }
  } catch {
    // ignore
  }

  const summary = {
    total_tables: results.length,
    healthy: results.filter(r => r.healthScore === 'green').length,
    warning: results.filter(r => r.healthScore === 'yellow').length,
    critical: results.filter(r => r.healthScore === 'red').length,
    empty_tables: results.filter(r => r.count === 0).length,
    total_records: results.reduce((sum, r) => sum + r.count, 0),
  };

  return NextResponse.json({
    tables: results,
    summary,
    enrichment,
    verificationBreakdown,
    provenanceBreakdown,
    apis,
    recommendations,
    lastScrapeJob,
    elSyncHealth,
    generatedAt: now.toISOString(),
  });
}
