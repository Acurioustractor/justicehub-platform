'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck2, RefreshCw } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface ApplicationDraftReviewTask {
  id: string;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  reviewDecision?: string | null;
  reviewFeedback?: string | null;
  reviewedAt?: string | null;
  organizationId?: string | null;
  opportunityId?: string | null;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  narrativePresent?: boolean;
  supportMaterialCount?: number;
  communityReviewNoteCount?: number;
  requestedAt?: string | null;
  communityReviewerRecommendation?: string | null;
  communityReviewerNote?: string | null;
  communityReviewerName?: string | null;
  communityReviewerConnection?: string | null;
  communityReviewerRespondedAt?: string | null;
  communityReviewerResponseCount?: number;
  communityReviewerEndorseCount?: number;
  communityReviewerRequestChangesCount?: number;
  communityReviewerRaiseConcernCount?: number;
  resolution?: string | null;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
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

function statusClass(status?: string | null) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'running' || status === 'in_progress') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

function resolutionLabel(value?: string | null) {
  if (value === 'ready_to_submit') return 'Ready to submit';
  if (value === 'needs_revision') return 'Needs revision';
  return null;
}

function FundingApplicationDraftReviewsPageContent() {
  const [tasks, setTasks] = useState<ApplicationDraftReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'completed'>(
    'all'
  );
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  async function loadTasks(background = false) {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '40');
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const response = await fetch(
        `/api/admin/funding/os/application-draft-reviews?${params.toString()}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load application draft reviews');
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load application draft reviews'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      queued: tasks.filter((task) => task.status === 'queued' || task.status === 'pending').length,
      running: tasks.filter((task) => task.status === 'running' || task.status === 'in_progress')
        .length,
      completed: tasks.filter((task) => task.status === 'completed').length,
      endorsements: tasks.reduce(
        (sum, task) => sum + Number(task.communityReviewerEndorseCount || 0),
        0
      ),
      changes: tasks.reduce(
        (sum, task) => sum + Number(task.communityReviewerRequestChangesCount || 0),
        0
      ),
      concerns: tasks.reduce(
        (sum, task) => sum + Number(task.communityReviewerRaiseConcernCount || 0),
        0
      ),
    }),
    [tasks]
  );

  async function updateStatus(taskId: string, status: 'queued' | 'running') {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);

      const response = await fetch('/api/admin/funding/os/application-draft-reviews/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update review task');
      }

      setNotice({
        type: 'success',
        message:
          status === 'running'
            ? 'Community review moved into progress.'
            : 'Community review returned to queue.',
      });
      await loadTasks(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error ? updateError.message : 'Failed to update review task',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function resolveTask(
    taskId: string,
    resolution: 'ready_to_submit' | 'needs_revision'
  ) {
    const note = String(reviewNotes[taskId] || '').trim();

    if (!note) {
      setNotice({
        type: 'error',
        message: 'Add a short review note before resolving this draft review.',
      });
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      setNotice(null);

      const response = await fetch('/api/admin/funding/os/application-draft-reviews/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, resolution, note }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to resolve draft review');
      }

      setNotice({
        type: 'success',
        message:
          resolution === 'ready_to_submit'
            ? 'Draft marked ready to submit.'
            : 'Draft returned for revision with review feedback.',
      });
      setReviewNotes((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
      await loadTasks(true);
    } catch (resolveError) {
      setNotice({
        type: 'error',
        message:
          resolveError instanceof Error ? resolveError.message : 'Failed to resolve draft review',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Application Draft Reviews</h1>
                  <p className="text-base text-gray-600">
                    Work the community review queue before applications move into live submission.
                  </p>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-600">
                Showing {tasks.length} review task{tasks.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | 'queued' | 'running' | 'completed')
                }
                className="bg-white border-2 border-black px-3 py-2 text-sm font-bold"
              >
                <option value="all">All statuses</option>
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="button"
                onClick={() => void loadTasks(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Visible</div>
              <div className="text-2xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queued</div>
              <div className="text-2xl font-black text-black">{summary.queued}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Running</div>
              <div className="text-2xl font-black text-black">{summary.running}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-black text-black">{summary.completed}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Endorse</div>
              <div className="text-2xl font-black text-black">{summary.endorsements}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Changes</div>
              <div className="text-2xl font-black text-black">{summary.changes}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Concerns</div>
              <div className="text-2xl font-black text-black">{summary.concerns}</div>
            </div>
          </div>

          {notice && (
            <div
              className={`border-2 px-4 py-3 text-sm font-bold ${
                notice.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-red-300 bg-red-50 text-red-900'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white border-2 border-black p-6 text-sm font-bold text-gray-600">
              Loading application draft reviews…
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white border-2 border-black p-6 text-sm font-bold text-gray-600">
              No application draft review tasks match the current filter.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isRunning =
                  task.status === 'running' || task.status === 'in_progress';
                const currentNote = reviewNotes[task.id] || '';

                return (
                  <div
                    key={task.id}
                    className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-[11px] font-black border border-black ${statusClass(task.status)}`}
                          >
                            {task.status}
                          </span>
                          {task.reviewDecision === 'resolved' && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-emerald-50 text-emerald-800">
                              resolved
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-black">{task.title}</h2>
                        <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                      </div>
                      <div className="text-xs font-bold text-gray-600 space-y-1">
                        <div>Requested: {formatDate(task.requestedAt || task.createdAt)}</div>
                        <div>Started: {formatDate(task.startedAt)}</div>
                        <div>Completed: {formatDate(task.completedAt)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-1">Organization</div>
                        <div className="text-sm font-black text-black">
                          {task.organizationName || '—'}
                        </div>
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-1">Opportunity</div>
                        <div className="text-sm font-black text-black">
                          {task.opportunityName || '—'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{task.funderName || '—'}</div>
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-1">Draft Signals</div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>Narrative: {task.narrativePresent ? 'present' : 'missing'}</div>
                          <div>Support items: {task.supportMaterialCount || 0}</div>
                          <div>Review notes: {task.communityReviewNoteCount || 0}</div>
                        </div>
                      </div>
                    </div>

                    {task.communityReviewerRespondedAt && (
                      <div className="mt-4 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                        <div className="font-black mb-1">Community Reviewer Input</div>
                        <div className="font-semibold">
                          {(task.communityReviewerRecommendation || 'response').replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs font-bold text-blue-900 mt-1">
                          Responses: {task.communityReviewerResponseCount || 1}
                        </div>
                        <div className="text-xs text-blue-900 mt-1">
                          {task.communityReviewerName || 'Community reviewer'}
                          {task.communityReviewerConnection
                            ? ` • ${task.communityReviewerConnection}`
                            : ''}
                          {' • '}
                          {formatDate(task.communityReviewerRespondedAt)}
                        </div>
                        {task.communityReviewerNote && (
                          <div className="mt-2 whitespace-pre-wrap">{task.communityReviewerNote}</div>
                        )}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="border border-blue-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black uppercase text-gray-600">
                              Endorse
                            </div>
                            <div className="text-lg font-black text-black">
                              {task.communityReviewerEndorseCount || 0}
                            </div>
                          </div>
                          <div className="border border-blue-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black uppercase text-gray-600">
                              Changes
                            </div>
                            <div className="text-lg font-black text-black">
                              {task.communityReviewerRequestChangesCount || 0}
                            </div>
                          </div>
                          <div className="border border-blue-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black uppercase text-gray-600">
                              Concerns
                            </div>
                            <div className="text-lg font-black text-black">
                              {task.communityReviewerRaiseConcernCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {!isCompleted && !isRunning && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(task.id, 'running')}
                          disabled={updatingTaskId === task.id}
                          className="inline-flex items-center justify-center px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60"
                        >
                          Start Review
                        </button>
                      )}
                      {!isCompleted && isRunning && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(task.id, 'queued')}
                          disabled={updatingTaskId === task.id}
                          className="inline-flex items-center justify-center px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60"
                        >
                          Return to Queue
                        </button>
                      )}
                      {task.organizationId && task.opportunityId && (
                        <Link
                          href={`/funding/workspace/${task.organizationId}/applications/${task.opportunityId}`}
                          className="inline-flex items-center justify-center px-4 py-3 bg-[#1d4ed8] text-white font-bold border-2 border-black hover:bg-[#1e40af]"
                        >
                          Open Draft Workspace
                        </Link>
                      )}
                    </div>

                    {!isCompleted ? (
                      <div className="mt-4 border border-gray-200 bg-[#f8fafc] p-4 space-y-3">
                        <div className="text-xs uppercase font-bold text-gray-600">
                          Review Resolution Note
                        </div>
                        <textarea
                          value={currentNote}
                          onChange={(event) =>
                            setReviewNotes((current) => ({
                              ...current,
                              [task.id]: event.target.value,
                            }))
                          }
                          rows={4}
                          className="w-full border-2 border-black p-3 text-sm text-black bg-white"
                          placeholder="Summarise what changed, what is still missing, or why this draft is ready to move."
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => void resolveTask(task.id, 'ready_to_submit')}
                            disabled={updatingTaskId === task.id || !currentNote.trim()}
                            className="inline-flex items-center justify-center px-4 py-3 bg-emerald-600 text-white font-bold border-2 border-black hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Mark Ready To Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => void resolveTask(task.id, 'needs_revision')}
                            disabled={updatingTaskId === task.id || !currentNote.trim()}
                            className="inline-flex items-center justify-center px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60"
                          >
                            Return For Revision
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                        <div className="font-black mb-1">
                          {resolutionLabel(task.resolution) || 'Review completed'}
                        </div>
                        <div>{task.reviewFeedback || 'No review feedback recorded.'}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FundingApplicationDraftReviewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f6f2] page-content" />}>
      <FundingApplicationDraftReviewsPageContent />
    </Suspense>
  );
}
