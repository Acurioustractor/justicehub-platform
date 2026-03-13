'use client';

import { useEffect, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface OrgRow {
  recipient_name: string;
  recipient_abn: string;
  total_funding: number;
  grant_count: number;
  sectors: string[];
  is_indigenous: boolean;
  pct_of_total: number;
}

function formatDollars(n: number): string {
  if (n == null) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

type SortField = 'recipient_name' | 'total_funding' | 'grant_count';

export default function TopFundedOrgs({ state }: { state: string }) {
  const [data, setData] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_funding');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterIndigenous, setFilterIndigenous] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=top-orgs&state=${state}&limit=50`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state]);

  const filtered = useMemo(() => {
    let rows = data;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.recipient_name?.toLowerCase().includes(q));
    }
    if (filterIndigenous) {
      rows = rows.filter(r => r.is_indigenous);
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'recipient_name') cmp = (a.recipient_name || '').localeCompare(b.recipient_name || '');
      else cmp = (a[sortField] || 0) - (b[sortField] || 0);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [data, search, sortField, sortAsc, filterIndigenous]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === 'recipient_name'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortAsc ? <ChevronUp className="w-3 h-3 text-black" /> : <ChevronDown className="w-3 h-3 text-black" />;
  };

  if (loading) return <div className="h-64 bg-gray-50 animate-pulse border border-gray-200" />;
  if (!data.length) return <div className="h-64 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">NO DATA</div>;

  const maxFunding = data[0]?.total_funding || 1;
  const indigenousCount = data.filter(r => r.is_indigenous).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search organisations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterIndigenous(false)}
            className={`px-3 py-2 text-xs font-bold uppercase transition-colors ${!filterIndigenous ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
          >
            All ({data.length})
          </button>
          <button
            onClick={() => setFilterIndigenous(true)}
            className={`px-3 py-2 text-xs font-bold uppercase transition-colors ${filterIndigenous ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
          >
            Indigenous-led ({indigenousCount})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-center px-3 py-3 font-bold uppercase text-xs text-gray-600 w-8">#</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('recipient_name')}>
                <span className="flex items-center gap-1">Organisation <SortIcon field="recipient_name" /></span>
              </th>
              <th className="text-right px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('total_funding')}>
                <span className="flex items-center justify-end gap-1">Total Funding <SortIcon field="total_funding" /></span>
              </th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600 w-48">Share</th>
              <th className="text-center px-4 py-3 font-bold uppercase text-xs text-gray-600 cursor-pointer select-none hover:text-black" onClick={() => handleSort('grant_count')}>
                <span className="flex items-center justify-center gap-1">Grants <SortIcon field="grant_count" /></span>
              </th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Sectors</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No matches</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.recipient_abn || i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100 transition-colors`}>
                  <td className="px-3 py-3 text-center text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {row.is_indigenous && <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-2" title="Indigenous-led" />}
                    {row.recipient_name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{formatDollars(row.total_funding)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${row.is_indigenous ? 'bg-emerald-500' : 'bg-slate-800'}`}
                          style={{ width: `${Math.max(1, (row.total_funding / maxFunding) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-10 text-right">{row.pct_of_total?.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.grant_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(row.sectors || []).slice(0, 3).map(s => (
                        <span key={s} className="bg-gray-100 border border-gray-200 text-[10px] px-1.5 py-0.5 font-mono">{s?.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        Showing {filtered.length} of {data.length} organisations | Sorted by total justice funding received
      </div>
    </div>
  );
}
