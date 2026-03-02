'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

type DecisionTag = 'advance' | 'hold' | 'needs_review';

interface WorkspaceEntry {
  id: string;
  organizationId: string;
  note?: string | null;
  decisionTag?: DecisionTag | null;
  activityLog?: Array<{
    id: string;
    timestamp: string;
    type: string;
    detail: string;
    organizationId?: string;
    organizationName?: string;
  }>;
  lastActivityAt?: string | null;
  lastActivityType?: string | null;
  lastReviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isSameLocalDay(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function decisionClass(tag?: string | null) {
  if (tag === 'advance') return 'bg-emerald-100 text-emerald-800';
  if (tag === 'hold') return 'bg-amber-100 text-amber-800';
  if (tag === 'needs_review') return 'bg-rose-100 text-rose-800';
  return 'bg-gray-100 text-gray-700';
}

function FundingDiscoveryWorkspacePageContent() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<'all' | DecisionTag>('all');

  const focusedOrganizationIds = useMemo(
    () =>
      (searchParams.get('organizationIds') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams]
  );

  const loadEntries = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (focusedOrganizationIds.length > 0) {
        params.set('organizationIds', focusedOrganizationIds.join(','));
      }

      const response = await fetch(
        `/api/admin/funding/os/discovery-workspace${
          params.toString() ? `?${params.toString()}` : ''
        }`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load shared discovery workspace');
      }

      setEntries(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load shared discovery workspace'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [searchParams]);

  const visibleEntries = useMemo(() => {
    if (decisionFilter === 'all') {
      return entries;
    }

    return entries.filter((entry) => entry.decisionTag === decisionFilter);
  }, [decisionFilter, entries]);

  const summary = useMemo(
    () => ({
      total: entries.length,
      withNotes: entries.filter((entry) => String(entry.note || '').trim()).length,
      needsReview: entries.filter((entry) => entry.decisionTag === 'needs_review').length,
      touchedToday: entries.filter((entry) => isSameLocalDay(entry.lastReviewedAt)).length,
    }),
    [entries]
  );

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding/os"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding OS
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Discovery Workspace</h1>
                  <p className="text-base text-gray-600">
                    Review the shared note, decision, and activity layer behind funder discovery.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadEntries(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Workspace
            </button>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Shared Orgs</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">With Notes</div>
              <div className="text-4xl font-black text-[#0f766e]">{summary.withNotes}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Needs Review</div>
              <div className="text-4xl font-black text-rose-700">{summary.needsReview}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Touched Today</div>
              <div className="text-4xl font-black text-blue-700">{summary.touchedToday}</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                  Workspace Filter
                </div>
                <div className="text-sm font-black text-black">
                  Showing {visibleEntries.length} of {entries.length} shared review entries
                </div>
                {focusedOrganizationIds.length > 0 && (
                  <div className="text-xs font-bold text-[#115e59] mt-2">
                    Focused to {focusedOrganizationIds.length} selected organization
                    {focusedOrganizationIds.length === 1 ? '' : 's'}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {focusedOrganizationIds.length > 0 && (
                  <Link
                    href="/admin/funding/os/discovery-workspace"
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#eef8f7] text-[#115e59] hover:bg-[#d7f0ee] transition-colors"
                  >
                    Show All Shared Profiles
                  </Link>
                )}
                {(['all', 'advance', 'hold', 'needs_review'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDecisionFilter(value)}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      decisionFilter === value
                        ? value === 'all'
                          ? 'bg-[#0f766e] text-white'
                          : decisionClass(value)
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {value === 'all'
                      ? 'All'
                      : value === 'advance'
                        ? 'Advance'
                        : value === 'hold'
                          ? 'Hold'
                          : 'Needs Review'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading shared workspace…
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              No shared discovery workspace entries match the current filter.
            </div>
          ) : (
            <div className="space-y-5">
              {visibleEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-2xl font-black text-black">
                          {entry.activityLog?.[0]?.organizationName ||
                            entry.organizationId}
                        </h2>
                        <span
                          className={`px-2 py-1 text-[11px] font-black border border-black ${decisionClass(
                            entry.decisionTag
                          )}`}
                        >
                          {entry.decisionTag
                            ? entry.decisionTag === 'needs_review'
                              ? 'Needs Review'
                              : entry.decisionTag.charAt(0).toUpperCase() +
                                entry.decisionTag.slice(1)
                            : 'Untagged'}
                        </span>
                        {isSameLocalDay(entry.lastReviewedAt) && (
                          <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#ecfdf5] text-[#115e59]">
                            Reviewed today
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Org ID {entry.organizationId}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                        Updated {formatDate(entry.updatedAt)}
                      </span>
                      <Link
                        href={`/funding/discovery/${entry.organizationId}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Discovery Detail
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-200 bg-[#fffdf7] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Shared Note
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {String(entry.note || '').trim() || 'No shared note recorded.'}
                      </div>
                    </div>
                    <div className="border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Activity State
                      </div>
                      <div className="text-sm font-black text-black">
                        {entry.lastActivityType || 'No activity yet'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Last activity {formatDate(entry.lastActivityAt)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Last reviewed {formatDate(entry.lastReviewedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      Recent Shared Activity
                    </div>
                    <div className="space-y-2">
                      {(entry.activityLog || []).slice(0, 4).map((activity) => (
                        <div
                          key={activity.id}
                          className="border border-gray-200 bg-[#f8fafc] p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold text-black">{activity.detail}</div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            {activity.type}
                          </div>
                        </div>
                      ))}
                      {(entry.activityLog || []).length === 0 && (
                        <div className="text-sm text-gray-500">
                          No shared activity recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FundingDiscoveryWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <FundingDiscoveryWorkspacePageContent />
    </Suspense>
  );
}
