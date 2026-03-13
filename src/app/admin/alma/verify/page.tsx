'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  ChevronLeft,
  Bot,
} from 'lucide-react';

interface Intervention {
  id: string;
  name: string;
  type: string;
  operating_organization: string | null;
  description: string;
  website: string | null;
  verification_status: string;
  source_documents: unknown;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  evidence_count: number;
}

interface StatusCounts {
  unverified: number;
  needs_review: number;
  verified: number;
  ai_generated: number;
}

interface ApiResponse {
  interventions: Intervention[];
  statusCounts: StatusCounts;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type StatusFilter = '' | 'unverified' | 'needs_review' | 'verified' | 'ai_generated';

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; icon: typeof CheckCircle2 }> = {
  unverified: { label: 'Unverified', bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', icon: Clock },
  needs_review: { label: 'Needs Review', bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', icon: AlertTriangle },
  verified: { label: 'Verified', bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', icon: CheckCircle2 },
  ai_generated: { label: 'AI Generated', bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', icon: Bot },
};

export default function AlmaVerifyPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('needs_review');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/alma/verify?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAction(id: string, action: 'verify' | 'reject' | 'needs_review') {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/alma/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      // Refresh data after action
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
    setActionLoading(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function renderSourceDocs(docs: unknown) {
    if (!docs) return null;
    const items = Array.isArray(docs) ? docs : typeof docs === 'object' ? [docs] : [];
    if (items.length === 0) return null;

    return (
      <div className="mt-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Source Documents</h4>
        <div className="space-y-1">
          {items.map((doc: Record<string, unknown>, idx: number) => {
            const url = typeof doc === 'string' ? doc : (doc.url as string) || (doc.source_url as string) || '';
            const title = typeof doc === 'string' ? doc : (doc.title as string) || (doc.name as string) || url || `Document ${idx + 1}`;
            return (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline hover:text-blue-900 truncate"
                  >
                    {title}
                  </a>
                ) : (
                  <span className="text-gray-600 truncate">{title}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const statusCards: { key: StatusFilter; countKey: keyof StatusCounts }[] = [
    { key: 'needs_review', countKey: 'needs_review' },
    { key: 'unverified', countKey: 'unverified' },
    { key: 'ai_generated', countKey: 'ai_generated' },
    { key: 'verified', countKey: 'verified' },
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                  Admin
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
                  ALMA Verification
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  Review and verify intervention records in the knowledge commons
                </p>
              </div>
              <button
                onClick={() => { setPage(1); fetchData(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className="container-justice py-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8">
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Status Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statusCards.map(({ key, countKey }) => {
              const config = STATUS_CONFIG[key];
              const StatusIcon = config.icon;
              const count = data?.statusCounts[countKey] ?? 0;
              const isActive = statusFilter === key;

              return (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(isActive ? '' : key); setPage(1); }}
                  className={`text-left p-6 border-2 transition-all ${
                    isActive
                      ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : `${config.border} hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]`
                  } ${config.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
                    <StatusIcon className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div className={`text-3xl font-black font-mono ${config.text}`}>
                    {count.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isActive ? 'Click to show all' : 'Click to filter'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table */}
          {loading && !data ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500 font-mono">Loading interventions...</span>
            </div>
          ) : data && (
            <>
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-black text-white px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <h2 className="font-bold uppercase tracking-wider">
                      Interventions
                      {statusFilter && ` — ${STATUS_CONFIG[statusFilter]?.label || statusFilter}`}
                    </h2>
                  </div>
                  <span className="text-sm font-mono text-gray-300">
                    {data.total} total
                  </span>
                </div>

                {data.interventions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold">No interventions found</p>
                    <p className="text-sm mt-1">Try changing the status filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b-2 border-black">
                        <tr>
                          <th className="px-3 py-3 text-left w-8"></th>
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Organisation</th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Evidence</th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.interventions.map((intervention, idx) => {
                          const isExpanded = expandedRows.has(intervention.id);
                          const config = STATUS_CONFIG[intervention.verification_status] || STATUS_CONFIG.unverified;
                          const StatusIcon = config.icon;
                          const isProcessing = actionLoading === intervention.id;

                          return (
                            <Fragment key={intervention.id}>
                              <tr
                                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                                onClick={() => toggleRow(intervention.id)}
                              >
                                <td className="px-3 py-3">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                </td>
                                <td className="px-4 py-3 font-medium max-w-[250px] truncate">
                                  {intervention.name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  <span className="inline-block bg-gray-100 border border-gray-300 px-2 py-0.5 text-xs font-mono">
                                    {intervention.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                                  {intervention.operating_organization || '—'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block font-mono font-bold px-2 py-0.5 text-xs border ${
                                    intervention.evidence_count > 0
                                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                                      : 'bg-gray-50 border-gray-300 text-gray-500'
                                  }`}>
                                    {intervention.evidence_count}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1">
                                    {intervention.verification_status !== 'verified' && (
                                      <button
                                        onClick={() => handleAction(intervention.id, 'verify')}
                                        disabled={isProcessing}
                                        className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white border-2 border-emerald-800 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                        title="Verify"
                                      >
                                        {isProcessing ? '...' : 'Verify'}
                                      </button>
                                    )}
                                    {intervention.verification_status !== 'needs_review' && (
                                      <button
                                        onClick={() => handleAction(intervention.id, 'needs_review')}
                                        disabled={isProcessing}
                                        className="px-2 py-1 text-xs font-bold bg-amber-500 text-white border-2 border-amber-700 hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                        title="Flag for review"
                                      >
                                        {isProcessing ? '...' : 'Review'}
                                      </button>
                                    )}
                                    {intervention.verification_status !== 'unverified' && (
                                      <button
                                        onClick={() => handleAction(intervention.id, 'reject')}
                                        disabled={isProcessing}
                                        className="px-2 py-1 text-xs font-bold bg-red-600 text-white border-2 border-red-800 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        title="Reject"
                                      >
                                        {isProcessing ? '...' : 'Reject'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td colSpan={7} className="px-12 py-4 border-t border-dashed border-gray-300">
                                    <div className="max-w-3xl">
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {intervention.description}
                                      </p>
                                      {intervention.website && (
                                        <a
                                          href={intervention.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-700 underline hover:text-blue-900"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          {intervention.website}
                                        </a>
                                      )}
                                      {renderSourceDocs(intervention.source_documents)}
                                      {intervention.reviewed_at && (
                                        <div className="mt-3 text-xs text-gray-400 font-mono">
                                          Last reviewed: {formatDate(intervention.reviewed_at)}
                                          {intervention.reviewed_by && ` by ${intervention.reviewed_by}`}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm font-mono text-gray-600">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="flex items-center gap-1 px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

