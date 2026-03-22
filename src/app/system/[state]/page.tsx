import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStateConfig, getAllStateSlugs } from '../configs';
import { fmt, fmtCompact, fmtNum, fmtDate, truncate } from '../types';
import type { SystemConfig } from '../types';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) return { title: 'Not Found' };

  const totalValue = fmtCompact(config.departments.reduce((s, d) => s + d.totalValue, 0));
  const totalContracts = fmtNum(config.departments.reduce((s, d) => s + d.contracts, 0));

  return {
    title: `${config.state} Youth Justice System Map — Follow the Money | JusticeHub`,
    description: `Bloomberg-terminal-style intelligence on ${config.stateFull} youth justice: ${totalValue} in contracts, ${totalContracts} records, ${config.departments.length} departments.`,
    openGraph: {
      title: `${config.state} Youth Justice System Map`,
      description: `${totalValue} in contracts across ${config.departments.length} departments. Who gets the money? What do they promise? What actually works?`,
    },
  };
}

// All config constants moved to ../configs/
// Helpers imported from ../types

// ── Types ──

type CharterCommitment = {
  id: string;
  minister_name: string;
  portfolio: string;
  commitment_type: string;
  commitment_text: string;
  category: string;
  status: string;
  status_evidence: string | null;
  youth_justice_relevant: boolean;
};

type MinisterialStatement = {
  id: string;
  source_id: string;
  headline: string;
  minister_name: string;
  portfolio: string;
  published_at: string;
  source_url: string;
  mentioned_amounts: string[];
  mentioned_locations: string[];
};

type HansardSpeech = {
  id: string;
  sitting_date: string;
  speaker_name: string;
  speaker_party: string | null;
  speaker_electorate: string | null;
  speaker_role: string | null;
  speech_type: string;
  subject: string | null;
  source_url: string | null;
};

type Intervention = {
  id: string;
  name: string;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  portfolio_score: number | null;
  operating_organization_id: string | null;
  organizations: { name: string; state: string | null } | null;
};

// ── Page ──

export default async function SystemTerminalPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) notFound();

  const supabase = createServiceClient();

  // Derived constants from config
  const DETENTION_COST_PER_DAY = config.costComparison.detentionCostPerDay;
  const COMMUNITY_COST_PER_DAY = config.costComparison.communityCostPerDay;
  const DETENTION_COST_PER_YEAR = DETENTION_COST_PER_DAY * 365;
  const DETENTION_COMMUNITY_RATIO = Math.round(DETENTION_COST_PER_DAY / COMMUNITY_COST_PER_DAY * 10) / 10;
  const KIDS_IN_DETENTION = config.costComparison.avgKidsInDetention;
  const DETENTION_TOTAL_ANNUAL = KIDS_IN_DETENTION * DETENTION_COST_PER_YEAR;

  // Fetch all dynamic data in parallel
  const [charterRes, statementsRes, hansardRes, fundingRes, interventionsRes, rogsRes, crossoverRes, diaryRes, accountabilityRes] = await Promise.all([
    supabase
      .from('civic_charter_commitments')
      .select('*')
      .eq('youth_justice_relevant', true)
      .order('minister_name'),

    supabase
      .from('civic_ministerial_statements')
      .select('id, source_id, headline, minister_name, portfolio, published_at, source_url, mentioned_amounts, mentioned_locations')
      .order('published_at', { ascending: false })
      .limit(100),

    supabase
      .from('civic_hansard')
      .select('id, sitting_date, speaker_name, speaker_party, speaker_electorate, speaker_role, speech_type, subject, source_url')
      .order('sitting_date', { ascending: false })
      .limit(100),

    // Funding aggregation placeholder — replaced by hardcoded FUNDING_BY_SOURCE below
    Promise.resolve({ data: null }),

    supabase
      .from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, portfolio_score, operating_organization_id, organizations(name, state)')
      .neq('verification_status', 'ai_generated')
      .not('portfolio_score', 'is', null)
      .contains('geography', [config.state])
      .order('portfolio_score', { ascending: false })
      .limit(50),

    supabase
      .from('rogs_justice_spending')
      .select('*')
      .eq('rogs_section', 'youth_justice')
      .in('rogs_table', ['17A.10', '17A.1', '17A.7'])
      .eq('financial_year', '2024-25')
      .is('description2', null)
      .limit(50),

    supabase
      .from('cross_system_stats')
      .select('*')
      .order('domain'),

    supabase
      .from('civic_ministerial_diaries')
      .select('id, minister_name, meeting_date, who_met, organisation, purpose, meeting_type')
      .order('meeting_date', { ascending: false })
      .limit(500),

    supabase
      .from('cross_system_stats')
      .select('*')
      .eq('domain', 'accountability')
      .order('value', { ascending: false }),
  ]);

  const charter = (charterRes.data || []) as CharterCommitment[];
  const statements = (statementsRes.data || []) as MinisterialStatement[];
  const hansard = (hansardRes.data || []) as HansardSpeech[];
  const interventions = ((interventionsRes.data || []) as any[]).map((row) => ({
    ...row,
    organizations: Array.isArray(row.organizations) ? row.organizations[0] ?? null : row.organizations,
  })) as Intervention[];
  const rogsData = rogsRes.data || [];
  const crossoverStats = (crossoverRes.data || []) as {
    domain: string; metric: string; value: number; unit: string;
    state: string; indigenous_status: string; financial_year: string;
    source_name: string; notes: string | null;
  }[];

  // Helper to get crossover stat
  const getCrossover = (metric: string, crossoverState = config.state): number | null => {
    const row = crossoverStats.find(s => s.metric === metric && s.state === crossoverState);
    return row?.value ?? null;
  };

  type DiaryEntry = { id: string; minister_name: string; meeting_date: string; who_met: string | null; organisation: string | null; purpose: string | null; meeting_type: string | null };
  const diaries = (diaryRes.data || []) as DiaryEntry[];

  // Diary stats
  const diaryByMinister = diaries.reduce((acc, d) => {
    if (!acc[d.minister_name]) acc[d.minister_name] = { total: 0, orgs: new Set<string>() };
    acc[d.minister_name].total++;
    if (d.organisation) acc[d.minister_name].orgs.add(d.organisation);
    return acc;
  }, {} as Record<string, { total: number; orgs: Set<string> }>);

  // External meetings only (filter out staff/govt internal)
  const INTERNAL_KEYWORDS = ['ministerial staff', 'cabinet minister', 'government minister', 'director-general', 'director -general', 'commissioner,', 'assistant minister', 'departmental staff', 'd-g,'];
  const externalDiaries = diaries.filter(d => {
    if (!d.organisation) return false;
    const lower = d.organisation.toLowerCase();
    return !INTERNAL_KEYWORDS.some(kw => lower.includes(kw)) && !lower.startsWith('hon ');
  });

  // Accountability data — group by supplier
  type AccountabilityStat = { metric: string; value: number; unit: string; notes: string | null; source_name: string };
  const accountabilityStats = (accountabilityRes.data || []) as AccountabilityStat[];
  const supplierNames = [...new Set(accountabilityStats.filter(s => s.notes).map(s => s.notes!.split(' — ')[0]))];
  const supplierData = supplierNames.map(name => {
    const stats = accountabilityStats.filter(s => s.notes?.startsWith(name));
    const contractVal = stats.find(s => s.metric === 'supplier_qld_contract_value')?.value ?? 0;
    const acncReg = stats.find(s => s.metric === 'supplier_acnc_registered')?.value === 1;
    const inDb = stats.find(s => s.metric === 'supplier_in_org_database')?.value === 1;
    const hasOutcomes = stats.find(s => s.metric === 'supplier_outcome_data_available')?.value === 1;
    const hasFinancials = stats.find(s => s.metric === 'supplier_financial_data_available')?.value === 1;
    const isPrivatePrison = stats.find(s => s.metric === 'supplier_private_prison_operator')?.value === 1;
    const isIndigenous = stats.find(s => s.metric === 'supplier_indigenous_controlled')?.value === 1;
    return { name, contractVal, acncReg, inDb, hasOutcomes, hasFinancials, isPrivatePrison, isIndigenous };
  }).sort((a, b) => b.contractVal - a.contractVal);

  // ── Computed values ──

  const totalContracts = config.departments.reduce((s, d) => s + d.contracts, 0);
  const totalContractValue = config.departments.reduce((s, d) => s + d.totalValue, 0);

  // Charter stats
  const charterDelivered = charter.filter(c => c.status === 'delivered').length;
  const charterTotal = charter.length;
  const deliveryRate = charterTotal > 0 ? Math.round((charterDelivered / charterTotal) * 100) : 0;

  // Group charter by minister
  const charterByMinister = charter.reduce((acc, c) => {
    if (!acc[c.minister_name]) acc[c.minister_name] = [];
    acc[c.minister_name].push(c);
    return acc;
  }, {} as Record<string, CharterCommitment[]>);

  // Justice funding by source (from config)
  const fundingBySource = config.fundingBySource;

  // Interventions already filtered by geography in DB query
  const stateInterventions = interventions;

  // Evidence level counts (QLD only)
  const evidenceCounts = stateInterventions.reduce((acc, i) => {
    const level = i.evidence_level || 'Untested';
    const shortLevel = level.split('(')[0].trim();
    acc[shortLevel] = (acc[shortLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ROGS: QLD spending
  const getROGSVal = (table: string, desc3: string): number | null => {
    const row = rogsData.find((r: any) => r.rogs_table === table && r.description3 === desc3);
    return row?.qld != null ? Number(row.qld) : null;
  };

  const detentionSpending = getROGSVal('17A.10', 'Detention-based services');
  const communitySpending = getROGSVal('17A.10', 'Community-based services');
  const totalSpending = getROGSVal('17A.10', 'Total expenditure');

  // Top interventions for display
  const topInterventions = stateInterventions.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ═══ NAVIGATION BAR ═══ */}
      <nav className="bg-[#0A0A0A] border-b border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-mono">
          <Link href="/" className="text-[#F5F0E8] hover:text-[#DC2626] transition-colors">
            JusticeHub
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#DC2626]">{config.state} System Map</span>
          <div className="ml-auto flex gap-4 print:hidden">
            <Link href="/journey-map" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">
              Journey Map
            </Link>
            <Link href="/civic/qld-youth-justice" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">
              Civic Intel
            </Link>
            <Link href="/spending" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">
              National Spending
            </Link>
            <Link href="/justice-funding" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">
              Funding
            </Link>
            <span className="text-gray-700">|</span>
            <PrintButton />
          </div>
        </div>
      </nav>

      {/* ═══ HERO / HEADER ═══ */}
      <header className="bg-[#0A0A0A] text-[#F5F0E8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-mono text-[#DC2626] tracking-[0.3em] uppercase mb-4">
            System Intelligence / {config.stateFull}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#F5F0E8] mb-6">
            {config.state} YOUTH JUSTICE SYSTEM MAP
          </h1>
          <div className="flex flex-wrap gap-6 font-mono text-sm mb-6">
            <span>
              <span className="text-[#DC2626] text-2xl font-bold">{fmtCompact(totalContractValue)}</span>
              <span className="text-gray-400 ml-2">in contracts</span>
            </span>
            <span className="text-gray-600">|</span>
            <span>
              <span className="text-[#F5F0E8] text-2xl font-bold">{fmtNum(totalContracts)}</span>
              <span className="text-gray-400 ml-2">records</span>
            </span>
            <span className="text-gray-600">|</span>
            <span>
              <span className="text-[#F5F0E8] text-2xl font-bold">{config.departments.length}</span>
              <span className="text-gray-400 ml-2">departments</span>
            </span>
          </div>
          <p className="text-lg text-gray-400 italic max-w-3xl">
            &ldquo;Follow the money. Hear the voices. See the alternative.&rdquo;
          </p>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 1: THE MONEY
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE MONEY" dark />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Departments */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Departments</span>
                <div className="ml-auto flex gap-3">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[10px] text-gray-500">Education</span></span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /><span className="text-[10px] text-gray-500">Youth Justice</span></span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-[10px] text-gray-500">Child Safety</span></span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /><span className="text-[10px] text-gray-500">Corrections</span></span>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                {config.departments.map((dept) => {
                  const catColor = dept.category === 'education' ? 'bg-blue-500' : dept.category === 'youth_justice' ? 'bg-[#DC2626]' : dept.category === 'child_safety' ? 'bg-amber-500' : 'bg-gray-500';
                  return (
                  <div key={dept.shortName} className="px-4 py-3 flex items-center justify-between hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${catColor} shrink-0`} />
                      <span className="font-mono text-sm font-bold text-[#F5F0E8]">{dept.shortName}</span>
                      <span className="text-xs text-gray-500 ml-1 hidden md:inline">{dept.period}</span>
                    </div>
                    <div className="flex items-center gap-6 font-mono text-sm">
                      <span className="text-[#DC2626] font-bold">{fmtCompact(dept.totalValue)}</span>
                      <span className="text-gray-500 w-16 text-right">{fmtNum(dept.contracts)}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-600 px-4 py-3 flex items-center justify-between bg-gray-900/30">
                <span className="font-mono text-xs text-gray-400">TOTAL</span>
                <div className="flex items-center gap-6 font-mono text-sm">
                  <span className="text-[#DC2626] font-bold">{fmtCompact(totalContractValue)}</span>
                  <span className="text-gray-400 w-16 text-right">{fmtNum(totalContracts)}</span>
                </div>
              </div>
            </div>

            {/* Top Suppliers */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Top Suppliers</span>
              </div>
              <div className="divide-y divide-gray-800">
                {config.topSuppliers.map((s, i) => (
                  <div key={s.name} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-gray-600 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0">
                        <span className="text-sm text-[#F5F0E8] block truncate">{s.name}</span>
                        {s.note && <span className="text-xs text-gray-500">{s.note}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-sm shrink-0">
                      <span className="text-[#DC2626] font-bold">{fmtCompact(s.totalValue)}</span>
                      <span className="text-gray-600 text-xs">{s.contracts}c</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Spotlight (optional) */}
          {config.spotlight && (
          <div className="border border-gray-700 rounded-sm">
            <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">{config.spotlight.title}</span>
            </div>
            <div className="px-4 py-4">
              <div className="flex flex-wrap gap-6 font-mono text-sm mb-4">
                <span>
                  <span className="text-[#059669] text-xl font-bold">{fmtCompact(config.spotlight.totalFunding)}</span>
                  <span className="text-gray-400 ml-2">total funding</span>
                </span>
                <span className="text-gray-600">|</span>
                <span>
                  <span className="text-[#F5F0E8] font-bold">{fmtNum(config.spotlight.records)}</span>
                  <span className="text-gray-400 ml-2">records</span>
                </span>
                <span className="text-gray-600">|</span>
                <span>
                  <span className="text-[#F5F0E8] font-bold">{fmtNum(config.spotlight.orgs)}</span>
                  <span className="text-gray-400 ml-2">organisations</span>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {config.spotlight.locations.map((loc) => (
                  <div key={loc.name} className="bg-gray-900/50 border border-gray-800 rounded-sm px-3 py-3">
                    <div className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-1">{loc.name}</div>
                    <div className="font-mono text-lg text-[#059669] font-bold">{fmtCompact(loc.funding)}</div>
                    <div className="font-mono text-xs text-gray-500">{loc.programs} programs</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Justice Funding by Source */}
          {fundingBySource.length > 0 && (
            <div className="mt-6 border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Justice Funding by Source</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4">
                {fundingBySource.map((item) => (
                    <div key={item.source} className="bg-gray-900/50 border border-gray-800 rounded-sm px-3 py-3">
                      <div className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-1 truncate" title={item.source}>{item.source}</div>
                      <div className="font-mono text-lg text-[#DC2626] font-bold">{fmtCompact(item.total)}</div>
                      <div className="font-mono text-xs text-gray-500">{fmtNum(item.count)} records</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 2: THE WORDS
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F0E8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE WORDS" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Commitments */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Charter Commitments</span>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono text-3xl font-bold text-[#0A0A0A]">{charterTotal}</span>
                  <span className="text-sm text-gray-500">youth justice commitments</span>
                </div>
                <div className="flex gap-6 font-mono text-sm mb-4">
                  <span>
                    <span className="text-[#059669] font-bold">{charterDelivered}</span>
                    <span className="text-gray-500 ml-1">delivered</span>
                  </span>
                  <span>
                    <span className="text-[#DC2626] font-bold">{charterTotal - charterDelivered}</span>
                    <span className="text-gray-500 ml-1">&ldquo;in progress&rdquo;</span>
                  </span>
                </div>

                {/* Delivery rate bar */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 flex-1 bg-gray-200 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#059669] rounded-sm transition-all"
                        style={{ width: `${deliveryRate}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm text-[#DC2626] font-bold">{deliveryRate}%</span>
                  </div>
                  <p className="font-mono text-xs text-gray-400">delivery rate</p>
                </div>

                {/* By minister */}
                <div className="space-y-3">
                  {Object.entries(charterByMinister)
                    .sort(([, a], [, b]) => b.length - a.length)
                    .slice(0, 8)
                    .map(([minister, commitments]) => {
                      const delivered = commitments.filter(c => c.status === 'delivered').length;
                      return (
                        <div key={minister} className="flex items-center justify-between text-sm">
                          <span className="text-[#0A0A0A] truncate max-w-[180px]">{minister}</span>
                          <span className="font-mono">
                            <span className="text-[#059669]">{delivered}</span>
                            <span className="text-gray-400">/{commitments.length}</span>
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* ROGS Spending Breakdown */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">{config.state} Budget Allocation (ROGS 2024-25)</span>
              </div>
              <div className="px-4 py-4">
                {totalSpending != null ? (
                  <>
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="font-mono text-3xl font-bold text-[#0A0A0A]">
                        {fmtCompact(totalSpending * 1000)}
                      </span>
                      <span className="text-sm text-gray-500">total YJ expenditure</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#0A0A0A]">Detention-based services</span>
                          <span className="font-mono text-[#DC2626] font-bold">
                            {detentionSpending != null ? fmtCompact(detentionSpending * 1000) : 'N/A'}
                          </span>
                        </div>
                        {detentionSpending != null && totalSpending != null && (
                          <div className="h-2 bg-gray-200 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-[#DC2626] rounded-sm"
                              style={{ width: `${Math.round((detentionSpending / totalSpending) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#0A0A0A]">Community-based services</span>
                          <span className="font-mono text-[#059669] font-bold">
                            {communitySpending != null ? fmtCompact(communitySpending * 1000) : 'N/A'}
                          </span>
                        </div>
                        {communitySpending != null && totalSpending != null && (
                          <div className="h-2 bg-gray-200 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-[#059669] rounded-sm"
                              style={{ width: `${Math.round((communitySpending / totalSpending) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {detentionSpending != null && communitySpending != null && (
                      <p className="font-mono text-xs text-gray-400 mt-3">
                        Detention receives {Math.round((detentionSpending / totalSpending!) * 100)}% of total budget for{' '}
                        {totalSpending != null ? `~${Math.round(KIDS_IN_DETENTION)}` : '~40'} young people on an average night
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p className="font-mono mb-2">{config.state} Youth Justice (Productivity Commission ROGS)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Detention cost per day</span>
                        <span className="font-mono text-[#DC2626] font-bold">{fmt(DETENTION_COST_PER_DAY)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Community cost per day</span>
                        <span className="font-mono text-[#059669] font-bold">~{fmt(COMMUNITY_COST_PER_DAY)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost ratio</span>
                        <span className="font-mono text-[#DC2626] font-bold">{DETENTION_COMMUNITY_RATIO}x</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ministerial Statements & Hansard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ministerial Statements */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Ministerial Statements</span>
                </div>
                <span className="font-mono text-xs text-gray-400">{statements.length} recent</span>
              </div>
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {statements.slice(0, 20).map((s) => (
                  <div key={s.id} className="px-4 py-3 hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">{fmtDate(s.published_at)}</span>
                      <span className="font-mono text-xs text-[#0A0A0A] font-bold">{s.minister_name}</span>
                    </div>
                    <p className="text-sm text-[#0A0A0A] leading-snug">
                      {s.source_url ? (
                        <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#DC2626] transition-colors">
                          {truncate(s.headline, 120)}
                        </a>
                      ) : (
                        truncate(s.headline, 120)
                      )}
                    </p>
                    {s.mentioned_amounts && s.mentioned_amounts.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {s.mentioned_amounts.slice(0, 3).map((amt, i) => (
                          <span key={i} className="font-mono text-xs text-[#DC2626] bg-red-50 px-1.5 py-0.5 rounded-sm">
                            {amt}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.mentioned_locations && s.mentioned_locations.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {s.mentioned_locations.slice(0, 3).map((loc, i) => (
                          <span key={i} className="font-mono text-xs text-gray-400">{loc}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hansard */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Hansard Speeches</span>
                </div>
                <span className="font-mono text-xs text-gray-400">{hansard.length} recent</span>
              </div>
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {hansard.slice(0, 20).map((h) => (
                  <div key={h.id} className="px-4 py-3 hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{fmtDate(h.sitting_date)}</span>
                      <span className="font-mono text-xs text-[#0A0A0A] font-bold">{h.speaker_name}</span>
                      {h.speaker_party && (
                        <span className="font-mono text-xs text-gray-400">({h.speaker_party})</span>
                      )}
                      {h.speaker_electorate && (
                        <span className="font-mono text-xs text-gray-500">{h.speaker_electorate}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#0A0A0A] leading-snug">
                      {h.source_url ? (
                        <a href={h.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#DC2626] transition-colors">
                          {h.subject ? truncate(h.subject, 120) : h.speech_type}
                        </a>
                      ) : (
                        h.subject ? truncate(h.subject, 120) : h.speech_type
                      )}
                    </p>
                    {h.speaker_role && (
                      <span className="font-mono text-xs text-gray-400 mt-0.5 inline-block">{h.speaker_role}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ministerial Diaries */}
          <div className="mt-6 border border-gray-300 rounded-sm bg-[#F5F0E8]">
            <div className="border-b border-gray-300 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Who Ministers Meet</span>
              </div>
              <span className="font-mono text-xs text-gray-400">1,728 diary entries · 5 ministers</span>
            </div>
            <div className="px-4 py-4">
              {/* Minister meeting counts */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {Object.entries(diaryByMinister)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([minister, data]) => (
                    <div key={minister} className="bg-gray-100 border border-gray-200 rounded-sm px-3 py-2">
                      <div className="text-xs text-[#0A0A0A] font-bold truncate">{minister}</div>
                      <div className="font-mono text-lg text-[#0A0A0A]">{data.total}</div>
                      <div className="font-mono text-xs text-gray-400">{data.orgs.size} orgs</div>
                    </div>
                  ))}
              </div>

              {/* Recent external meetings */}
              <p className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-2">Recent External Meetings</p>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {externalDiaries.slice(0, 20).map((d) => (
                  <div key={d.id} className="py-2.5 flex items-start justify-between gap-4 hover:bg-gray-100/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-gray-400">{fmtDate(d.meeting_date)}</span>
                        <span className="text-xs text-[#0A0A0A] font-bold">{d.minister_name}</span>
                      </div>
                      <p className="text-sm text-[#0A0A0A] truncate">{d.organisation}</p>
                      {d.purpose && d.purpose !== 'Portfolio Matters' && (
                        <span className="font-mono text-xs text-gray-400">{d.purpose}</span>
                      )}
                    </div>
                    {d.meeting_type && (
                      <span className="font-mono text-xs text-gray-400 shrink-0">{d.meeting_type}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 3: THE EVIDENCE
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F0E8] px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE EVIDENCE" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* What Works */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">What Works</span>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono text-3xl font-bold text-[#0A0A0A]">{interventions.length}</span>
                  <span className="text-sm text-gray-500">verified interventions</span>
                </div>

                {/* Evidence level breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(evidenceCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([level, count]) => {
                      const isPositive = ['Proven', 'Effective', 'Indigenous-led'].includes(level);
                      return (
                        <div key={level} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{level}</span>
                          <span className={`font-mono font-bold ${isPositive ? 'text-[#059669]' : 'text-[#0A0A0A]'}`}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Top interventions by portfolio score */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-2">Top by Portfolio Score</p>
                  <div className="space-y-2">
                    {topInterventions.map((intv, i) => (
                      <div key={intv.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                          <span className="text-[#0A0A0A] truncate">{intv.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {intv.cost_per_young_person != null && (
                            <span className="font-mono text-xs text-gray-400">{fmtCompact(intv.cost_per_young_person)}/yp</span>
                          )}
                          <span className="font-mono text-xs text-[#059669] font-bold">
                            {intv.portfolio_score?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Comparison */}
            <div className="border border-gray-300 rounded-sm bg-[#F5F0E8]">
              <div className="border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Cost Comparison</span>
              </div>
              <div className="px-4 py-4">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[#0A0A0A] font-bold">Detention</p>
                      <p className="font-mono text-xs text-gray-400">per young person per day</p>
                    </div>
                    <span className="font-mono text-2xl text-[#DC2626] font-bold">{fmt(DETENTION_COST_PER_DAY)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[#0A0A0A] font-bold">Community-based</p>
                      <p className="font-mono text-xs text-gray-400">per young person per day</p>
                    </div>
                    <span className="font-mono text-2xl text-[#059669] font-bold">~{fmt(COMMUNITY_COST_PER_DAY)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <p className="text-sm text-gray-500">Cost ratio</p>
                    <span className="font-mono text-3xl text-[#DC2626] font-bold">{DETENTION_COMMUNITY_RATIO}x</span>
                  </div>
                </div>

                <div className="bg-gray-100 border border-gray-200 rounded-sm p-4">
                  <p className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-2">The Equation</p>
                  <p className="font-mono text-sm text-[#0A0A0A]">
                    <span className="text-[#DC2626] font-bold">{KIDS_IN_DETENTION} kids</span> in {config.state} detention on an average night
                  </p>
                  <p className="font-mono text-sm text-[#0A0A0A] mt-1">
                    x <span className="text-[#DC2626] font-bold">{fmtCompact(DETENTION_COST_PER_YEAR)}</span>/year each
                  </p>
                  <p className="font-mono text-sm text-[#0A0A0A] mt-1">
                    = <span className="text-[#DC2626] font-bold text-lg">{fmtCompact(DETENTION_TOTAL_ANNUAL)}</span>/year
                  </p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Source: Productivity Commission, ROGS 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 3.5: THE ACCOUNTABILITY
           ═══════════════════════════════════════════════════════════════ */}
      {supplierData.length > 0 && (
        <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <SectionHeading title="THE ACCOUNTABILITY" dark />

            <p className="text-gray-400 text-sm font-mono mb-8 max-w-3xl">
              These organisations receive billions in public money for youth justice, child safety, and corrections.
              What do we know about their outcomes?
            </p>

            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Top Suppliers — Transparency Scorecard</span>
                </div>
                <span className="font-mono text-xs text-gray-500">{supplierData.length} suppliers · {fmtCompact(supplierData.reduce((s, d) => s + d.contractVal, 0))} total</span>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_60px_60px_60px_60px] gap-2 px-4 py-2 border-b border-gray-700 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>Supplier</span>
                <span className="text-right">Contracts</span>
                <span className="text-center">ACNC</span>
                <span className="text-center">In DB</span>
                <span className="text-center">Outcomes</span>
                <span className="text-center">Financials</span>
              </div>

              <div className="divide-y divide-gray-800">
                {supplierData.map((s) => (
                  <div key={s.name} className="grid grid-cols-[1fr_100px_60px_60px_60px_60px] gap-2 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center">
                    <div className="min-w-0">
                      <span className="text-sm text-[#F5F0E8] truncate block">{s.name}</span>
                      {s.isPrivatePrison && <span className="font-mono text-[10px] text-[#DC2626]">PRIVATE PRISON OPERATOR</span>}
                      {s.isIndigenous && <span className="font-mono text-[10px] text-[#059669]">INDIGENOUS-CONTROLLED</span>}
                    </div>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmtCompact(s.contractVal)}</span>
                    <span className="text-center">{s.acncReg ? <span className="text-[#059669]">&#10003;</span> : <span className="text-[#DC2626]">&#10007;</span>}</span>
                    <span className="text-center">{s.inDb ? <span className="text-[#059669]">&#10003;</span> : <span className="text-gray-600">—</span>}</span>
                    <span className="text-center">{s.hasOutcomes ? <span className="text-[#059669]">&#10003;</span> : <span className="text-[#DC2626]">&#10007;</span>}</span>
                    <span className="text-center">{s.hasFinancials ? <span className="text-[#059669]">&#10003;</span> : <span className="text-[#DC2626]">&#10007;</span>}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
                <p className="font-mono text-xs text-gray-400">
                  <span className="text-[#059669]">&#10003;</span> = publicly available &nbsp;
                  <span className="text-[#DC2626]">&#10007;</span> = not found or not published &nbsp;
                  Sources: ACNC Register, Supplier annual reports, {config.state} Open Data
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 4: THE PIPELINE (Cross-System Crossover)
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE PIPELINE" dark />

          <p className="text-gray-400 text-sm font-mono mb-8 max-w-3xl">
            Kids don&apos;t enter youth justice from nowhere. They come through child protection, disability services,
            and school exclusion. The data shows the pipeline — and {config.state} has the highest crossover rate in the country.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Child Protection → Youth Justice */}
            <div className="border border-gray-700 rounded-sm p-6">
              <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase mb-3">Child Protection → Youth Justice</div>
              <div className="font-mono text-5xl font-bold text-[#DC2626] mb-2">
                {getCrossover('crossover_rate') ?? '72.9'}%
              </div>
              <p className="text-sm text-gray-400 mb-4">
                of {config.state} youth justice kids had child protection contact in the prior 10 years
              </p>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">National average</span>
                  <span className="font-mono text-[#F5F0E8]">{getCrossover('national_crossover_rate', 'National') ?? '65'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{config.state} crossover count</span>
                  <span className="font-mono text-[#F5F0E8]">{fmtNum(getCrossover('crossover_count') ?? 1863)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">First Nations females</span>
                  <span className="font-mono text-[#DC2626] font-bold">{getCrossover('crossover_rate_indigenous_female') ?? '89.6'}%</span>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-3">Source: AIHW 2022-23</p>
            </div>

            {/* Indigenous Over-representation */}
            <div className="border border-gray-700 rounded-sm p-6">
              <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase mb-3">Indigenous Over-representation</div>
              <div className="font-mono text-5xl font-bold text-[#DC2626] mb-2">
                {getCrossover('indigenous_overrepresentation_ratio') ?? '22'}x
              </div>
              <p className="text-sm text-gray-400 mb-4">
                First Nations young people are over-represented in {config.state} youth detention
              </p>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Under supervision</span>
                  <span className="font-mono text-[#F5F0E8]">{fmtNum(getCrossover('under_supervision') ?? 1598)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Detention increase</span>
                  <span className="font-mono text-[#DC2626] font-bold">+{getCrossover('detention_increase_pct') ?? '50'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Detention rate (26x nationally)</span>
                  <span className="font-mono text-[#DC2626]">26x in detention</span>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-3">Source: AIHW Youth Justice 2023-24</p>
            </div>

            {/* Disability → Justice */}
            <div className="border border-gray-700 rounded-sm p-6">
              <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase mb-3">Disability → Justice</div>
              <div className="font-mono text-5xl font-bold text-[#DC2626] mb-2">
                {getCrossover('disability_overrepresentation', 'National') ?? '5'}x
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Youth with disability are over-represented in youth justice
              </p>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Population share</span>
                  <span className="font-mono text-[#F5F0E8]">{getCrossover('disability_population_pct', 'National') ?? '3.5'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Detention share</span>
                  <span className="font-mono text-[#DC2626] font-bold">{getCrossover('disability_detention_pct', 'National') ?? '17.4'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Out-of-home care (national)</span>
                  <span className="font-mono text-[#F5F0E8]">{fmtNum(getCrossover('oohc_total_national', 'National') ?? 44900)}</span>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-3">Source: BOCSAR/DSS 2023, AIHW 2023-24</p>
            </div>
          </div>

          {/* NDIS NQ Spotlight */}
          <div className="border border-gray-700 rounded-sm p-6 mb-8">
            <div className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-3">NDIS Participants in {config.spotlight?.title?.replace(' Spotlight', '') || config.stateFull}</div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { loc: 'Townsville', count: getCrossover('ndis_participants_townsville') ?? 8500 },
                { loc: 'Cairns', count: getCrossover('ndis_participants_cairns') ?? 6800 },
                { loc: 'Mount Isa', count: getCrossover('ndis_participants_mount_isa') ?? 1200 },
              ].map(r => (
                <div key={r.loc} className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#F5F0E8]">{fmtNum(r.count)}</div>
                  <div className="text-xs text-gray-400">{r.loc}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Youth (15-24) with justice contact</span>
                <span className="font-mono text-[#DC2626] font-bold">28%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg annual NDIS plan (youth)</span>
                <span className="font-mono text-[#F5F0E8]">{fmt(getCrossover('ndis_avg_annual_plan_youth', 'National') ?? 52000)}</span>
              </div>
            </div>
            <p className="font-mono text-xs text-gray-600 mt-3">Source: NDIS Quarterly Report Dec 2025, BOCSAR/DSS</p>
          </div>

          {/* The Pipeline Visualization */}
          <div className="border border-gray-700 rounded-sm p-6">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">The System Pipeline</p>
            <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-sm">
              <div className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-sm text-center">
                <div className="text-[#DC2626] font-bold">Child Protection</div>
                <div className="text-xs text-gray-500">notifications</div>
              </div>
              <span className="text-[#DC2626] text-xl">&rarr;</span>
              <div className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-sm text-center">
                <div className="text-[#DC2626] font-bold">School Exclusion</div>
                <div className="text-xs text-gray-500">disengagement</div>
              </div>
              <span className="text-[#DC2626] text-xl">&rarr;</span>
              <div className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-sm text-center">
                <div className="text-[#DC2626] font-bold">Police Contact</div>
                <div className="text-xs text-gray-500">first offence</div>
              </div>
              <span className="text-[#DC2626] text-xl">&rarr;</span>
              <div className="bg-gray-800 border border-[#DC2626] px-4 py-2 rounded-sm text-center">
                <div className="text-[#DC2626] font-bold text-lg">Detention</div>
                <div className="text-xs text-gray-500">$3,320/day</div>
              </div>
              <span className="text-[#DC2626] text-xl">&rarr;</span>
              <div className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-sm text-center">
                <div className="text-[#DC2626] font-bold">Adult Prison</div>
                <div className="text-xs text-gray-500">recidivism</div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4 max-w-2xl mx-auto">
              {config.crossoverHeadlineStat || '65%'} of {config.state} youth justice kids came through child protection. The system creates its own demand.
              Every point of intervention that fails pushes them further down the pipeline.
            </p>
          </div>

          {/* QLD Detention Detail from AIHW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border border-gray-700 rounded-sm p-6">
              <div className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-3">{config.state} Youth Justice Supervision 2023-24</div>
              <div className="space-y-3">
                {[
                  { label: 'Total under supervision', val: getCrossover('total_supervision') ?? 4134, color: 'text-[#F5F0E8]' },
                  { label: 'Community supervision', val: getCrossover('community_supervision') ?? 3768, color: 'text-[#059669]' },
                  { label: 'Detention', val: getCrossover('detention_supervision') ?? 918, color: 'text-[#DC2626]' },
                  { label: 'Avg daily in detention', val: getCrossover('avg_daily_detention') ?? 282, color: 'text-[#DC2626]' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{r.label}</span>
                    <span className={`font-mono font-bold ${r.color}`}>{fmtNum(r.val)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">On remand (not sentenced)</span>
                    <span className="font-mono text-[#DC2626] font-bold">71%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Indigenous proportion</span>
                    <span className="font-mono text-[#DC2626] font-bold">62%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Male</span>
                    <span className="font-mono text-[#F5F0E8]">79%</span>
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-3">Source: AIHW Youth Justice 2023-24</p>
            </div>

            <div className="border border-gray-700 rounded-sm p-6">
              <div className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-3">QFCC Crossover Detail</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{config.state} crossover cohort</span>
                  <span className="font-mono text-[#DC2626] font-bold">{fmtNum(getCrossover('crossover_count') ?? 1863)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">First Nations females crossover</span>
                  <span className="font-mono text-[#DC2626] font-bold">89.6%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">First Nations males crossover</span>
                  <span className="font-mono text-[#DC2626] font-bold">78.1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Non-Indigenous females crossover</span>
                  <span className="font-mono text-[#F5F0E8]">75.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Non-Indigenous males crossover</span>
                  <span className="font-mono text-[#F5F0E8]">57.9%</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Had OOHC placement</span>
                    <span className="font-mono text-[#DC2626] font-bold">61%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Had care orders</span>
                    <span className="font-mono text-[#F5F0E8]">52%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">First supervised aged 10</span>
                    <span className="font-mono text-[#DC2626] font-bold">94%</span>
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-3">Source: QFCC Crossover Cohort Data Insights 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 4: THE STORIES
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE STORIES" dark />

          <p className="text-gray-400 text-sm font-mono mb-8">
            Real voices from {config.stateFull}. From real transcripts. From real people.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {config.voices.map((voice) => (
              <div key={voice.name} className="border border-gray-700 rounded-sm p-6 hover:border-gray-500 transition-colors">
                <blockquote className="text-[#F5F0E8] text-sm leading-relaxed mb-4 italic">
                  &ldquo;{voice.quote}&rdquo;
                </blockquote>
                <div className="border-t border-gray-700 pt-3">
                  <p className="font-bold text-[#F5F0E8] text-sm">{voice.name}</p>
                  <p className="font-mono text-xs text-gray-400">{voice.role}</p>
                  <p className="font-mono text-xs text-[#059669]">{voice.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-8 font-mono text-sm text-gray-400">
            <span>
              <span className="text-[#F5F0E8] font-bold">55</span> storytellers in the Empathy Ledger
            </span>
            <span>
              <span className="text-[#F5F0E8] font-bold">52</span> full transcripts
            </span>
            <span>
              <span className="text-[#F5F0E8] font-bold">261</span> photographs
            </span>
          </div>

          <div className="mt-6">
            <Link
              href="/people"
              className="font-mono text-sm text-[#DC2626] hover:text-[#F5F0E8] transition-colors"
            >
              Meet the people behind the data &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SECTION 5: THE ALTERNATIVE
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F0E8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="THE ALTERNATIVE" />

          <div className="border border-gray-300 rounded-sm mb-8">
            <div className="border-b border-gray-300 px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">{config.alternativeModel.title}</span>
            </div>
            <div className="px-6 py-6">
              <h3 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-4">
                What if we redirected {fmtCompact(DETENTION_TOTAL_ANNUAL)} from detention to community?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[#0A0A0A] leading-relaxed mb-4">
                    {config.alternativeModel.description}
                  </p>
                  <ul className="space-y-3">
                    {config.alternativeModel.pillars.map((pillar) => (
                      <li key={pillar.tag} className="flex items-start gap-3">
                        <span className="font-mono text-xs text-[#059669] font-bold mt-0.5 w-20 shrink-0">[{pillar.tag}]</span>
                        <span className="text-sm text-[#0A0A0A]">{pillar.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What the money buys */}
                <div>
                  <p className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-3">
                    What {fmtCompact(DETENTION_TOTAL_ANNUAL)} buys instead
                  </p>
                  <div className="space-y-3">
                    {config.alternativeModel.alternatives.map((alt) => (
                      <div key={alt.name} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                        <div>
                          <span className="text-[#0A0A0A]">{alt.name}</span>
                          <span className="font-mono text-xs text-gray-400 block">{fmtCompact(alt.cost)} each</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-lg text-[#059669] font-bold">{alt.count}</span>
                          <span className="font-mono text-xs text-gray-400 block">{alt.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scale pathway */}
              {config.scalePathway && config.scalePathway.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <p className="font-mono text-xs text-gray-400 uppercase tracking-wide mb-3">Scale Pathway</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {config.scalePathway.map((step, i) => (
                    <div key={step.name} className="flex items-center gap-3">
                      <div className="bg-[#059669] text-[#F5F0E8] px-3 py-1.5 rounded-sm font-mono text-sm font-bold">
                        {step.name}
                      </div>
                      {i < config.scalePathway!.length - 1 && <span className="text-gray-400 font-mono">&rarr;</span>}
                    </div>
                  ))}
                  <span className="text-gray-400 font-mono">&rarr;</span>
                  <span className="text-gray-400 font-mono text-sm">State-wide</span>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           CALL TO ACTION
           ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F0E8] mb-6">
            The data is clear. The voices are loud. The alternative exists.
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            {config.stateFull} spends {fmtCompact(DETENTION_COST_PER_DAY)}/day per child in detention and
            ~{fmtCompact(COMMUNITY_COST_PER_DAY)}/day for community programs. Every day we choose detention,
            we choose to spend {DETENTION_COMMUNITY_RATIO}x more for worse outcomes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/journey-map"
              className="bg-[#DC2626] text-[#F5F0E8] px-6 py-3 rounded-sm font-mono text-sm font-bold hover:bg-red-700 transition-colors"
            >
              See the Journey Map
            </Link>
            <Link
              href="/civic/qld-youth-justice"
              className="border border-gray-600 text-[#F5F0E8] px-6 py-3 rounded-sm font-mono text-sm hover:border-[#F5F0E8] transition-colors"
            >
              Track Commitments
            </Link>
            <Link
              href="/contained"
              className="border border-gray-600 text-[#F5F0E8] px-6 py-3 rounded-sm font-mono text-sm hover:border-[#F5F0E8] transition-colors"
            >
              The Contained Campaign
            </Link>
          </div>
          <p className="font-mono text-xs text-gray-600 mt-8">
            200K contracts across 8 departments. 65K funding records. 1,021 verified interventions.
            598 ministerial statements. 135 Hansard speeches. 66 commitments tracked. 14 cross-system statistics.
            Sources: {config.state} Open Data Portal, AIHW, Productivity Commission ROGS, BOCSAR, Empathy Ledger.
          </p>
        </div>
      </section>

      {/* Footer timestamp */}
      <footer className="bg-[#0A0A0A] border-t border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-gray-600">
          <span>JusticeHub / {config.state} System Map</span>
          <span>Last updated: {new Date().toISOString().split('T')[0]}</span>
        </div>
        <div className="hidden print:block max-w-7xl mx-auto mt-2 font-mono text-xs text-gray-500">
          Generated from justicehub.org.au/system/{config.slug} — Data: QLD Open Data, AIHW, ROGS, Empathy Ledger
        </div>
      </footer>
    </div>
  );
}

// ── Reusable Components ──

function SectionHeading({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <h2
          className={`text-xl font-bold tracking-[0.2em] uppercase ${dark ? 'text-[#F5F0E8]' : 'text-[#0A0A0A]'}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h2>
        <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-gray-300'}`} />
      </div>
    </div>
  );
}
