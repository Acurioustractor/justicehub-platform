'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Workflow } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface ConversationOutcomeFollowUpTask {
  id: string;
  parentConversationTaskId?: string | null;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  opportunityId?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  matchScore: number;
  followUpKind?: string | null;
  followUpLabel?: string | null;
  outcomeKind?: string | null;
  promotedRelationshipId?: string | null;
  promotedRelationshipStatus?: string | null;
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

export default function FundingConversationOutcomeFollowUpsPage() {
  const [tasks, setTasks] = useState<ConversationOutcomeFollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'completed'>(
    'all'
  );
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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
      const response = await fetch(
        `/api/admin/funding/os/conversations/follow-ups?${params.toString()}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load outcome follow-ups');
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load outcome follow-ups'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
    }),
    [tasks]
  );

  const updateStatus = async (
    taskId: string,
    status: 'queued' | 'running' | 'completed'
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/conversations/follow-ups/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update outcome follow-up');
      }

      setNotice({
        type: 'success',
        message:
          status === 'completed'
            ? 'Marked outcome follow-up complete.'
            : status === 'running'
              ? 'Outcome follow-up is now in progress.'
              : 'Outcome follow-up returned to queue.',
      });
      await loadTasks(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error ? updateError.message : 'Failed to update outcome follow-up',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const promoteToRelationship = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpTaskId: taskId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to promote relationship');
      }

      setNotice({
        type: 'success',
        message: payload.existing
          ? 'Opened existing relationship record.'
          : 'Promoted follow-up into a durable relationship record.',
      });
      await loadTasks(true);
    } catch (promoteError) {
      setNotice({
        type: 'error',
        message:
          promoteError instanceof Error ? promoteError.message : 'Failed to promote relationship',
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
                href="/admin/funding/os/conversations"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Conversations
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Outcome Follow-ups</h1>
                  <p className="text-base text-gray-600">
                    Work the concrete next actions created when a conversation closes.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/admin/funding/os/relationships"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Relationships
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
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
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue Filter</div>
                <div className="text-sm font-black text-black">
                  Showing {tasks.length} follow-up task{tasks.length === 1 ? '' : 's'}
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
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading outcome follow-ups…
            </div>
          ) : tasks.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              No outcome follow-ups match the current queue filter.
            </div>
          ) : (
            <div className="space-y-5">
              {tasks.map((task) => {
                const responseHref = task.parentConversationTaskId
                  ? `/funding/conversations/${encodeURIComponent(task.parentConversationTaskId)}`
                  : '/admin/funding/os/conversations';

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
                          {task.promotedRelationshipId && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-violet-100 text-violet-800">
                              Relationship {task.promotedRelationshipStatus || 'active'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[task.organizationName, task.funderName].filter(Boolean).join(' • ') ||
                            'Conversation follow-up'}
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
                          Follow-up
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.followUpLabel || 'Operational follow-up'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.opportunityName || 'Funding opportunity'}
                        </div>
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Task Audit
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.lastAudit?.summary || 'Queued outcome follow-up.'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.lastAudit?.at ? formatDate(task.lastAudit.at) : '—'} •{' '}
                          {task.auditEntryCount || 0} audit entr{task.auditEntryCount === 1 ? 'y' : 'ies'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                      {task.status === 'completed' && !task.promotedRelationshipId && (
                        <button
                          type="button"
                          onClick={() => promoteToRelationship(task.id)}
                          disabled={updatingTaskId === task.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-[#f5f3ff] text-[#5b21b6] hover:bg-[#ede9fe] transition-colors disabled:opacity-50"
                        >
                          Promote to Relationship
                        </button>
                      )}
                      <Link
                        href={responseHref}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Conversation
                      </Link>
                      {task.promotedRelationshipId && (
                        <Link
                          href="/admin/funding/os/relationships"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Relationships
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
