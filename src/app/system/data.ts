import { createServiceClient } from '@/lib/supabase/service-lite';
import { STATE_CONFIGS, getAllStateSlugs } from './configs';

// ── Types ──

export type LiveCounts = {
  interventionsByState: Record<string, number>;
  fundingByState: Record<string, { count: number; total: number }>;
  orgsByState: Record<string, number>;
  totalOrgs: number;
  totalInterventions: number;
  totalFunding: number;
  totalFundingRecords: number;
  statements: { id: string; headline: string; minister_name: string; published_at: string; source_url: string; mentioned_amounts: string[] }[];
  statementsCount: number;
  hansardCount: number;
  commitmentsCount: number;
  storytellerCount: number;
  ministers: MinisterProfile[];
  commitments: { minister_name: string; status: string; commitment_text: string }[];
  orgSparklines: Record<string, { fy: string; total: number }[]>;
  nationalSparkline: { fy: string; total: number }[];
  alerts: { id: string; alert_type: string; severity: string; title: string; summary: string; jurisdiction: string | null; source_url: string | null; created_at: string }[];
  alertsCount: number;
};

export type MinisterProfile = {
  name: string;
  totalMeetings: number;
  externalMeetings: number;
  uniqueOrgs: number;
  topOrgs: string[];
  statements: number;
  commitments: number;
  delivered: number;
};

export type StateRow = {
  slug: string;
  state: string;
  stateFull: string;
  totalContracts: number;
  totalValue: number;
  departments: number;
  detentionCostPerDay: number;
  communityCostPerDay: number;
  ratio: number;
  avgKids: number;
  detentionAnnual: number;
  supplierCount: number;
  interventionCount: number;
  orgCount: number;
  fundingSources: number;
  totalFundingRecords: number;
  liveFundingTotal: number;
  liveFundingRecords: number;
  dataConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  procurementSource: string;
  verificationScore: number;
};

export type OrgRow = {
  name: string;
  state: string;
  slug: string;
  totalValue: number;
  contracts: number;
  note?: string;
  departments: string[];
};

// ── Data source registry ──

export const SOURCES = {
  rogs: { name: 'Productivity Commission ROGS 2024-25', url: 'https://www.pc.gov.au/ongoing/report-on-government-services', confidence: 'verified' as const },
  qgip: { name: 'QLD Government Information Portal', url: 'https://data.qld.gov.au', confidence: 'verified' as const },
  austender: { name: 'AusTender Federal Procurement', url: 'https://www.tenders.gov.au', confidence: 'verified' as const },
  aihw: { name: 'AIHW Youth Justice 2023-24', url: 'https://www.aihw.gov.au/reports/youth-justice', confidence: 'verified' as const },
  alma: { name: 'ALMA Interventions Database', url: null, confidence: 'cross-referenced' as const },
  civic: { name: 'CivicScope QLD Scraper', url: null, confidence: 'cross-referenced' as const },
  config: { name: 'State Config (manual entry)', url: null, confidence: 'estimate' as const },
} as const;

// ── Live data fetch ──

export async function fetchLiveCounts(): Promise<LiveCounts> {
  const supabase = createServiceClient();
  const stateKeys = getAllStateSlugs().map(s => STATE_CONFIGS[s]!.state);

  const fundingCountQueries = stateKeys.map(state =>
    supabase.from('justice_funding').select('id', { count: 'exact', head: true }).eq('state', state)
  );

  const [
    interventionsRes,
    interventionsCountRes,
    orgsRes,
    fundingTotalCountRes,
    statementsRes,
    statementsCountRes,
    hansardCountRes,
    commitmentsCountRes,
    storytellerCountRes,
    alertsRes,
    alertsCountRes,
    diariesRes,
    charterRes,
    statementsPerMinisterRes,
    ...fundingCountResults
  ] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id, geography')
      .neq('verification_status', 'ai_generated')
      .limit(5000),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('organizations')
      .select('state', { count: 'exact' })
      .in('state', stateKeys),
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('civic_ministerial_statements')
      .select('id, headline, minister_name, published_at, source_url, mentioned_amounts')
      .order('published_at', { ascending: false })
      .limit(15),
    supabase.from('civic_ministerial_statements').select('id', { count: 'exact', head: true }),
    supabase.from('civic_hansard').select('id', { count: 'exact', head: true }),
    supabase.from('civic_charter_commitments').select('id', { count: 'exact', head: true }).eq('youth_justice_relevant', true),
    supabase.from('alma_stories').select('id', { count: 'exact', head: true }),
    supabase
      .from('civic_alerts')
      .select('id, alert_type, severity, title, summary, jurisdiction, source_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('civic_alerts').select('id', { count: 'exact', head: true }),
    supabase
      .from('civic_ministerial_diaries')
      .select('minister_name, organisation, meeting_type')
      .limit(5000),
    supabase
      .from('civic_charter_commitments')
      .select('minister_name, status, commitment_text')
      .eq('youth_justice_relevant', true),
    supabase
      .from('civic_ministerial_statements')
      .select('minister_name')
      .limit(5000),
    ...fundingCountQueries,
  ]);

  // Process interventions by state
  const interventionsByState: Record<string, number> = {};
  let totalInterventions = 0;
  for (const row of (interventionsRes.data || [])) {
    totalInterventions++;
    const geo = row.geography as string[] | null;
    if (geo) {
      for (const s of stateKeys) {
        if (geo.includes(s)) {
          interventionsByState[s] = (interventionsByState[s] || 0) + 1;
        }
      }
    }
  }

  // Build per-state funding
  const fundingByState: Record<string, { count: number; total: number }> = {};
  let totalFunding = 0;
  stateKeys.forEach((state, i) => {
    const slug = getAllStateSlugs().find(s => STATE_CONFIGS[s]!.state === state)!;
    const config = STATE_CONFIGS[slug]!;
    const count = fundingCountResults[i]?.count || 0;
    const total = config.fundingBySource.reduce((s, f) => s + f.total, 0);
    fundingByState[state] = { count, total };
    totalFunding += total;
  });

  // Process orgs by state
  const orgsByState: Record<string, number> = {};
  for (const row of (orgsRes.data || [])) {
    const s = row.state as string;
    orgsByState[s] = (orgsByState[s] || 0) + 1;
  }

  // Process minister leaderboard
  const INTERNAL_KEYWORDS = ['ministerial staff', 'cabinet minister', 'government minister', 'director-general', 'director -general', 'commissioner,', 'assistant minister', 'departmental staff', 'd-g,'];
  const diaries = (diariesRes.data || []) as { minister_name: string; organisation: string | null; meeting_type: string | null }[];
  const charter = (charterRes.data || []) as { minister_name: string; status: string; commitment_text: string }[];
  const stmtsByMinister = (statementsPerMinisterRes.data || []) as { minister_name: string }[];

  const ministerMap: Record<string, { total: number; external: number; orgs: Set<string>; topOrgCounts: Record<string, number> }> = {};
  for (const d of diaries) {
    if (!ministerMap[d.minister_name]) ministerMap[d.minister_name] = { total: 0, external: 0, orgs: new Set(), topOrgCounts: {} };
    const m = ministerMap[d.minister_name];
    m.total++;
    if (d.organisation) {
      const lower = d.organisation.toLowerCase();
      const isInternal = INTERNAL_KEYWORDS.some(kw => lower.includes(kw)) || lower.startsWith('hon ');
      if (!isInternal) {
        m.external++;
        m.orgs.add(d.organisation);
        m.topOrgCounts[d.organisation] = (m.topOrgCounts[d.organisation] || 0) + 1;
      }
    }
  }

  const stmtCounts: Record<string, number> = {};
  for (const s of stmtsByMinister) {
    stmtCounts[s.minister_name] = (stmtCounts[s.minister_name] || 0) + 1;
  }

  const charterByMinister: Record<string, { total: number; delivered: number }> = {};
  for (const c of charter) {
    if (!charterByMinister[c.minister_name]) charterByMinister[c.minister_name] = { total: 0, delivered: 0 };
    charterByMinister[c.minister_name].total++;
    if (c.status === 'delivered') charterByMinister[c.minister_name].delivered++;
  }

  const ministers: MinisterProfile[] = Object.entries(ministerMap)
    .map(([name, data]) => {
      const topOrgs = Object.entries(data.topOrgCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([org]) => org);
      const ch = charterByMinister[name];
      return {
        name,
        totalMeetings: data.total,
        externalMeetings: data.external,
        uniqueOrgs: data.orgs.size,
        topOrgs,
        statements: stmtCounts[name] || 0,
        commitments: ch?.total || 0,
        delivered: ch?.delivered || 0,
      };
    })
    .sort((a, b) => b.totalMeetings - a.totalMeetings);

  // Fetch sparkline data
  const allOrgNames = getAllStateSlugs().flatMap(slug =>
    STATE_CONFIGS[slug]!.topSuppliers.map(s => s.name)
  );
  const uniqueOrgNames = [...new Set(allOrgNames)];

  const { data: orgIdRows } = await supabase
    .from('organizations')
    .select('id, name')
    .in('name', uniqueOrgNames);

  const orgIdMap = new Map((orgIdRows || []).map((r: any) => [r.id, r.name]));
  const orgIds = (orgIdRows || []).map((r: any) => r.id);

  const [sparklineRes, nationalSparkRes] = await Promise.all([
    orgIds.length > 0
      ? supabase
          .from('justice_funding')
          .select('alma_organization_id, financial_year, amount_dollars')
          .in('alma_organization_id', orgIds)
          .not('financial_year', 'is', null)
          .gte('financial_year', '2017-18')
          .lte('financial_year', '2023-24')
          .limit(10000)
      : Promise.resolve({ data: [] }),
    supabase
      .from('justice_funding')
      .select('financial_year, amount_dollars, state')
      .not('financial_year', 'is', null)
      .gte('financial_year', '2017-18')
      .lte('financial_year', '2023-24')
      .in('state', stateKeys)
      .limit(50000),
  ]);

  const orgFyMap: Record<string, Record<string, number>> = {};
  for (const row of (sparklineRes.data || [])) {
    const orgName = orgIdMap.get(row.alma_organization_id);
    if (!orgName) continue;
    const fy = row.financial_year as string;
    if (!orgFyMap[orgName]) orgFyMap[orgName] = {};
    orgFyMap[orgName][fy] = (orgFyMap[orgName][fy] || 0) + (Number(row.amount_dollars) || 0);
  }

  const FY_ORDER = ['2017-18', '2018-19', '2019-20', '2020-21', '2021-22', '2022-23', '2023-24'];
  const orgSparklines: Record<string, { fy: string; total: number }[]> = {};
  for (const [name, fyData] of Object.entries(orgFyMap)) {
    orgSparklines[name] = FY_ORDER
      .filter(fy => fyData[fy] != null)
      .map(fy => ({ fy, total: fyData[fy] }));
  }

  const natFyMap: Record<string, number> = {};
  for (const row of (nationalSparkRes.data || [])) {
    const fy = row.financial_year as string;
    natFyMap[fy] = (natFyMap[fy] || 0) + (Number(row.amount_dollars) || 0);
  }
  const nationalSparkline = FY_ORDER
    .filter(fy => natFyMap[fy] != null)
    .map(fy => ({ fy, total: natFyMap[fy] }));

  return {
    interventionsByState,
    fundingByState,
    orgsByState,
    totalOrgs: orgsRes.count || 0,
    totalInterventions: interventionsCountRes.count || totalInterventions,
    totalFunding,
    totalFundingRecords: fundingTotalCountRes.count || 0,
    statements: (statementsRes.data || []) as LiveCounts['statements'],
    statementsCount: statementsCountRes.count || 0,
    hansardCount: hansardCountRes.count || 0,
    commitmentsCount: commitmentsCountRes.count || 0,
    storytellerCount: storytellerCountRes.count || 0,
    ministers,
    commitments: charter.map(c => ({ minister_name: c.minister_name, status: c.status, commitment_text: c.commitment_text })),
    orgSparklines,
    nationalSparkline,
    alerts: (alertsRes.data || []) as LiveCounts['alerts'],
    alertsCount: alertsCountRes.count || 0,
  };
}

// ── Build state rows ──

export function buildStateRows(live: LiveCounts): StateRow[] {
  return getAllStateSlugs().map((slug) => {
    const c = STATE_CONFIGS[slug]!;
    const totalContracts = c.departments.reduce((s, d) => s + d.contracts, 0);
    const totalValue = c.departments.reduce((s, d) => s + d.totalValue, 0);
    const ratio = Math.round(c.costComparison.detentionCostPerDay / c.costComparison.communityCostPerDay * 10) / 10;
    const detentionAnnual = c.costComparison.avgKidsInDetention * c.costComparison.detentionCostPerDay * 365;

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = slug === 'qld' ? 'HIGH' : 'LOW';
    const procSource = slug === 'qld' ? 'QGIP + Historical + DYJVS' : 'AusTender only';

    const liveFunding = live.fundingByState[c.state];
    const interventionCount = live.interventionsByState[c.state] || 0;
    const orgCount = live.orgsByState[c.state] || 0;

    const hasStateProcurement = slug === 'qld';
    const hasFunding = (liveFunding?.count || 0) > 100;
    const hasInterventions = interventionCount > 10;
    const hasOrgs = orgCount > 50;
    const hasCivic = slug === 'qld';
    const checks = [hasStateProcurement, hasFunding, hasInterventions, hasOrgs, hasCivic];
    const verificationScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return {
      slug,
      state: c.state,
      stateFull: c.stateFull,
      totalContracts,
      totalValue,
      departments: c.departments.length,
      detentionCostPerDay: c.costComparison.detentionCostPerDay,
      communityCostPerDay: c.costComparison.communityCostPerDay,
      ratio,
      avgKids: c.costComparison.avgKidsInDetention,
      detentionAnnual,
      supplierCount: c.topSuppliers.length,
      interventionCount,
      orgCount,
      fundingSources: c.fundingBySource.length,
      totalFundingRecords: c.fundingBySource.reduce((s, f) => s + f.count, 0),
      liveFundingTotal: liveFunding?.total || 0,
      liveFundingRecords: liveFunding?.count || 0,
      dataConfidence: confidence,
      procurementSource: procSource,
      verificationScore,
    };
  });
}

export function buildOrgRows(): OrgRow[] {
  const rows: OrgRow[] = [];
  getAllStateSlugs().forEach((slug) => {
    const c = STATE_CONFIGS[slug]!;
    c.topSuppliers.forEach((s) => {
      rows.push({ name: s.name, state: c.state, slug, totalValue: s.totalValue, contracts: s.contracts, note: s.note, departments: s.departments });
    });
  });
  return rows.sort((a, b) => b.totalValue - a.totalValue);
}
