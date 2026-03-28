import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, AlertTriangle, DollarSign, Users, Building2,
  Scale, Network, BookOpen, HelpCircle, Mail,
} from 'lucide-react';
import { formatDollars, pct } from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Queensland Youth Justice: Follow the Money | JusticeHub Intelligence',
  description:
    'Deep dive into QLD youth justice funding, programs, governance networks, and evidence — built for QLD Corrective Services briefings.',
  openGraph: {
    title: 'Queensland Youth Justice: Follow the Money',
    description:
      'Comprehensive analysis of QLD youth justice spending, who receives funding, governance networks, and evidence gaps.',
  },
};

/* ── Constants ──────────────────────────────────────────────── */

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

const CONTROL_COLORS: Record<string, { bar: string; badge: string }> = {
  community_controlled: { bar: 'bg-[#059669]', badge: 'bg-emerald-100 text-emerald-800' },
  community_adjacent: { bar: 'bg-teal-400', badge: 'bg-teal-100 text-teal-800' },
  intermediary: { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  government: { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-800' },
  university: { bar: 'bg-blue-400', badge: 'bg-blue-100 text-blue-800' },
  peak_body: { bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-800' },
};

const QLD_SOURCES: Record<string, string> = {
  qgip: 'QLD Govt Investment Portal (QGIP)',
  'qld-contract-disclosure': 'QLD Contract Disclosure',
  rogs: 'Report on Govt Services (ROGS)',
  'qld-historical': 'QLD Historical Funding',
  austender: 'AusTender (Federal)',
  'dyjvs-contracts': 'DYJVS Contracts',
  niaa: 'NIAA (National Indigenous Australians Agency)',
  'foundation-notable-grants': 'Foundation Grants',
};

/* ── Data types ─────────────────────────────────────────────── */

interface SourceBreakdown {
  source: string;
  label: string;
  records: number;
  totalDollars: number;
  linked: number;
}

interface ControlTypeRow {
  controlType: string;
  label: string;
  totalDollars: number;
  orgCount: number;
  avgPerOrg: number;
}

interface TopFundedOrg {
  id: string;
  name: string;
  slug: string | null;
  controlType: string | null;
  isIndigenous: boolean;
  totalFunding: number;
  recordCount: number;
  programCount: number;
}

interface IndigenousOrg {
  id: string;
  name: string;
  slug: string | null;
  totalFunding: number;
  programCount: number;
}

interface BoardConnector {
  personName: string;
  orgCount: number;
  orgs: string[];
}

interface EvidenceRow {
  level: string;
  count: number;
}

/* ── Data fetching ──────────────────────────────────────────── */

async function getQLDData() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  // ── Parallel data fetches ──
  const [
    qldOrgsRes,
    qldFundingRes,
    qldProgramsRes,
    boardRolesCountRes,
  ] = await Promise.all([
    // QLD orgs
    sb.from('organizations')
      .select('id, name, slug, state, is_indigenous_org, control_type, abn')
      .eq('state', 'QLD')
      .eq('is_active', true),

    // QLD funding — filter by state or QLD-specific sources
    sb.from('justice_funding')
      .select('id, source, amount_dollars, alma_organization_id, recipient_name')
      .or('state.eq.QLD,source.like.qld%,source.eq.qgip,source.eq.dyjvs-contracts'),

    // QLD programs (join through org)
    sb.from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, operating_organization_id')
      .neq('verification_status', 'ai_generated'),

    // Board roles count for QLD
    sb.from('person_roles')
      .select('id', { count: 'exact', head: true }),
  ]);

  const allQldOrgs: any[] = qldOrgsRes.data || [];
  const allFunding: any[] = qldFundingRes.data || [];
  const allPrograms: any[] = qldProgramsRes.data || [];

  // Build org lookup
  const orgMap = new Map<string, any>();
  const qldOrgIds = new Set<string>();
  for (const o of allQldOrgs) {
    orgMap.set(o.id, o);
    qldOrgIds.add(o.id);
  }

  // Filter programs to QLD orgs only
  const qldPrograms = allPrograms.filter(
    (p: any) => p.operating_organization_id && qldOrgIds.has(p.operating_organization_id)
  );

  // Build program count per org
  const orgProgramCount = new Map<string, number>();
  for (const p of qldPrograms) {
    if (p.operating_organization_id) {
      orgProgramCount.set(
        p.operating_organization_id,
        (orgProgramCount.get(p.operating_organization_id) || 0) + 1
      );
    }
  }

  // ── Hero stats ──
  const totalFundingDollars = allFunding.reduce((s: number, f: any) => s + (f.amount_dollars || 0), 0);
  const heroStats = {
    totalFunding: totalFundingDollars,
    totalOrgs: allQldOrgs.length,
    totalPrograms: qldPrograms.length,
    totalBoardRoles: boardRolesCountRes.count || 0,
  };

  // ── Section 2: Funding by source ──
  const sourceMap = new Map<string, { records: number; totalDollars: number; linked: number }>();
  for (const f of allFunding) {
    const src = f.source || 'unknown';
    const existing = sourceMap.get(src) || { records: 0, totalDollars: 0, linked: 0 };
    existing.records++;
    existing.totalDollars += f.amount_dollars || 0;
    if (f.alma_organization_id) existing.linked++;
    sourceMap.set(src, existing);
  }
  const sourceBreakdown: SourceBreakdown[] = [...sourceMap.entries()]
    .map(([source, data]) => ({
      source,
      label: QLD_SOURCES[source] || source.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      ...data,
    }))
    .sort((a, b) => b.totalDollars - a.totalDollars);

  // ── Section 3: Funding by control type ──
  const controlAgg = new Map<string, { totalDollars: number; orgIds: Set<string> }>();
  for (const f of allFunding) {
    if (!f.alma_organization_id) {
      const ct = 'unclassified';
      const existing = controlAgg.get(ct) || { totalDollars: 0, orgIds: new Set() };
      existing.totalDollars += f.amount_dollars || 0;
      controlAgg.set(ct, existing);
      continue;
    }
    const org = orgMap.get(f.alma_organization_id);
    const ct = org?.control_type || 'unclassified';
    const existing = controlAgg.get(ct) || { totalDollars: 0, orgIds: new Set() };
    existing.totalDollars += f.amount_dollars || 0;
    existing.orgIds.add(f.alma_organization_id);
    controlAgg.set(ct, existing);
  }
  const controlRows: ControlTypeRow[] = [...controlAgg.entries()]
    .map(([ct, data]) => ({
      controlType: ct,
      label: CONTROL_LABELS[ct] || (ct === 'unclassified' ? 'Unlinked/Unclassified' : ct),
      totalDollars: data.totalDollars,
      orgCount: data.orgIds.size,
      avgPerOrg: data.orgIds.size > 0 ? data.totalDollars / data.orgIds.size : 0,
    }))
    .sort((a, b) => b.totalDollars - a.totalDollars);

  // ── Section 4: Top 20 funded orgs ──
  const orgFundingTotals = new Map<string, { total: number; records: number }>();
  for (const f of allFunding) {
    if (!f.alma_organization_id) continue;
    const existing = orgFundingTotals.get(f.alma_organization_id) || { total: 0, records: 0 };
    existing.total += f.amount_dollars || 0;
    existing.records++;
    orgFundingTotals.set(f.alma_organization_id, existing);
  }

  const top20Ids = [...orgFundingTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20)
    .map(([id]) => id);

  let topOrgDetails: any[] = [];
  if (top20Ids.length > 0) {
    const { data } = await sb
      .from('organizations')
      .select('id, name, slug, control_type, is_indigenous_org')
      .in('id', top20Ids);
    topOrgDetails = data || [];
  }

  const topFundedOrgs: TopFundedOrg[] = topOrgDetails
    .map((o: any) => {
      const ft = orgFundingTotals.get(o.id) || { total: 0, records: 0 };
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        controlType: o.control_type,
        isIndigenous: o.is_indigenous_org,
        totalFunding: ft.total,
        recordCount: ft.records,
        programCount: orgProgramCount.get(o.id) || 0,
      };
    })
    .sort((a, b) => b.totalFunding - a.totalFunding);

  // ── Section 5: Indigenous community orgs ──
  const indigenousOrgs: IndigenousOrg[] = allQldOrgs
    .filter((o: any) => o.is_indigenous_org)
    .map((o: any) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      totalFunding: orgFundingTotals.get(o.id)?.total || 0,
      programCount: orgProgramCount.get(o.id) || 0,
    }))
    .sort((a: IndigenousOrg, b: IndigenousOrg) => b.totalFunding - a.totalFunding)
    .slice(0, 30);

  // ── Section 6: Governance network ──
  // Fetch QLD person_roles via ABN join — get all orgs with ABN in QLD
  const qldAbns = allQldOrgs.filter((o: any) => o.abn).map((o: any) => o.abn);

  let boardConnectors: BoardConnector[] = [];
  let totalQldBoardRoles = 0;
  let multiboardCount = 0;

  if (qldAbns.length > 0) {
    // Fetch person roles for QLD orgs — need to batch ABNs if too many
    // Use first 500 ABNs to keep query manageable
    const abnBatch = qldAbns.slice(0, 500);
    const { data: personRolesData } = await sb
      .from('person_roles')
      .select('person_name, company_name, company_abn')
      .in('company_abn', abnBatch);

    const qldRoles: any[] = personRolesData || [];
    totalQldBoardRoles = qldRoles.length;

    // Group by person name
    const personBoards = new Map<string, Set<string>>();
    for (const r of qldRoles) {
      if (!r.person_name) continue;
      const name = r.person_name.trim();
      const existing = personBoards.get(name) || new Set();
      if (r.company_name) existing.add(r.company_name);
      personBoards.set(name, existing);
    }

    // Multi-board directors
    const multiBoardDirectors = [...personBoards.entries()]
      .filter(([, orgs]) => orgs.size >= 2)
      .sort((a, b) => b[1].size - a[1].size);

    multiboardCount = multiBoardDirectors.length;

    boardConnectors = multiBoardDirectors
      .slice(0, 15)
      .map(([name, orgs]) => ({
        personName: name,
        orgCount: orgs.size,
        orgs: [...orgs].slice(0, 5),
      }));
  }

  const governanceStats = {
    totalQldBoardRoles,
    multiboardCount,
    boardConnectors,
  };

  // ── Section 7: Programs & evidence ──
  const evidenceCounts = new Map<string, number>();
  for (const p of qldPrograms) {
    const el = p.evidence_level || 'Untested (theory/pilot stage)';
    evidenceCounts.set(el, (evidenceCounts.get(el) || 0) + 1);
  }
  const evidenceDistribution: EvidenceRow[] = EVIDENCE_ORDER
    .map(level => ({ level, count: evidenceCounts.get(level) || 0 }))
    .filter(r => r.count > 0);

  // Programs grouped by evidence
  const programsByEvidence = new Map<string, any[]>();
  for (const p of qldPrograms) {
    const el = p.evidence_level || 'Untested (theory/pilot stage)';
    const short = EVIDENCE_SHORT[el] || 'Untested';
    const existing = programsByEvidence.get(short) || [];
    existing.push(p);
    programsByEvidence.set(short, existing);
  }

  // ── Data gaps ──
  const dataGaps = [
    { area: 'Crime & Recidivism Data', detail: 'No public QLD data on recidivism by program. Cannot measure which programs actually reduce reoffending.' },
    { area: 'Disability Crossover', detail: 'No linked data between QLD youth justice and NDIS. Up to 40% of detained youth have cognitive disabilities.' },
    { area: 'Education Outcomes', detail: 'No linked education data showing school engagement before/after program participation.' },
    { area: 'Child Protection Linkage', detail: 'QLD DCSSDS data not linked to justice outcomes. Most detained youth have child protection histories.' },
    { area: 'Recidivism by Program', detail: 'No program-level outcome tracking. We know which programs exist but not which ones work best for QLD youth.' },
    { area: 'Cost-Benefit Analysis', detail: 'Only 30% of QLD programs have cost data. Full economic evaluation impossible without per-program costings.' },
    { area: 'Cultural Safety Metrics', detail: 'No standardised measure of cultural safety across QLD youth justice programs.' },
  ];

  return {
    heroStats,
    sourceBreakdown,
    controlRows,
    topFundedOrgs,
    indigenousOrgs,
    governanceStats,
    evidenceDistribution,
    programsByEvidence,
    dataGaps,
    totalFundingDollars,
  };
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function QLDJusticeDeepDive() {
  const {
    heroStats,
    sourceBreakdown,
    controlRows,
    topFundedOrgs,
    indigenousOrgs,
    governanceStats,
    evidenceDistribution,
    programsByEvidence,
    dataGaps,
    totalFundingDollars,
  } = await getQLDData();

  const totalRecords = sourceBreakdown.reduce((s, r) => s + r.records, 0);
  const totalEvidencePrograms = evidenceDistribution.reduce((s, r) => s + r.count, 0);
  const controlTotal = controlRows.reduce((s, r) => s + r.totalDollars, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation bar ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/50">QLD JUSTICE DEEP DIVE</span>
          <span className="font-mono text-xs text-white/30">Ctrl+P to save as PDF</span>
        </div>
      </div>

      {/* ====== SECTION 1: HERO ====== */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                  QUEENSLAND
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Queensland Youth Justice:
                <br />
                Follow the Money
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-3xl">
                A comprehensive analysis of who funds what, who receives the money,
                and what the evidence says about youth justice in Queensland. Built for
                transparency and accountability.
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <Scale className="w-10 h-10 text-white/20" />
              <span className="text-xs font-mono text-white/30">QLD DEEP DIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero stat strip */}
      <div className="bg-[#0A0A0A] border-t border-white/10 print:border-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBlock value={formatDollars(heroStats.totalFunding)} label="Total Funding Tracked" />
          <StatBlock value={heroStats.totalOrgs.toLocaleString()} label="QLD Organisations" />
          <StatBlock value={heroStats.totalPrograms.toLocaleString()} label="QLD Programs" />
          <StatBlock value={governanceStats.totalQldBoardRoles.toLocaleString()} label="Board Roles Mapped" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-20 print:space-y-10">

        {/* ====== SECTION 2: SPENDING BREAKDOWN ====== */}
        <section>
          <SectionHeader
            icon={<DollarSign className="w-6 h-6" />}
            title="The Spending Breakdown"
            subtitle="QLD youth justice funding tracked by data source. Each row represents a distinct government or philanthropic funding stream."
          />
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Source</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Records</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">% of Total</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">% Linked</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceBreakdown.map((row, i) => (
                    <tr key={row.source} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.records.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(row.totalDollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{pct(row.totalDollars, totalFundingDollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span className={row.records > 0 && row.linked / row.records > 0.5 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                          {pct(row.linked, row.records)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0A0A0A] text-white font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{totalRecords.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatDollars(totalFundingDollars)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">100%</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {pct(
                        sourceBreakdown.reduce((s, r) => s + r.linked, 0),
                        totalRecords
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ====== SECTION 3: WHO GETS THE MONEY ====== */}
        <section>
          <SectionHeader
            icon={<Building2 className="w-6 h-6" />}
            title="Who Gets the Money"
            subtitle="Funding distribution by organisation control type. The gap between intermediaries and community-controlled organisations tells the story."
          />

          {/* Visual bar */}
          <div className="mb-6 rounded-xl overflow-hidden h-10 flex">
            {controlRows.filter(r => r.totalDollars > 0).map(row => {
              const widthPct = controlTotal > 0 ? (row.totalDollars / controlTotal) * 100 : 0;
              if (widthPct < 1) return null;
              return (
                <div
                  key={row.controlType}
                  className={`${CONTROL_COLORS[row.controlType]?.bar || 'bg-gray-300'} flex items-center justify-center text-xs text-white font-mono`}
                  style={{ width: `${widthPct}%` }}
                  title={`${row.label}: ${formatDollars(row.totalDollars)}`}
                >
                  {widthPct > 8 ? `${row.label} ${Math.round(widthPct)}%` : ''}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Control Type</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Orgs</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Avg / Org</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {controlRows.map((row, i) => (
                    <tr key={row.controlType} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CONTROL_COLORS[row.controlType]?.badge || 'bg-gray-100 text-gray-700'}`}>
                          {row.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(row.totalDollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.orgCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.orgCount > 0 ? formatDollars(row.avgPerOrg) : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{pct(row.totalDollars, controlTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disparity callout */}
          {(() => {
            const intermediary = controlRows.find(r => r.controlType === 'intermediary');
            const cc = controlRows.find(r => r.controlType === 'community_controlled');
            if (!intermediary || !cc) return null;
            const ratio = intermediary.avgPerOrg > 0 && cc.avgPerOrg > 0
              ? (intermediary.totalDollars / cc.totalDollars).toFixed(1)
              : null;
            return (
              <div className="mt-6 p-6 rounded-xl border-2 border-[#DC2626]/20 bg-[#DC2626]/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      The Disparity
                    </p>
                    <p className="text-sm text-[#0A0A0A]/70 mt-1">
                      Intermediaries receive <strong>{formatDollars(intermediary.totalDollars)}</strong> across{' '}
                      <strong>{intermediary.orgCount.toLocaleString()}</strong> orgs (avg {formatDollars(intermediary.avgPerOrg)}/org).
                      Community-controlled organisations receive <strong>{formatDollars(cc.totalDollars)}</strong> across{' '}
                      <strong>{cc.orgCount.toLocaleString()}</strong> orgs (avg {formatDollars(cc.avgPerOrg)}/org).
                      {ratio && <> That&apos;s a <strong>{ratio}x</strong> gap in total funding.</>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ====== SECTION 4: TOP 20 FUNDED ORGANISATIONS ====== */}
        <section>
          <SectionHeader
            icon={<DollarSign className="w-6 h-6" />}
            title="Top 20 Funded Organisations"
            subtitle="The organisations receiving the most youth justice funding in Queensland, ranked by total dollars."
          />
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase w-8">#</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Organisation</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Type</th>
                    <th className="text-center px-4 py-3 font-mono text-xs uppercase">Indigenous</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Records</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Programs</th>
                  </tr>
                </thead>
                <tbody>
                  {topFundedOrgs.map((org, i) => (
                    <tr key={org.id} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0A0A0A]/40">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        {org.slug ? (
                          <Link href={`/hub/${org.slug}`} className="text-[#0A0A0A] hover:underline">
                            {org.name}
                          </Link>
                        ) : (
                          org.name
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {org.controlType && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CONTROL_COLORS[org.controlType]?.badge || 'bg-gray-100 text-gray-700'}`}>
                            {CONTROL_LABELS[org.controlType] || org.controlType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {org.isIndigenous && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#059669]" title="Indigenous organisation" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(org.totalFunding)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{org.recordCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{org.programCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ====== SECTION 5: INDIGENOUS COMMUNITY ORGS ====== */}
        <section>
          <SectionHeader
            icon={<Users className="w-6 h-6" />}
            title="Indigenous Community Organisations"
            subtitle="QLD Indigenous organisations and their funding — the frontline of community-led justice. These are the organisations closest to the communities most affected."
          />
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase w-8">#</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Organisation</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Programs</th>
                  </tr>
                </thead>
                <tbody>
                  {indigenousOrgs.map((org, i) => (
                    <tr key={org.id} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0A0A0A]/40">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        {org.slug ? (
                          <Link href={`/hub/${org.slug}`} className="text-[#0A0A0A] hover:underline">
                            {org.name}
                          </Link>
                        ) : (
                          org.name
                        )}
                        {org.programCount >= 15 && (
                          <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            {org.programCount} programs
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">
                        {org.totalFunding > 0 ? formatDollars(org.totalFunding) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{org.programCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {indigenousOrgs.length === 30 && (
            <p className="text-sm text-[#0A0A0A]/50 mt-3 font-mono">Showing top 30 by funding. Full dataset available on request.</p>
          )}
        </section>

        {/* ====== SECTION 6: GOVERNANCE NETWORK ====== */}
        <section>
          <SectionHeader
            icon={<Network className="w-6 h-6" />}
            title="Governance Network"
            subtitle="Board directors and governance connections across QLD youth justice organisations. Multi-board directors reveal the informal power networks shaping policy and funding."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MetricCard
              value={governanceStats.totalQldBoardRoles.toLocaleString()}
              label="QLD Board Roles"
            />
            <MetricCard
              value={governanceStats.multiboardCount.toLocaleString()}
              label="Multi-Board Directors"
            />
            <MetricCard
              value={governanceStats.boardConnectors.length > 0 ? governanceStats.boardConnectors[0].orgCount.toString() : '0'}
              label="Most Connected (orgs)"
            />
          </div>

          {governanceStats.boardConnectors.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#0A0A0A]">
                <h3 className="text-sm font-mono text-white/60 uppercase">Top Governance Connectors</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#0A0A0A]/10">
                      <th className="text-left px-4 py-3 font-mono text-xs uppercase text-[#0A0A0A]/50">Director</th>
                      <th className="text-right px-4 py-3 font-mono text-xs uppercase text-[#0A0A0A]/50">Orgs</th>
                      <th className="text-left px-4 py-3 font-mono text-xs uppercase text-[#0A0A0A]/50">Connected To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governanceStats.boardConnectors.map((c, i) => (
                      <tr key={c.personName} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium">{c.personName}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-medium">{c.orgCount}</td>
                        <td className="px-4 py-3 text-xs text-[#0A0A0A]/60">
                          {c.orgs.join(', ')}
                          {c.orgCount > 5 && <span className="text-[#0A0A0A]/40"> +{c.orgCount - 5} more</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ====== SECTION 7: PROGRAMS & EVIDENCE ====== */}
        <section>
          <SectionHeader
            icon={<BookOpen className="w-6 h-6" />}
            title="Programs & Evidence"
            subtitle={`${totalEvidencePrograms} youth justice programs mapped in Queensland, categorised by evidence strength.`}
          />

          {/* Evidence distribution bar */}
          {totalEvidencePrograms > 0 && (
            <div className="mb-6">
              <div className="rounded-xl overflow-hidden h-10 flex">
                {evidenceDistribution.map(row => {
                  const widthPct = (row.count / totalEvidencePrograms) * 100;
                  if (widthPct < 1) return null;
                  return (
                    <div
                      key={row.level}
                      className={`${EVIDENCE_COLORS[row.level] || 'bg-gray-400'} flex items-center justify-center text-xs text-white font-mono`}
                      style={{ width: `${widthPct}%` }}
                      title={`${EVIDENCE_SHORT[row.level]}: ${row.count}`}
                    >
                      {widthPct > 10 ? `${EVIDENCE_SHORT[row.level]} (${row.count})` : row.count > 0 ? row.count.toString() : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {evidenceDistribution.map(row => (
                  <div key={row.level} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded ${EVIDENCE_COLORS[row.level] || 'bg-gray-400'}`} />
                    <span className="font-mono text-[#0A0A0A]/60">
                      {EVIDENCE_SHORT[row.level]}: {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Programs by evidence level */}
          <div className="space-y-4">
            {EVIDENCE_ORDER.map(level => {
              const short = EVIDENCE_SHORT[level];
              const programs = programsByEvidence.get(short) || [];
              if (programs.length === 0) return null;
              return (
                <div key={level} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-2 border-b border-[#0A0A0A]/5">
                    <div className={`w-3 h-3 rounded ${EVIDENCE_COLORS[level]}`} />
                    <h3 className="text-sm font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {short}
                    </h3>
                    <span className="text-xs font-mono text-[#0A0A0A]/40">{programs.length} programs</span>
                  </div>
                  <div className="px-4 py-2">
                    <div className="flex flex-wrap gap-2 py-2">
                      {programs.slice(0, 20).map((p: any) => (
                        <span
                          key={p.id}
                          className="inline-block px-2 py-1 rounded text-xs bg-[#F5F0E8] text-[#0A0A0A]/70"
                        >
                          {p.name}
                        </span>
                      ))}
                      {programs.length > 20 && (
                        <span className="inline-block px-2 py-1 rounded text-xs bg-[#0A0A0A]/5 text-[#0A0A0A]/40 font-mono">
                          +{programs.length - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====== SECTION 8: DATA GAPS ====== */}
        <section>
          <SectionHeader
            icon={<HelpCircle className="w-6 h-6" />}
            title="What We Don't Know Yet"
            subtitle="Honest assessment of data gaps. Completing the picture would require access to these datasets — and we're actively working on it."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataGaps.map(gap => (
              <div key={gap.area} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-[#DC2626]/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]/60 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {gap.area}
                    </p>
                    <p className="text-xs text-[#0A0A0A]/60 mt-1 leading-relaxed">{gap.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ====== SECTION 9: CTA ====== */}
      <div className="bg-[#0A0A0A] text-white mt-20 print:mt-10">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <Mail className="w-8 h-8 text-white/30 mx-auto mb-4" />
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            This Data Is Available for Briefings
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            This analysis is available for QLD Corrective Services, government departments,
            and policymakers. We provide tailored briefings with full data access, interactive
            dashboards, and program-level detail.
          </p>
          <a
            href="mailto:benjamin@act.place?subject=QLD%20Youth%20Justice%20Data%20Briefing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: '#DC2626' }}
          >
            <Mail className="w-4 h-4" />
            Request a Briefing
          </a>
          <p className="text-xs font-mono text-white/30 mt-6">
            JusticeHub Intelligence &middot; Updated daily &middot; {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────── */

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

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[#0A0A0A]/30">{icon}</div>
        <h2
          className="text-2xl md:text-3xl font-bold text-[#0A0A0A]"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-sm text-[#0A0A0A]/60 max-w-3xl leading-relaxed">{subtitle}</p>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
      <p
        className="text-3xl font-bold text-[#0A0A0A]"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {value}
      </p>
      <p className="text-xs font-mono text-[#0A0A0A]/50 mt-1 uppercase">{label}</p>
    </div>
  );
}
