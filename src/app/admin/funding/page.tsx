'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  DollarSign,
  Calendar,
  Building2,
  ExternalLink,
  Clock,
  AlertTriangle,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface FundingOpportunity {
  id: string;
  name: string;
  description?: string;
  funder_name: string;
  source_type: 'government' | 'philanthropy' | 'corporate' | 'community';
  category?: string;
  total_pool_amount?: number;
  min_grant_amount?: number;
  max_grant_amount?: number;
  deadline?: string;
  status: string;
  jurisdictions?: string[];
  focus_areas?: string[];
  source_url?: string;
  application_url?: string;
  relevance_score?: number;
  days_until_deadline?: number;
  created_at: string;
}

interface FundingStats {
  total_opportunities: number;
  active_opportunities: number;
  by_source: Record<string, number>;
}

const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  government: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-600' },
  philanthropy: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-600' },
  corporate: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-600' },
  community: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-600' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-green-100', text: 'text-green-800' },
  closing_soon: { bg: 'bg-red-100', text: 'text-red-800' },
  upcoming: { bg: 'bg-blue-100', text: 'text-blue-800' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
  recurring: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

export default function FundingDashboard() {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [stats, setStats] = useState<FundingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (sourceTypeFilter) params.set('source_type', sourceTypeFilter);
      if (jurisdictionFilter) params.set('jurisdiction', jurisdictionFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '100');

      const [oppsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/funding/opportunities?${params}`),
        fetch('/api/admin/funding/scrape'),
      ]);

      if (!oppsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const oppsData = await oppsRes.json();
      const statsData = await statsRes.json();

      setOpportunities(oppsData.data || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, sourceTypeFilter, jurisdictionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '—';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDeadline = (deadline?: string, daysLeft?: number) => {
    if (!deadline) return 'Ongoing';
    const date = new Date(deadline);
    const formatted = date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (daysLeft !== undefined && daysLeft !== null) {
      if (daysLeft < 0) return `Closed`;
      if (daysLeft === 0) return `Today!`;
      if (daysLeft <= 7) return `${daysLeft}d left`;
      if (daysLeft <= 14) return `${daysLeft}d`;
    }

    return formatted;
  };

  // Group opportunities by status for Kanban view
  const closingSoon = opportunities.filter((o) => o.status === 'closing_soon');
  const open = opportunities.filter((o) => o.status === 'open');
  const upcoming = opportunities.filter((o) => o.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <h1 className="text-4xl font-black text-black">Funding Pipeline</h1>
              </div>
              <p className="text-lg text-gray-600">
                Track grants, philanthropy, and funding opportunities for basecamps
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/admin/funding/new"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white border-2 border-black font-bold hover:bg-green-700 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus className="w-4 h-4" />
                Add Opportunity
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Total Tracked</span>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-4xl font-black text-black">
                {stats?.total_opportunities || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">funding opportunities</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Active Now</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-4xl font-black text-green-600">
                {stats?.active_opportunities || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">open for applications</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Closing Soon</span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-4xl font-black text-red-600">{closingSoon.length}</div>
              <div className="text-xs text-gray-500 mt-1">within 14 days</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Coming Up</span>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-4xl font-black text-blue-600">{upcoming.length}</div>
              <div className="text-xs text-gray-500 mt-1">opening soon</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-bold text-sm">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="active">Active (Open + Closing)</option>
                  <option value="open">Open</option>
                  <option value="closing_soon">Closing Soon</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Source Type Filter */}
              <div className="relative">
                <select
                  value={sourceTypeFilter}
                  onChange={(e) => setSourceTypeFilter(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Sources</option>
                  <option value="government">Government</option>
                  <option value="philanthropy">Philanthropy</option>
                  <option value="corporate">Corporate</option>
                  <option value="community">Community</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Jurisdiction Filter */}
              <div className="relative">
                <select
                  value={jurisdictionFilter}
                  onChange={(e) => setJurisdictionFilter(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Jurisdictions</option>
                  <option value="National">National</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search opportunities..."
                    className="w-full pl-10 pr-4 py-1.5 bg-gray-100 border-2 border-gray-300 font-medium text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading funding opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No opportunities found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or add a new opportunity
              </p>
              <Link
                href="/admin/funding/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white border-2 border-black font-bold hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Opportunity
              </Link>
            </div>
          ) : (
            <>
              {/* Closing Soon Alert */}
              {closingSoon.length > 0 && (
                <div className="bg-red-50 border-2 border-red-600 p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-red-800 mb-2">
                        {closingSoon.length} Opportunities Closing Soon
                      </h3>
                      <ul className="space-y-1">
                        {closingSoon.slice(0, 5).map((opp) => (
                          <li key={opp.id} className="text-sm text-red-700">
                            <span className="font-medium">{opp.name}</span>
                            <span className="text-red-500">
                              {' '}
                              — {formatDeadline(opp.deadline, opp.days_until_deadline)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Opportunities Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {opportunities.map((opp) => {
                  const sourceColors =
                    SOURCE_TYPE_COLORS[opp.source_type] || SOURCE_TYPE_COLORS.community;
                  const statusColors = STATUS_COLORS[opp.status] || STATUS_COLORS.open;

                  return (
                    <div
                      key={opp.id}
                      className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 text-xs font-bold border ${sourceColors.bg} ${sourceColors.text} ${sourceColors.border}`}
                              >
                                {opp.source_type.toUpperCase()}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-bold ${statusColors.bg} ${statusColors.text}`}
                              >
                                {opp.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-black line-clamp-2">
                              {opp.name}
                            </h3>
                          </div>

                          {opp.relevance_score && opp.relevance_score >= 70 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs font-bold">
                              <Sparkles className="w-3 h-3" />
                              {opp.relevance_score}%
                            </div>
                          )}
                        </div>

                        {/* Funder */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Building2 className="w-4 h-4" />
                          <span>{opp.funder_name}</span>
                        </div>

                        {/* Amount & Deadline Row */}
                        <div className="flex items-center gap-6 mb-4">
                          {(opp.min_grant_amount || opp.max_grant_amount) && (
                            <div>
                              <div className="text-xs text-gray-500 uppercase font-medium">
                                Grant Amount
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {opp.min_grant_amount && opp.max_grant_amount
                                  ? `${formatCurrency(opp.min_grant_amount)} - ${formatCurrency(opp.max_grant_amount)}`
                                  : formatCurrency(opp.max_grant_amount || opp.min_grant_amount)}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-gray-500 uppercase font-medium">
                              Deadline
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                opp.days_until_deadline !== undefined &&
                                opp.days_until_deadline <= 14
                                  ? 'text-red-600'
                                  : 'text-gray-800'
                              }`}
                            >
                              {formatDeadline(opp.deadline, opp.days_until_deadline)}
                            </div>
                          </div>
                        </div>

                        {/* Jurisdictions */}
                        {opp.jurisdictions && opp.jurisdictions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {opp.jurisdictions.map((j) => (
                              <span
                                key={j}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium"
                              >
                                {j}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Focus Areas */}
                        {opp.focus_areas && opp.focus_areas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {opp.focus_areas.slice(0, 4).map((area) => (
                              <span
                                key={area}
                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium"
                              >
                                {area}
                              </span>
                            ))}
                            {opp.focus_areas.length > 4 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium">
                                +{opp.focus_areas.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <Link
                            href={`/admin/funding/${opp.id}`}
                            className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </Link>

                          {opp.application_url && (
                            <a
                              href={opp.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-bold text-green-600 hover:underline"
                            >
                              Apply
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick Actions */}
          <div className="mt-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="text-2xl font-black text-black mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/funding/scrape"
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Run Funding Scrape
              </Link>

              <Link
                href="/admin/funding/applications"
                className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-100 transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Track Applications
              </Link>

              <Link
                href="/admin/funding/reports"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-600 text-green-600 font-bold hover:bg-green-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                Weekly Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
