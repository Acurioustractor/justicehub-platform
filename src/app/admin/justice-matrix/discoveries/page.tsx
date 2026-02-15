'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Scale,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  RefreshCw
} from 'lucide-react';

interface Discovery {
  id: string;
  source_id: string;
  source_url: string;
  item_type: 'case' | 'campaign' | 'resource';
  raw_data: Record<string, unknown>;
  extracted_title: string;
  extracted_jurisdiction: string;
  extracted_year: number;
  extracted_categories: string[];
  extracted_summary: string;
  extracted_lat: number;
  extracted_lng: number;
  extracted_country_code: string;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  review_notes: string;
  extraction_confidence: number;
  similarity_score: number;
  discovered_at: string;
  source?: {
    name: string;
    source_type: string;
    region: string;
  };
}

export default function DiscoveriesReviewPage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchDiscoveries();
  }, [statusFilter, typeFilter, pagination.page]);

  async function fetchDiscoveries() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: '20',
      });
      if (typeFilter) params.set('item_type', typeFilter);

      const res = await fetch(`/api/justice-matrix/discovered?${params}`);
      const json = await res.json();

      if (json.success) {
        setDiscoveries(json.data || []);
        setPagination(prev => ({
          ...prev,
          total: json.pagination.total,
          totalPages: json.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    }
    setLoading(false);
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'duplicate', additionalData?: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/justice-matrix/discovered/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewed_by: 'admin', // In real app, get from auth
          ...additionalData,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Refresh the list
        fetchDiscoveries();
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    }
  }

  const filteredDiscoveries = discoveries.filter(d =>
    !searchQuery ||
    d.extracted_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.extracted_jurisdiction?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = {
    pending: discoveries.filter(d => d.status === 'pending').length,
    approved: discoveries.filter(d => d.status === 'approved').length,
    rejected: discoveries.filter(d => d.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/justice-matrix"
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="w-px h-6 bg-gray-300" />
              <div>
                <h1 className="text-2xl font-black text-black">Discovery Review Queue</h1>
                <p className="text-sm text-gray-600">Review and approve items discovered by Ralph</p>
              </div>
            </div>
            <button
              onClick={() => fetchDiscoveries()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 transition-colors font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="border-2 border-gray-300 px-3 py-2 font-medium focus:border-black focus:outline-none"
              >
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="border-2 border-gray-300 px-3 py-2 font-medium focus:border-black focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="case">Cases</option>
              <option value="campaign">Campaigns</option>
            </select>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discoveries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading discoveries...</p>
          </div>
        ) : filteredDiscoveries.length === 0 ? (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No discoveries found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'pending'
                ? 'No items pending review. Run /ralph-matrix-scan to discover new items.'
                : 'No items match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDiscoveries.map((discovery) => (
              <div
                key={discovery.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {/* Header */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {discovery.item_type === 'case' ? (
                        <Scale className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Users className="w-5 h-5 text-green-600" />
                      )}
                      <span className={`px-2 py-1 text-xs font-bold ${
                        discovery.item_type === 'case'
                          ? 'bg-blue-100 text-blue-700 border border-blue-600'
                          : 'bg-green-100 text-green-700 border border-green-600'
                      }`}>
                        {discovery.item_type.toUpperCase()}
                      </span>
                      {discovery.extraction_confidence && (
                        <span className={`px-2 py-1 text-xs font-bold ${
                          discovery.extraction_confidence >= 80
                            ? 'bg-green-100 text-green-700'
                            : discovery.extraction_confidence >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {discovery.extraction_confidence}% confidence
                        </span>
                      )}
                      {discovery.similarity_score && discovery.similarity_score > 70 && (
                        <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-700 border border-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Possible duplicate
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-black mb-1">
                      {discovery.extracted_title || 'Untitled Discovery'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {discovery.extracted_jurisdiction && `${discovery.extracted_jurisdiction} • `}
                      {discovery.extracted_year && `${discovery.extracted_year} • `}
                      {discovery.source?.name && `Source: ${discovery.source.name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={discovery.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => setExpandedId(expandedId === discovery.id ? null : discovery.id)}
                      className="p-2 text-gray-500 hover:text-black transition-colors"
                    >
                      {expandedId === discovery.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary */}
                {discovery.extracted_summary && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 line-clamp-2">{discovery.extracted_summary}</p>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedId === discovery.id && (
                  <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Categories</h4>
                        <div className="flex flex-wrap gap-1">
                          {discovery.extracted_categories?.map((cat, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs">
                              {cat}
                            </span>
                          )) || <span className="text-gray-400 text-sm">None extracted</span>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Location</h4>
                        <p className="text-sm">
                          {discovery.extracted_country_code || 'Unknown'} •
                          {discovery.extracted_lat && discovery.extracted_lng
                            ? ` ${discovery.extracted_lat.toFixed(4)}, ${discovery.extracted_lng.toFixed(4)}`
                            : ' Coordinates not extracted'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Raw Data</h4>
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 overflow-x-auto max-h-40">
                        {JSON.stringify(discovery.raw_data, null, 2)}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Discovered: {new Date(discovery.discovered_at).toLocaleString()}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(discovery.id)}
                        className="flex items-center gap-1 hover:text-black transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy ID
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {discovery.status === 'pending' && (
                  <div className="border-t-2 border-gray-200 p-4 flex items-center gap-3 bg-gray-50">
                    <button
                      onClick={() => handleAction(discovery.id, 'approve', {
                        // Pass through extracted fields - in a real app you'd have an edit form
                        jurisdiction: discovery.extracted_jurisdiction,
                        case_citation: discovery.extracted_title,
                        year: discovery.extracted_year,
                        categories: discovery.extracted_categories,
                        country_code: discovery.extracted_country_code,
                        lat: discovery.extracted_lat,
                        lng: discovery.extracted_lng,
                        country_region: discovery.extracted_jurisdiction,
                        campaign_name: discovery.extracted_title,
                        goals: discovery.extracted_summary,
                      })}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Rejection reason (optional):');
                        handleAction(discovery.id, 'reject', { review_notes: notes });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-bold border-2 border-red-600 hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        const duplicateId = prompt('Enter ID of existing item this duplicates:');
                        if (duplicateId) {
                          handleAction(discovery.id, 'duplicate', { duplicate_of_id: duplicateId });
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-bold border-2 border-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Mark Duplicate
                    </button>
                  </div>
                )}

                {/* Reviewed Status */}
                {discovery.status !== 'pending' && (
                  <div className={`border-t-2 p-4 ${
                    discovery.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : discovery.status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {discovery.status === 'approved' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : discovery.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="font-bold capitalize">{discovery.status}</span>
                      {discovery.review_notes && (
                        <span className="text-sm text-gray-600">• {discovery.review_notes}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
