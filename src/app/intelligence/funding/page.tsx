'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Search,
  Filter,
  DollarSign,
  MapPin,
  ExternalLink,
  TrendingUp,
  Building2,
  Target,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
} from 'lucide-react';

const STATES = ['ALL', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'NT', 'ACT'] as const;
const SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'qgip', label: 'QLD Grants (QGIP)' },
  { value: 'rogs-yj', label: 'ROGS Youth Justice' },
  { value: 'qld-historical', label: 'QLD Historical' },
  { value: 'austender', label: 'AusTender' },
  { value: 'state-budgets', label: 'State Budgets' },
  { value: 'niaa', label: 'NIAA' },
  { value: 'brisbane_council', label: 'Brisbane Council' },
];

type TopRecipient = {
  recipient_name: string;
  recipient_abn: string | null;
  alma_org_id: string | null;
  total_dollars: number;
  grant_count: number;
  is_indigenous: boolean;
  years_funded: number;
  program_count: number;
  sectors: string[];
  alma_linked: boolean;
};

type FundingRecord = {
  id: string;
  recipient_name: string;
  program_name: string | null;
  amount_dollars: number | null;
  state: string | null;
  source: string | null;
  financial_year: string | null;
  location: string | null;
  alma_organization_id: string | null;
};

export default function FundingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalDollars: 0,
    totalSources: 0,
    statesCovered: 0,
    linkedToOrgs: 0,
  });
  const [topRecipients, setTopRecipients] = useState<TopRecipient[]>([]);
  const [records, setRecords] = useState<FundingRecord[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const [stateFilter, setStateFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();

    // Total records count
    const { count: totalRecords } = await supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true });

    // Total dollar amount — use a simple sum query
    const { data: sumData } = await supabase.rpc('exec_sql', {
      query: `SELECT COUNT(*) as cnt, COALESCE(SUM(amount_dollars), 0) as total, COUNT(DISTINCT source) as sources, COUNT(DISTINCT state) as states, COUNT(*) FILTER (WHERE alma_organization_id IS NOT NULL) as linked FROM justice_funding`,
    });

    if (sumData?.[0]) {
      const row = sumData[0];
      setStats({
        totalRecords: totalRecords || parseInt(row.cnt),
        totalDollars: parseFloat(row.total),
        totalSources: parseInt(row.sources),
        statesCovered: parseInt(row.states),
        linkedToOrgs: parseInt(row.linked),
      });
    } else {
      setStats(s => ({ ...s, totalRecords: totalRecords || 0 }));
    }
  }, []);

  const fetchTopRecipients = useCallback(async () => {
    const state = stateFilter === 'ALL' ? '' : stateFilter;
    const url = `/api/justice-funding?view=top_recipients&state=${state}&limit=15`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setTopRecipients(data || []);
    }
  }, [stateFilter]);

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (stateFilter !== 'ALL') params.set('state', stateFilter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    const res = await fetch(`/api/justice-funding?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records || []);
      setTotalResults(data.total || 0);
    }
  }, [stateFilter, sourceFilter, searchQuery, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTopRecipients(), fetchRecords()]).finally(() => setLoading(false));
  }, [fetchTopRecipients, fetchRecords]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [stateFilter, sourceFilter, searchQuery]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return 'N/A';
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="section-padding border-b-2 border-black bg-white">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Intelligence
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
              Funding Intelligence
            </h1>
            <p className="text-xl max-w-3xl text-gray-700">
              Track government funding flows across Australian youth justice, community services,
              and Indigenous programs. {stats.totalRecords.toLocaleString()} records totalling{' '}
              {formatCurrency(stats.totalDollars)} tracked from {stats.totalSources} data sources.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Funding Records
                  </div>
                  <Database className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-black">
                  {stats.totalRecords.toLocaleString()}
                </div>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Total Tracked
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-black">
                  {formatCurrency(stats.totalDollars)}
                </div>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Data Sources
                  </div>
                  <Target className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-black">{stats.totalSources}</div>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    States
                  </div>
                  <Globe className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-black">{stats.statesCovered}</div>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Linked to Orgs
                  </div>
                  <Building2 className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-black">
                  {stats.linkedToOrgs.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* State pills */}
              <div className="flex flex-wrap gap-2">
                {STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => setStateFilter(state)}
                    className={`px-3 py-1.5 text-sm font-bold uppercase border-2 border-black transition-colors ${
                      stateFilter === state
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>

              {/* More filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors ml-auto"
              >
                <Filter className="w-4 h-4" />
                <span className="font-bold uppercase text-sm">More Filters</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border-2 border-gray-200 bg-gray-50">
                {/* Source filter */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-gray-700">
                    Data Source
                  </label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-gray-700">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by recipient, program, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border-2 border-black pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="container-justice py-12">
          {/* Top Recipients */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-black mb-6 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Top Recipients
              {stateFilter !== 'ALL' && (
                <span className="text-lg text-gray-600">({stateFilter})</span>
              )}
            </h2>

            {topRecipients.length === 0 && !loading ? (
              <div className="border-2 border-gray-300 bg-white p-12 text-center">
                <p className="text-gray-600 font-bold uppercase text-sm">
                  No recipient data for this filter
                </p>
              </div>
            ) : (
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold w-8">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          Recipient
                        </th>
                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">
                          Total Funding
                        </th>
                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">
                          Grants
                        </th>
                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">
                          Years
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRecipients.map((recipient, index) => (
                        <tr
                          key={`${recipient.recipient_name}-${index}`}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {recipient.is_indigenous && (
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Indigenous organisation" />
                              )}
                              <span className="font-medium">{recipient.recipient_name}</span>
                              {recipient.alma_linked && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-300">
                                  ALMA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lg">
                            {formatCurrency(recipient.total_dollars)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {recipient.grant_count?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {recipient.years_funded}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Funding Records Table */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                <DollarSign className="w-8 h-8" />
                Funding Records
                <span className="text-lg text-gray-600">
                  ({totalResults.toLocaleString()})
                </span>
              </h2>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-2 border-2 border-black disabled:opacity-30 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-mono px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 border-2 border-black disabled:opacity-30 hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {records.length === 0 && !loading ? (
              <div className="border-2 border-gray-300 bg-white p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase text-sm">
                  No records match your filters
                </p>
              </div>
            ) : (
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          Recipient
                        </th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          Program
                        </th>
                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          State
                        </th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                          Year
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr
                          key={record.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3 max-w-[200px]">
                            <span className="font-medium truncate block">
                              {record.recipient_name}
                            </span>
                            {record.location && (
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {record.location}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-[250px]">
                            <span className="truncate block text-sm">
                              {record.program_name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {record.amount_dollars
                              ? formatFullCurrency(record.amount_dollars)
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-mono">
                              {record.state || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {record.source || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {record.financial_year || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="border-t-2 border-black p-4 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {page * PAGE_SIZE + 1} -{' '}
                      {Math.min((page + 1) * PAGE_SIZE, totalResults)} of{' '}
                      {totalResults.toLocaleString()} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 border-2 border-black disabled:opacity-30 hover:bg-gray-100 text-sm font-bold"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1 border-2 border-black disabled:opacity-30 hover:bg-gray-100 text-sm font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
