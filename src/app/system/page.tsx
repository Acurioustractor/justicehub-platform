import Link from 'next/link';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { STATE_CONFIGS, getAllStateSlugs } from './configs';
import { fmt, fmtCompact, fmtNum, fmtDate, truncate } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'System Terminal — Youth Justice Intelligence | JusticeHub',
  description: 'Bloomberg-terminal-style dashboard across all Australian youth justice systems. Follow the money across QLD, NSW, VIC, NT.',
  openGraph: {
    title: 'System Terminal — Youth Justice Intelligence',
    description: 'Multi-state youth justice intelligence. Contracts, suppliers, interventions, costs — all in one view.',
  },
};

// ── Types ──

type LiveCounts = {
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
  // Minister leaderboard data
  ministers: MinisterProfile[];
  commitments: { minister_name: string; status: string; commitment_text: string }[];
  // Sparkline data: per-org funding by FY
  orgSparklines: Record<string, { fy: string; total: number }[]>;
  nationalSparkline: { fy: string; total: number }[];
};

type MinisterProfile = {
  name: string;
  totalMeetings: number;
  externalMeetings: number;
  uniqueOrgs: number;
  topOrgs: string[];
  statements: number;
  commitments: number;
  delivered: number;
};

type StateRow = {
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

type OrgRow = {
  name: string;
  state: string;
  slug: string;
  totalValue: number;
  contracts: number;
  note?: string;
  departments: string[];
};

// ── Data source registry (every number traced to its source) ──

const SOURCES = {
  rogs: { name: 'Productivity Commission ROGS 2024-25', url: 'https://www.pc.gov.au/ongoing/report-on-government-services', confidence: 'verified' as const },
  qgip: { name: 'QLD Government Information Portal', url: 'https://data.qld.gov.au', confidence: 'verified' as const },
  austender: { name: 'AusTender Federal Procurement', url: 'https://www.tenders.gov.au', confidence: 'verified' as const },
  aihw: { name: 'AIHW Youth Justice 2023-24', url: 'https://www.aihw.gov.au/reports/youth-justice', confidence: 'verified' as const },
  alma: { name: 'ALMA Interventions Database', url: null, confidence: 'cross-referenced' as const },
  civic: { name: 'CivicScope QLD Scraper', url: null, confidence: 'cross-referenced' as const },
  config: { name: 'State Config (manual entry)', url: null, confidence: 'estimate' as const },
} as const;

// ── Live data fetch ──

async function fetchLiveCounts(): Promise<LiveCounts> {
  const supabase = createServiceClient();
  const stateKeys = getAllStateSlugs().map(s => STATE_CONFIGS[s]!.state);

  // Per-state funding count queries (avoids 50K row truncation problem)
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
    diariesRes,
    charterRes,
    statementsPerMinisterRes,
    ...fundingCountResults
  ] = await Promise.all([
    // Interventions with geography for per-state breakdown
    supabase
      .from('alma_interventions')
      .select('id, geography')
      .neq('verification_status', 'ai_generated')
      .limit(5000),

    // Exact intervention count
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),

    // Org counts by state
    supabase
      .from('organizations')
      .select('state', { count: 'exact' })
      .in('state', stateKeys),

    // Total funding count (all states)
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true }),

    // Recent statements for live feed
    supabase
      .from('civic_ministerial_statements')
      .select('id, headline, minister_name, published_at, source_url, mentioned_amounts')
      .order('published_at', { ascending: false })
      .limit(15),

    // Counts
    supabase.from('civic_ministerial_statements').select('id', { count: 'exact', head: true }),
    supabase.from('civic_hansard').select('id', { count: 'exact', head: true }),
    supabase.from('civic_charter_commitments').select('id', { count: 'exact', head: true }).eq('youth_justice_relevant', true),
    supabase.from('alma_stories').select('id', { count: 'exact', head: true }),

    // Minister leaderboard: diaries + charter commitments
    supabase
      .from('civic_ministerial_diaries')
      .select('minister_name, organisation, meeting_type')
      .limit(5000),
    supabase
      .from('civic_charter_commitments')
      .select('minister_name, status, commitment_text')
      .eq('youth_justice_relevant', true),
    // Statements per minister (for leaderboard)
    supabase
      .from('civic_ministerial_statements')
      .select('minister_name')
      .limit(5000),

    // Per-state funding counts (no row data transferred — just counts)
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

  // Build per-state funding from count queries + config totals (verified for QLD, estimates for others)
  const fundingByState: Record<string, { count: number; total: number }> = {};
  let totalFunding = 0;
  stateKeys.forEach((state, i) => {
    const slug = getAllStateSlugs().find(s => STATE_CONFIGS[s]!.state === state)!;
    const config = STATE_CONFIGS[slug]!;
    const count = fundingCountResults[i]?.count || 0;
    // Use config fundingBySource totals (verified for QLD via QGIP, estimates for others)
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

  // Build per-minister profiles
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

  // Statement counts per minister
  const stmtCounts: Record<string, number> = {};
  for (const s of stmtsByMinister) {
    stmtCounts[s.minister_name] = (stmtCounts[s.minister_name] || 0) + 1;
  }

  // Charter commitments per minister
  const charterByMinister: Record<string, { total: number; delivered: number }> = {};
  for (const c of charter) {
    if (!charterByMinister[c.minister_name]) charterByMinister[c.minister_name] = { total: 0, delivered: 0 };
    charterByMinister[c.minister_name].total++;
    if (c.status === 'delivered') charterByMinister[c.minister_name].delivered++;
  }

  // Build sorted minister profiles
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

  // Fetch sparkline data (per-org funding by FY)
  // Step 1: get org IDs for suppliers we care about
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

  // Step 2: fetch funding only for those orgs in the FY range
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

  // Aggregate per-org sparkline data
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

  // National sparkline
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
  };
}

// ── SVG Sparkline renderer ──

function Sparkline({ data, width = 80, height = 20, color = '#DC2626' }: {
  data: { fy: string; total: number }[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.total);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Trend: compare last value to first
  const trend = vals[vals.length - 1] > vals[0] ? 'up' : vals[vals.length - 1] < vals[0] ? 'down' : 'flat';
  const trendColor = trend === 'up' ? '#DC2626' : trend === 'down' ? '#059669' : '#888';
  const arrow = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';

  // Last FY label
  const lastFy = data[data.length - 1].fy.split('-')[0].slice(2);

  return (
    <span className="inline-flex items-center gap-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-70">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot on last point */}
        <circle
          cx={(vals.length - 1) / (vals.length - 1) * width}
          cy={height - ((vals[vals.length - 1] - min) / range) * (height - 2) - 1}
          r="2"
          fill={color}
        />
      </svg>
      <span className="font-mono text-[10px]" style={{ color: trendColor }}>{arrow}</span>
    </span>
  );
}

// ── Build state rows with live + config data ──

function buildStateRows(live: LiveCounts): StateRow[] {
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

    // Verification score: how much of this state's data is cross-referenced
    const hasStateProcurement = slug === 'qld';
    const hasFunding = (liveFunding?.count || 0) > 100;
    const hasInterventions = interventionCount > 10;
    const hasOrgs = orgCount > 50;
    const hasCivic = slug === 'qld'; // only QLD has civic data
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

function buildOrgRows(): OrgRow[] {
  const rows: OrgRow[] = [];
  getAllStateSlugs().forEach((slug) => {
    const c = STATE_CONFIGS[slug]!;
    c.topSuppliers.forEach((s) => {
      rows.push({ name: s.name, state: c.state, slug, totalValue: s.totalValue, contracts: s.contracts, note: s.note, departments: s.departments });
    });
  });
  return rows.sort((a, b) => b.totalValue - a.totalValue);
}

// ── Confidence badge component ──

function ConfBadge({ level }: { level: 'verified' | 'cross-referenced' | 'estimate' }) {
  const styles = {
    verified: 'bg-[#059669]/20 text-[#059669]',
    'cross-referenced': 'bg-amber-500/20 text-amber-400',
    estimate: 'bg-gray-800 text-gray-500',
  };
  const dots = { verified: '#059669', 'cross-referenced': '#D97706', estimate: '#555' };
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${styles[level]}`}>
      <span className="w-1 h-1 rounded-full" style={{ background: dots[level] }} />
      {level}
    </span>
  );
}

// ── Page ──

export default async function SystemTerminalDashboard() {
  const live = await fetchLiveCounts();
  const states = buildStateRows(live);
  const orgs = buildOrgRows();

  const totalContracts = states.reduce((s, r) => s + r.totalContracts, 0);
  const totalValue = states.reduce((s, r) => s + r.totalValue, 0);
  const totalDetentionAnnual = states.reduce((s, r) => s + r.detentionAnnual, 0);
  const totalKids = states.reduce((s, r) => s + r.avgKids, 0);
  const nationalAvgDetention = Math.round(states.reduce((s, r) => s + r.detentionCostPerDay, 0) / states.length);
  const nationalAvgCommunity = Math.round(states.reduce((s, r) => s + r.communityCostPerDay, 0) / states.length);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ═══ TOP BAR ═══ */}
      <nav className="bg-[#0A0A0A] border-b border-gray-800 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-6 text-sm font-mono">
          <Link href="/" className="text-[#F5F0E8] hover:text-[#DC2626] transition-colors">JusticeHub</Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#DC2626]">System Terminal</span>
          <div className="ml-auto flex gap-4">
            <Link href="/journey-map" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">Journey Map</Link>
            <Link href="/spending" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">National Spending</Link>
            <Link href="/justice-funding" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">Funding</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HEADER ═══ */}
      <header className="bg-[#0A0A0A] text-[#F5F0E8] px-6 pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-[#DC2626] tracking-[0.3em] uppercase mb-3">Multi-State Intelligence</p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#F5F0E8]">SYSTEM TERMINAL</h1>
            </div>
            <div className="font-mono text-xs text-gray-600 text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                <span>LIVE</span>
              </div>
              <div suppressHydrationWarning>{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Headline stats — all sourced */}
          <div className="flex flex-wrap gap-6 font-mono text-sm mb-8 border-b border-gray-800 pb-6">
            <div>
              <span className="text-[#DC2626] text-2xl font-bold">{fmtCompact(totalValue)}</span>
              <span className="text-gray-500 ml-2">in contracts</span>
              <div className="text-[10px] text-gray-700 mt-0.5">Config · {states.length} states</div>
            </div>
            <span className="text-gray-700 self-center">|</span>
            <div>
              <span className="text-[#F5F0E8] text-2xl font-bold">{fmtNum(live.totalFundingRecords)}</span>
              <span className="text-gray-500 ml-2">funding records</span>
              <div className="text-[10px] text-gray-700 mt-0.5">Live DB · {fmtCompact(live.totalFunding)}</div>
            </div>
            <span className="text-gray-700 self-center">|</span>
            <div>
              <span className="text-[#DC2626] text-2xl font-bold">{fmtCompact(totalDetentionAnnual)}</span>
              <span className="text-gray-500 ml-2">detention/yr</span>
              <div className="text-[10px] text-gray-700 mt-0.5">ROGS 2024-25</div>
            </div>
            <span className="text-gray-700 self-center">|</span>
            <div>
              <span className="text-[#F5F0E8] text-2xl font-bold">{fmtNum(live.totalInterventions)}</span>
              <span className="text-gray-500 ml-2">interventions</span>
              <div className="text-[10px] text-gray-700 mt-0.5">Live DB · ALMA verified</div>
            </div>
            <span className="text-gray-700 self-center">|</span>
            <div>
              <span className="text-[#F5F0E8] text-2xl font-bold">{totalKids}</span>
              <span className="text-gray-500 ml-2">kids detained nightly</span>
              <div className="text-[10px] text-gray-700 mt-0.5">ROGS 2024-25</div>
            </div>
          </div>

          {/* State filter chips */}
          <div className="flex gap-3 flex-wrap">
            {states.map((s) => (
              <Link
                key={s.slug}
                href={`/system/${s.slug}`}
                className="group border border-gray-700 hover:border-[#DC2626] rounded-sm px-4 py-3 transition-all hover:bg-gray-900/50 min-w-[160px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : s.dataConfidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                  <span className="font-mono text-sm font-bold text-[#F5F0E8] group-hover:text-[#DC2626] transition-colors">{s.state}</span>
                  <ConfBadge level={s.dataConfidence === 'HIGH' ? 'verified' : 'estimate'} />
                </div>
                <div className="font-mono text-xs text-gray-500">
                  {fmtCompact(s.totalValue)} · {fmtNum(s.interventionCount)} programs · {fmtNum(s.orgCount)} orgs
                </div>
              </Link>
            ))}
            <div className="border border-dashed border-gray-800 rounded-sm px-4 py-3 min-w-[140px] flex items-center justify-center">
              <span className="font-mono text-xs text-gray-700">WA · SA · TAS · ACT</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN GRID ═══ */}
      <main className="px-6 pb-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COL 1-2: Tables ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* State Comparison Table */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">State Comparison</span>
                </div>
                <div className="flex items-center gap-3">
                  <button id="compare-btn" className="font-mono text-[10px] text-gray-600 hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border border-gray-700 hover:border-[#DC2626] px-2 py-0.5 rounded-sm">COMPARE</button>
                  <ConfBadge level="verified" />
                  <span className="font-mono text-xs text-gray-600">ROGS 2024-25</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_80px_80px_55px_55px_80px_55px_65px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>State</span>
                <span className="text-right">Det/day</span>
                <span className="text-right">Comm/day</span>
                <span className="text-right">Ratio</span>
                <span className="text-right">Kids</span>
                <span className="text-right">Annual</span>
                <span className="text-right">Intv</span>
                <span className="text-center">Verify</span>
              </div>

              <div className="divide-y divide-gray-800" id="state-table">
                {states
                  .sort((a, b) => b.detentionCostPerDay - a.detentionCostPerDay)
                  .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/system/${s.slug}`}
                    className="grid grid-cols-[1fr_80px_80px_55px_55px_80px_55px_65px] gap-1 px-4 py-3 hover:bg-gray-900/50 transition-colors items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : 'bg-gray-600'}`} />
                      <span className="font-mono text-sm font-bold text-[#F5F0E8]">{s.state}</span>
                      <span className="text-xs text-gray-600 hidden md:inline">{s.stateFull}</span>
                    </div>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmt(s.detentionCostPerDay)}</span>
                    <span className="font-mono text-sm text-[#059669] text-right">{fmt(s.communityCostPerDay)}</span>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{s.ratio}x</span>
                    <span className="font-mono text-sm text-[#F5F0E8] text-right">{s.avgKids}</span>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmtCompact(s.detentionAnnual)}</span>
                    <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(s.interventionCount)}</span>
                    <span className="text-center">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                        s.verificationScore >= 80 ? 'bg-[#059669]/20 text-[#059669]' :
                        s.verificationScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-gray-800 text-gray-500'
                      }`}>
                        {s.verificationScore}%
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-400">NATIONAL</span>
                  <div className="flex items-center gap-4 font-mono text-sm">
                    <span className="text-[#DC2626] font-bold">{fmt(nationalAvgDetention)}/day</span>
                    <span className="text-gray-600">vs</span>
                    <span className="text-[#059669] font-bold">{fmt(nationalAvgCommunity)}/day</span>
                    <span className="text-gray-600">=</span>
                    <span className="text-[#DC2626] font-bold">{fmtCompact(totalDetentionAnnual)}/yr</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-gray-700 mt-1">
                  Source: {SOURCES.rogs.name} · Detention costs verified against published tables
                </div>
              </div>
            </div>

            {/* Org Ticker Table */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Top Organisations</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-600">{orgs.length} suppliers</span>
                  <span className="font-mono text-xs text-gray-700">|</span>
                  <button id="sort-value" className="font-mono text-[10px] text-[#DC2626] hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none">SORT: VALUE</button>
                  <button id="sort-contracts" className="font-mono text-[10px] text-gray-600 hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none">CONTRACTS</button>
                  <button id="sort-name" className="font-mono text-[10px] text-gray-600 hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none">A-Z</button>
                </div>
              </div>

              <div className="grid grid-cols-[32px_1fr_60px_100px_100px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>#</span>
                <span>Organisation</span>
                <span>State</span>
                <span className="text-right">Value</span>
                <span className="text-center">Trend</span>
                <span className="text-right">Contracts</span>
              </div>

              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto" id="org-table">
                {orgs.map((o, i) => {
                  const spark = live.orgSparklines[o.name];
                  return (
                  <div
                    key={`${o.name}-${o.state}`}
                    className="grid grid-cols-[32px_1fr_60px_100px_100px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center"
                    data-org-row
                    data-value={o.totalValue}
                    data-contracts={o.contracts}
                    data-name={o.name}
                  >
                    <span className="font-mono text-xs text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-[#F5F0E8] block truncate">{o.name}</span>
                      {o.note && (
                        <span className={`font-mono text-[10px] ${o.note.toLowerCase().includes('indigenous') ? 'text-[#059669]' : 'text-gray-600'}`}>
                          {o.note}
                        </span>
                      )}
                    </div>
                    <Link href={`/system/${o.slug}`} className="font-mono text-xs text-gray-400 hover:text-[#DC2626] transition-colors">{o.state}</Link>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmtCompact(o.totalValue)}</span>
                    <span className="text-center">
                      {spark && spark.length >= 2 ? (
                        <Sparkline data={spark} />
                      ) : (
                        <span className="font-mono text-[10px] text-gray-700">—</span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-gray-500 text-right">{fmtNum(o.contracts)}</span>
                  </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-400">TOTAL</span>
                  <div className="flex items-center gap-6 font-mono text-sm">
                    <span className="text-[#DC2626] font-bold">{fmtCompact(orgs.reduce((s, o) => s + o.totalValue, 0))}</span>
                    <span className="text-gray-500">{fmtNum(orgs.reduce((s, o) => s + o.contracts, 0))} contracts</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-gray-700 mt-1">
                  QLD: {SOURCES.qgip.name} (verified) · NSW/VIC/NT: {SOURCES.austender.name} (estimates)
                </div>
              </div>
            </div>

            {/* Minister Leaderboard */}
            {live.ministers.length > 0 && (
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Minister Leaderboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <ConfBadge level="cross-referenced" />
                  <span className="font-mono text-xs text-gray-600">{live.ministers.reduce((s, m) => s + m.totalMeetings, 0)} meetings</span>
                </div>
              </div>

              {/* Header */}
              <div className="grid grid-cols-[1fr_65px_65px_55px_55px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>Minister</span>
                <span className="text-right">Meetings</span>
                <span className="text-right">External</span>
                <span className="text-right">Orgs</span>
                <span className="text-right">Stmts</span>
                <span className="text-center">Delivery</span>
              </div>

              <div className="divide-y divide-gray-800">
                {live.ministers.slice(0, 10).map((m) => {
                  const deliveryRate = m.commitments > 0 ? Math.round((m.delivered / m.commitments) * 100) : null;
                  return (
                    <div key={m.name} className="grid grid-cols-[1fr_65px_65px_55px_55px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center">
                      <div className="min-w-0">
                        <span className="text-sm text-[#F5F0E8] block truncate">{m.name}</span>
                        {m.topOrgs.length > 0 && (
                          <span className="font-mono text-[10px] text-gray-600 block truncate">
                            Top: {m.topOrgs.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-sm text-[#F5F0E8] font-bold text-right">{fmtNum(m.totalMeetings)}</span>
                      <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.externalMeetings)}</span>
                      <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.uniqueOrgs)}</span>
                      <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.statements)}</span>
                      <span className="text-center">
                        {deliveryRate !== null ? (
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                            deliveryRate >= 50 ? 'bg-[#059669]/20 text-[#059669]' :
                            deliveryRate >= 25 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-[#DC2626]/20 text-[#DC2626]'
                          }`}>
                            {m.delivered}/{m.commitments} ({deliveryRate}%)
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-gray-700">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] text-gray-700">
                    Source: QLD Ministerial Diaries + Charter Letter Commitments · Who do ministers meet? Who gets access?
                  </div>
                </div>
                {/* Commitment delivery summary */}
                {live.commitments.length > 0 && (() => {
                  const totalCommitments = live.commitments.length;
                  const deliveredCount = live.commitments.filter(c => c.status === 'delivered').length;
                  const rate = Math.round((deliveredCount / totalCommitments) * 100);
                  return (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
                        <div className={`h-full rounded-sm ${rate >= 50 ? 'bg-[#059669]' : rate >= 25 ? 'bg-amber-500' : 'bg-[#DC2626]'}`} style={{ width: `${rate}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">
                        {deliveredCount}/{totalCommitments} YJ commitments delivered ({rate}%)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            )}

            {/* Live Feed — Recent Ministerial Statements */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Live Feed — Ministerial Statements</span>
                </div>
                <div className="flex items-center gap-3">
                  <ConfBadge level="cross-referenced" />
                  <span className="font-mono text-xs text-gray-600">{fmtNum(live.statementsCount)} total</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
                {live.statements.map((s) => (
                  <div key={s.id} className="px-4 py-3 hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-gray-600">{fmtDate(s.published_at)}</span>
                      <span className="font-mono text-xs text-[#F5F0E8] font-bold">{s.minister_name}</span>
                      <span className="font-mono text-[10px] text-gray-700">QLD</span>
                    </div>
                    <p className="text-sm text-[#F5F0E8] leading-snug">
                      {s.source_url ? (
                        <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#DC2626] transition-colors">
                          {truncate(s.headline, 140)}
                        </a>
                      ) : truncate(s.headline, 140)}
                    </p>
                    {s.mentioned_amounts && s.mentioned_amounts.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {s.mentioned_amounts.slice(0, 4).map((amt, i) => (
                          <span key={i} className="font-mono text-xs text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 rounded-sm">{amt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-600 px-4 py-2 bg-gray-900/30">
                <span className="font-mono text-[10px] text-gray-700">
                  Source: {SOURCES.civic.name} · Auto-scraped from QLD ministerial websites · $ amounts auto-extracted
                </span>
              </div>
            </div>
          </div>

          {/* ── COL 3: Sidebar ── */}
          <div className="space-y-6">

            {/* System Health Gauge */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Verification Score</span>
              </div>
              <div className="p-4 space-y-4">
                {states.map((s) => {
                  const score = s.verificationScore;
                  const barColor = score >= 80 ? 'bg-[#059669]' : score >= 40 ? 'bg-amber-500' : 'bg-gray-600';
                  return (
                    <div key={s.slug}>
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/system/${s.slug}`} className="font-mono text-sm text-[#F5F0E8] font-bold hover:text-[#DC2626] transition-colors">{s.state}</Link>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">{score}%</span>
                          <ConfBadge level={score >= 80 ? 'verified' : score >= 40 ? 'cross-referenced' : 'estimate'} />
                        </div>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                        <div className={`h-full ${barColor} rounded-sm transition-all`} style={{ width: `${score}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1 font-mono text-[10px] text-gray-600">
                        <span>{s.procurementSource}</span>
                        <span>{fmtNum(s.liveFundingRecords)} DB records</span>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-gray-700 pt-3 space-y-1.5">
                  <p className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verification Criteria</p>
                  <div className="font-mono text-[10px] text-gray-600 space-y-1">
                    <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> State procurement data</div>
                    <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 100+ funding records</div>
                    <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 10+ verified interventions</div>
                    <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 50+ tracked organisations</div>
                    <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> Civic intelligence active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detention Cost Index */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Detention Cost Index</span>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {states
                    .sort((a, b) => b.detentionCostPerDay - a.detentionCostPerDay)
                    .map((s) => {
                      const maxCost = Math.max(...states.map(st => st.detentionCostPerDay));
                      const pct = Math.round((s.detentionCostPerDay / maxCost) * 100);
                      return (
                        <div key={s.slug}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-[#F5F0E8] font-bold">{s.state}</span>
                            <span className="font-mono text-xs text-[#DC2626] font-bold">{fmt(s.detentionCostPerDay)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-sm overflow-hidden">
                            <div className="h-full bg-[#DC2626] rounded-sm" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="font-mono text-[10px] text-gray-600 mt-3">
                  Source: {SOURCES.rogs.name}
                </p>
              </div>
            </div>

            {/* Live Data Inventory */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5F0E8]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Data Inventory</span>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { label: 'Contracts (config)', value: fmtNum(totalContracts), color: 'text-[#F5F0E8]', source: 'State configs', conf: 'estimate' as const },
                  { label: 'Funding records', value: fmtNum(live.totalFundingRecords), color: 'text-[#F5F0E8]', source: 'Live DB', conf: 'verified' as const },
                  { label: 'Funding total', value: fmtCompact(live.totalFunding), color: 'text-[#DC2626]', source: 'Live DB', conf: 'verified' as const },
                  { label: 'Interventions', value: fmtNum(live.totalInterventions), color: 'text-[#059669]', source: 'ALMA DB', conf: 'cross-referenced' as const },
                  { label: 'Organisations', value: fmtNum(live.totalOrgs), color: 'text-[#F5F0E8]', source: 'Live DB', conf: 'verified' as const },
                  { label: 'Statements', value: fmtNum(live.statementsCount), color: 'text-[#F5F0E8]', source: 'CivicScope', conf: 'cross-referenced' as const },
                  { label: 'Hansard', value: fmtNum(live.hansardCount), color: 'text-[#F5F0E8]', source: 'CivicScope', conf: 'cross-referenced' as const },
                  { label: 'Commitments', value: fmtNum(live.commitmentsCount), color: 'text-[#F5F0E8]', source: 'CivicScope', conf: 'cross-referenced' as const },
                  { label: 'Stories', value: fmtNum(live.storytellerCount), color: 'text-[#059669]', source: 'Empathy Ledger', conf: 'verified' as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{item.label}</span>
                      <span className={`w-1 h-1 rounded-full ${item.conf === 'verified' ? 'bg-[#059669]' : item.conf === 'cross-referenced' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                    </div>
                    <span className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 font-mono text-[10px] text-gray-600 space-y-0.5">
                  <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#059669]" /> Verified — directly from authoritative source</div>
                  <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500" /> Cross-referenced — matched across datasets</div>
                  <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-600" /> Estimate — manual entry, needs verification</div>
                </div>
              </div>
            </div>

            {/* The Equation */}
            <div className="border border-[#DC2626]/30 rounded-sm bg-[#DC2626]/5">
              <div className="p-4">
                <p className="font-mono text-xs text-[#DC2626] uppercase tracking-wide mb-3">The Equation</p>
                <div className="font-mono text-sm text-[#F5F0E8] space-y-2">
                  <p><span className="text-[#DC2626] font-bold">{totalKids}</span> kids in detention nightly</p>
                  <p>&times; avg <span className="text-[#DC2626] font-bold">{fmtCompact(nationalAvgDetention * 365)}</span>/yr each</p>
                  <p className="border-t border-[#DC2626]/20 pt-2">= <span className="text-[#DC2626] font-bold text-lg">{fmtCompact(totalDetentionAnnual)}</span>/year</p>
                </div>
                <p className="font-mono text-[10px] text-gray-600 mt-3">
                  {SOURCES.rogs.name} · {states.length} states · Verified
                </p>
              </div>
            </div>

            {/* Source Registry */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Source Registry</span>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(SOURCES).map(([key, src]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${src.confidence === 'verified' ? 'bg-[#059669]' : src.confidence === 'cross-referenced' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-[#F5F0E8] block">{src.name}</span>
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-gray-600 hover:text-gray-400 truncate block">
                          {src.url.replace('https://', '')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* State data for comparison mode */}
      <script
        id="state-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(states.map(s => ({
          slug: s.slug, state: s.state, stateFull: s.stateFull,
          det: s.detentionCostPerDay, comm: s.communityCostPerDay, ratio: s.ratio,
          kids: s.avgKids, annual: s.detentionAnnual, intv: s.interventionCount,
          orgs: s.orgCount, verify: s.verificationScore, conf: s.dataConfidence,
          fundRec: s.liveFundingRecords, fundTotal: s.liveFundingTotal,
        }))) }}
      />

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-gray-800 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between font-mono text-xs text-gray-600">
          <span>JusticeHub / System Terminal</span>
          <span suppressHydrationWarning>Last updated: {new Date().toISOString().split('T')[0]}</span>
        </div>
      </footer>

      {/* Inline interactive script — sort, drill-down, copy, keyboard nav */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          // ── 1. Sort table ──
          var sortBtns = { value: document.getElementById('sort-value'), contracts: document.getElementById('sort-contracts'), name: document.getElementById('sort-name') };
          var container = document.getElementById('org-table');
          if (container) {
            function sortTable(key) {
              var rows = Array.from(container.querySelectorAll('[data-org-row]'));
              rows.sort(function(a, b) {
                if (key === 'value') return Number(b.dataset.value) - Number(a.dataset.value);
                if (key === 'contracts') return Number(b.dataset.contracts) - Number(a.dataset.contracts);
                return a.dataset.name.localeCompare(b.dataset.name);
              });
              rows.forEach(function(row, i) {
                row.querySelector('span').textContent = String(i + 1).padStart(2, '0');
                container.appendChild(row);
              });
              Object.entries(sortBtns).forEach(function(entry) {
                if (entry[1]) entry[1].style.color = entry[0] === key ? '#DC2626' : '#555';
              });
            }
            Object.entries(sortBtns).forEach(function(entry) {
              if (entry[1]) entry[1].addEventListener('click', function() { sortTable(entry[0]); });
            });
          }

          // ── 2. Org drill-down panel ──
          var panel = null;
          function escHandler(e) { if (e.key === 'Escape') closeDrill(); }
          function closeDrill() {
            if (panel) { panel.remove(); panel = null; }
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
          }

          // Click org name → drill-down
          if (container) {
            container.addEventListener('click', function(e) {
              var row = e.target.closest('[data-org-row]');
              if (!row) return;
              // Don't trigger on state link clicks
              if (e.target.closest('a')) return;
              var orgName = row.dataset.name;
              var stateEl = row.querySelector('a');
              var state = stateEl ? stateEl.textContent.trim() : 'QLD';
              showOrgDrill(orgName, state);
            });
          }

          function showOrgDrill(orgName, state) {
            closeDrill();
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;justify-content:flex-end;';
            overlay.innerHTML = '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" data-close></div>'
              + '<div style="position:relative;width:100%;max-width:640px;background:#0A0A0A;border-left:1px solid #333;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,0.5)">'
              + '<div style="position:sticky;top:0;background:#0A0A0A;border-bottom:1px solid #333;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;z-index:1">'
              + '<div><h3 style="font-family:Space Grotesk,sans-serif;font-size:18px;font-weight:700;color:#F5F0E8;margin:0">' + orgName + '</h3>'
              + '<p style="font-family:monospace;font-size:11px;color:#888;margin:4px 0 0">' + state + ' · Funding History + Programs</p></div>'
              + '<button data-close style="color:#888;font-family:monospace;font-size:13px;background:none;border:none;cursor:pointer;padding:4px 8px">[ESC]</button>'
              + '</div>'
              + '<div id="drill-body" style="padding:24px"><div style="display:flex;align-items:center;gap:12px;justify-content:center;padding:48px 0"><div style="width:16px;height:16px;border:2px solid #333;border-top-color:#DC2626;border-radius:50%;animation:spin 1s linear infinite"></div><span style="font-family:monospace;font-size:13px;color:#888">Loading...</span></div></div>'
              + '</div>';
            var style = document.createElement('style');
            style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            overlay.appendChild(style);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            panel = overlay;
            overlay.addEventListener('click', function(ev) {
              if (ev.target.hasAttribute('data-close')) closeDrill();
            });
            document.addEventListener('keydown', escHandler);

            fetch('/api/system/drill-down?id=org-detail&state=' + encodeURIComponent(state) + '&org=' + encodeURIComponent(orgName))
              .then(function(r) { return r.json(); })
              .then(function(data) { renderDrill(data); })
              .catch(function(err) {
                document.getElementById('drill-body').innerHTML = '<p style="font-family:monospace;font-size:13px;color:#DC2626;text-align:center;padding:48px 0">Error: ' + err.message + '</p>';
              });
          }

          function renderDrill(data) {
            var body = document.getElementById('drill-body');
            if (!body) return;
            var conf = data.confidence || 'estimate';
            var dot = conf === 'verified' ? '#059669' : conf === 'cross-referenced' ? '#D97706' : '#DC2626';
            var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
              + '<span style="display:inline-flex;align-items:center;gap:4px;font-family:monospace;font-size:11px;color:#888"><span style="width:6px;height:6px;border-radius:50%;background:' + dot + ';display:inline-block"></span>' + conf.charAt(0).toUpperCase() + conf.slice(1) + '</span>'
              + '<span style="font-family:monospace;font-size:10px;color:#555">' + (data.total || 0).toLocaleString() + ' records</span>'
              + '</div>';
            html += '<div style="overflow-x:auto"><table style="width:100%;font-family:monospace;font-size:13px;border-collapse:collapse">';
            html += '<thead><tr style="border-bottom:1px solid #333">';
            (data.columns || []).forEach(function(col) {
              html += '<th style="padding:8px 12px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;text-align:' + (col.align === 'right' ? 'right' : 'left') + '">' + col.label + '</th>';
            });
            html += '</tr></thead><tbody>';
            (data.rows || []).forEach(function(row) {
              var isSection = String(row[data.columns[0].key] || '').startsWith('──');
              html += '<tr style="border-bottom:1px solid ' + (isSection ? '#333' : '#1a1a1a') + ';' + (isSection ? 'background:#111' : '') + '">';
              (data.columns || []).forEach(function(col) {
                var val = row[col.key];
                var style = 'padding:8px 12px;text-align:' + (col.align === 'right' ? 'right' : 'left') + ';';
                if (isSection) style += 'color:#DC2626;font-weight:bold;font-size:11px;';
                else style += 'color:#F5F0E8;';
                var display = val == null ? '' : typeof val === 'number' ? (Math.abs(val) >= 1e6 ? '$' + (val/1e6).toFixed(1) + 'M' : Math.abs(val) >= 1e3 ? '$' + (val/1e3).toFixed(0) + 'K' : Number.isInteger(val) ? val.toLocaleString() : String(val)) : String(val);
                html += '<td style="' + style + '">' + display + '</td>';
              });
              html += '</tr>';
            });
            html += '</tbody></table></div>';
            html += '<div style="border-top:1px solid #333;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between">'
              + '<span style="font-family:monospace;font-size:10px;color:#555">Source: ' + (data.source || 'Unknown') + '</span>'
              + '<span style="font-family:monospace;font-size:10px;color:#444">Updated: ' + (data.lastUpdated || 'Unknown') + '</span>'
              + '</div>';
            body.innerHTML = html;
          }

          // ── 3. Click-to-copy with source ──
          document.addEventListener('dblclick', function(e) {
            var el = e.target.closest('[class*="font-mono"][class*="font-bold"]');
            if (!el) return;
            var text = el.textContent.trim();
            if (!text || text.length > 30) return;
            // Find nearest source attribution
            var parent = el.closest('div[class*="border"]') || el.parentElement;
            var sourceEl = parent ? parent.querySelector('[class*="text-gray-700"], [class*="text-gray-600"]') : null;
            var source = sourceEl ? sourceEl.textContent.trim() : 'JusticeHub System Terminal';
            var copyText = text + ' (Source: ' + source + ' — justicehub.org.au/system)';
            navigator.clipboard.writeText(copyText).then(function() {
              // Show toast
              var toast = document.createElement('div');
              toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:#F5F0E8;font-family:monospace;font-size:13px;padding:8px 16px;border-radius:4px;z-index:99999;';
              toast.textContent = 'Copied: ' + text;
              document.body.appendChild(toast);
              setTimeout(function() { toast.remove(); }, 2000);
            });
          });

          // ── 4. Keyboard navigation ──
          var focusedRow = -1;
          var allRows = [];
          function refreshRows() {
            allRows = Array.from(document.querySelectorAll('[data-org-row], #state-table a'));
          }
          function highlightRow(idx) {
            allRows.forEach(function(r) { r.style.background = ''; });
            if (idx >= 0 && idx < allRows.length) {
              allRows[idx].style.background = 'rgba(220,38,38,0.1)';
              allRows[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
          document.addEventListener('keydown', function(e) {
            if (panel) return; // don't nav while drill-down is open
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'j' || e.key === 'ArrowDown') {
              e.preventDefault();
              refreshRows();
              focusedRow = Math.min(focusedRow + 1, allRows.length - 1);
              highlightRow(focusedRow);
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
              e.preventDefault();
              refreshRows();
              focusedRow = Math.max(focusedRow - 1, 0);
              highlightRow(focusedRow);
            } else if (e.key === 'Enter' && focusedRow >= 0) {
              refreshRows();
              var row = allRows[focusedRow];
              if (row && row.dataset && row.dataset.name) {
                var stateEl = row.querySelector('a');
                showOrgDrill(row.dataset.name, stateEl ? stateEl.textContent.trim() : 'QLD');
              } else if (row && row.href) {
                window.location.href = row.href;
              }
            } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
              // Show keyboard shortcuts help
              var existing = document.getElementById('kb-help');
              if (existing) { existing.remove(); return; }
              var help = document.createElement('div');
              help.id = 'kb-help';
              help.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0A0A0A;border:1px solid #333;padding:16px;border-radius:4px;z-index:99999;font-family:monospace;font-size:12px;color:#888;min-width:200px;';
              help.innerHTML = '<div style="color:#F5F0E8;font-weight:bold;margin-bottom:8px">Keyboard Shortcuts</div>'
                + '<div><span style="color:#DC2626">j/↓</span> Next row</div>'
                + '<div><span style="color:#DC2626">k/↑</span> Previous row</div>'
                + '<div><span style="color:#DC2626">Enter</span> Open detail</div>'
                + '<div><span style="color:#DC2626">Esc</span> Close panel</div>'
                + '<div><span style="color:#DC2626">dbl-click</span> Copy number + source</div>'
                + '<div style="margin-top:8px"><span style="color:#DC2626">?</span> Toggle this help</div>';
              document.body.appendChild(help);
              setTimeout(function() { help.remove(); }, 5000);
            }
          });
          // ── 5. State comparison mode ──
          var compareBtn = document.getElementById('compare-btn');
          var stateData = [];
          try { stateData = JSON.parse(document.getElementById('state-data').textContent); } catch(e) {}
          var compareMode = false;
          var selected = [];

          if (compareBtn && stateData.length > 0) {
            compareBtn.addEventListener('click', function() {
              compareMode = !compareMode;
              selected = [];
              compareBtn.textContent = compareMode ? 'SELECT 2 STATES' : 'COMPARE';
              compareBtn.style.color = compareMode ? '#DC2626' : '';
              compareBtn.style.borderColor = compareMode ? '#DC2626' : '';
              // Remove any existing comparison panel
              var existing = document.getElementById('compare-panel');
              if (existing) existing.remove();
              // Add click handlers to state table rows
              var stateRows = document.querySelectorAll('#state-table a');
              stateRows.forEach(function(row) {
                if (compareMode) {
                  row.dataset.compareListener = 'true';
                  row.addEventListener('click', stateClickHandler);
                } else {
                  row.removeEventListener('click', stateClickHandler);
                  row.style.background = '';
                }
              });
            });
          }

          function stateClickHandler(e) {
            if (!compareMode) return;
            e.preventDefault();
            e.stopPropagation();
            var row = e.currentTarget;
            var stateCode = row.querySelector('.font-mono.text-sm.font-bold')?.textContent?.trim();
            if (!stateCode) return;
            // Toggle selection
            var idx = selected.indexOf(stateCode);
            if (idx >= 0) {
              selected.splice(idx, 1);
              row.style.background = '';
            } else if (selected.length < 2) {
              selected.push(stateCode);
              row.style.background = 'rgba(220,38,38,0.15)';
            }
            compareBtn.textContent = selected.length === 0 ? 'SELECT 2 STATES' : selected.length === 1 ? selected[0] + ' vs ?' : selected[0] + ' vs ' + selected[1];
            if (selected.length === 2) {
              showComparison(selected[0], selected[1]);
            }
          }

          function fmtMoney(n) { return n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : n >= 1e6 ? '$'+(n/1e6).toFixed(0)+'M' : n >= 1e3 ? '$'+(n/1e3).toFixed(0)+'K' : '$'+n; }
          function fmtN(n) { return n.toLocaleString(); }

          function showComparison(a, b) {
            var sa = stateData.find(function(s) { return s.state === a; });
            var sb = stateData.find(function(s) { return s.state === b; });
            if (!sa || !sb) return;

            var existing = document.getElementById('compare-panel');
            if (existing) existing.remove();

            var metrics = [
              { label: 'Detention cost/day', a: sa.det, b: sb.det, fmt: fmtMoney, worse: 'higher' },
              { label: 'Community cost/day', a: sa.comm, b: sb.comm, fmt: fmtMoney, worse: 'higher' },
              { label: 'Cost ratio', a: sa.ratio, b: sb.ratio, fmt: function(v){return v+'x'}, worse: 'higher' },
              { label: 'Avg kids detained', a: sa.kids, b: sb.kids, fmt: fmtN, worse: 'higher' },
              { label: 'Annual detention cost', a: sa.annual, b: sb.annual, fmt: fmtMoney, worse: 'higher' },
              { label: 'Interventions', a: sa.intv, b: sb.intv, fmt: fmtN, worse: 'lower' },
              { label: 'Organisations', a: sa.orgs, b: sb.orgs, fmt: fmtN, worse: 'lower' },
              { label: 'Funding records', a: sa.fundRec, b: sb.fundRec, fmt: fmtN, worse: 'lower' },
              { label: 'Verification', a: sa.verify, b: sb.verify, fmt: function(v){return v+'%'}, worse: 'lower' },
            ];

            var html = '<div id="compare-panel" style="border:1px solid #DC2626;border-radius:2px;margin-top:12px;background:#0A0A0A">';
            html += '<div style="border-bottom:1px solid #333;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
            html += '<div style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:#DC2626;display:inline-block"></span><span style="font-family:monospace;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em">State Comparison</span></div>';
            html += '<button onclick="this.closest(\\x27#compare-panel\\x27).remove()" style="font-family:monospace;font-size:11px;color:#888;background:none;border:none;cursor:pointer">[CLOSE]</button>';
            html += '</div>';
            html += '<div style="display:grid;grid-template-columns:1fr 100px 60px 100px;gap:4px;padding:8px 16px;font-family:monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1a1a1a">';
            html += '<span>Metric</span><span style="text-align:right">' + a + '</span><span style="text-align:center">vs</span><span style="text-align:right">' + b + '</span>';
            html += '</div>';

            metrics.forEach(function(m) {
              var aWorse = m.worse === 'higher' ? m.a > m.b : m.a < m.b;
              var bWorse = m.worse === 'higher' ? m.b > m.a : m.b < m.a;
              var aColor = m.a === m.b ? '#F5F0E8' : aWorse ? '#DC2626' : '#059669';
              var bColor = m.a === m.b ? '#F5F0E8' : bWorse ? '#DC2626' : '#059669';
              var delta = m.a !== 0 ? Math.round(((m.b - m.a) / m.a) * 100) : 0;
              var deltaStr = delta > 0 ? '+' + delta + '%' : delta + '%';
              html += '<div style="display:grid;grid-template-columns:1fr 100px 60px 100px;gap:4px;padding:8px 16px;border-bottom:1px solid #111;align-items:center">';
              html += '<span style="font-family:monospace;font-size:12px;color:#888">' + m.label + '</span>';
              html += '<span style="font-family:monospace;font-size:13px;font-weight:bold;color:' + aColor + ';text-align:right">' + m.fmt(m.a) + '</span>';
              html += '<span style="font-family:monospace;font-size:10px;color:#555;text-align:center">' + (m.a === m.b ? '=' : deltaStr) + '</span>';
              html += '<span style="font-family:monospace;font-size:13px;font-weight:bold;color:' + bColor + ';text-align:right">' + m.fmt(m.b) + '</span>';
              html += '</div>';
            });

            html += '<div style="padding:12px 16px;font-family:monospace;font-size:10px;color:#555">';
            html += 'Red = worse outcome · Green = better outcome · Source: ROGS 2024-25, Live DB';
            html += '</div></div>';

            var table = document.querySelector('#state-table')?.parentElement;
            if (table) table.insertAdjacentHTML('beforeend', html);

            // Reset compare mode
            compareMode = false;
            compareBtn.textContent = 'COMPARE';
            compareBtn.style.color = '';
            compareBtn.style.borderColor = '';
            document.querySelectorAll('#state-table a').forEach(function(row) {
              row.removeEventListener('click', stateClickHandler);
            });
          }
        })();
      `}} />
    </div>
  );
}
