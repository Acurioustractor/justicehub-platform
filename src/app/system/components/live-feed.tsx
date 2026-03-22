import { fmtDate, fmtNum, truncate } from '../types';
import { ConfBadge } from './conf-badge';
import type { LiveCounts } from '../data';
import { SOURCES } from '../data';

export function LiveFeed({ live }: { live: LiveCounts }) {
  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Live Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <ConfBadge level="cross-referenced" />
          <span className="font-mono text-xs text-gray-600">{fmtNum(live.statementsCount)} total</span>
        </div>
      </div>
      <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
        {live.statements.map((s) => (
          <div key={s.id} className="px-4 py-3 hover:bg-gray-900/50 transition-colors">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
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
              <div className="flex gap-2 mt-1 flex-wrap">
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
          Source: {SOURCES.civic.name} · Auto-scraped from QLD ministerial websites
        </span>
      </div>
    </div>
  );
}
