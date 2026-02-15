'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  source_type: string | null;
  jurisdiction: string | null;
  last_scraped_at: string | null;
  success_rate: number | null;
  quality_score: number | null;
  total_entities_extracted: number | null;
  failure_count: number | null;
  derivedStatus: 'active' | 'stale' | 'failing' | 'new';
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface SourcesTableProps {
  sources: Source[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onTriggerScrape?: (sourceId: string) => void;
  onResetFailures?: (sourceId: string) => void;
  isLoading?: boolean;
}

export function SourcesTable({
  sources,
  pagination,
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  onTriggerScrape,
  onResetFailures,
  isLoading,
}: SourcesTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'stale':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failing':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'new':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-300',
      stale: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      failing: 'bg-red-100 text-red-800 border-red-300',
      new: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-bold text-xs uppercase text-gray-600 hover:text-black"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="p-4 border-b-2 border-black">
        <h2 className="text-xl font-black text-black">Data Sources</h2>
        <p className="text-sm text-gray-600">
          {pagination.total} sources registered
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left">
                <SortHeader field="name">Source</SortHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-bold text-xs uppercase text-gray-600">Type</span>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="last_scraped_at">Last Scraped</SortHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="success_rate">Success Rate</SortHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="quality_score">Quality</SortHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="total_entities_extracted">Entities</SortHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-bold text-xs uppercase text-gray-600">Status</span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="font-bold text-xs uppercase text-gray-600">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={isLoading ? 'opacity-50' : ''}>
            {sources.map((source) => (
              <tr
                key={source.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {source.name}
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate max-w-xs"
                    >
                      {source.url.replace(/^https?:\/\//, '').slice(0, 40)}...
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 border border-gray-300">
                    {source.source_type || 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatTimeAgo(source.last_scraped_at)}
                </td>
                <td className="px-4 py-3">
                  {source.success_rate !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 h-2">
                        <div
                          className={`h-full ${
                            source.success_rate >= 80
                              ? 'bg-green-500'
                              : source.success_rate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${source.success_rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{source.success_rate}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {source.quality_score !== null ? (
                    <span className={`text-sm font-medium ${
                      source.quality_score >= 7
                        ? 'text-green-600'
                        : source.quality_score >= 4
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {source.quality_score.toFixed(1)}/10
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {source.total_entities_extracted || 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(source.derivedStatus)}
                    <span className={`px-2 py-0.5 text-xs font-medium border ${getStatusBadge(source.derivedStatus)}`}>
                      {source.derivedStatus}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === source.id ? null : source.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenuOpen === source.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border-2 border-black shadow-lg z-10">
                        {onTriggerScrape && (
                          <button
                            onClick={() => {
                              onTriggerScrape(source.id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Trigger Scrape
                          </button>
                        )}
                        {onResetFailures && source.derivedStatus === 'failing' && (
                          <button
                            onClick={() => {
                              onResetFailures(source.id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Reset Failures
                          </button>
                        )}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit Source
                        </a>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t-2 border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 border-2 border-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="px-3 py-1 border-2 border-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
