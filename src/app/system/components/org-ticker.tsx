import Link from 'next/link';
import { fmtCompact, fmtNum } from '../types';
import { Sparkline } from './sparkline';
import type { OrgRow, LiveCounts } from '../data';
import { SOURCES } from '../data';

export function OrgTicker({ orgs, live }: { orgs: OrgRow[]; live: LiveCounts }) {
  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Top Organisations</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-600">{orgs.length} suppliers</span>
          <span className="font-mono text-xs text-gray-700 hidden sm:inline">|</span>
          <button id="sort-value" className="font-mono text-[10px] text-[#DC2626] hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none hidden sm:inline">SORT: VALUE</button>
          <button id="sort-contracts" className="font-mono text-[10px] text-gray-600 hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none hidden sm:inline">CONTRACTS</button>
          <button id="sort-name" className="font-mono text-[10px] text-gray-600 hover:text-[#F5F0E8] transition-colors cursor-pointer bg-transparent border-none hidden sm:inline">A-Z</button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[32px_1fr_60px_100px_100px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>#</span>
        <span>Organisation</span>
        <span>State</span>
        <span className="text-right">Value</span>
        <span className="text-center">Trend</span>
        <span className="text-right">Contracts</span>
      </div>

      {/* Mobile header */}
      <div className="grid md:hidden grid-cols-[24px_1fr_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>#</span>
        <span>Organisation</span>
        <span className="text-right">Value</span>
      </div>

      <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto" id="org-table">
        {orgs.map((o, i) => {
          const spark = live.orgSparklines[o.name];
          return (
            <div key={`${o.name}-${o.state}`}>
              {/* Desktop row */}
              <div
                className="hidden md:grid grid-cols-[32px_1fr_60px_100px_100px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center"
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
                    <span className="font-mono text-[10px] text-gray-700">&mdash;</span>
                  )}
                </span>
                <span className="font-mono text-xs text-gray-500 text-right">{fmtNum(o.contracts)}</span>
              </div>

              {/* Mobile row */}
              <div
                className="grid md:hidden grid-cols-[24px_1fr_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center"
                data-org-row
                data-value={o.totalValue}
                data-contracts={o.contracts}
                data-name={o.name}
              >
                <span className="font-mono text-xs text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <span className="text-sm text-[#F5F0E8] block truncate">{o.name}</span>
                  <span className="font-mono text-[10px] text-gray-600">{o.state}</span>
                </div>
                <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmtCompact(o.totalValue)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400">TOTAL</span>
          <div className="flex items-center gap-6 font-mono text-sm">
            <span className="text-[#DC2626] font-bold">{fmtCompact(orgs.reduce((s, o) => s + o.totalValue, 0))}</span>
            <span className="text-gray-500 hidden sm:inline">{fmtNum(orgs.reduce((s, o) => s + o.contracts, 0))} contracts</span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-gray-700 mt-1 hidden sm:block">
          QLD: {SOURCES.qgip.name} (verified) · NSW/VIC/NT: {SOURCES.austender.name} (estimates)
        </div>
      </div>
    </div>
  );
}
