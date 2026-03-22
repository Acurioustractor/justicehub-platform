import { fmtNum } from '../types';
import { ConfBadge } from './conf-badge';
import type { LiveCounts } from '../data';

export function MinisterLeaderboard({ live }: { live: LiveCounts }) {
  if (live.ministers.length === 0) return null;

  const totalCommitments = live.commitments.length;
  const deliveredCount = live.commitments.filter(c => c.status === 'delivered').length;
  const rate = totalCommitments > 0 ? Math.round((deliveredCount / totalCommitments) * 100) : 0;

  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Minister Leaderboard</span>
        </div>
        <div className="flex items-center gap-3">
          <ConfBadge level="cross-referenced" />
          <span className="font-mono text-xs text-gray-600 hidden sm:inline">{live.ministers.reduce((s, m) => s + m.totalMeetings, 0)} meetings</span>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[1fr_65px_65px_55px_55px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>Minister</span>
        <span className="text-right">Meetings</span>
        <span className="text-right">External</span>
        <span className="text-right">Orgs</span>
        <span className="text-right">Stmts</span>
        <span className="text-center">Delivery</span>
      </div>

      {/* Mobile header */}
      <div className="grid md:hidden grid-cols-[1fr_65px_80px] gap-1 px-4 py-2 border-b border-gray-800 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
        <span>Minister</span>
        <span className="text-right">Meetings</span>
        <span className="text-center">Delivery</span>
      </div>

      <div className="divide-y divide-gray-800">
        {live.ministers.slice(0, 10).map((m) => {
          const deliveryRate = m.commitments > 0 ? Math.round((m.delivered / m.commitments) * 100) : null;
          return (
            <div key={m.name}>
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[1fr_65px_65px_55px_55px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center">
                <div className="min-w-0">
                  <span className="text-sm text-[#F5F0E8] block truncate">{m.name}</span>
                  {m.topOrgs.length > 0 && (
                    <span className="font-mono text-[10px] text-gray-600 block truncate">
                      Top: {m.topOrgs.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm text-[#F5F0E8] font-bold text-right">{fmtNum(m.totalMeetings)}</span>
                <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.externalMeetings)}</span>
                <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.uniqueOrgs)}</span>
                <span className="font-mono text-xs text-gray-400 text-right">{fmtNum(m.statements)}</span>
                <span className="text-center">
                  {deliveryRate !== null ? (
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                      deliveryRate >= 50 ? 'bg-[#059669]/20 text-[#059669]' :
                      deliveryRate >= 25 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-[#DC2626]/20 text-[#DC2626]'
                    }`}>
                      {m.delivered}/{m.commitments} ({deliveryRate}%)
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-gray-700">&mdash;</span>
                  )}
                </span>
              </div>

              {/* Mobile row */}
              <div className="grid md:hidden grid-cols-[1fr_65px_80px] gap-1 px-4 py-2.5 hover:bg-gray-900/50 transition-colors items-center">
                <div className="min-w-0">
                  <span className="text-sm text-[#F5F0E8] block truncate">{m.name}</span>
                </div>
                <span className="font-mono text-sm text-[#F5F0E8] font-bold text-right">{fmtNum(m.totalMeetings)}</span>
                <span className="text-center">
                  {deliveryRate !== null ? (
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                      deliveryRate >= 50 ? 'bg-[#059669]/20 text-[#059669]' :
                      deliveryRate >= 25 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-[#DC2626]/20 text-[#DC2626]'
                    }`}>
                      {m.delivered}/{m.commitments}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-gray-700">&mdash;</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-600 px-4 py-3 bg-gray-900/30">
        <div className="font-mono text-[10px] text-gray-700">
          Source: QLD Ministerial Diaries + Charter Letter Commitments
        </div>
        {totalCommitments > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm ${rate >= 50 ? 'bg-[#059669]' : rate >= 25 ? 'bg-amber-500' : 'bg-[#DC2626]'}`} style={{ width: `${rate}%` }} />
            </div>
            <span className="font-mono text-[10px] text-gray-500">
              {deliveredCount}/{totalCommitments} YJ commitments delivered ({rate}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
