import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, MapPin, AlertTriangle, DollarSign, Users,
  BarChart3,
} from 'lucide-react';
import { formatDollars } from '@/lib/intelligence/regional-computations';
import {
  processLgaData,
  tierColor,
  tierLabel,
  type LgaRow,
  type FundingDesertRow,
  type FundingByLgaRow,
  type ClassifiedLga,
  type FundingMapSummary,
  type StateBreakdown,
} from '@/lib/intelligence/funding-map-utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Million Dollar LGAs: Where the Money Isn\'t | JusticeHub Intelligence',
  description:
    'Mapping funding deserts across Australia — where detention spending dwarfs community investment at the LGA level.',
  openGraph: {
    title: 'Million Dollar LGAs: Where the Money Isn\'t',
    description:
      'An interactive view of justice funding deserts, inspired by the Justice Mapping Center\'s Million Dollar Blocks.',
  },
};

/* ── Data fetching ──────────────────────────────────────────── */

async function getFundingMapData(): Promise<{
  classified: ClassifiedLga[];
  summary: FundingMapSummary;
}> {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const [lgaRes, desertsRes, fundingByLgaRes] = await Promise.all([
    sb.from('lga_cross_system_stats').select('*'),
    sb.from('mv_funding_deserts').select('*'),
    sb.from('mv_funding_by_lga').select('*'),
  ]);

  const lgas: LgaRow[] = lgaRes.data ?? [];
  const deserts: FundingDesertRow[] = desertsRes.data ?? [];
  const fundingByLga: FundingByLgaRow[] = fundingByLgaRes.data ?? [];

  return processLgaData(lgas, deserts, fundingByLga);
}

/* ── Helper: tier badge ─────────────────────────────────────── */

function TierBadge({ tier }: { tier: ClassifiedLga['tier'] }) {
  const colorMap = {
    desert: 'bg-red-100 text-red-800 border-red-200',
    underfunded: 'bg-amber-100 text-amber-800 border-amber-200',
    moderate: 'bg-gray-100 text-gray-700 border-gray-200',
    'well-funded': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border font-mono ${colorMap[tier]}`}>
      {tierLabel(tier)}
    </span>
  );
}

/* ── Helper: stat card ──────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#0A0A0A]/10 p-5" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#0A0A0A]/50" />
        <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">{label}</span>
      </div>
      <div
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-[#0A0A0A]/50 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

/* ── Helper: funding bar ────────────────────────────────────── */

function FundingBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-[#0A0A0A]/5">
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: pct < 20 ? '#DC2626' : pct < 50 ? '#F59E0B' : '#059669',
        }}
      />
    </div>
  );
}

/* ── State summary row ──────────────────────────────────────── */

function StateSummaryCard({ state }: { state: StateBreakdown }) {
  const desertPct = state.lgaCount > 0 ? Math.round((state.desertCount / state.lgaCount) * 100) : 0;
  return (
    <div className="rounded-lg border border-[#0A0A0A]/10 p-4" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {state.state}
        </span>
        <span className="text-xs font-mono text-[#0A0A0A]/50">
          {state.lgaCount} LGAs
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div>
          <div className="text-[#0A0A0A]/50">Deserts</div>
          <div className="font-medium" style={{ color: state.desertCount > 0 ? '#DC2626' : '#059669' }}>
            {state.desertCount} ({desertPct}%)
          </div>
        </div>
        <div>
          <div className="text-[#0A0A0A]/50">Funding</div>
          <div className="font-medium">{formatDollars(state.totalFunding)}</div>
        </div>
        <div>
          <div className="text-[#0A0A0A]/50">Indig. Ratio</div>
          <div className="font-medium" style={{ color: (state.avgIndigenousRatio ?? 0) > 15 ? '#DC2626' : '#0A0A0A' }}>
            {state.avgIndigenousRatio ? `${state.avgIndigenousRatio.toFixed(1)}x` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page component ────────────────────────────────────── */

export default async function FundingMapPage() {
  const { classified, summary } = await getFundingMapData();

  // Get max funding for bar scaling
  const maxFunding = Math.max(
    ...classified.map((l) => l.jh_funding_tracked ?? 0),
    1
  );

  // Get unique states for grouping
  const states = [...new Set(classified.map((l) => l.state))].sort();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation bar ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/50">MILLION DOLLAR LGAs</span>
          <span className="font-mono text-xs text-white/30">Ctrl+P to save as PDF</span>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
              NATIONAL
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DC2626]/20 text-[#DC2626] font-mono">
              {summary.desertCount} FUNDING DESERTS
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Million Dollar LGAs:
            <br />
            <span style={{ color: '#DC2626' }}>Where the Money Isn&apos;t</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-3xl mb-6">
            Inspired by the Justice Mapping Center&apos;s &ldquo;Million Dollar Blocks,&rdquo; this analysis
            maps justice funding deserts across {summary.totalLgas} Australian LGAs. Every red row is a
            community where detention spending dwarfs community program investment.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/40 font-mono">
            <span>Data: lga_cross_system_stats ({summary.totalLgas} LGAs)</span>
            <span>|</span>
            <span>mv_funding_deserts + mv_funding_by_lga</span>
          </div>
        </div>
      </div>

      {/* ── Key stats ── */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={MapPin}
            label="LGAs Tracked"
            value={summary.totalLgas.toLocaleString()}
            sub={`${summary.totalPopulation.toLocaleString()} total population`}
          />
          <StatCard
            icon={AlertTriangle}
            label="Funding Deserts"
            value={summary.desertCount.toString()}
            sub={`${summary.underfundedCount} underfunded`}
            accent="#DC2626"
          />
          <StatCard
            icon={DollarSign}
            label="Total Tracked"
            value={formatDollars(summary.totalFundingTracked)}
            sub={summary.medianFundingPerCapita !== null
              ? `Median ${formatDollars(summary.medianFundingPerCapita)}/capita`
              : 'Median N/A'}
          />
          <StatCard
            icon={Users}
            label="Avg Indigenous Overrep"
            value={summary.avgIndigenousOverrep
              ? `${summary.avgIndigenousOverrep.toFixed(1)}x`
              : 'N/A'}
            sub="Rate ratio in detention"
            accent={summary.avgIndigenousOverrep && summary.avgIndigenousOverrep > 10 ? '#DC2626' : undefined}
          />
        </div>
      </div>

      {/* ── Tier distribution ── */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="rounded-xl border border-[#0A0A0A]/10 p-6 bg-white/50">
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Funding Tier Distribution
          </h2>
          <div className="flex items-center gap-1 h-10 rounded-lg overflow-hidden">
            {(['desert', 'underfunded', 'moderate', 'well-funded'] as const).map((tier) => {
              const count = classified.filter((l) => l.tier === tier).length;
              const pct = summary.totalLgas > 0 ? (count / summary.totalLgas) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={tier}
                  className="h-full flex items-center justify-center text-xs font-mono text-white font-medium"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: tierColor(tier),
                    minWidth: pct > 3 ? undefined : '40px',
                  }}
                  title={`${tierLabel(tier)}: ${count} LGAs (${pct.toFixed(1)}%)`}
                >
                  {pct > 8 ? `${count}` : ''}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {(['desert', 'underfunded', 'moderate', 'well-funded'] as const).map((tier) => {
              const count = classified.filter((l) => l.tier === tier).length;
              return (
                <div key={tier} className="flex items-center gap-2 text-xs font-mono text-[#0A0A0A]/60">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: tierColor(tier) }} />
                  <span>{tierLabel(tier)}: {count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── State breakdown ── */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
        >
          State Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary.stateBreakdown.map((state) => (
            <StateSummaryCard key={state.state} state={state} />
          ))}
        </div>
      </div>

      {/* ── LGA data table ── */}
      <div className="max-w-6xl mx-auto px-6 mt-10 mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            All LGAs — Sorted by Need
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0A0A0A]/40">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{classified.length} rows</span>
          </div>
        </div>

        {/* Table container */}
        <div className="rounded-xl border border-[#0A0A0A]/10 overflow-hidden bg-white/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A0A0A] text-white text-xs font-mono uppercase tracking-wider">
                  <th className="text-left px-4 py-3">LGA</th>
                  <th className="text-left px-4 py-3">State</th>
                  <th className="text-left px-4 py-3">Tier</th>
                  <th className="text-right px-4 py-3">Pop.</th>
                  <th className="text-right px-4 py-3">Indig. %</th>
                  <th className="text-right px-4 py-3">Funding</th>
                  <th className="text-left px-4 py-3 min-w-[100px]">Bar</th>
                  <th className="text-right px-4 py-3">Orgs</th>
                  <th className="text-right px-4 py-3">$/Capita</th>
                  <th className="text-right px-4 py-3">Recid. %</th>
                  <th className="text-right px-4 py-3">Overrep</th>
                </tr>
              </thead>
              <tbody>
                {classified.map((lga) => (
                  <tr
                    key={lga.lga_code}
                    className={`border-t border-[#0A0A0A]/5 hover:bg-[#0A0A0A]/[0.02] ${
                      lga.tier === 'desert' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-[#0A0A0A]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tierColor(lga.tier) }}
                        />
                        <span className="truncate max-w-[180px]" title={lga.lga_name}>
                          {lga.lga_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#0A0A0A]/60">
                      {lga.state}
                    </td>
                    <td className="px-4 py-2.5">
                      <TierBadge tier={lga.tier} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {lga.population?.toLocaleString() ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {lga.indigenous_pct !== null ? `${lga.indigenous_pct.toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-medium">
                      {lga.jh_funding_tracked ? formatDollars(lga.jh_funding_tracked) : '$0'}
                    </td>
                    <td className="px-4 py-2.5">
                      <FundingBar value={lga.jh_funding_tracked ?? 0} max={maxFunding} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {lga.jh_org_count ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {lga.fundingPerCapita !== null
                        ? `$${lga.fundingPerCapita.toFixed(0)}`
                        : '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {lga.recidivism_pct !== null ? `${lga.recidivism_pct.toFixed(0)}%` : '--'}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right font-mono text-xs font-medium"
                      style={{
                        color: (lga.indigenous_rate_ratio ?? 0) > 15
                          ? '#DC2626'
                          : (lga.indigenous_rate_ratio ?? 0) > 10
                            ? '#F59E0B'
                            : '#0A0A0A',
                      }}
                    >
                      {lga.indigenous_rate_ratio !== null
                        ? `${lga.indigenous_rate_ratio.toFixed(1)}x`
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Definition ── */}
        <div className="mt-6 rounded-lg border border-[#0A0A0A]/10 p-4 bg-white/30">
          <h3
            className="text-sm font-bold mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Methodology: Funding Desert Definition
          </h3>
          <div className="text-xs text-[#0A0A0A]/60 font-mono space-y-1">
            <p>
              <strong style={{ color: '#DC2626' }}>Funding Desert:</strong> LGAs classified as
              &ldquo;severe&rdquo; or &ldquo;critical&rdquo; by the mv_funding_deserts view, OR LGAs
              with less than $10/capita in tracked funding and 0-1 organizations.
            </p>
            <p>
              <strong style={{ color: '#F59E0B' }}>Underfunded:</strong> Less than $50/capita in
              tracked funding OR fewer than 2 organizations present.
            </p>
            <p>
              <strong style={{ color: '#059669' }}>Well Funded:</strong> More than $200/capita in
              tracked funding with 3+ organizations.
            </p>
            <p>
              Data sources: lga_cross_system_stats ({summary.totalLgas} LGAs), mv_funding_deserts,
              mv_funding_by_lga. Inspired by the Justice Mapping Center&apos;s &ldquo;Million Dollar
              Blocks&rdquo; methodology.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-[#0A0A0A] text-white/40 py-6 px-6 text-center text-xs font-mono print:hidden">
        <p>
          JusticeHub Intelligence &middot; Million Dollar LGAs &middot; Data updated from
          lga_cross_system_stats, mv_funding_deserts, mv_funding_by_lga
        </p>
      </div>
    </div>
  );
}
