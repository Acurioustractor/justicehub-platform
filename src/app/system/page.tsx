import Link from 'next/link';
import type { Metadata } from 'next';
import { STATE_CONFIGS, getAllStateSlugs } from './configs';
import { fmt, fmtCompact, fmtNum } from './types';
import type { SystemConfig } from './types';

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

// ── Aggregate data across all states ──

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
  suppliers: number;
  interventionCount: number;
  fundingSources: number;
  totalFundingRecords: number;
  dataConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  procurementSource: string;
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

function buildStateRows(): StateRow[] {
  return getAllStateSlugs().map((slug) => {
    const c = STATE_CONFIGS[slug]!;
    const totalContracts = c.departments.reduce((s, d) => s + d.contracts, 0);
    const totalValue = c.departments.reduce((s, d) => s + d.totalValue, 0);
    const ratio = Math.round(c.costComparison.detentionCostPerDay / c.costComparison.communityCostPerDay * 10) / 10;
    const detentionAnnual = c.costComparison.avgKidsInDetention * c.costComparison.detentionCostPerDay * 365;

    // Data confidence based on procurement source
    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      slug === 'qld' ? 'HIGH' : 'LOW';
    const procSource =
      slug === 'qld' ? 'QGIP + Historical + DYJVS' :
      'AusTender only';

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
      suppliers: c.topSuppliers.length,
      interventionCount: 0, // filled from config if available
      fundingSources: c.fundingBySource.length,
      totalFundingRecords: c.fundingBySource.reduce((s, f) => s + f.count, 0),
      dataConfidence: confidence,
      procurementSource: procSource,
    };
  });
}

function buildOrgRows(): OrgRow[] {
  const rows: OrgRow[] = [];
  getAllStateSlugs().forEach((slug) => {
    const c = STATE_CONFIGS[slug]!;
    c.topSuppliers.forEach((s) => {
      rows.push({
        name: s.name,
        state: c.state,
        slug,
        totalValue: s.totalValue,
        contracts: s.contracts,
        note: s.note,
        departments: s.departments,
      });
    });
  });
  return rows.sort((a, b) => b.totalValue - a.totalValue);
}

// ── Page ──

export default function SystemTerminalDashboard() {
  const states = buildStateRows();
  const orgs = buildOrgRows();

  const totalContracts = states.reduce((s, r) => s + r.totalContracts, 0);
  const totalValue = states.reduce((s, r) => s + r.totalValue, 0);
  const totalDetentionAnnual = states.reduce((s, r) => s + r.detentionAnnual, 0);
  const totalKids = states.reduce((s, r) => s + r.avgKids, 0);

  // ROGS cost comparison data for national view
  const nationalAvgDetention = Math.round(states.reduce((s, r) => s + r.detentionCostPerDay, 0) / states.length);
  const nationalAvgCommunity = Math.round(states.reduce((s, r) => s + r.communityCostPerDay, 0) / states.length);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ═══ TOP BAR ═══ */}
      <nav className="bg-[#0A0A0A] border-b border-gray-800 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-6 text-sm font-mono">
          <Link href="/" className="text-[#F5F0E8] hover:text-[#DC2626] transition-colors">
            JusticeHub
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#DC2626]">System Terminal</span>
          <div className="ml-auto flex gap-4">
            <Link href="/journey-map" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">Journey Map</Link>
            <Link href="/spending" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">National Spending</Link>
            <Link href="/justice-funding" className="text-gray-400 hover:text-[#F5F0E8] transition-colors">Funding</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HEADER + STATE CHIPS ═══ */}
      <header className="bg-[#0A0A0A] text-[#F5F0E8] px-6 pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-[#DC2626] tracking-[0.3em] uppercase mb-3">
                Multi-State Intelligence
              </p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#F5F0E8]">
                SYSTEM TERMINAL
              </h1>
            </div>
            <div className="font-mono text-xs text-gray-600 text-right">
              <div>LIVE</div>
              <div suppressHydrationWarning>{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Headline stats ticker */}
          <div className="flex flex-wrap gap-8 font-mono text-sm mb-8 border-b border-gray-800 pb-6">
            <span>
              <span className="text-[#DC2626] text-2xl font-bold">{fmtCompact(totalValue)}</span>
              <span className="text-gray-500 ml-2">total contracts</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>
              <span className="text-[#F5F0E8] text-2xl font-bold">{fmtNum(totalContracts)}</span>
              <span className="text-gray-500 ml-2">records</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>
              <span className="text-[#DC2626] text-2xl font-bold">{fmtCompact(totalDetentionAnnual)}</span>
              <span className="text-gray-500 ml-2">detention spend/yr</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>
              <span className="text-[#F5F0E8] text-2xl font-bold">{totalKids}</span>
              <span className="text-gray-500 ml-2">avg kids detained nightly</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>
              <span className="text-[#F5F0E8] text-2xl font-bold">{states.length}</span>
              <span className="text-gray-500 ml-2">states tracked</span>
            </span>
          </div>

          {/* State filter chips */}
          <div className="flex gap-3 flex-wrap">
            {states.map((s) => (
              <Link
                key={s.slug}
                href={`/system/${s.slug}`}
                className="group border border-gray-700 hover:border-[#DC2626] rounded-sm px-4 py-3 transition-all hover:bg-gray-900/50 min-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : s.dataConfidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                  <span className="font-mono text-sm font-bold text-[#F5F0E8] group-hover:text-[#DC2626] transition-colors">{s.state}</span>
                </div>
                <div className="font-mono text-xs text-gray-500">
                  {fmtCompact(s.totalValue)} · {fmtNum(s.totalContracts)} rec
                </div>
              </Link>
            ))}
            <div className="border border-dashed border-gray-800 rounded-sm px-4 py-3 min-w-[140px] flex items-center justify-center">
              <span className="font-mono text-xs text-gray-700">WA · SA · TAS · ACT</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN GRID: 3 columns ═══ */}
      <main className="px-6 pb-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COL 1: State Comparison + Cost Gauge ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* State Comparison Table */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">State Comparison</span>
                </div>
                <span className="font-mono text-xs text-gray-600">ROGS 2024-25</span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_90px_90px_70px_70px_90px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>State</span>
                <span className="text-right">Detention/day</span>
                <span className="text-right">Community/day</span>
                <span className="text-right">Ratio</span>
                <span className="text-right">Avg Kids</span>
                <span className="text-right">Annual Cost</span>
                <span className="text-center">Data</span>
              </div>

              <div className="divide-y divide-gray-800" id="state-table">
                {states
                  .sort((a, b) => b.detentionCostPerDay - a.detentionCostPerDay)
                  .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/system/${s.slug}`}
                    className="grid grid-cols-[1fr_90px_90px_70px_70px_90px_80px] gap-1 px-4 py-3 hover:bg-gray-900/50 transition-colors items-center"
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
                    <span className="text-center">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                        s.dataConfidence === 'HIGH'
                          ? 'bg-[#059669]/20 text-[#059669]'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {s.dataConfidence}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 flex items-center justify-between bg-gray-900/30">
                <span className="font-mono text-xs text-gray-400">NATIONAL AVERAGE</span>
                <div className="flex items-center gap-6 font-mono text-sm">
                  <span className="text-[#DC2626] font-bold">{fmt(nationalAvgDetention)}/day</span>
                  <span className="text-gray-400">vs</span>
                  <span className="text-[#059669] font-bold">{fmt(nationalAvgCommunity)}/day</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-[#DC2626] font-bold">{fmtCompact(totalDetentionAnnual)}/yr</span>
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

              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_60px_100px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <span>#</span>
                <span>Organisation</span>
                <span>State</span>
                <span className="text-right">Value</span>
                <span className="text-right">Contracts</span>
              </div>

              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto" id="org-table">
                {orgs.map((o, i) => (
                  <div
                    key={`${o.name}-${o.state}`}
                    className="grid grid-cols-[32px_1fr_60px_100px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center"
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
                    <Link href={`/system/${o.slug}`} className="font-mono text-xs text-gray-400 hover:text-[#DC2626] transition-colors">
                      {o.state}
                    </Link>
                    <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmtCompact(o.totalValue)}</span>
                    <span className="font-mono text-xs text-gray-500 text-right">{fmtNum(o.contracts)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30 flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">TOTAL</span>
                <div className="flex items-center gap-6 font-mono text-sm">
                  <span className="text-[#DC2626] font-bold">{fmtCompact(orgs.reduce((s, o) => s + o.totalValue, 0))}</span>
                  <span className="text-gray-500">{fmtNum(orgs.reduce((s, o) => s + o.contracts, 0))} contracts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── COL 3: System Health + Quick Stats ── */}
          <div className="space-y-6">

            {/* System Health Gauge */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">System Health</span>
              </div>
              <div className="p-4 space-y-4">
                {states.map((s) => {
                  // Health score: based on data confidence, funding sources, supplier count
                  const score =
                    s.dataConfidence === 'HIGH' ? 92 :
                    s.dataConfidence === 'MEDIUM' ? 55 :
                    Math.min(40, Math.round((s.totalFundingRecords / 1000) * 10 + s.suppliers * 2));
                  const barColor = score >= 70 ? 'bg-[#059669]' : score >= 40 ? 'bg-amber-500' : 'bg-gray-600';

                  return (
                    <div key={s.slug}>
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/system/${s.slug}`} className="font-mono text-sm text-[#F5F0E8] font-bold hover:text-[#DC2626] transition-colors">
                          {s.state}
                        </Link>
                        <span className="font-mono text-xs text-gray-400">{score}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-sm transition-all`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-[10px] text-gray-600">{s.procurementSource}</span>
                        <span className="font-mono text-[10px] text-gray-600">{fmtNum(s.totalFundingRecords)} rec</span>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-center gap-3 flex-wrap font-mono text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />HIGH — state procurement data</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />MEDIUM — partial state data</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-600" />LOW — federal only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detention Cost Gauge */}
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
                            <div
                              className="h-full bg-[#DC2626] rounded-sm"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="font-mono text-[10px] text-gray-600 mt-3">
                  VIC highest at $7,304/day. National avg: {fmt(nationalAvgDetention)}/day.
                  Source: Productivity Commission ROGS 2024-25.
                </p>
              </div>
            </div>

            {/* Data Inventory */}
            <div className="border border-gray-700 rounded-sm">
              <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5F0E8]" />
                <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Data Inventory</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Total contracts', value: fmtNum(totalContracts), color: 'text-[#F5F0E8]' },
                  { label: 'Funding records', value: fmtNum(states.reduce((s, r) => s + r.totalFundingRecords, 0)), color: 'text-[#F5F0E8]' },
                  { label: 'Verified interventions', value: '1,034', color: 'text-[#059669]' },
                  { label: 'Ministerial statements', value: '598', color: 'text-[#F5F0E8]' },
                  { label: 'Hansard speeches', value: '135', color: 'text-[#F5F0E8]' },
                  { label: 'Charter commitments', value: '66', color: 'text-[#F5F0E8]' },
                  { label: 'Organisations tracked', value: '18,304', color: 'text-[#F5F0E8]' },
                  { label: 'EL storytellers', value: '55', color: 'text-[#059669]' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500">{item.label}</span>
                    <span className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* The Equation */}
            <div className="border border-[#DC2626]/30 rounded-sm bg-[#DC2626]/5">
              <div className="p-4">
                <p className="font-mono text-xs text-[#DC2626] uppercase tracking-wide mb-3">The Equation</p>
                <div className="font-mono text-sm text-[#F5F0E8] space-y-2">
                  <p>
                    <span className="text-[#DC2626] font-bold">{totalKids}</span> kids in detention nightly
                  </p>
                  <p>
                    &times; avg <span className="text-[#DC2626] font-bold">{fmtCompact(nationalAvgDetention * 365)}</span>/yr each
                  </p>
                  <p className="border-t border-[#DC2626]/20 pt-2">
                    = <span className="text-[#DC2626] font-bold text-lg">{fmtCompact(totalDetentionAnnual)}</span>/year
                  </p>
                </div>
                <p className="font-mono text-[10px] text-gray-600 mt-3">
                  Across {states.length} states. For {totalKids} children. Every year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-gray-800 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between font-mono text-xs text-gray-600">
          <span>JusticeHub / System Terminal</span>
          <span suppressHydrationWarning>Last updated: {new Date().toISOString().split('T')[0]}</span>
        </div>
      </footer>

      {/* Inline sort script — avoids Next.js 14 HMR crash with client components */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var sortBtns = { value: document.getElementById('sort-value'), contracts: document.getElementById('sort-contracts'), name: document.getElementById('sort-name') };
          var container = document.getElementById('org-table');
          if (!container) return;

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
            // Update active button styling
            Object.entries(sortBtns).forEach(function(entry) {
              if (entry[1]) entry[1].style.color = entry[0] === key ? '#DC2626' : '#555';
            });
          }

          Object.entries(sortBtns).forEach(function(entry) {
            if (entry[1]) entry[1].addEventListener('click', function() { sortTable(entry[0]); });
          });
        })();
      `}} />
    </div>
  );
}
