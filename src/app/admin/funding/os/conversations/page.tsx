'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface ConversationTask {
  id: string;
  sourceId?: string | null;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  reviewDecision?: 'acknowledged' | 'resolved' | string | null;
  reviewFeedback?: string | null;
  reviewedAt?: string | null;
  needsReview: boolean;
  recommendationId?: string | null;
  organizationId?: string | null;
  opportunityId?: string | null;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  matchScore: number;
  brief?: string;
  responseKind?: string | null;
  responseMessage?: string | null;
  responderName?: string | null;
  responderEmail?: string | null;
  respondedAt?: string | null;
  nextStepKind?: string | null;
  nextStepLabel?: string | null;
  nextStepScheduledAt?: string | null;
  outcomeKind?: string | null;
  outcomeLabel?: string | null;
  outcomeRecordedAt?: string | null;
  outcomeFollowUpTaskId?: string | null;
  outcomeFollowUpKind?: string | null;
  outcomeFollowUpLabel?: string | null;
  relationshipNoticeKind?: string | null;
  relationshipNoticeLabel?: string | null;
  relationshipNoticeMessage?: string | null;
  relationshipNoticeRecordedAt?: string | null;
  relationshipNoticeRequestResponse?: boolean;
  relationshipNoticeResponsePrompt?: string | null;
  relationshipNoticeResponseStatus?: string | null;
  relationshipNoticeResponseMessage?: string | null;
  relationshipNoticeResponderName?: string | null;
  relationshipNoticeResponderEmail?: string | null;
  relationshipNoticeRespondedAt?: string | null;
  auditEntryCount?: number;
  lastAudit?: {
    action: string;
    actorId?: string | null;
    at?: string | null;
    summary: string;
  } | null;
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

function nextStepBadgeLabel(kind?: string | null) {
  if (!kind) return null;
  switch (kind) {
    case 'reassess_relationship_pause':
      return 'Reassess relationship';
    case 'review_pipeline_risk_context':
      return 'Adjust pipeline risk';
    case 'review_relationship_update_reply':
      return 'Generic review';
    case 'intro_call':
      return 'Intro call';
    case 'send_follow_up_info':
      return 'Send info';
    case 'check_in_later':
      return 'Later check-in';
    default:
      return kind.replace(/_/g, ' ');
  }
}

export default function FundingOsConversationRequestsPage() {
  const [tasks, setTasks] = useState<ConversationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'completed'>(
    'all'
  );
  const [relationshipReplyOnly, setRelationshipReplyOnly] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    const reply = searchParams.get('reply');

    if (status === 'queued' || status === 'running' || status === 'completed' || status === 'all') {
      setStatusFilter(status);
    }

    if (reply === 'relationship') {
      setRelationshipReplyOnly(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);

    if (statusFilter === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', statusFilter);
    }

    if (relationshipReplyOnly) {
      url.searchParams.set('reply', 'relationship');
    } else {
      url.searchParams.delete('reply');
    }

    const search = url.searchParams.toString();
    const nextUrl = search ? `${url.pathname}?${search}` : url.pathname;
    window.history.replaceState({}, '', nextUrl);
  }, [relationshipReplyOnly, statusFilter]);

  const loadTasks = async (background = false) => {
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
      const response = await fetch(`/api/admin/funding/os/conversations?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load conversation requests');
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load conversation requests'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const visibleTasks = useMemo(
    () =>
      relationshipReplyOnly
        ? tasks.filter(
            (task) =>
              task.relationshipNoticeResponseStatus === 'received' &&
              task.reviewDecision !== 'acknowledged' &&
              task.reviewDecision !== 'resolved'
          )
        : tasks,
    [relationshipReplyOnly, tasks]
  );

  const summary = useMemo(
    () => ({
      total: visibleTasks.length,
      queued: visibleTasks.filter((task) => task.status === 'queued' || task.status === 'pending')
        .length,
      running: visibleTasks.filter(
        (task) => task.status === 'running' || task.status === 'in_progress'
      ).length,
      completed: visibleTasks.filter((task) => task.status === 'completed').length,
      relationshipRepliesAwaitingReview: tasks.filter(
        (task) =>
          task.relationshipNoticeResponseStatus === 'received' &&
          task.reviewDecision !== 'acknowledged' &&
          task.reviewDecision !== 'resolved'
      ).length,
    }),
    [tasks, visibleTasks]
  );

  const updateStatus = async (
    taskId: string,
    status: 'queued' | 'running' | 'completed'
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/conversations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update conversation request');
      }

      setNotice({
        type: 'success',
        message:
          status === 'completed'
            ? 'Marked conversation request complete.'
            : status === 'running'
              ? 'Conversation request is now in progress.'
              : 'Conversation request returned to queue.',
      });
      await loadTasks(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error
            ? updateError.message
            : 'Failed to update conversation request',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const acknowledgeResponse = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/conversations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to acknowledge conversation response');
      }

      setNotice({
        type: 'success',
        message: 'Acknowledged community reply.',
      });
      await loadTasks(true);
    } catch (ackError) {
      setNotice({
        type: 'error',
        message:
          ackError instanceof Error
            ? ackError.message
            : 'Failed to acknowledge conversation response',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const acceptAndScheduleNextStep = async (
    taskId: string,
    nextStepKind?:
      | 'reassess_relationship_pause'
      | 'review_pipeline_risk_context'
      | 'review_relationship_update_reply'
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/conversations/next-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextStepKind ? { taskId, nextStepKind } : { taskId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to schedule next step');
      }

      setNotice({
        type: 'success',
        message: nextStepKind
          ? 'Accepted relationship reply and scheduled the selected next step.'
          : 'Accepted response and scheduled the next step.',
      });
      await loadTasks(true);
    } catch (nextStepError) {
      setNotice({
        type: 'error',
        message:
          nextStepError instanceof Error
            ? nextStepError.message
            : 'Failed to schedule next step',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completeWithOutcome = async (
    taskId: string,
    outcomeKind: 'mutual_fit' | 'paused_after_check_in'
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/conversations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, outcomeKind }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to complete conversation');
      }

      setNotice({
        type: 'success',
        message:
          outcomeKind === 'mutual_fit'
            ? 'Closed conversation as mutual fit.'
            : 'Paused conversation after check-in.',
      });
      await loadTasks(true);
    } catch (outcomeError) {
      setNotice({
        type: 'error',
        message:
          outcomeError instanceof Error
            ? outcomeError.message
            : 'Failed to complete conversation',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

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
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Conversation Requests</h1>
                  <p className="text-base text-gray-600">
                    Work tracked outreach requests created from funder discovery and shortlist decisions.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/admin/funding/os/conversations/follow-ups"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Outcome Follow-ups
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadTasks(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-red-500 bg-red-50 text-red-800'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Visible</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Queued</div>
              <div className="text-4xl font-black text-amber-700">{summary.queued}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">In Progress</div>
              <div className="text-4xl font-black text-blue-700">{summary.running}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Completed</div>
              <div className="text-4xl font-black text-emerald-700">{summary.completed}</div>
            </div>
            <button
              type="button"
              onClick={() => setRelationshipReplyOnly((current) => !current)}
              disabled={summary.relationshipRepliesAwaitingReview === 0}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                relationshipReplyOnly ? 'bg-[#ede9fe]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                Rel Replies
              </div>
              <div className="text-4xl font-black text-[#5b21b6]">
                {summary.relationshipRepliesAwaitingReview}
              </div>
              <div className="mt-2 text-[11px] font-black text-gray-600">
                {relationshipReplyOnly ? 'Active review lane' : 'Awaiting review'}
              </div>
            </button>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue Filter</div>
                <div className="text-sm font-black text-black">
                  Showing {summary.total} of {tasks.length} tracked conversation request
                  {tasks.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'queued', 'running', 'completed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      statusFilter === value
                        ? 'bg-[#0f766e] text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    >
                      {value === 'all'
                      ? 'All'
                      : value === 'queued'
                        ? 'Queued'
                        : value === 'running'
                          ? 'In Progress'
                          : 'Completed'}
                    </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRelationshipReplyOnly((current) => !current)}
                  disabled={summary.relationshipRepliesAwaitingReview === 0}
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors disabled:opacity-50 ${
                    relationshipReplyOnly
                      ? 'bg-[#ede9fe] text-[#5b21b6]'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {relationshipReplyOnly ? 'Relationship Replies' : 'Show Relationship Replies'}
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading conversation requests…
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {relationshipReplyOnly
                ? 'No relationship replies are awaiting review in the current queue slice.'
                : 'No conversation requests match the current queue filter.'}
            </div>
          ) : (
            <div className="space-y-5">
              {visibleTasks.map((task) => {
                const pipelineHref = task.organizationId
                  ? task.opportunityId
                    ? `/admin/funding/os/pipeline?organizationId=${encodeURIComponent(
                        task.organizationId
                      )}&opportunityId=${encodeURIComponent(task.opportunityId)}`
                    : `/admin/funding/os/pipeline?organizationId=${encodeURIComponent(
                        task.organizationId
                      )}`
                  : '/admin/funding/os/pipeline';
                const responseHref = `/funding/conversations/${encodeURIComponent(task.id)}`;

                return (
                  <article
                    key={task.id}
                    className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl font-black text-black">{task.title}</h2>
                          <span
                            className={`px-2 py-1 text-[11px] font-black border border-black ${statusClass(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                          {task.needsReview && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                              Needs review
                            </span>
                          )}
                          {task.reviewDecision === 'acknowledged' && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-blue-100 text-blue-800">
                              Response acknowledged
                            </span>
                          )}
                          {task.respondedAt && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                              Community replied
                            </span>
                          )}
                          {task.nextStepLabel && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-emerald-100 text-emerald-800">
                              Next step scheduled
                            </span>
                          )}
                          {task.nextStepKind && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#dcfce7] text-[#166534]">
                              {nextStepBadgeLabel(task.nextStepKind)}
                            </span>
                          )}
                          {task.outcomeLabel && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-violet-100 text-violet-800">
                              Outcome recorded
                            </span>
                          )}
                          {task.relationshipNoticeLabel && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#d1fae5] text-[#065f46]">
                              Relationship updated
                            </span>
                          )}
                          {task.relationshipNoticeRespondedAt && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#ede9fe] text-[#5b21b6]">
                              Relationship reply received
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[task.organizationName, task.funderName].filter(Boolean).join(' • ') ||
                            'Tracked conversation request'}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-700 mt-2">{task.description}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          Match {task.matchScore}
                        </span>
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          Created {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Opportunity
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.opportunityName || 'Funding opportunity'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.funderName || 'Funder not recorded'}
                        </div>
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Task Audit
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.lastAudit?.summary || 'Created tracked conversation request.'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.lastAudit?.at ? formatDate(task.lastAudit.at) : '—'} •{' '}
                          {task.auditEntryCount || 0} audit entr{task.auditEntryCount === 1 ? 'y' : 'ies'}
                        </div>
                      </div>
                    </div>

                    {task.brief && (
                      <div className="border border-gray-200 bg-[#fffdf7] p-4 mb-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Outreach Brief
                        </div>
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans">
                          {task.brief}
                        </pre>
                      </div>
                    )}

                    {task.respondedAt && (
                      <div className="border border-gray-200 bg-[#eef4ff] p-4 mb-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Community Response
                        </div>
                        <div className="text-sm font-black text-black mb-1">
                          {(task.responseKind || 'response').replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {task.responderName || 'Community responder'}
                          {task.responderEmail ? ` • ${task.responderEmail}` : ''}
                          {' • '}
                          {formatDate(task.respondedAt)}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {task.responseMessage || '—'}
                        </div>
                      </div>
                    )}

                    {task.nextStepLabel && (
                      <div className="border border-gray-200 bg-[#ecfdf5] p-4 mb-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Next Step
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.nextStepLabel}
                        </div>
                        {task.nextStepKind && (
                          <div className="text-xs font-bold text-[#166534] mt-1">
                            Route: {nextStepBadgeLabel(task.nextStepKind)}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDate(task.nextStepScheduledAt)}
                        </div>
                      </div>
                    )}

                    {task.outcomeLabel && (
                      <div className="border border-gray-200 bg-[#f5f3ff] p-4 mb-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Conversation Outcome
                        </div>
                        <div className="text-sm font-black text-black">{task.outcomeLabel}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDate(task.outcomeRecordedAt)}
                        </div>
                        {task.outcomeFollowUpLabel && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Operational Follow-up
                            </div>
                            <div className="text-sm font-black text-black">
                              {task.outcomeFollowUpLabel}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {task.relationshipNoticeLabel && (
                      <div className="border border-gray-200 bg-[#ecfdf5] p-4 mb-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Relationship Update
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.relationshipNoticeLabel}
                        </div>
                        {task.relationshipNoticeMessage && (
                          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                            {task.relationshipNoticeMessage}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDate(task.relationshipNoticeRecordedAt)}
                        </div>
                        {task.relationshipNoticeResponsePrompt && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Reply Requested
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {task.relationshipNoticeResponsePrompt}
                            </div>
                          </div>
                        )}
                        {task.relationshipNoticeRespondedAt && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Relationship Reply
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {task.relationshipNoticeResponderName || 'Community responder'}
                              {task.relationshipNoticeResponderEmail
                                ? ` • ${task.relationshipNoticeResponderEmail}`
                                : ''}
                              {' • '}
                              {formatDate(task.relationshipNoticeRespondedAt)}
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {task.relationshipNoticeResponseMessage || '—'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {task.respondedAt &&
                        task.status !== 'completed' &&
                        !task.nextStepLabel && (
                          <button
                            type="button"
                            onClick={() => acceptAndScheduleNextStep(task.id)}
                            disabled={updatingTaskId === task.id}
                            className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                          >
                            Accept + Next Step
                          </button>
                        )}
                      {task.relationshipNoticeRespondedAt &&
                        task.reviewDecision !== 'acknowledged' &&
                        task.reviewDecision !== 'resolved' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                acceptAndScheduleNextStep(task.id, 'review_relationship_update_reply')
                              }
                              disabled={updatingTaskId === task.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Accept + Generic Review
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                acceptAndScheduleNextStep(task.id, 'reassess_relationship_pause')
                              }
                              disabled={updatingTaskId === task.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              Accept + Reassess Relationship
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                acceptAndScheduleNextStep(task.id, 'review_pipeline_risk_context')
                              }
                              disabled={updatingTaskId === task.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-[#fff7e6] text-[#b45309] hover:bg-[#ffefc2] transition-colors disabled:opacity-50"
                            >
                              Accept + Adjust Pipeline Risk
                            </button>
                          </>
                        )}
                      {task.nextStepLabel &&
                        task.status !== 'completed' &&
                        !task.outcomeKind && (
                          <>
                            <button
                              type="button"
                              onClick={() => completeWithOutcome(task.id, 'mutual_fit')}
                              disabled={updatingTaskId === task.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              Complete as Mutual Fit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                completeWithOutcome(task.id, 'paused_after_check_in')
                              }
                              disabled={updatingTaskId === task.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Pause After Check-in
                            </button>
                          </>
                        )}
                      {(task.respondedAt || task.relationshipNoticeRespondedAt) &&
                        task.reviewDecision !== 'acknowledged' &&
                        task.reviewDecision !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => acknowledgeResponse(task.id)}
                            disabled={updatingTaskId === task.id}
                            className="px-3 py-2 text-xs font-black border-2 border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                          >
                            {task.relationshipNoticeRespondedAt &&
                            !task.respondedAt
                              ? 'Acknowledge Relationship Reply'
                              : 'Acknowledge Reply'}
                          </button>
                        )}
                      {task.status !== 'running' && task.status !== 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, 'running')}
                          disabled={updatingTaskId === task.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Start Work
                        </button>
                      )}
                      {task.status !== 'queued' && task.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, 'queued')}
                          disabled={updatingTaskId === task.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Return to Queue
                        </button>
                      )}
                      {task.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, 'completed')}
                          disabled={updatingTaskId === task.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      )}
                      <Link
                        href={pipelineHref}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Pipeline
                      </Link>
                      <Link
                        href={responseHref}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Response Page
                      </Link>
                      {task.outcomeFollowUpTaskId && (
                        <Link
                          href="/admin/funding/os/conversations/follow-ups"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Outcome Follow-ups
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
