import Link from 'next/link';
import { fmt, fmtCompact, fmtNum, fmtDate } from '../types';
import { ConfBadge } from './conf-badge';
import type { StateRow, LiveCounts } from '../data';
import { SOURCES } from '../data';

export function VerificationScores({ states }: { states: StateRow[] }) {
  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#059669]" />
        <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Verification Score</span>
      </div>
      <div className="p-4 space-y-4">
        {states.map((s) => {
          const score = s.verificationScore;
          const barColor = score >= 80 ? 'bg-[#059669]' : score >= 40 ? 'bg-amber-500' : 'bg-gray-600';
          return (
            <div key={s.slug}>
              <div className="flex items-center justify-between mb-1">
                <Link href={`/system/${s.slug}`} className="font-mono text-sm text-[#F5F0E8] font-bold hover:text-[#DC2626] transition-colors">{s.state}</Link>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{score}%</span>
                  <ConfBadge level={score >= 80 ? 'verified' : score >= 40 ? 'cross-referenced' : 'estimate'} />
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                <div className={`h-full ${barColor} rounded-sm transition-all`} style={{ width: `${score}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 font-mono text-[10px] text-gray-600">
                <span>{s.procurementSource}</span>
                <span>{fmtNum(s.liveFundingRecords)} DB records</span>
              </div>
            </div>
          );
        })}
        <div className="border-t border-gray-700 pt-3 space-y-1.5">
          <p className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verification Criteria</p>
          <div className="font-mono text-[10px] text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> State procurement data</div>
            <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 100+ funding records</div>
            <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 10+ verified interventions</div>
            <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> 50+ tracked organisations</div>
            <div className="flex items-center gap-1.5"><span className="text-[#059669]">&#10003;</span> Civic intelligence active</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetentionCostIndex({ states }: { states: StateRow[] }) {
  const sorted = [...states].sort((a, b) => b.detentionCostPerDay - a.detentionCostPerDay);
  const maxCost = Math.max(...states.map(st => st.detentionCostPerDay));

  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
        <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Detention Cost Index</span>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {sorted.map((s) => {
            const pct = Math.round((s.detentionCostPerDay / maxCost) * 100);
            return (
              <div key={s.slug}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-[#F5F0E8] font-bold">{s.state}</span>
                  <span className="font-mono text-xs text-[#DC2626] font-bold">{fmt(s.detentionCostPerDay)}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-sm overflow-hidden">
                  <div className="h-full bg-[#DC2626] rounded-sm" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[10px] text-gray-600 mt-3">
          Source: {SOURCES.rogs.name}
        </p>
      </div>
    </div>
  );
}

export function DataInventory({ states, live }: { states: StateRow[]; live: LiveCounts }) {
  const totalContracts = states.reduce((s, r) => s + r.totalContracts, 0);

  const items = [
    { label: 'Contracts (config)', value: fmtNum(totalContracts), color: 'text-[#F5F0E8]', conf: 'estimate' as const },
    { label: 'Funding records', value: fmtNum(live.totalFundingRecords), color: 'text-[#F5F0E8]', conf: 'verified' as const },
    { label: 'Funding total', value: fmtCompact(live.totalFunding), color: 'text-[#DC2626]', conf: 'verified' as const },
    { label: 'Interventions', value: fmtNum(live.totalInterventions), color: 'text-[#059669]', conf: 'cross-referenced' as const },
    { label: 'Organisations', value: fmtNum(live.totalOrgs), color: 'text-[#F5F0E8]', conf: 'verified' as const },
    { label: 'Statements', value: fmtNum(live.statementsCount), color: 'text-[#F5F0E8]', conf: 'cross-referenced' as const },
    { label: 'Hansard', value: fmtNum(live.hansardCount), color: 'text-[#F5F0E8]', conf: 'cross-referenced' as const },
    { label: 'Commitments', value: fmtNum(live.commitmentsCount), color: 'text-[#F5F0E8]', conf: 'cross-referenced' as const },
    { label: 'Stories', value: fmtNum(live.storytellerCount), color: 'text-[#059669]', conf: 'verified' as const },
  ];

  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#F5F0E8]" />
        <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Data Inventory</span>
      </div>
      <div className="p-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-500">{item.label}</span>
              <span className={`w-1 h-1 rounded-full ${item.conf === 'verified' ? 'bg-[#059669]' : item.conf === 'cross-referenced' ? 'bg-amber-500' : 'bg-gray-600'}`} />
            </div>
            <span className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 pt-2 font-mono text-[10px] text-gray-600 space-y-0.5">
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#059669]" /> Verified — directly from authoritative source</div>
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500" /> Cross-referenced — matched across datasets</div>
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-600" /> Estimate — manual entry, needs verification</div>
        </div>
      </div>
    </div>
  );
}

export function TheEquation({ states }: { states: StateRow[] }) {
  const totalKids = states.reduce((s, r) => s + r.avgKids, 0);
  const nationalAvgDetention = Math.round(states.reduce((s, r) => s + r.detentionCostPerDay, 0) / states.length);
  const totalDetentionAnnual = states.reduce((s, r) => s + r.detentionAnnual, 0);

  return (
    <div className="border border-[#DC2626]/30 rounded-sm bg-[#DC2626]/5">
      <div className="p-4">
        <p className="font-mono text-xs text-[#DC2626] uppercase tracking-wide mb-3">The Equation</p>
        <div className="font-mono text-sm text-[#F5F0E8] space-y-2">
          <p><span className="text-[#DC2626] font-bold">{totalKids}</span> kids in detention nightly</p>
          <p>&times; avg <span className="text-[#DC2626] font-bold">{fmtCompact(nationalAvgDetention * 365)}</span>/yr each</p>
          <p className="border-t border-[#DC2626]/20 pt-2">= <span className="text-[#DC2626] font-bold text-lg">{fmtCompact(totalDetentionAnnual)}</span>/year</p>
        </div>
        <p className="font-mono text-[10px] text-gray-600 mt-3">
          {SOURCES.rogs.name} · {states.length} states · Verified
        </p>
      </div>
    </div>
  );
}

export function AlertsTicker({ live }: { live: LiveCounts }) {
  if (live.alerts.length === 0) return null;

  return (
    <div className="border border-amber-500/30 rounded-sm">
      <div className="border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-mono text-xs text-amber-400 tracking-widest uppercase">Alerts</span>
        </div>
        <span className="font-mono text-xs text-gray-600">{fmtNum(live.alertsCount)} total</span>
      </div>
      <div className="divide-y divide-gray-800/50 max-h-[300px] overflow-y-auto">
        {live.alerts.map((a) => (
          <div key={a.id} className="px-4 py-2.5 hover:bg-gray-900/30 transition-colors">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`font-mono text-[10px] px-1 py-0.5 rounded-sm ${
                a.severity === 'high' ? 'bg-[#DC2626]/20 text-[#DC2626]' :
                a.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-gray-800 text-gray-500'
              }`}>{a.severity}</span>
              <span className="font-mono text-[10px] text-gray-600">{fmtDate(a.created_at)}</span>
              {a.jurisdiction && <span className="font-mono text-[10px] text-gray-700">{a.jurisdiction}</span>}
            </div>
            <p className="text-xs text-[#F5F0E8] leading-snug">
              {a.source_url ? (
                <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                  {a.title}
                </a>
              ) : a.title}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-amber-500/20 px-4 py-3 bg-gray-900/30">
        <div className="flex items-center gap-2">
          <input
            id="alert-email"
            type="email"
            placeholder="your@email.com"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-sm px-3 py-1.5 font-mono text-xs text-[#F5F0E8] placeholder-gray-600 focus:border-amber-500 focus:outline-none"
          />
          <button
            id="alert-subscribe"
            className="bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs px-3 py-1.5 rounded-sm hover:bg-amber-500/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>
        <p className="font-mono text-[10px] text-gray-700 mt-1.5">
          Get notified when new youth justice alerts are detected
        </p>
      </div>
    </div>
  );
}

export function SourceRegistry() {
  return (
    <div className="border border-gray-700 rounded-sm">
      <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Source Registry</span>
      </div>
      <div className="p-4 space-y-2">
        {Object.entries(SOURCES).map(([key, src]) => (
          <div key={key} className="flex items-start gap-2">
            <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${src.confidence === 'verified' ? 'bg-[#059669]' : src.confidence === 'cross-referenced' ? 'bg-amber-500' : 'bg-gray-600'}`} />
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-[#F5F0E8] block">{src.name}</span>
              {src.url && (
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-gray-600 hover:text-gray-400 truncate block">
                  {src.url.replace('https://', '')}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
