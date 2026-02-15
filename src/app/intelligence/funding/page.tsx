'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  MapPin,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Target,
  ChevronDown,
  X,
} from 'lucide-react';

type FundingOpportunity = {
  id: string;
  name: string;
  funder_name: string;
  source_type: string;
  status: string;
  deadline: string | null;
  min_grant_amount: number | null;
  max_grant_amount: number | null;
  jurisdictions: string[] | null;
  focus_areas: string[] | null;
  application_url: string | null;
  relevance_score: number | null;
  created_at: string;
};

type FundingData = {
  id: string;
  jurisdiction: string;
  fiscal_year: string;
  category: string;
  amount: number;
  source_url: string | null;
  created_at: string;
};

type FilterState = {
  search: string;
  jurisdiction: string;
  sourceType: string;
  status: string;
};

export default function FundingPage() {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [governmentData, setGovernmentData] = useState<FundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    jurisdiction: 'all',
    sourceType: 'all',
    status: 'all',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalExpenditure: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch funding opportunities
      const { data: oppsData, error: oppsError } = await supabase
        .from('alma_funding_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (oppsError) throw oppsError;

      // Fetch government expenditure data
      const { data: govData, error: govError } = await supabase
        .from('alma_funding_data')
        .select('*')
        .order('fiscal_year', { ascending: false });

      if (govError) throw govError;

      setOpportunities(oppsData || []);
      setGovernmentData(govData || []);

      // Calculate stats
      const activeOpps = (oppsData || []).filter(
        (opp) => opp.status === 'active' || opp.status === 'open'
      );
      const totalExp = (govData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

      setStats({
        total: oppsData?.length || 0,
        active: activeOpps.length,
        totalExpenditure: totalExp,
      });
    } catch (err: any) {
      console.error('Error fetching funding data:', err);
      setError(err.message || 'Failed to load funding data');
    } finally {
      setLoading(false);
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        opp.name?.toLowerCase().includes(searchLower) ||
        opp.funder_name?.toLowerCase().includes(searchLower) ||
        opp.focus_areas?.some((area) => area.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Jurisdiction filter
    if (filters.jurisdiction !== 'all') {
      if (!opp.jurisdictions?.includes(filters.jurisdiction)) return false;
    }

    // Source type filter
    if (filters.sourceType !== 'all') {
      if (opp.source_type !== filters.sourceType) return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      if (opp.status !== filters.status) return false;
    }

    return true;
  });

  // Get unique values for filters
  const allJurisdictions = Array.from(
    new Set(opportunities.flatMap((opp) => opp.jurisdictions || []))
  ).sort();

  const allSourceTypes = Array.from(
    new Set(opportunities.map((opp) => opp.source_type).filter(Boolean))
  ).sort();

  const allStatuses = Array.from(
    new Set(opportunities.map((opp) => opp.status).filter(Boolean))
  ).sort();

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'open':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <X className="w-4 h-4 text-red-600" />;
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const activeFiltersCount = [
    filters.search,
    filters.jurisdiction !== 'all',
    filters.sourceType !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

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
              Track funding opportunities and government expenditure across Australian jurisdictions.
              Community-controlled intelligence for Indigenous justice programs.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm uppercase tracking-wider text-gray-700">
                    Total Opportunities
                  </div>
                  <Target className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-4xl font-bold text-black">{stats.total}</div>
              </div>

              <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm uppercase tracking-wider text-gray-700">
                    Active Now
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-black">{stats.active}</div>
              </div>

              <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm uppercase tracking-wider text-gray-700">
                    Govt Expenditure
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-black">
                  {formatCurrency(stats.totalExpenditure)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, funder, or focus area..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full border-2 border-black pl-12 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="font-bold uppercase text-sm">
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 border-2 border-gray-200 bg-gray-50">
                {/* Jurisdiction Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-gray-700">
                    Jurisdiction
                  </label>
                  <select
                    value={filters.jurisdiction}
                    onChange={(e) =>
                      setFilters({ ...filters, jurisdiction: e.target.value })
                    }
                    className="w-full border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Jurisdictions</option>
                    {allJurisdictions.map((jurisdiction) => (
                      <option key={jurisdiction} value={jurisdiction}>
                        {jurisdiction}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Type Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-gray-700">
                    Source Type
                  </label>
                  <select
                    value={filters.sourceType}
                    onChange={(e) =>
                      setFilters({ ...filters, sourceType: e.target.value })
                    }
                    className="w-full border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Sources</option>
                    {allSourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-gray-700">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Statuses</option>
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="container-justice py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block border-4 border-black border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
              <p className="mt-4 text-gray-700 font-bold uppercase text-sm">
                Loading funding data...
              </p>
            </div>
          ) : error ? (
            <div className="border-2 border-red-600 bg-red-50 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-800 font-bold uppercase">{error}</p>
            </div>
          ) : (
            <>
              {/* Opportunities Section */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-black mb-6 flex items-center gap-3">
                  <Target className="w-8 h-8" />
                  Funding Opportunities
                  <span className="text-lg text-gray-600">
                    ({filteredOpportunities.length})
                  </span>
                </h2>

                {filteredOpportunities.length === 0 ? (
                  <div className="border-2 border-gray-300 bg-white p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-bold uppercase text-sm">
                      No opportunities match your filters
                    </p>
                    <button
                      onClick={() =>
                        setFilters({
                          search: '',
                          jurisdiction: 'all',
                          sourceType: 'all',
                          status: 'all',
                        })
                      }
                      className="mt-4 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold uppercase text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOpportunities.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                      >
                        {/* Card Header */}
                        <div className="border-b-2 border-black p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg leading-tight flex-1">
                              {opportunity.name}
                            </h3>
                            {getStatusIcon(opportunity.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{opportunity.funder_name}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Amount Range */}
                          <div>
                            <div className="text-xs uppercase tracking-wider text-gray-600 mb-1">
                              Grant Amount
                            </div>
                            <div className="font-bold text-lg">
                              {opportunity.min_grant_amount &&
                              opportunity.max_grant_amount ? (
                                <>
                                  {formatCurrency(opportunity.min_grant_amount)} -{' '}
                                  {formatCurrency(opportunity.max_grant_amount)}
                                </>
                              ) : opportunity.max_grant_amount ? (
                                <>Up to {formatCurrency(opportunity.max_grant_amount)}</>
                              ) : (
                                'Amount varies'
                              )}
                            </div>
                          </div>

                          {/* Deadline */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span>{formatDate(opportunity.deadline)}</span>
                          </div>

                          {/* Jurisdictions */}
                          {opportunity.jurisdictions &&
                            opportunity.jurisdictions.length > 0 && (
                              <div>
                                <div className="text-xs uppercase tracking-wider text-gray-600 mb-1">
                                  Jurisdictions
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {opportunity.jurisdictions.map((jurisdiction) => (
                                    <span
                                      key={jurisdiction}
                                      className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-mono"
                                    >
                                      {jurisdiction}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Focus Areas */}
                          {opportunity.focus_areas &&
                            opportunity.focus_areas.length > 0 && (
                              <div>
                                <div className="text-xs uppercase tracking-wider text-gray-600 mb-1">
                                  Focus Areas
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {opportunity.focus_areas.slice(0, 3).map((area) => (
                                    <span
                                      key={area}
                                      className="px-2 py-1 bg-blue-50 border border-blue-200 text-xs text-blue-800"
                                    >
                                      {area}
                                    </span>
                                  ))}
                                  {opportunity.focus_areas.length > 3 && (
                                    <span className="px-2 py-1 text-xs text-gray-600">
                                      +{opportunity.focus_areas.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Relevance Score */}
                          {opportunity.relevance_score !== null && (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="text-xs uppercase tracking-wider text-gray-600 mb-1">
                                Relevance Score
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 border border-gray-300">
                                  <div
                                    className="h-full bg-green-600"
                                    style={{
                                      width: `${opportunity.relevance_score}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold">
                                  {Math.round(opportunity.relevance_score)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        {opportunity.application_url && (
                          <div className="border-t-2 border-black p-4">
                            <a
                              href={opportunity.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full bg-black text-white py-2 px-4 font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
                            >
                              Apply Now
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Government Expenditure Section */}
              {governmentData.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-black mb-6 flex items-center gap-3">
                    <Building2 className="w-8 h-8" />
                    Government Expenditure Data
                  </h2>

                  <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-black bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                              Jurisdiction
                            </th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                              Fiscal Year
                            </th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold">
                              Category
                            </th>
                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-bold">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {governmentData.slice(0, 20).map((item, index) => (
                            <tr
                              key={item.id}
                              className={`border-b border-gray-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium">{item.jurisdiction}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item.fiscal_year}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{item.category}</td>
                              <td className="px-4 py-3 text-right font-bold text-lg">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.source_url ? (
                                  <a
                                    href={item.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {governmentData.length > 20 && (
                      <div className="border-t-2 border-black p-4 bg-gray-50 text-center">
                        <p className="text-sm text-gray-600">
                          Showing 20 of {governmentData.length} records
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
