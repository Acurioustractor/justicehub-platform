import Link from 'next/link';
import type { Metadata } from 'next';
import { fmtCompact, fmtNum } from './types';
import { fetchLiveCounts, buildStateRows, buildOrgRows } from './data';
import { ConfBadge } from './components/conf-badge';
import { StateComparisonTable } from './components/state-table';
import { OrgTicker } from './components/org-ticker';
import { MinisterLeaderboard } from './components/minister-leaderboard';
import { LiveFeed } from './components/live-feed';
import { VerificationScores, DetentionCostIndex, DataInventory, TheEquation, AlertsTicker, SourceRegistry } from './components/sidebar';
import { InlineScript } from './components/inline-script';
import { TerminalNav } from './components/terminal-nav';
import { TerminalFooter } from './components/terminal-footer';

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

export default async function SystemTerminalDashboard() {
  const live = await fetchLiveCounts();
  const states = buildStateRows(live);
  const orgs = buildOrgRows();

  const totalValue = states.reduce((s, r) => s + r.totalValue, 0);
  const totalDetentionAnnual = states.reduce((s, r) => s + r.detentionAnnual, 0);
  const totalKids = states.reduce((s, r) => s + r.avgKids, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <TerminalNav current="System Terminal" />

      {/* ═══ HEADER ═══ */}
      <header className="bg-[#0A0A0A] text-[#F5F0E8] px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-[#DC2626] tracking-[0.3em] uppercase mb-3">Multi-State Intelligence</p>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-[#F5F0E8]">SYSTEM TERMINAL</h1>
            </div>
            <div className="font-mono text-xs text-gray-600 text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                <span>LIVE</span>
              </div>
              <div suppressHydrationWarning>{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Headline stats */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 font-mono text-sm mb-8 border-b border-gray-800 pb-6">
            <div>
              <span className="text-[#DC2626] text-xl sm:text-2xl font-bold">{fmtCompact(totalValue)}</span>
              <span className="text-gray-500 ml-2 hidden sm:inline">in contracts</span>
              <div className="text-[10px] text-gray-700 mt-0.5">Config · {states.length} states</div>
            </div>
            <div>
              <span className="text-[#F5F0E8] text-xl sm:text-2xl font-bold">{fmtNum(live.totalFundingRecords)}</span>
              <span className="text-gray-500 ml-2 hidden sm:inline">funding records</span>
              <div className="text-[10px] text-gray-700 mt-0.5">Live DB · {fmtCompact(live.totalFunding)}</div>
            </div>
            <div>
              <span className="text-[#DC2626] text-xl sm:text-2xl font-bold">{fmtCompact(totalDetentionAnnual)}</span>
              <span className="text-gray-500 ml-2 hidden sm:inline">detention/yr</span>
              <div className="text-[10px] text-gray-700 mt-0.5">ROGS 2024-25</div>
            </div>
            <div>
              <span className="text-[#F5F0E8] text-xl sm:text-2xl font-bold">{fmtNum(live.totalInterventions)}</span>
              <span className="text-gray-500 ml-2 hidden sm:inline">interventions</span>
              <div className="text-[10px] text-gray-700 mt-0.5">ALMA verified</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[#F5F0E8] text-xl sm:text-2xl font-bold">{totalKids}</span>
              <span className="text-gray-500 ml-2">kids detained nightly</span>
              <div className="text-[10px] text-gray-700 mt-0.5">ROGS 2024-25</div>
            </div>
          </div>

          {/* State filter chips */}
          <div className="grid grid-cols-2 sm:flex gap-3">
            {states.map((s) => (
              <Link
                key={s.slug}
                href={`/system/${s.slug}`}
                className="group border border-gray-700 hover:border-[#DC2626] rounded-sm px-3 sm:px-4 py-3 transition-all hover:bg-gray-900/50 sm:min-w-[160px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : s.dataConfidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                  <span className="font-mono text-sm font-bold text-[#F5F0E8] group-hover:text-[#DC2626] transition-colors">{s.state}</span>
                  <ConfBadge level={s.dataConfidence === 'HIGH' ? 'verified' : 'estimate'} />
                </div>
                <div className="font-mono text-xs text-gray-500">
                  {fmtCompact(s.totalValue)} · {fmtNum(s.interventionCount)} pgms
                </div>
              </Link>
            ))}
            <div className="border border-dashed border-gray-800 rounded-sm px-3 sm:px-4 py-3 flex items-center justify-center">
              <span className="font-mono text-xs text-gray-700">WA · SA · TAS · ACT</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN GRID ═══ */}
      <main className="px-4 sm:px-6 pb-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COL 1-2: Tables ── */}
          <div className="lg:col-span-2 space-y-6">
            <StateComparisonTable states={states} />
            <OrgTicker orgs={orgs} live={live} />
            <MinisterLeaderboard live={live} />
            <LiveFeed live={live} />
          </div>

          {/* ── COL 3: Sidebar ── */}
          <div className="space-y-6">
            <VerificationScores states={states} />
            <DetentionCostIndex states={states} />
            <DataInventory states={states} live={live} />
            <TheEquation states={states} />
            <AlertsTicker live={live} />
            <SourceRegistry />
          </div>
        </div>
      </main>

      <TerminalFooter label="JusticeHub / System Terminal" />

      <InlineScript states={states} />
    </div>
  );
}
