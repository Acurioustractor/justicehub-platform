import Link from 'next/link';
import { fmt, fmtCompact, fmtNum } from '../types';
import { ConfBadge } from './conf-badge';
import type { StateRow } from '../data';
import { SOURCES } from '../data';

export function StateComparisonTable({ states }: { states: StateRow[] }) {
  const sorted = [...states].sort((a, b) => b.detentionCostPerDay - a.detentionCostPerDay);
  const nationalAvgDetention = Math.round(states.reduce((s, r) => s + r.detentionCostPerDay, 0) / states.length);
  const nationalAvgCommunity = Math.round(states.reduce((s, r) => s + r.communityCostPerDay, 0) / states.length);
  const totalDetentionAnnual = states.reduce((s, r) => s + r.detentionAnnual, 0);

  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">State Comparison</span>
        </div>
        <div className="flex items-center gap-3">
          <button id="compare-btn" className="font-mono text-[10px] text-gray-600 hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border border-gray-700 hover:border-[#DC2626] px-2 py-0.5 rounded-sm">COMPARE</button>
          <ConfBadge level="verified" />
          <span className="font-mono text-xs text-gray-600 hidden sm:inline">ROGS 2024-25</span>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_55px_55px_80px_55px_65px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>State</span>
        <span className="text-right">Det/day</span>
        <span className="text-right">Comm/day</span>
        <span className="text-right">Ratio</span>
        <span className="text-right">Kids</span>
        <span className="text-right">Annual</span>
        <span className="text-right">Intv</span>
        <span className="text-center">Verify</span>
      </div>

      {/* Mobile header */}
      <div className="grid md:hidden grid-cols-[1fr_80px_55px_65px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>State</span>
        <span className="text-right">Det/day</span>
        <span className="text-right">Ratio</span>
        <span className="text-center">Verify</span>
      </div>

      <div className="divide-y divide-gray-800" id="state-table">
        {sorted.map((s) => (
          <Link
            key={s.slug}
            href={`/system/${s.slug}`}
            className="block"
          >
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-[1fr_80px_80px_55px_55px_80px_55px_65px] gap-1 px-4 py-3 hover:bg-gray-900/50 transition-colors items-center">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : s.dataConfidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                <span className="font-mono text-sm font-bold text-[#F5F0E8]">{s.state}</span>
                <span className="text-xs text-gray-600 hidden lg:inline">{s.stateFull}</span>
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
            </div>

            {/* Mobile row */}
            <div className="grid md:hidden grid-cols-[1fr_80px_55px_65px] gap-1 px-4 py-3 hover:bg-gray-900/50 transition-colors items-center">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dataConfidence === 'HIGH' ? 'bg-[#059669]' : s.dataConfidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                <span className="font-mono text-sm font-bold text-[#F5F0E8]">{s.state}</span>
              </div>
              <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{fmt(s.detentionCostPerDay)}</span>
              <span className="font-mono text-sm text-[#DC2626] font-bold text-right">{s.ratio}x</span>
              <span className="text-center">
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                  s.verificationScore >= 80 ? 'bg-[#059669]/20 text-[#059669]' :
                  s.verificationScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {s.verificationScore}%
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400">NATIONAL</span>
          <div className="flex items-center gap-2 md:gap-4 font-mono text-sm">
            <span className="text-[#DC2626] font-bold">{fmt(nationalAvgDetention)}/day</span>
            <span className="text-gray-600 hidden sm:inline">vs</span>
            <span className="text-[#059669] font-bold hidden sm:inline">{fmt(nationalAvgCommunity)}/day</span>
            <span className="text-gray-600 hidden sm:inline">=</span>
            <span className="text-[#DC2626] font-bold">{fmtCompact(totalDetentionAnnual)}/yr</span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-gray-700 mt-1 hidden sm:block">
          Source: {SOURCES.rogs.name} · Detention costs verified against published tables
        </div>
      </div>
    </div>
  );
}
