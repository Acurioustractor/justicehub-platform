import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  DollarSign, Users, Building2, Shield, Network, Globe,
  ArrowRight, AlertTriangle, ExternalLink, ChevronRight,
  TrendingUp, Scale, BarChart3, Eye,
} from 'lucide-react';
import { formatDollars } from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Power Map — Who Controls the Money? | JusticeHub',
  description:
    'Follow the money. See which organisations receive the most government funding, how their boards overlap, and who holds power across the youth justice sector.',
  openGraph: {
    title: 'Power Map — Who Controls the Money?',
    description:
      '$120B in government funding tracked. 339K board roles mapped. See the concentration of power in youth justice.',
  },
};

/* ── Constants ──────────────────────────────────────────────── */

const CONTROL_LABELS: Record<string, string> = {
  community_controlled: 'Community Controlled',
  community_adjacent: 'Community Adjacent',
  intermediary: 'Intermediary',
  government: 'Government',
  university: 'University',
  peak_body: 'Peak Body',
};

const CONTROL_COLORS: Record<string, { bg: string; text: string; bar: string; badge: string }> = {
  community_controlled: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
  community_adjacent: { bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-400', badge: 'bg-teal-100 text-teal-800' },
  intermediary: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  government: { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-800' },
  university: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-400', badge: 'bg-blue-100 text-blue-800' },
  peak_body: { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-800' },
};

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland',
  WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania',
  NT: 'Northern Territory', ACT: 'Australian Capital Territory',
};

/* ── Types ──────────────────────────────────────────────────── */

interface PowerOrg {
  id: string;
  name: string;
  slug: string | null;
  state: string | null;
  control_type: string;
  is_indigenous_org: boolean;
  acnc_size: string | null;
  total_funding: number;
  funding_records: number;
  funding_sources: number;
  programs: number;
  board_roles: number;
  unique_directors: number;
}

interface BoardConnector {
  person_name: string;
  org_count: number;
  orgs: string[];
  total_funding_across_orgs: number;
}

interface ConcentrationStats {
  top10_total: number;
  top10_pct: number;
  top50_total: number;
  top50_pct: number;
  intermediary_total: number;
  intermediary_pct: number;
  cc_total: number;
  cc_pct: number;
  grand_total: number;
}

interface ControlTypeBreakdown {
  control_type: string;
  org_count: number;
  total_funding: number;
  avg_funding: number;
  total_programs: number;
}

/* ── Data fetching ──────────────────────────────────────────── */

export default async function PowerMapPage() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  // ── All server-side via RPCs ──
  const [
    topOrgsRes,
    statsRes,
    boardConnectorsRes,
    controlBreakdownRes,
  ] = await Promise.all([
    sb.rpc('get_power_map_top_orgs', { lim: 50 }),
    sb.rpc('get_power_map_stats'),
    sb.rpc('get_power_map_board_connectors', { top_org_limit: 50, min_boards: 2, lim: 25 }),
    sb.rpc('get_power_map_control_breakdown'),
  ]);

  const topOrgsRaw: any[] = topOrgsRes.data || [];
  const stats = (statsRes.data || [])[0] || { grand_total: 0, funded_org_count: 0, top10_total: 0, top50_total: 0 };
  const boardConnectors: { person_name: string; org_count: number; org_names: string[] }[] = boardConnectorsRes.data || [];
  const controlBreakdown: any[] = controlBreakdownRes.data || [];

  const grandTotal = Number(stats.grand_total) || 1;
  const top10Total = Number(stats.top10_total) || 0;
  const top50Total = topOrgsRaw.reduce((s: number, o: any) => s + Number(o.total_funding || 0), 0);
  const fundedOrgCount = Number(stats.funded_org_count) || 0;

  // Build typed top orgs
  const topOrgs: PowerOrg[] = topOrgsRaw.map((r: any) => ({
    id: r.org_id,
    name: r.org_name,
    slug: r.slug,
    state: r.state,
    control_type: r.control_type || 'unknown',
    is_indigenous_org: r.is_indigenous_org || false,
    acnc_size: r.acnc_size,
    total_funding: Number(r.total_funding),
    funding_records: Number(r.funding_records),
    funding_sources: Number(r.funding_sources),
    programs: Number(r.program_count),
    board_roles: 0,
    unique_directors: Number(r.director_count || 0),
  }));

  // By control type (from top 50)
  const controlTotals = new Map<string, { total: number; count: number; programs: number }>();
  for (const org of topOrgs) {
    const ct = org.control_type;
    const existing = controlTotals.get(ct) || { total: 0, count: 0, programs: 0 };
    existing.total += org.total_funding;
    existing.count++;
    existing.programs += org.programs;
    controlTotals.set(ct, existing);
  }

  // Cross-sector reach — orgs with most funding source diversity
  const crossSector = topOrgs
    .filter(o => o.funding_sources >= 4)
    .sort((a, b) => b.funding_sources - a.funding_sources)
    .slice(0, 20);

  // Compute $ per program ratio for top orgs (accountability metric)
  const dollarsPerProgram = topOrgs
    .filter(o => o.programs > 0)
    .map(o => ({ ...o, ratio: o.total_funding / o.programs }))
    .sort((a, b) => b.ratio - a.ratio);

  const maxFunding = topOrgs[0]?.total_funding || 1;

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ── Hero ── */}
      <section className="bg-[#0A0A0A] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-3">
            JusticeHub Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] tracking-tight mb-4">
            Power Map
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mb-2">
            Follow the money. See which organisations control the most government funding,
            how their boards overlap, and where the power sits across social services.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Social services sector only — child protection, youth justice, disability, housing, family services.
            Excludes transport, defence, and medical research.
            For the full cross-sector view including procurement and political donations, see CivicScope.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tracked', value: `$${(grandTotal / 1e9).toFixed(1)}B`, sub: 'government funding' },
              { label: 'Top 10 hold', value: `${((top10Total / grandTotal) * 100).toFixed(0)}%`, sub: 'of all linked $' },
              { label: 'Board roles', value: '339K', sub: 'mapped nationally' },
              { label: 'Funded orgs', value: `${(fundedOrgCount / 1000).toFixed(1)}K`, sub: 'with linked funding' },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs font-mono text-gray-400 uppercase">{s.label}</p>
                <p className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* ── Table of Contents ── */}
        <nav className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] mb-3">Contents</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              { id: 'top-funded', label: '1. Top 50 Funded Organisations' },
              { id: 'concentration', label: '2. Funding Concentration' },
              { id: 'dollars-per-program', label: '3. Dollars Per Program (Accountability)' },
              { id: 'board-network', label: '4. Board Network & Power Connectors' },
              { id: 'cross-sector', label: '5. Cross-Sector Reach' },
              { id: 'control-type', label: '6. Who Controls the Money?' },
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0A0A0A] hover:bg-gray-50 rounded px-2 py-1 transition-colors">
                <ChevronRight className="w-3 h-3" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── 1. Top 50 Funded Organisations ── */}
        <section id="top-funded">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Top 50 Funded Organisations
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Every dollar of government funding we can trace, ranked by total amount received.
            Hover or tap for detail. Colour = organisation type.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Organisation</th>
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">State</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Records</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Sources</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Programs</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Directors</th>
                  </tr>
                </thead>
                <tbody>
                  {topOrgs.map((org, i) => {
                    const colors = CONTROL_COLORS[org.control_type] || CONTROL_COLORS.intermediary;
                    const barWidth = (org.total_funding / maxFunding) * 100;
                    return (
                      <tr key={org.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${org.is_indigenous_org ? 'bg-emerald-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {org.slug ? (
                              <Link href={`/hub/${org.slug}`} className="font-medium text-[#0A0A0A] hover:text-[#DC2626] transition-colors">
                                {org.name}
                              </Link>
                            ) : (
                              <span className="font-medium text-[#0A0A0A]">{org.name}</span>
                            )}
                            {/* Funding bar */}
                            <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${barWidth}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                            {CONTROL_LABELS[org.control_type] || org.control_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{org.state || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {org.total_funding >= 1e9
                            ? `$${(org.total_funding / 1e9).toFixed(1)}B`
                            : `$${(org.total_funding / 1e6).toFixed(0)}M`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{org.funding_records.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{org.funding_sources}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono ${org.programs === 0 ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
                            {org.programs}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{org.unique_directors || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Programs = 0 (red) means we track funding to this org but have not mapped any of their youth justice programs yet.
          </p>
        </section>

        {/* ── 2. Funding Concentration ── */}
        <section id="concentration">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Funding Concentration
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-mono text-gray-500 uppercase mb-1">Top 10 organisations</p>
              <p className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
                {((top10Total / grandTotal) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ${(top10Total / 1e9).toFixed(1)}B of ${(grandTotal / 1e9).toFixed(1)}B total
              </p>
              <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${(top10Total / grandTotal) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-mono text-gray-500 uppercase mb-1">Top 50 organisations</p>
              <p className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
                {((top50Total / grandTotal) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ${(top50Total / 1e9).toFixed(1)}B of ${(grandTotal / 1e9).toFixed(1)}B total
              </p>
              <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(top50Total / grandTotal) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-mono text-gray-500 uppercase mb-1">Remaining {(fundedOrgCount - 50).toLocaleString()} orgs</p>
              <p className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
                {(100 - (top50Total / grandTotal) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ${((grandTotal - top50Total) / 1e9).toFixed(1)}B spread across thousands
              </p>
              <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - (top50Total / grandTotal) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Dollars Per Program ── */}
        <section id="dollars-per-program">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Dollars Per Program
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            How much funding does each organisation receive per mapped program?
            A high ratio means lots of money flowing in with few visible programs —
            either programs are unmapped, or the money isn{"'"}t reaching frontline services.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Organisation</th>
                    <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Type</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Total Funding</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Programs</th>
                    <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">$ per Program</th>
                  </tr>
                </thead>
                <tbody>
                  {dollarsPerProgram.slice(0, 20).map((org) => {
                    const colors = CONTROL_COLORS[org.control_type] || CONTROL_COLORS.intermediary;
                    return (
                      <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {org.slug ? (
                            <Link href={`/hub/${org.slug}`} className="font-medium text-[#0A0A0A] hover:text-[#DC2626]">
                              {org.name}
                            </Link>
                          ) : (
                            <span className="font-medium">{org.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                            {CONTROL_LABELS[org.control_type] || org.control_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {org.total_funding >= 1e9
                            ? `$${(org.total_funding / 1e9).toFixed(1)}B`
                            : `$${(org.total_funding / 1e6).toFixed(0)}M`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{org.programs}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#DC2626]">
                          ${(org.ratio / 1e6).toFixed(0)}M
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zero-program callout */}
          {(() => {
            const zeroProgram = topOrgs.filter(o => o.programs === 0);
            const zeroTotal = zeroProgram.reduce((s, o) => s + o.total_funding, 0);
            return zeroProgram.length > 0 ? (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#0A0A0A]">
                      {zeroProgram.length} of the top 50 funded organisations have zero mapped programs
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      These {zeroProgram.length} organisations collectively receive{' '}
                      <strong>${(zeroTotal / 1e9).toFixed(1)}B</strong> in government funding
                      but we cannot see what youth justice programs that money supports.
                      This is either a transparency gap or a data gap.
                    </p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </section>

        {/* ── 4. Board Network ── */}
        <section id="board-network">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Board Network & Power Connectors
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            People who sit on the boards of multiple top-funded organisations.
            Board overlap concentrates decision-making power and can create conflicts of interest.
          </p>

          {boardConnectors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardConnectors.slice(0, 15).map((connector, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-bold">
                      {connector.org_count}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{connector.person_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{connector.org_count} boards</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(connector.org_names || []).map((orgName: string, j: number) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                        {orgName.length > 30 ? orgName.substring(0, 30) + '...' : orgName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              <p>No multi-board connectors found among top 50 funded organisations.</p>
              <p className="text-sm mt-2">Board data comes from ASIC director records matched via ABN.</p>
            </div>
          )}
        </section>

        {/* ── 5. Cross-Sector Reach ── */}
        <section id="cross-sector">
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Cross-Sector Reach
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Organisations receiving funding from 4+ different government sources.
            More sources = deeper embeddedness in the system.
          </p>

          {crossSector.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Organisation</th>
                      <th className="text-left px-4 py-3 font-mono text-xs text-gray-500 uppercase">Type</th>
                      <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Funding Sources</th>
                      <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Total Funding</th>
                      <th className="text-right px-4 py-3 font-mono text-xs text-gray-500 uppercase">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossSector.map((org) => {
                      const colors = CONTROL_COLORS[org.control_type] || CONTROL_COLORS.intermediary;
                      return (
                        <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {org.slug ? (
                              <Link href={`/hub/${org.slug}`} className="font-medium hover:text-[#DC2626]">
                                {org.name}
                              </Link>
                            ) : (
                              <span className="font-medium">{org.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                              {CONTROL_LABELS[org.control_type] || org.control_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-bold text-[#0A0A0A]">{org.funding_sources}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {org.total_funding >= 1e9
                              ? `$${(org.total_funding / 1e9).toFixed(1)}B`
                              : `$${(org.total_funding / 1e6).toFixed(0)}M`}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-500">{org.funding_records.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No organisations with 4+ funding sources in top 50.</p>
          )}
        </section>

        {/* ── 6. Who Controls the Money? ── */}
        <section id="control-type">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#DC2626]" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Who Controls the Money?
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Among the top 50 funded organisations, how does funding break down by organisation type?
            Community-controlled organisations — those led by the communities they serve — typically
            receive a fraction of what large intermediaries get.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                Top 50: Funding by Organisation Type
              </h3>
              <div className="space-y-4">
                {[...controlTotals.entries()]
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([ct, data]) => {
                    const colors = CONTROL_COLORS[ct] || CONTROL_COLORS.intermediary;
                    const pctOfTop50 = (data.total / top50Total) * 100;
                    return (
                      <div key={ct}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{CONTROL_LABELS[ct] || ct}</span>
                          <span className="font-mono text-gray-500">
                            {data.count} orgs — ${(data.total / 1e9).toFixed(1)}B ({pctOfTop50.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pctOfTop50}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Narrative */}
            <div className="bg-[#0A0A0A] text-white rounded-xl p-6">
              <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] text-lg mb-3">
                The Pattern
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                {(() => {
                  const intermediaryData = controlTotals.get('intermediary');
                  const ccData = controlTotals.get('community_controlled');
                  const intermediaryPct = intermediaryData ? ((intermediaryData.total / top50Total) * 100).toFixed(0) : '0';
                  const ccPct = ccData ? ((ccData.total / top50Total) * 100).toFixed(0) : '0';
                  return (
                    <>
                      <p>
                        Large intermediaries — Mission Australia, Life Without Barriers, Anglicare,
                        UnitingCare — receive{' '}
                        <strong className="text-white">{intermediaryPct}% of top-50 funding</strong>.
                      </p>
                      {ccData ? (
                        <p>
                          Community-controlled organisations — led by the people closest to the problem — receive{' '}
                          <strong className="text-[#059669]">{ccPct}%</strong>.
                        </p>
                      ) : (
                        <p>
                          <strong className="text-[#DC2626]">Zero community-controlled organisations</strong>{' '}
                          appear in the top 50 most funded.
                        </p>
                      )}
                      <p>
                        This is the structural inequality at the heart of the system.
                        The organisations closest to communities get the least money.
                        The organisations furthest from communities get the most.
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] mb-3">Methodology & Sources</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Funding data comes from 35+ sources including QGIP, QLD contract disclosures,
              AusTender, ROGS, NSW/VIC/SA grant registries, and foundation databases.
              Not all funding records include dollar amounts — concentration figures use only
              records with verified amounts.
            </p>
            <p>
              Board data comes from ASIC company director records matched to organisations via ABN.
              Some organisations (especially government bodies) may not appear in ASIC records.
            </p>
            <p>
              Program counts reflect verified programs mapped in the ALMA database.
              A count of zero does not mean the organisation runs no programs — it means
              we have not yet mapped them. This is a transparency gap, not an accusation.
            </p>
          </div>
        </section>

        {/* ── CivicScope cross-link ── */}
        <section className="bg-[#0A0A0A] text-white rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Globe className="w-6 h-6 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] text-lg mb-2">
                See the full picture on CivicScope
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                This page shows social services funding only. CivicScope tracks the complete power map
                across all sectors — including federal procurement ($3.1B), political donations (312K records),
                and cross-system influence scoring for 159K+ entities.
              </p>
              <a
                href="https://civicgraph.app/power"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded px-4 py-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open CivicScope Power Map
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer nav ── */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/intelligence/national" className="flex items-center gap-1 text-gray-500 hover:text-[#0A0A0A]">
            <ArrowRight className="w-4 h-4" /> National Overview
          </Link>
          <Link href="/intelligence/qld-dyjvs" className="flex items-center gap-1 text-gray-500 hover:text-[#0A0A0A]">
            <ArrowRight className="w-4 h-4" /> QLD Sector Report
          </Link>
        </div>
      </div>
    </main>
  );
}
