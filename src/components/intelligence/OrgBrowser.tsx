'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Award, Building2, Users, MapPin, ExternalLink, ChevronDown } from 'lucide-react';
import { OrgDetailPanel } from './OrgDetailPanel';

interface OrgRow {
  org_id: string;
  name: string;
  abn: string | null;
  state: string | null;
  postcode: string | null;
  locality: string | null;
  lga_name: string | null;
  remoteness: string | null;
  sector: string | null;
  community_controlled: boolean;
  cc_tier: string | null;
  supply_nation_certified: boolean;
  charity_size: string | null;
  acnc_registered: boolean;
  ben_aboriginal_tsi: boolean;
  ben_youth: boolean;
  is_oric_corporation: boolean;
  program_count: number;
  strong_evidence_count: number;
  funding_total: number;
  funding_records: number;
  tier: 'heavy_lifter' | 'established' | 'verified' | 'emerging';
}

const TIER_META: Record<OrgRow['tier'], { label: string; sub: string; color: string }> = {
  heavy_lifter: {
    label: 'Heavy lifters',
    sub: '5+ programs and $1M+ funding tracked',
    color: '#dc2626',
  },
  established: {
    label: 'Established',
    sub: '3+ programs OR $500K+ funding OR community-controlled with ACNC',
    color: '#f59e0b',
  },
  verified: {
    label: 'Verified delivery',
    sub: 'At least one program, ACNC-registered or community-controlled',
    color: '#10b981',
  },
  emerging: {
    label: 'Emerging / small',
    sub: 'Indexed via the Living Map, limited public data so far',
    color: '#6b7280',
  },
};

const TIER_ORDER: OrgRow['tier'][] = ['heavy_lifter', 'established', 'verified', 'emerging'];

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return '—';
}

export function OrgBrowser() {
  const [data, setData] = useState<{ tiers: Record<string, OrgRow[]>; summary: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [ccOnly, setCcOnly] = useState(false);
  const [acncOnly, setAcncOnly] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/orgs/browser', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTiers = useMemo(() => {
    if (!data) return null;
    const out: Record<string, OrgRow[]> = {};
    for (const tier of TIER_ORDER) {
      let rows = (data.tiers[tier] ?? []) as OrgRow[];
      if (search) {
        const s = search.toLowerCase();
        rows = rows.filter((r) => (r.name || '').toLowerCase().includes(s) || (r.lga_name || '').toLowerCase().includes(s) || (r.locality || '').toLowerCase().includes(s));
      }
      if (stateFilter) rows = rows.filter((r) => r.state === stateFilter);
      if (ccOnly) rows = rows.filter((r) => r.community_controlled);
      if (acncOnly) rows = rows.filter((r) => r.acnc_registered);
      out[tier] = rows;
    }
    return out;
  }, [data, search, stateFilter, ccOnly, acncOnly]);

  const totalShown = filteredTiers
    ? TIER_ORDER.reduce((a, t) => a + filteredTiers[t].length, 0)
    : 0;

  if (loading) {
    return (
      <section className="container-justice py-12 text-sm text-gray-500 font-mono">
        Loading organisations…
      </section>
    );
  }
  if (!data || !filteredTiers) return null;

  return (
    <>
      <section className="container-justice py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-1">
              Organisation browser
            </p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {totalShown.toLocaleString()} youth-justice organisations
            </h2>
            <p className="text-sm text-gray-700 mt-1 font-mono">
              Tiered by program count + funding tracked + ACNC + community-controlled signal. Click any row for full ACNC + ABN detail.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by org, locality or LGA…"
              className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="border-2 border-black px-3 py-2 font-mono text-sm">
            <option value="">All states</option>
            {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => setCcOnly((c) => !c)}
            className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-widest font-mono transition-colors ${
              ccOnly ? 'border-red-500 bg-red-500 text-white' : 'border-black text-black hover:bg-gray-100'
            }`}
          >
            Community-controlled
          </button>
          <button
            onClick={() => setAcncOnly((c) => !c)}
            className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-widest font-mono transition-colors ${
              acncOnly ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-black text-black hover:bg-gray-100'
            }`}
          >
            ACNC-registered
          </button>
        </div>

        {/* Tier sections */}
        <div className="space-y-8">
          {TIER_ORDER.map((tier) => {
            const meta = TIER_META[tier];
            const rows = filteredTiers[tier];
            if (rows.length === 0) return null;
            const expanded = expandedTier === tier || rows.length <= 12;
            const visible = expanded ? rows : rows.slice(0, 12);

            return (
              <div key={tier} className="border-2 border-black">
                <div
                  className="flex items-center justify-between gap-4 px-4 py-3 border-b-2 border-black"
                  style={{ backgroundColor: meta.color, color: 'white' }}
                >
                  <div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
                      {meta.label} · {rows.length}
                    </h3>
                    <p className="text-[11px] font-mono opacity-90 mt-0.5">{meta.sub}</p>
                  </div>
                  {!expanded && (
                    <button
                      onClick={() => setExpandedTier(tier)}
                      className="px-3 py-1.5 border-2 border-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center gap-1"
                    >
                      Show all {rows.length} <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <ul>
                  {visible.map((r, i) => (
                    <li key={r.org_id}>
                      <button
                        onClick={() => setActiveOrgId(r.org_id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{(i + 1).toString().padStart(3, '0')}</span>
                            <span className="font-bold text-sm md:text-base">{r.name}</span>
                            {r.community_controlled && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-red-600 text-white font-bold">CC</span>
                            )}
                            {r.is_oric_corporation && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-600 text-white font-bold">ORIC</span>
                            )}
                            {r.supply_nation_certified && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-600 text-white font-bold">SUPPLY NATION</span>
                            )}
                            {r.ben_aboriginal_tsi && !r.community_controlled && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-400 text-gray-700 font-bold">FIRST NATIONS BENEFICIARIES</span>
                            )}
                            {r.ben_youth && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-400 text-gray-700 font-bold">YOUTH</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-600 font-mono">
                            {r.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {r.locality ? `${r.locality}, ` : ''}{r.state} {r.postcode ?? ''}
                              </span>
                            )}
                            {r.lga_name && <span>LGA · {r.lga_name}</span>}
                            {r.remoteness && <span className="text-gray-500">{r.remoteness.replace(' Australia', '')}</span>}
                            {r.charity_size && (
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" /> {r.charity_size}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 md:gap-8 text-right flex-shrink-0">
                          <Stat label="Programs" value={r.program_count.toString()} sub={r.strong_evidence_count > 0 ? `${r.strong_evidence_count} ★` : undefined} />
                          <Stat label="Funding" value={fmtMoney(Number(r.funding_total))} sub={r.funding_records > 0 ? `${r.funding_records} grants` : undefined} />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {expanded && rows.length > 12 && (
                  <div className="px-4 py-2 border-t border-gray-200 text-right">
                    <button
                      onClick={() => setExpandedTier(null)}
                      className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"
                    >
                      Collapse
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <OrgDetailPanel orgId={activeOrgId} onClose={() => setActiveOrgId(null)} />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{label}</div>
      <div className="text-base font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 font-mono">{sub}</div>}
    </div>
  );
}
