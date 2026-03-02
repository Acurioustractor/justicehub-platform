'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Workflow } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface RelationshipStageTask {
  id: string;
  relationshipId?: string | null;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  stageKey?: string | null;
  stageTaskKind?: string | null;
  stageTaskLabel?: string | null;
  partnerRiskResolution?: string | null;
  partnerRiskResolutionNote?: string | null;
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

function getTaskAgeHours(task: RelationshipStageTask) {
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

function isTaskOverdue(task: RelationshipStageTask) {
  const ageHours = getTaskAgeHours(task);
  if (ageHours == null) return false;

  if (task.status === 'running' || task.status === 'in_progress') {
    return ageHours >= 12;
  }

  return ageHours >= 24;
}

function formatTaskAge(task: RelationshipStageTask) {
  const ageHours = getTaskAgeHours(task);
  if (ageHours == null) return '—';
  if (ageHours < 1) return '<1h';
  if (ageHours < 24) return `${Math.round(ageHours)}h`;
  const days = ageHours / 24;
  if (days < 2) return '1d';
  return `${Math.round(days)}d`;
}

function isResolvedPartnerRiskTask(task: RelationshipStageTask) {
  return task.stageKey === 'partner_risk_review' && task.status === 'completed';
}

function FundingRelationshipStageTasksPageContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<RelationshipStageTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'completed'>(
    'all'
  );
  const [stageKeyFilter, setStageKeyFilter] = useState<'all' | 'partner_risk_review'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [partnerRiskNotes, setPartnerRiskNotes] = useState<Record<string, string>>({});

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
      if (stageKeyFilter !== 'all') {
        params.set('stageKey', stageKeyFilter);
      }
      const response = await fetch(
        `/api/admin/funding/os/relationships/stage-tasks?${params.toString()}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load relationship stage tasks');
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load relationship stage tasks'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [stageKeyFilter, statusFilter]);

  useEffect(() => {
    const stageKey = String(searchParams.get('stageKey') || 'all')
      .trim()
      .toLowerCase();
    if (stageKey === 'partner_risk_review') {
      setStageKeyFilter('partner_risk_review');
    } else {
      setStageKeyFilter('all');
    }
  }, [searchParams]);

  const visibleTasks = useMemo(
    () => (overdueOnly ? tasks.filter((task) => isTaskOverdue(task)) : tasks),
    [tasks, overdueOnly]
  );
  const resolvedPartnerRiskCount = useMemo(
    () => tasks.filter((task) => isResolvedPartnerRiskTask(task)).length,
    [tasks]
  );

  const resolvedPartnerRiskSliceActive =
    stageKeyFilter === 'partner_risk_review' &&
    statusFilter === 'completed' &&
    !overdueOnly;

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
      resolvedPartnerRisk: visibleTasks.filter((task) => isResolvedPartnerRiskTask(task)).length,
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
      const response = await fetch('/api/admin/funding/os/relationships/stage-tasks/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update stage task');
      }

      setNotice({
        type: 'success',
        message:
          status === 'completed'
            ? 'Marked stage task complete.'
            : status === 'running'
              ? 'Stage task is now in progress.'
              : 'Stage task returned to queue.',
      });
      await loadTasks(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error ? updateError.message : 'Failed to update stage task',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const resolvePartnerRiskTask = async (
    taskId: string,
    resolution: 'no_relationship_impact' | 'pause_relationship' | 'escalate_pipeline_risk'
  ) => {
    const note = String(partnerRiskNotes[taskId] || '').trim();

    if (!note) {
      setNotice({
        type: 'error',
        message: 'Add a short partner-risk review note before resolving this task.',
      });
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      setNotice(null);
      const response = await fetch(
        '/api/admin/funding/os/relationships/stage-tasks/partner-risk-resolve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, resolution, note }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to resolve partner-risk review');
      }

      setNotice({
        type: 'success',
        message:
          resolution === 'no_relationship_impact'
            ? 'Marked partner-risk review as no relationship impact.'
            : resolution === 'pause_relationship'
              ? 'Paused the relationship after partner-risk review.'
              : 'Escalated partner-risk review into the main pipeline-risk queue.',
      });
      setPartnerRiskNotes((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
      await loadTasks(true);
    } catch (resolveError) {
      setNotice({
        type: 'error',
        message:
          resolveError instanceof Error
            ? resolveError.message
            : 'Failed to resolve partner-risk review',
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
                  <h1 className="text-4xl font-black text-black">Relationship Actions</h1>
                  <p className="text-base text-gray-600">
                    Work the concrete tasks created when a relationship moves to a new stage.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/admin/funding/os/conversations?reply=relationship"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Relationship Replies
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5 mb-8">
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
            <button
              type="button"
              onClick={() => {
                if (!resolvedPartnerRiskSliceActive) {
                  setStageKeyFilter('partner_risk_review');
                  setStatusFilter('completed');
                  setOverdueOnly(false);
                }
              }}
              disabled={resolvedPartnerRiskCount === 0 && !resolvedPartnerRiskSliceActive}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                resolvedPartnerRiskSliceActive
                  ? 'bg-[#0f766e] text-white'
                  : 'bg-white hover:bg-[#ecfdf5]'
              }`}
            >
              <div
                className={`text-xs uppercase font-bold mb-2 ${
                  resolvedPartnerRiskSliceActive ? 'text-[#d1fae5]' : 'text-gray-600'
                }`}
              >
                Resolved Partner Risk
              </div>
              <div
                className={`text-4xl font-black ${
                  resolvedPartnerRiskSliceActive ? 'text-white' : 'text-[#0f766e]'
                }`}
              >
                {resolvedPartnerRiskCount}
              </div>
              <div
                className={`text-xs font-bold mt-2 ${
                  resolvedPartnerRiskSliceActive ? 'text-[#d1fae5]' : 'text-gray-600'
                }`}
              >
                {resolvedPartnerRiskSliceActive ? 'Active audit slice' : 'Open this lane'}
              </div>
            </button>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue Filter</div>
                <div className="text-sm font-black text-black">
                  Showing {visibleTasks.length} of {tasks.length} stage action task
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
                <button
                  type="button"
                  onClick={() =>
                    setStageKeyFilter((current) =>
                      current === 'partner_risk_review' ? 'all' : 'partner_risk_review'
                    )
                  }
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                    stageKeyFilter === 'partner_risk_review'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {stageKeyFilter === 'partner_risk_review'
                    ? 'Partner Risk Only'
                    : 'Show Partner Risk Only'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (resolvedPartnerRiskSliceActive) {
                      setStageKeyFilter('all');
                      setStatusFilter('all');
                    } else {
                      setStageKeyFilter('partner_risk_review');
                      setStatusFilter('completed');
                      setOverdueOnly(false);
                    }
                  }}
                  disabled={resolvedPartnerRiskCount === 0 && !resolvedPartnerRiskSliceActive}
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                    resolvedPartnerRiskSliceActive
                      ? 'bg-[#0f766e] text-white'
                      : 'bg-white hover:bg-gray-100 disabled:opacity-50'
                  }`}
                >
                  {resolvedPartnerRiskSliceActive
                    ? 'Resolved Partner Risk'
                    : 'Show Resolved Partner Risk'}
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading relationship actions…
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {resolvedPartnerRiskSliceActive
                ? 'No resolved partner-risk reviews match the current queue filter.'
                : 'No relationship actions match the current queue filter.'}
            </div>
          ) : (
            <div className="space-y-5">
              {visibleTasks.map((task) => (
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
                        {task.stageKey && (
                          <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                            {task.stageKey.replace(/_/g, ' ')}
                          </span>
                        )}
                        {isTaskOverdue(task) && (
                          <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {[task.organizationName, task.funderName].filter(Boolean).join(' • ') ||
                          'Relationship action'}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-700 mt-2">{task.description}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                        Created {formatDate(task.createdAt)}
                      </span>
                      <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                        Age {formatTaskAge(task)}
                      </span>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">Action</div>
                      <div className="text-sm font-black text-black">
                        {task.stageTaskLabel || 'Relationship action'}
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
                        {task.lastAudit?.summary || 'Queued relationship stage task.'}
                      </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {task.lastAudit?.at ? formatDate(task.lastAudit.at) : '—'} •{' '}
                          {task.auditEntryCount || 0} audit entr{task.auditEntryCount === 1 ? 'y' : 'ies'}
                        </div>
                        {task.partnerRiskResolutionNote && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Resolution Note
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {task.partnerRiskResolutionNote}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  {task.stageKey === 'partner_risk_review' && task.status !== 'completed' && (
                    <div className="mb-4 border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Operator Review Note
                      </div>
                      <textarea
                        value={partnerRiskNotes[task.id] || ''}
                        onChange={(event) =>
                          setPartnerRiskNotes((current) => ({
                            ...current,
                            [task.id]: event.target.value.slice(0, 1000),
                          }))
                        }
                        placeholder="Record why this has no impact, why you are pausing, or why this should escalate into pipeline risk."
                        className="w-full min-h-[96px] border-2 border-black px-3 py-2 text-sm font-medium resize-y bg-white"
                      />
                      <div className="text-[11px] text-gray-600 mt-2">
                        Required before resolving this partner-risk review.
                      </div>
                    </div>
                  )}

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
                    {task.stageKey === 'partner_risk_review' && task.status !== 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            resolvePartnerRiskTask(task.id, 'no_relationship_impact')
                          }
                          disabled={updatingTaskId === task.id || !String(partnerRiskNotes[task.id] || '').trim()}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          No Relationship Impact
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            resolvePartnerRiskTask(task.id, 'pause_relationship')
                          }
                          disabled={updatingTaskId === task.id || !String(partnerRiskNotes[task.id] || '').trim()}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          Pause Relationship
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            resolvePartnerRiskTask(task.id, 'escalate_pipeline_risk')
                          }
                          disabled={updatingTaskId === task.id || !String(partnerRiskNotes[task.id] || '').trim()}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
                        >
                          Escalate to Pipeline Risk
                        </button>
                      </>
                    )}
                    {task.stageKey !== 'partner_risk_review' && task.status !== 'completed' && (
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
                      href="/admin/funding/os/relationships"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Relationships
                    </Link>
                    {task.stageKey === 'partner_risk_review' && task.status === 'completed' && (
                      <Link
                        href="/admin/funding/os/conversations?reply=relationship"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Relationship Replies
                      </Link>
                    )}
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

export default function FundingRelationshipStageTasksPage() {
  return (
    <Suspense fallback={null}>
      <FundingRelationshipStageTasksPageContent />
    </Suspense>
  );
}
