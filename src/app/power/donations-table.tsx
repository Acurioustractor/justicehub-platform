'use client';

import { useEffect, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface DonationRow {
  org_name: string;
  abn: string;
  justice_funding_total: number;
  grant_count: number;
  sectors: string[];
  political_party: string;
  donation_total: number;
  donation_count: number;
  parties_detail: string[];
}

function formatDollars(n: number): string {
  if (n == null) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

type SortField = 'org_name' | 'justice_funding_total' | 'donation_total' | 'political_party';

const PARTY_COLORS: Record<string, string> = {
  Labor: 'bg-red-50 text-red-700 border-red-200',
  Liberal: 'bg-blue-50 text-blue-700 border-blue-200',
  Nationals: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Greens: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Other: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function DonationsTable({ state }: { state: string }) {
  const [data, setData] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('justice_funding_total');
  const [sortAsc, setSortAsc] = useState(false);
  const [partyFilter, setPartyFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=donations&state=${state}&limit=200`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state]);

  const partyGroups = useMemo(() => {
    const set = new Set(data.map(r => r.political_party).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.org_name?.toLowerCase().includes(q) ||
        r.political_party?.toLowerCase().includes(q) ||
        (r.parties_detail || []).some(p => p.toLowerCase().includes(q))
      );
    }
    if (partyFilter !== 'all') {
      rows = rows.filter(r => r.political_party === partyFilter);
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'org_name') cmp = (a.org_name || '').localeCompare(b.org_name || '');
      else if (sortField === 'political_party') cmp = (a.political_party || '').localeCompare(b.political_party || '');
      else cmp = (a[sortField] || 0) - (b[sortField] || 0);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [data, search, sortField, sortAsc, partyFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'org_name' || field === 'political_party');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 text-black" />
      : <ChevronDown className="w-3 h-3 text-black" />;
  };

  if (loading) return <div className="h-64 bg-gray-50 animate-pulse border border-gray-200" />;
  if (!data.length) {
    return (
      <div className="h-64 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">
        No political donation cross-links found for {state}
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search organisations or parties..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-1">
          {partyGroups.map(g => (
            <button
              key={g}
              onClick={() => setPartyFilter(g)}
              className={`px-3 py-2 text-xs font-bold uppercase transition-colors ${
                partyFilter === g ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {g === 'all' ? `All (${data.length})` : g}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('org_name')}>
                <span className="flex items-center gap-1">Organisation <SortIcon field="org_name" /></span>
              </th>
              <th className="text-right px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('justice_funding_total')}>
                <span className="flex items-center justify-end gap-1">Justice Funding <SortIcon field="justice_funding_total" /></span>
              </th>
              <th className="text-center px-4 py-3 font-bold uppercase text-xs text-gray-600">Grants</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('political_party')}>
                <span className="flex items-center gap-1">Party Group <SortIcon field="political_party" /></span>
              </th>
              <th className="text-right px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('donation_total')}>
                <span className="flex items-center justify-end gap-1">Donations <SortIcon field="donation_total" /></span>
              </th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Donated To</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No matches</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={`${row.abn}-${row.political_party}-${i}`} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100 transition-colors`}>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{row.org_name}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatDollars(row.justice_funding_total)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.grant_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 border ${PARTY_COLORS[row.political_party] || PARTY_COLORS.Other}`}>
                      {row.political_party}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{formatDollars(row.donation_total)}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {(row.parties_detail || []).slice(0, 2).map(p => (
                        <span key={p} className="bg-gray-100 border border-gray-200 text-[10px] px-1.5 py-0.5 font-mono truncate max-w-[180px]" title={p}>{p}</span>
                      ))}
                      {(row.parties_detail || []).length > 2 && (
                        <span className="text-[10px] text-gray-400" title={(row.parties_detail || []).join(', ')}>
                          +{(row.parties_detail || []).length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Showing {filtered.length} of {data.length} cross-linked records | ABN + name verified matches | Party branches consolidated
      </div>
    </div>
  );
}
