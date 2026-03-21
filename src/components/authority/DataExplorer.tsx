'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  state: string;
  is_indigenous_org: boolean;
  total_funding: number;
  grant_count: number;
  website: string | null;
  intervention_count: number;
  proven_count: number;
  effective_count: number;
  promising_count: number;
  indigenous_led_count: number;
  untested_count: number;
  abn?: string;
  seifa_decile?: number;
}

type SortField = 'total_funding' | 'intervention_count' | 'name';
type SortDir = 'asc' | 'desc';

const STATES = ['All', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'NT', 'TAS', 'ACT'];
const EVIDENCE_LEVELS = ['All', 'Proven/Effective', 'Promising', 'Indigenous-led', 'Any programs', 'No programs'];

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getEvidenceLabel(org: OrgData): string {
  if (org.proven_count > 0) return 'Proven';
  if (org.effective_count > 0) return 'Effective';
  if (org.indigenous_led_count > 0) return 'Indigenous-led';
  if (org.promising_count > 0) return 'Promising';
  if (org.intervention_count > 0) return 'Untested';
  return 'None';
}

function getEvidenceColor(label: string): string {
  switch (label) {
    case 'Proven': case 'Effective': return 'text-emerald-400 bg-emerald-900/40 border-emerald-800';
    case 'Promising': return 'text-amber-400 bg-amber-900/40 border-amber-800';
    case 'Indigenous-led': return 'text-purple-400 bg-purple-900/40 border-purple-800';
    case 'Untested': return 'text-gray-400 bg-gray-800/40 border-gray-700';
    default: return 'text-gray-500 bg-gray-900/40 border-gray-800';
  }
}

export default function DataExplorer() {
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('total_funding');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showCount, setShowCount] = useState(20);

  useEffect(() => {
    fetch('/api/authority/org-map?seifa=true')
      .then(r => r.json())
      .then(d => { if (d.orgs) setOrgs(d.orgs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = orgs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o => o.name.toLowerCase().includes(q));
    }
    if (stateFilter !== 'All') {
      result = result.filter(o => o.state === stateFilter);
    }
    if (indigenousOnly) {
      result = result.filter(o => o.is_indigenous_org);
    }
    if (evidenceFilter !== 'All') {
      switch (evidenceFilter) {
        case 'Proven/Effective':
          result = result.filter(o => o.proven_count > 0 || o.effective_count > 0);
          break;
        case 'Promising':
          result = result.filter(o => o.promising_count > 0);
          break;
        case 'Indigenous-led':
          result = result.filter(o => o.indigenous_led_count > 0);
          break;
        case 'Any programs':
          result = result.filter(o => o.intervention_count > 0);
          break;
        case 'No programs':
          result = result.filter(o => o.intervention_count === 0);
          break;
      }
    }

    result = [...result].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mul * a.name.localeCompare(b.name);
      return mul * (Number(a[sortField]) - Number(b[sortField]));
    });

    return result;
  }, [orgs, search, stateFilter, evidenceFilter, indigenousOnly, sortField, sortDir]);

  const stats = useMemo(() => ({
    count: filtered.length,
    funding: filtered.reduce((s, o) => s + Number(o.total_funding), 0),
    programs: filtered.reduce((s, o) => s + o.intervention_count, 0),
    indigenous: filtered.filter(o => o.is_indigenous_org).length,
  }), [filtered]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const visible = filtered.slice(0, showCount);

  if (loading) {
    return (
      <div className="container-justice px-5 md:px-8">
        <div className="h-[300px] bg-[#F5F0E8]/5 animate-pulse flex items-center justify-center">
          <span className="text-[#F5F0E8]/20 font-mono text-sm">Loading explorer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-justice px-5 md:px-8">
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
          Explore the Data
        </div>
        <h2
          className="text-2xl md:text-5xl font-bold tracking-[-0.02em] text-[#F5F0E8] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Your turn. Dig in.
        </h2>
        <p className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-2xl leading-relaxed">
          Filter, sort, and explore every organisation in our database.
          Click any row to see their full profile with funding history and program details.
        </p>
      </div>

      {/* Live stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        {[
          { label: 'Matching', value: stats.count.toString() },
          { label: 'Total Funding', value: formatDollars(stats.funding) },
          { label: 'Programs', value: stats.programs.toString(), color: 'text-emerald-500' },
          { label: 'Indigenous', value: stats.indigenous.toString(), color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className={`text-lg md:text-xl font-bold ${s.color || 'text-[#F5F0E8]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {s.value}
            </span>
            <span className="font-mono text-[10px] text-[#F5F0E8]/30 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0E8]/20" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowCount(20); }}
            placeholder="Search organisations..."
            className="w-full bg-gray-950 border border-gray-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition-colors"
          />
        </div>

        {/* State */}
        <select
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); setShowCount(20); }}
          className="bg-gray-950 border border-gray-800 px-3 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
        >
          {STATES.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All states' : s}</option>
          ))}
        </select>

        {/* Evidence */}
        <select
          value={evidenceFilter}
          onChange={e => { setEvidenceFilter(e.target.value); setShowCount(20); }}
          className="bg-gray-950 border border-gray-800 px-3 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
        >
          {EVIDENCE_LEVELS.map(e => (
            <option key={e} value={e}>{e === 'All' ? 'All evidence' : e}</option>
          ))}
        </select>

        {/* Indigenous toggle */}
        <button
          onClick={() => { setIndigenousOnly(!indigenousOnly); setShowCount(20); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors ${
            indigenousOnly
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-gray-800 text-gray-500 hover:border-purple-600 hover:text-purple-400'
          }`}
        >
          Indigenous
        </button>
      </div>

      {/* Results table */}
      <div className="border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950">
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60">
                  Organisation <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F0E8]/30">State</span>
              </th>
              <th className="text-right px-4 py-3">
                <button onClick={() => toggleSort('total_funding')} className="flex items-center gap-1 ml-auto text-[10px] font-mono uppercase tracking-wider text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60">
                  Funding <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right px-4 py-3 hidden md:table-cell">
                <button onClick={() => toggleSort('intervention_count')} className="flex items-center gap-1 ml-auto text-[10px] font-mono uppercase tracking-wider text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60">
                  Programs <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F0E8]/30">Evidence</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((org, i) => {
              const evidence = getEvidenceLabel(org);
              const colorCls = getEvidenceColor(evidence);
              const profileUrl = org.abn ? `/justice-funding/org/${org.abn}` : null;

              return (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                  className="border-b border-gray-800/50 hover:bg-gray-950/80 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {profileUrl ? (
                        <Link href={profileUrl} className="font-medium text-[#F5F0E8] hover:text-red-400 transition-colors group-hover:underline underline-offset-2">
                          {org.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-[#F5F0E8]">{org.name}</span>
                      )}
                      {org.is_indigenous_org && (
                        <span className="text-[8px] font-bold px-1 py-0.5 bg-purple-600 text-white shrink-0">INDIGENOUS</span>
                      )}
                      {profileUrl && (
                        <ExternalLink className="w-3 h-3 text-[#F5F0E8]/10 group-hover:text-red-500 transition-colors shrink-0" />
                      )}
                    </div>
                    <div className="sm:hidden text-[10px] text-[#F5F0E8]/25 font-mono mt-0.5">{org.state}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-[#F5F0E8]/40 font-mono">{org.state}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-[#F5F0E8]/70">{formatDollars(org.total_funding)}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="font-mono text-sm text-[#F5F0E8]/50">{org.intervention_count}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 border ${colorCls}`}>
                      {evidence}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > showCount && (
        <button
          onClick={() => setShowCount(c => c + 20)}
          className="w-full mt-3 py-3 text-sm font-bold uppercase tracking-widest border border-gray-800 text-gray-500 hover:border-white hover:text-white transition-colors"
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}

      {filtered.length === 0 && (
        <div className="py-12 text-center border border-gray-800 mt-3">
          <Filter className="w-6 h-6 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No organisations match your filters.</p>
        </div>
      )}

      <p className="font-mono text-[10px] text-[#F5F0E8]/15 mt-6">
        Source: JusticeHub database — {orgs.length} organisations tracked. Click any name to see full profile.
      </p>
    </div>
  );
}
