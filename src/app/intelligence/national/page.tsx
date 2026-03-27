import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, AlertTriangle, CheckCircle,
  Target, Globe, Database, Link2, Shield,
  ChevronRight,
} from 'lucide-react';
import {
  DETENTION_COST_PER_CHILD,
  formatDollars,
  pct,
} from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Australia's Youth Justice Evidence Base — National Intelligence | JusticeHub",
  description:
    'Every program, every organisation, every dollar, every state. The most comprehensive view of youth justice evidence in Australia.',
  openGraph: {
    title: "Australia's Youth Justice Evidence Base",
    description:
      'National intelligence overview — organisations, programs, funding flows, evidence, and community control across all states and territories.',
  },
};

/* ── Constants ──────────────────────────────────────────────── */

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_ORDER = [
  'Proven (RCT/quasi-experimental, replicated)',
  'Effective (strong evaluation, positive outcomes)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Untested (theory/pilot stage)',
];

const CONTROL_LABELS: Record<string, string> = {
  community_controlled: 'Community Controlled',
  community_adjacent: 'Community Adjacent',
  intermediary: 'Intermediary',
  government: 'Government',
  university: 'University',
  peak_body: 'Peak Body',
};

const CONTROL_COLORS: Record<string, { bar: string; text: string }> = {
  community_controlled: { bar: 'bg-[#059669]', text: 'text-[#059669]' },
  community_adjacent: { bar: 'bg-teal-400', text: 'text-teal-600' },
  intermediary: { bar: 'bg-amber-400', text: 'text-amber-600' },
  government: { bar: 'bg-slate-400', text: 'text-slate-600' },
  university: { bar: 'bg-blue-400', text: 'text-blue-600' },
  peak_body: { bar: 'bg-indigo-400', text: 'text-indigo-600' },
};

const REGIONAL_REPORTS = [
  { slug: 'mt-druitt', name: 'Mt Druitt', state: 'NSW', tourStop: 1, desc: "Australia's largest urban justice reinvestment site" },
  { slug: 'adelaide', name: 'Adelaide', state: 'SA', tourStop: 2, desc: "SA's first Aboriginal-led justice reinvestment site" },
  { slug: 'perth', name: 'Perth', state: 'WA', tourStop: 3, desc: '70% community control among Indigenous orgs' },
  { slug: 'tennant-creek', name: 'Tennant Creek', state: 'NT', tourStop: 4, desc: '85% community control — highest in Australia' },
  { slug: 'townsville', name: 'Townsville', state: 'QLD', tourStop: 5, desc: 'Where moral panic meets community solutions' },
  { slug: 'brisbane', name: 'Brisbane', state: 'QLD', tourStop: 6, desc: '93% of QLD justice funding concentrated here' },
];

/* ── Data fetching ──────────────────────────────────────────── */

interface NationalStats {
  total_orgs: number;
  indigenous_orgs: number;
  classified_orgs: number;
  total_programs: number;
  total_funding_records: number;
  total_funding_dollars: number;
  total_evidence: number;
  total_media: number;
  total_stories: number;
  total_findings: number;
}

interface StateRow {
  state: string;
  orgs: number;
  indigenous: number;
  cc: number;
  intermediary: number;
  programs: number;
  proven: number;
  effective: number;
  promising: number;
  indigenous_led: number;
  funding_records: number;
  funding_dollars: number;
  cc_pct: number;
}

interface EvidenceRow {
  evidence_level: string;
  count: number;
}

interface TopFundedOrg {
  name: string;
  slug: string | null;
  state: string | null;
  control_type: string | null;
  is_indigenous_org: boolean;
  total_funding: number;
  funding_records: number;
}

interface CommunityControlRow {
  state: string;
  cc: number;
  classified: number;
  cc_pct: number;
}

interface DetentionCosts {
  avg_cost: number | null;
  median_cost: number | null;
  min_cost: number | null;
  max_cost: number | null;
  programs_with_cost: number;
}

interface LinkageHealth {
  funding_link_pct: number;
  program_link_pct: number;
  orgs_with_abn: number;
}

async function getNationalData() {
  const supabase = createServiceClient();
  const sb = supabase as any; // bypass stale types for ALMA tables

  // ── Parallel data fetches ──
  const [
    orgsRes,
    programsRes,
    fundingRes,
    evidenceCountRes,
    mediaCountRes,
    storiesCountRes,
    findingsCountRes,
    costDataRes,
    fundingLinkedRes,
    fundingTotalRes,
    abnCountRes,
  ] = await Promise.all([
    // All active orgs (select minimal columns for aggregation)
    sb.from('organizations')
      .select('id, state, is_indigenous_org, control_type, abn')
      .eq('is_active', true),

    // All verified programs with org reference
    sb.from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, operating_organization_id')
      .neq('verification_status', 'ai_generated'),

    // Funding with org reference (top funded needs amount + org)
    sb.from('justice_funding')
      .select('id, amount_dollars, alma_organization_id'),

    // Counts for stats
    sb.from('alma_evidence').select('id', { count: 'exact', head: true }),
    sb.from('alma_media_articles').select('id', { count: 'exact', head: true }),
    sb.from('alma_stories').select('id', { count: 'exact', head: true }),
    sb.from('alma_research_findings').select('id', { count: 'exact', head: true }),

    // Programs with cost data for detention comparison
    sb.from('alma_interventions')
      .select('cost_per_young_person')
      .neq('verification_status', 'ai_generated')
      .not('cost_per_young_person', 'is', null)
      .gt('cost_per_young_person', 0),

    // Linkage: funding with linked orgs
    sb.from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .not('alma_organization_id', 'is', null),

    // Total funding count
    sb.from('justice_funding')
      .select('id', { count: 'exact', head: true }),

    // Orgs with ABN
    sb.from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('abn', 'is', null),
  ]);

  const allOrgs: any[] = orgsRes.data || [];
  const allPrograms: any[] = programsRes.data || [];
  const allFunding: any[] = fundingRes.data || [];
  const costPrograms: any[] = costDataRes.data || [];

  // ── Build org lookup ──
  const orgMap = new Map<string, any>();
  for (const o of allOrgs) {
    orgMap.set(o.id, o);
  }

  // ── National stats ──
  const stats: NationalStats = {
    total_orgs: allOrgs.length,
    indigenous_orgs: allOrgs.filter(o => o.is_indigenous_org).length,
    classified_orgs: allOrgs.filter(o => o.control_type != null).length,
    total_programs: allPrograms.length,
    total_funding_records: fundingTotalRes.count || 0,
    total_funding_dollars: allFunding.reduce((s, f) => s + (f.amount_dollars || 0), 0),
    total_evidence: evidenceCountRes.count || 0,
    total_media: mediaCountRes.count || 0,
    total_stories: storiesCountRes.count || 0,
    total_findings: findingsCountRes.count || 0,
  };

  // ── State-by-state: orgs ──
  const stateOrgData = new Map<string, { orgs: number; indigenous: number; cc: number; intermediary: number }>();
  for (const o of allOrgs) {
    if (!o.state) continue;
    const s = stateOrgData.get(o.state) || { orgs: 0, indigenous: 0, cc: 0, intermediary: 0 };
    s.orgs++;
    if (o.is_indigenous_org) s.indigenous++;
    if (o.control_type === 'community_controlled') s.cc++;
    if (o.control_type === 'intermediary') s.intermediary++;
    stateOrgData.set(o.state, s);
  }

  // ── State-by-state: programs ──
  const stateProgramData = new Map<string, { programs: number; proven: number; effective: number; promising: number; indigenous_led: number }>();
  for (const p of allPrograms) {
    const org = p.operating_organization_id ? orgMap.get(p.operating_organization_id) : null;
    const state = org?.state;
    if (!state) continue;
    const s = stateProgramData.get(state) || { programs: 0, proven: 0, effective: 0, promising: 0, indigenous_led: 0 };
    s.programs++;
    const el = p.evidence_level || '';
    if (el.startsWith('Proven')) s.proven++;
    else if (el.startsWith('Effective')) s.effective++;
    else if (el.startsWith('Promising')) s.promising++;
    else if (el.startsWith('Indigenous')) s.indigenous_led++;
    stateProgramData.set(state, s);
  }

  // ── State-by-state: funding ──
  const stateFundingData = new Map<string, { records: number; dollars: number }>();
  for (const f of allFunding) {
    const org = f.alma_organization_id ? orgMap.get(f.alma_organization_id) : null;
    const state = org?.state;
    if (!state) continue;
    const s = stateFundingData.get(state) || { records: 0, dollars: 0 };
    s.records++;
    s.dollars += f.amount_dollars || 0;
    stateFundingData.set(state, s);
  }

  // Merge into state rows
  const stateKeys = new Set([...stateOrgData.keys()]);
  const stateRows: StateRow[] = [...stateKeys].map((state) => {
    const od = stateOrgData.get(state) || { orgs: 0, indigenous: 0, cc: 0, intermediary: 0 };
    const pd = stateProgramData.get(state) || { programs: 0, proven: 0, effective: 0, promising: 0, indigenous_led: 0 };
    const fd = stateFundingData.get(state) || { records: 0, dollars: 0 };
    return {
      state,
      orgs: od.orgs,
      indigenous: od.indigenous,
      cc: od.cc,
      intermediary: od.intermediary,
      programs: pd.programs,
      proven: pd.proven,
      effective: pd.effective,
      promising: pd.promising,
      indigenous_led: pd.indigenous_led,
      funding_records: fd.records,
      funding_dollars: fd.dollars,
      cc_pct: od.indigenous > 0 ? Math.round((od.cc / od.indigenous) * 1000) / 10 : 0,
    };
  });
  stateRows.sort((a, b) => b.cc_pct - a.cc_pct);

  // ── Evidence distribution ──
  const evidenceCounts = new Map<string, number>();
  for (const p of allPrograms) {
    if (p.evidence_level) {
      evidenceCounts.set(p.evidence_level, (evidenceCounts.get(p.evidence_level) || 0) + 1);
    }
  }
  const evidenceDistribution: EvidenceRow[] = [...evidenceCounts.entries()]
    .map(([evidence_level, count]) => ({ evidence_level, count }))
    .sort((a, b) => b.count - a.count);

  // ── Top funded orgs ──
  const orgFundingTotals = new Map<string, { total: number; records: number }>();
  for (const f of allFunding) {
    if (!f.alma_organization_id) continue;
    const existing = orgFundingTotals.get(f.alma_organization_id) || { total: 0, records: 0 };
    existing.total += f.amount_dollars || 0;
    existing.records++;
    orgFundingTotals.set(f.alma_organization_id, existing);
  }

  // Need org details for top funded -- fetch them
  const topOrgIds = [...orgFundingTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 30)
    .map(([id]) => id);

  let topFundedOrgDetails: any[] = [];
  if (topOrgIds.length > 0) {
    const { data } = await sb
      .from('organizations')
      .select('id, name, slug, state, control_type, is_indigenous_org')
      .in('id', topOrgIds);
    topFundedOrgDetails = data || [];
  }

  const topFunded: TopFundedOrg[] = topFundedOrgDetails
    .map((o: any) => {
      const ft = orgFundingTotals.get(o.id) || { total: 0, records: 0 };
      return {
        name: o.name,
        slug: o.slug,
        state: o.state,
        control_type: o.control_type,
        is_indigenous_org: o.is_indigenous_org,
        total_funding: ft.total,
        funding_records: ft.records,
      };
    })
    .sort((a, b) => b.total_funding - a.total_funding);

  // ── Community control by state (Indigenous orgs only) ──
  const ccStateData = new Map<string, { cc: number; classified: number }>();
  for (const o of allOrgs) {
    if (!o.is_indigenous_org || !o.state) continue;
    const s = ccStateData.get(o.state) || { cc: 0, classified: 0 };
    if (o.control_type != null) s.classified++;
    if (o.control_type === 'community_controlled') s.cc++;
    ccStateData.set(o.state, s);
  }
  const communityControl: CommunityControlRow[] = [...ccStateData.entries()]
    .map(([state, d]) => ({
      state,
      cc: d.cc,
      classified: d.classified,
      cc_pct: d.classified > 0 ? Math.round((d.cc / d.classified) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.cc_pct - a.cc_pct);

  // ── Detention cost comparison ──
  const costs = costPrograms.map((p: any) => p.cost_per_young_person).sort((a: number, b: number) => a - b);
  const detention: DetentionCosts = {
    avg_cost: costs.length > 0 ? costs.reduce((s: number, c: number) => s + c, 0) / costs.length : null,
    median_cost: costs.length > 0 ? costs[Math.floor(costs.length / 2)] : null,
    min_cost: costs.length > 0 ? costs[0] : null,
    max_cost: costs.length > 0 ? costs[costs.length - 1] : null,
    programs_with_cost: costs.length,
  };

  // ── Linkage health ──
  const fundingLinkedCount = fundingLinkedRes.count || 0;
  const fundingTotalCount = fundingTotalRes.count || 0;
  const programsWithOrg = allPrograms.filter(p => p.operating_organization_id != null).length;
  const linkage: LinkageHealth = {
    funding_link_pct: fundingTotalCount > 0 ? Math.round((fundingLinkedCount / fundingTotalCount) * 1000) / 10 : 0,
    program_link_pct: allPrograms.length > 0 ? Math.round((programsWithOrg / allPrograms.length) * 1000) / 10 : 0,
    orgs_with_abn: abnCountRes.count || 0,
  };

  return { stats, stateRows, evidenceDistribution, topFunded, communityControl, detention, linkage };
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function NationalIntelligencePage() {
  const { stats, stateRows, evidenceDistribution, topFunded, communityControl, detention, linkage } =
    await getNationalData();

  const totalEvidence = evidenceDistribution.reduce((s, r) => s + r.count, 0);
  const costRatio =
    detention.median_cost && detention.median_cost > 0
      ? Math.round(DETENTION_COST_PER_CHILD / detention.median_cost)
      : 17;

  // Funding by control type from topFunded
  const fundingByControl: Record<string, number> = {};
  for (const org of topFunded) {
    const ct = org.control_type || 'unclassified';
    fundingByControl[ct] = (fundingByControl[ct] || 0) + org.total_funding;
  }
  const totalControlFunding = Object.values(fundingByControl).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation bar ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/50">NATIONAL INTELLIGENCE REPORT</span>
          <span className="font-mono text-xs text-white/30">Ctrl+P to save as PDF</span>
        </div>
      </div>

      {/* ══════════════ SECTION 1: HERO ══════════════ */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                  ALL STATES & TERRITORIES
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Australia&apos;s Youth Justice
                <br />
                Evidence Base
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-3xl">
                Every program mapped. Every organisation tracked. Every dollar followed. Every piece of evidence
                catalogued. This is the most comprehensive view of what works in youth justice across Australia.
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <Globe className="w-10 h-10 text-white/20" />
              <span className="text-xs font-mono text-white/30">NATIONAL VIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero stat strip */}
      <div className="bg-[#0A0A0A] border-t border-white/10 print:border-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatBlock value={stats.total_orgs.toLocaleString()} label="Organisations" />
          <StatBlock value={stats.total_programs.toLocaleString()} label="Programs Mapped" />
          <StatBlock value={formatDollars(stats.total_funding_dollars)} label="Funding Tracked" />
          <StatBlock value={stats.total_evidence.toLocaleString()} label="Evidence Items" />
          <StatBlock value={stats.total_media.toLocaleString()} label="Media Articles" />
          <StatBlock value={stats.total_stories.toLocaleString()} label="Stories" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-20 print:space-y-10">

        {/* ══════════════ SECTION 2: THE COST EQUATION ══════════════ */}
        <section>
          <div className="bg-[#0A0A0A] rounded-xl p-8 md:p-12 text-white print:border print:border-gray-300">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-8"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The Cost Equation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <p className="text-sm font-mono text-white/50 mb-2 uppercase">Youth Detention</p>
                <p
                  className="text-4xl md:text-5xl font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#DC2626' }}
                >
                  $1.3M
                </p>
                <p className="text-sm text-white/50 mt-1">per child per year</p>
                <p
                  className="text-xs font-mono mt-3 px-3 py-1 rounded-full inline-block"
                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#DC2626' }}
                >
                  85% recidivism rate
                </p>
              </div>
              <div className="text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold font-mono" style={{ color: '#059669' }}>{costRatio}:1</span>
                </div>
                <p className="text-xs font-mono text-white/50">COST RATIO</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-mono text-white/50 mb-2 uppercase">Community Programs</p>
                <p
                  className="text-4xl md:text-5xl font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#059669' }}
                >
                  {detention.median_cost ? formatDollars(detention.median_cost) : '$77K'}
                </p>
                <p className="text-sm text-white/50 mt-1">median per young person per year</p>
                <p
                  className="text-xs font-mono mt-3 px-3 py-1 rounded-full inline-block"
                  style={{ backgroundColor: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}
                >
                  {detention.programs_with_cost} programs with cost data
                </p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-center text-white/60 max-w-2xl mx-auto leading-relaxed">
                Australia spends over $1 billion per year on youth detention. Here&apos;s what the evidence says
                works instead. We&apos;ve mapped {stats.total_programs.toLocaleString()} community programs
                across {stateRows.length} states and territories.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════ SECTION 3: STATE-BY-STATE TABLE ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            State-by-State Intelligence
          </h2>
          <p className="text-gray-600 mb-6">
            Sorted by community control percentage among Indigenous organisations. Click a state to explore.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] text-white">
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">State</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Orgs</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Indigenous</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">CC%</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Programs</th>
                  <th className="text-center px-4 py-3 font-mono text-xs uppercase tracking-wider">Evidence</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Funding</th>
                </tr>
              </thead>
              <tbody>
                {stateRows.map((row, i) => {
                  const totalEv = row.proven + row.effective + row.promising + row.indigenous_led;
                  const evMax = Math.max(row.programs, 1);
                  return (
                    <tr
                      key={row.state}
                      className={`border-b border-gray-200 hover:bg-white/60 transition-colors ${
                        i % 2 === 0 ? 'bg-white/40' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-[#0A0A0A]">
                        <div className="flex items-center gap-2">
                          <span>{row.state}</span>
                          <span className="text-xs text-gray-400 font-normal hidden md:inline">
                            {STATE_NAMES[row.state] || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{row.orgs.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.indigenous.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="font-bold font-mono"
                          style={{ color: row.cc_pct >= 50 ? '#059669' : row.cc_pct >= 20 ? '#D97706' : '#DC2626' }}
                        >
                          {row.cc_pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{row.programs}</td>
                      <td className="px-4 py-3">
                        {row.programs > 0 ? (
                          <div className="flex gap-0.5 justify-center h-4">
                            {row.proven > 0 && (
                              <div
                                className="bg-emerald-600 rounded-sm"
                                style={{ width: `${Math.max((row.proven / evMax) * 80, 4)}px` }}
                                title={`${row.proven} Proven`}
                              />
                            )}
                            {row.effective > 0 && (
                              <div
                                className="bg-green-600 rounded-sm"
                                style={{ width: `${Math.max((row.effective / evMax) * 80, 4)}px` }}
                                title={`${row.effective} Effective`}
                              />
                            )}
                            {row.promising > 0 && (
                              <div
                                className="bg-amber-500 rounded-sm"
                                style={{ width: `${Math.max((row.promising / evMax) * 80, 4)}px` }}
                                title={`${row.promising} Promising`}
                              />
                            )}
                            {row.indigenous_led > 0 && (
                              <div
                                className="bg-purple-600 rounded-sm"
                                style={{ width: `${Math.max((row.indigenous_led / evMax) * 80, 4)}px` }}
                                title={`${row.indigenous_led} Indigenous-led`}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {row.funding_dollars > 0 ? formatDollars(row.funding_dollars) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#0A0A0A] text-white font-bold">
                  <td className="px-4 py-3 font-mono text-xs uppercase">National</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {stateRows.reduce((s, r) => s + r.orgs, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {stateRows.reduce((s, r) => s + r.indigenous, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">--</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {stateRows.reduce((s, r) => s + r.programs, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">--</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatDollars(stateRows.reduce((s, r) => s + r.funding_dollars, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ══════════════ SECTION 4: COMMUNITY CONTROL MAP ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Community Control by State
          </h2>
          <p className="text-gray-600 mb-6">
            Percentage of classified Indigenous organisations that are community-controlled.
            Self-determination in practice.
          </p>

          <div className="bg-white/80 rounded-xl p-6 border border-gray-200 space-y-3">
            {communityControl.map((row) => (
              <div key={row.state} className="flex items-center gap-4">
                <span className="w-10 text-sm font-bold text-[#0A0A0A] font-mono">{row.state}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(row.cc_pct, 2)}%`,
                      backgroundColor: row.cc_pct >= 50 ? '#059669' : row.cc_pct >= 20 ? '#D97706' : '#DC2626',
                    }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-mono font-bold" style={{
                  color: row.cc_pct >= 50 ? '#059669' : row.cc_pct >= 20 ? '#D97706' : '#DC2626',
                }}>
                  {row.cc_pct}%
                </span>
                <span className="w-24 text-right text-xs text-gray-500 font-mono hidden md:block">
                  {row.cc}/{row.classified}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════ SECTION 5: EVIDENCE PROFILE ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            National Evidence Profile
          </h2>
          <p className="text-gray-600 mb-6">
            Distribution of evidence levels across {stats.total_programs.toLocaleString()} mapped programs.
          </p>

          {/* Evidence bar */}
          <div className="bg-white/80 rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex rounded-lg overflow-hidden h-10 mb-4">
              {EVIDENCE_ORDER.map((level) => {
                const row = evidenceDistribution.find((e) => e.evidence_level === level);
                const count = row?.count || 0;
                if (count === 0) return null;
                const widthPct = (count / totalEvidence) * 100;
                return (
                  <div
                    key={level}
                    className={`${EVIDENCE_COLORS[level]} flex items-center justify-center text-white text-xs font-mono font-bold transition-all`}
                    style={{ width: `${widthPct}%`, minWidth: count > 0 ? '40px' : '0' }}
                    title={`${EVIDENCE_SHORT[level]}: ${count}`}
                  >
                    {widthPct > 8 ? count : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {EVIDENCE_ORDER.map((level) => {
                const row = evidenceDistribution.find((e) => e.evidence_level === level);
                const count = row?.count || 0;
                return (
                  <div key={level} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${EVIDENCE_COLORS[level]}`} />
                    <span className="font-medium text-gray-700">{EVIDENCE_SHORT[level]}</span>
                    <span className="font-mono text-gray-500">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence explainer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  What &ldquo;Proven&rdquo; Means
                </h3>
              </div>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Programs with replicated RCT or quasi-experimental evidence demonstrating positive outcomes.
                These are the gold standard -- the programs we can say, with confidence, reduce reoffending.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-purple-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  What &ldquo;Indigenous-led&rdquo; Means
                </h3>
              </div>
              <p className="text-sm text-purple-700 leading-relaxed">
                Programs grounded in cultural authority with community endorsement. Evidence takes many forms --
                including cultural knowledge, community outcomes, and self-determined metrics.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════ SECTION 6: WHERE THE MONEY GOES ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Where the Money Goes
          </h2>
          <p className="text-gray-600 mb-6">
            Funding distribution by organisation control type and the top funded organisations nationally.
          </p>

          {/* Control type funding bars */}
          {totalControlFunding > 0 && (
            <div className="bg-white/80 rounded-xl p-6 border border-gray-200 mb-8">
              <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">
                Funding by Organisation Type (Top 30)
              </h3>
              <div className="space-y-3">
                {Object.entries(fundingByControl)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, amount]) => {
                    const widthPct = (amount / totalControlFunding) * 100;
                    const colors = CONTROL_COLORS[type] || { bar: 'bg-gray-300', text: 'text-gray-500' };
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-40 text-xs font-medium text-gray-700 truncate">
                          {CONTROL_LABELS[type] || type}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bar}`}
                            style={{ width: `${Math.max(widthPct, 1)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-xs font-mono font-bold text-gray-700">
                          {formatDollars(amount)}
                        </span>
                        <span className="w-12 text-right text-xs font-mono text-gray-400">
                          {pct(amount, totalControlFunding)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Top funded orgs table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] text-white">
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">Organisation</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">State</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Funding</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody>
                {topFunded.slice(0, 20).map((org, i) => (
                  <tr
                    key={`${org.name}-${i}`}
                    className={`border-b border-gray-200 hover:bg-white/60 transition-colors ${
                      i % 2 === 0 ? 'bg-white/40' : 'bg-transparent'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {org.is_indigenous_org && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#059669] flex-shrink-0" title="Indigenous org" />
                        )}
                        <span className="font-medium text-[#0A0A0A]">
                          {org.slug ? (
                            <Link href={`/hub/${org.slug}`} className="hover:underline">
                              {org.name}
                            </Link>
                          ) : (
                            org.name
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{org.state || '--'}</td>
                    <td className="px-4 py-3">
                      {org.control_type ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            org.control_type === 'community_controlled'
                              ? 'bg-emerald-100 text-emerald-700'
                              : org.control_type === 'intermediary'
                                ? 'bg-amber-100 text-amber-700'
                                : org.control_type === 'government'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {CONTROL_LABELS[org.control_type] || org.control_type}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-xs">
                      {formatDollars(org.total_funding)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                      {org.funding_records}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════════════ SECTION 7: DATA QUALITY ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Data Quality Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Radical transparency about our own data. We show what we know, what we don&apos;t, and where
            the gaps are.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataQualityCard
              icon={Link2}
              label="Funding Linked to Orgs"
              value={`${linkage.funding_link_pct}%`}
              total={`${stats.total_funding_records.toLocaleString()} records`}
              color={linkage.funding_link_pct >= 60 ? '#059669' : linkage.funding_link_pct >= 30 ? '#D97706' : '#DC2626'}
              description="Percentage of funding records matched to a known organisation"
            />
            <DataQualityCard
              icon={Target}
              label="Programs Linked to Orgs"
              value={`${linkage.program_link_pct}%`}
              total={`${stats.total_programs.toLocaleString()} programs`}
              color={linkage.program_link_pct >= 80 ? '#059669' : linkage.program_link_pct >= 50 ? '#D97706' : '#DC2626'}
              description="Programs with a verified operating organisation"
            />
            <DataQualityCard
              icon={Database}
              label="ABN Verified Orgs"
              value={linkage.orgs_with_abn.toLocaleString()}
              total={`of ${stats.total_orgs.toLocaleString()} orgs`}
              color="#059669"
              description="Organisations with an Australian Business Number on file"
            />
          </div>

          <div className="mt-6 bg-white/80 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Help us fill the gaps
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This evidence base grows with every contribution. If you run a youth justice program,
                  fund one, or research one -- we want your data. Contact us to add your organisation&apos;s
                  programs, funding, or evidence to the national picture.
                </p>
                <Link
                  href="/intelligence/chat"
                  className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-[#0A0A0A] hover:underline"
                >
                  Talk to ALMA <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ SECTION 8: REGIONAL DEEP DIVES ══════════════ */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Regional Deep Dives
          </h2>
          <p className="text-gray-600 mb-6">
            Go deeper into the 6 CONTAINED tour stop regions with full community intelligence reports.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGIONAL_REPORTS.map((region) => (
              <Link
                key={region.slug}
                href={`/intelligence/regional/${region.slug}`}
                className="group bg-white/80 rounded-xl p-5 border border-gray-200 hover:border-[#0A0A0A] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 font-mono">
                    STOP {region.tourStop}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{region.state}</span>
                </div>
                <h3
                  className="text-lg font-bold text-[#0A0A0A] mb-1 group-hover:underline"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {region.name}
                </h3>
                <p className="text-sm text-gray-600">{region.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-bold text-[#0A0A0A] opacity-0 group-hover:opacity-100 transition-opacity">
                  View Report <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════ SECTION 9: INQUIRY TRACKER ══════════════ */}
        <section className="pb-8">
          <div className="bg-[#0A0A0A] rounded-xl p-8 md:p-12 text-white print:border print:border-gray-300">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The Inquiry Tracker
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl">
              Decades of inquiries, royal commissions, and reports. Thousands of recommendations.
              Here&apos;s where they stand.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p
                  className="text-5xl font-bold text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  17
                </p>
                <p className="text-sm font-mono text-white/50 mt-1">Major Inquiries</p>
              </div>
              <div className="text-center">
                <p
                  className="text-5xl font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#D97706' }}
                >
                  1,845
                </p>
                <p className="text-sm font-mono text-white/50 mt-1">Recommendations Made</p>
              </div>
              <div className="text-center">
                <p
                  className="text-5xl font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#DC2626' }}
                >
                  0
                </p>
                <p className="text-sm font-mono text-white/50 mt-1">Fully Implemented</p>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-6 text-center">
              <p className="text-white/40 text-sm font-mono">
                From the Royal Commission into Aboriginal Deaths in Custody (1991) to the present day.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-200 pt-8 pb-12 print:hidden">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <Link href="/intelligence" className="hover:text-gray-600">Intelligence Hub</Link>
              <Link href="/intelligence/chat" className="hover:text-gray-600">Ask ALMA</Link>
              <Link href="/hub" className="hover:text-gray-600">Organisation Hub</Link>
            </div>
            <span className="font-mono">JusticeHub National Intelligence Report</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p
        className="text-3xl font-bold text-white"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {value}
      </p>
      <p className="text-sm text-white/50 font-mono">{label}</p>
    </div>
  );
}

function DataQualityCard({
  icon: Icon,
  label,
  value,
  total,
  color,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  total: string;
  color: string;
  description: string;
}) {
  return (
    <div className="bg-white/80 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color }}>
        {value}
      </p>
      <p className="text-xs font-mono text-gray-400 mt-1">{total}</p>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );
}
