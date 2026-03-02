'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Workflow } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface RelationshipPathwayTask {
  id: string;
  relationshipId?: string | null;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  pathwayTaskKind?: string | null;
  pathwayTaskLabel?: string | null;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
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

function getTaskAgeHours(task: RelationshipPathwayTask) {
  const referenceTime =
    task.status === 'running' || task.status === 'in_progress'
      ? task.startedAt || task.createdAt
      : task.createdAt;

  if (!referenceTime || task.status === 'completed') return null;

  const started = new Date(referenceTime).getTime();
  if (!Number.isFinite(started)) return null;

  const diff = Date.now() - started;
  if (!Number.isFinite(diff) || diff < 0) return null;

  return diff / (1000 * 60 * 60);
}

function isTaskOverdue(task: RelationshipPathwayTask) {
  const ageHours = getTaskAgeHours(task);
  if (ageHours == null) return false;

  if (task.status === 'running' || task.status === 'in_progress') {
    return ageHours >= 12;
  }

  return ageHours >= 24;
}

function formatTaskAge(task: RelationshipPathwayTask) {
  const ageHours = getTaskAgeHours(task);
  if (ageHours == null) return '—';
  if (ageHours < 1) return '<1h';
  if (ageHours < 24) return `${Math.round(ageHours)}h`;
  const days = ageHours / 24;
  if (days < 2) return '1d';
  return `${Math.round(days)}d`;
}

export default function FundingRelationshipPathwayTasksPage() {
  const [tasks, setTasks] = useState<RelationshipPathwayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'completed'>(
    'all'
  );
  const [overdueOnly, setOverdueOnly] = useState(false);
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
        `/api/admin/funding/os/relationships/pathway-tasks?${params.toString()}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load funding pathway tasks');
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load funding pathway tasks'
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
    () => (overdueOnly ? tasks.filter((task) => isTaskOverdue(task)) : tasks),
    [tasks, overdueOnly]
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
      overdue: visibleTasks.filter((task) => isTaskOverdue(task)).length,
    }),
    [visibleTasks]
  );

  const updateStatus = async (
    taskId: string,
    status: 'queued' | 'running' | 'completed'
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/relationships/pathway-tasks/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update funding pathway task');
      }

      setNotice({
        type: 'success',
        message:
          status === 'completed'
            ? 'Marked funding pathway task complete.'
            : status === 'running'
              ? 'Funding pathway task is now in progress.'
              : 'Funding pathway task returned to queue.',
      });
      await loadTasks(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error
            ? updateError.message
            : 'Failed to update funding pathway task',
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
                href="/admin/funding/os/relationships"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Relationships
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Funding Pathway Tasks</h1>
                  <p className="text-base text-gray-600">
                    Work the concrete funding actions created once a relationship becomes engaged.
                  </p>
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
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Overdue</div>
              <div className="text-4xl font-black text-rose-700">{summary.overdue}</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue Filter</div>
                <div className="text-sm font-black text-black">
                  Showing {visibleTasks.length} of {tasks.length} funding pathway task
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
                  onClick={() => setOverdueOnly((current) => !current)}
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                    overdueOnly ? 'bg-rose-100 text-rose-800' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {overdueOnly ? 'Overdue Only' : 'Show Overdue Only'}
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading funding pathway tasks…
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {overdueOnly
                ? 'No overdue funding pathway tasks match the current queue filter.'
                : 'No funding pathway tasks match the current queue filter.'}
            </div>
          ) : (
            <div className="space-y-5">
              {visibleTasks.map((task) => {
                const overdue = isTaskOverdue(task);

                return (
                  <article
                    key={task.id}
                    className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl font-black text-black">
                            {task.organizationName || task.title}
                          </h2>
                          <span
                            className={`px-2 py-1 text-[11px] font-black border border-black ${statusClass(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                          {overdue && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                              overdue
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[task.funderName, task.opportunityName].filter(Boolean).join(' • ') ||
                            'Funding pathway progression'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          {task.pathwayTaskLabel || 'Advance the funding pathway'}
                        </span>
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          Age {formatTaskAge(task)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Task Detail
                        </div>
                        <div className="text-sm font-black text-black">{task.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.description || 'No task description recorded.'}
                        </div>
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Audit
                        </div>
                        <div className="text-sm font-black text-black">
                          {task.lastAudit?.summary || 'No audit yet'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.lastAudit?.at ? formatDate(task.lastAudit.at) : '—'} •{' '}
                          {task.auditEntryCount || 0} entr{task.auditEntryCount === 1 ? 'y' : 'ies'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status !== 'running' && task.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, 'running')}
                          disabled={updatingTaskId === task.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Start Work
                        </button>
                      )}
                      {task.status !== 'queued' && task.status !== 'completed' && (
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
                      {task.relationshipId && (
                        <Link
                          href="/admin/funding/os/relationships"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Relationship
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
