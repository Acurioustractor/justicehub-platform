'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  buildFundingOperatingRebalanceRecommendation,
  type FundingOperatingDispatchTask,
} from '@/lib/funding/funding-operating-dispatch';
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

interface FollowUpTask {
  id: string;
  sourceId?: string | null;
  status: string;
  title: string;
  description?: string;
  priority: number;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  assignedAgentId?: string | null;
  reviewDecision?: 'acknowledged' | 'resolved' | string | null;
  reviewFeedback?: string | null;
  reviewedAt?: string | null;
  needsReview: boolean;
  digestSignature?: string | null;
  targetOrganizationId?: string | null;
  routingClass?: string | null;
  routingRule?: string | null;
  autoAssigned?: boolean;
  auditEntryCount?: number;
  lastAudit?: {
    action: string;
    actorId?: string | null;
    at?: string | null;
    summary: string;
  } | null;
  recentAudit?: Array<{
    action: string;
    actorId?: string | null;
    at?: string | null;
    summary: string;
  }>;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  summary: {
    overdueCommunityReports: number;
    spendWithoutValidation: number;
    strongMatchesNotEngaged: number;
    awardsWithoutCommitments: number;
    commitmentsWithoutUpdates: number;
    engagedMatchesStalled: number;
  };
}

interface AssignableAgent {
  id: string;
  name: string;
  domain?: string | null;
  enabled: boolean;
  lastHeartbeat?: string | null;
  currentTaskId?: string | null;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

type QueueViewFilters = {
  status: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
  review: 'all' | 'pending' | 'acknowledged' | 'resolved';
  severity: 'all' | 'critical' | 'high' | 'medium' | 'low';
  route: 'all' | 'pipeline' | 'reporting' | 'finance' | 'general';
  ownership: 'all' | 'assigned' | 'unassigned';
  assignee: string;
  audit: 'all' | 'system' | 'manual';
  breachedOnly: boolean;
};

type QueueViewPreset = {
  id: string;
  label: string;
  description: string;
  filters: QueueViewFilters;
};

const FOLLOW_UP_CUSTOM_PRESETS_STORAGE_KEY = 'justicehub:follows-up-queue-custom-presets';

function parseEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[]
) {
  const value = searchParams.get(key);
  return value && allowed.includes(value as T) ? (value as T) : null;
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

function severityClass(level: string) {
  if (level === 'critical') return 'bg-red-100 text-red-800';
  if (level === 'high') return 'bg-amber-100 text-amber-800';
  if (level === 'medium') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function reviewClass(decision?: string | null) {
  if (decision === 'resolved') return 'bg-emerald-100 text-emerald-800';
  if (decision === 'acknowledged') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function statusClass(status?: string | null) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'running' || status === 'in_progress') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

function hoursSince(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  const diff = Date.now() - time;
  if (!Number.isFinite(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60);
}

function formatAgeFromHours(hours?: number | null) {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0) return '—';
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  const remHours = Math.floor(hours % 24);
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function getSlaSignal(task: FollowUpTask) {
  const isRunning = task.status === 'running' || task.status === 'in_progress';
  const ageHours = hoursSince(isRunning ? task.startedAt || task.createdAt : task.createdAt);

  if (task.status === 'completed') {
    return {
      state: 'met' as const,
      label: 'Completed',
      ageHours,
      ageText: formatAgeFromHours(ageHours),
    };
  }

  if (typeof ageHours !== 'number') {
    return {
      state: 'unknown' as const,
      label: isRunning ? 'Running SLA' : 'Queue SLA',
      ageHours: null,
      ageText: '—',
    };
  }

  const warningThreshold = isRunning ? 4 : 8;
  const breachThreshold = isRunning ? 12 : 24;

  if (ageHours >= breachThreshold) {
    return {
      state: 'breach' as const,
      label: isRunning ? 'Running SLA breach' : 'Queue SLA breach',
      ageHours,
      ageText: formatAgeFromHours(ageHours),
    };
  }

  if (ageHours >= warningThreshold) {
    return {
      state: 'warning' as const,
      label: isRunning ? 'Running SLA risk' : 'Queue SLA risk',
      ageHours,
      ageText: formatAgeFromHours(ageHours),
    };
  }

  return {
    state: 'healthy' as const,
    label: isRunning ? 'Running in SLA' : 'Queue in SLA',
    ageHours,
    ageText: formatAgeFromHours(ageHours),
  };
}

function slaClass(state: 'healthy' | 'warning' | 'breach' | 'met' | 'unknown') {
  if (state === 'breach') return 'bg-red-100 text-red-800';
  if (state === 'warning') return 'bg-amber-100 text-amber-800';
  if (state === 'healthy') return 'bg-emerald-100 text-emerald-800';
  if (state === 'met') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function auditOriginMeta(actorId?: string | null) {
  if (actorId === 'system') {
    return {
      label: 'system',
      className: 'bg-blue-100 text-blue-800',
    };
  }

  return {
    label: 'manual',
    className: 'bg-gray-100 text-gray-700',
  };
}

function normalizeQueueViewFilters(input?: Partial<QueueViewFilters> | null): QueueViewFilters {
  const statusOptions = ['all', 'queued', 'pending', 'running', 'in_progress', 'completed', 'failed'] as const;
  const reviewOptions = ['all', 'pending', 'acknowledged', 'resolved'] as const;
  const severityOptions = ['all', 'critical', 'high', 'medium', 'low'] as const;
  const routeOptions = ['all', 'pipeline', 'reporting', 'finance', 'general'] as const;
  const ownershipOptions = ['all', 'assigned', 'unassigned'] as const;
  const auditOptions = ['all', 'system', 'manual'] as const;

  const fallback: QueueViewFilters = {
    status: 'all',
    review: 'pending',
    severity: 'all',
    route: 'all',
    ownership: 'all',
    assignee: 'all',
    audit: 'all',
    breachedOnly: false,
  };

  return {
    status: statusOptions.includes(input?.status as (typeof statusOptions)[number])
      ? (input?.status as QueueViewFilters['status'])
      : fallback.status,
    review: reviewOptions.includes(input?.review as (typeof reviewOptions)[number])
      ? (input?.review as QueueViewFilters['review'])
      : fallback.review,
    severity: severityOptions.includes(input?.severity as (typeof severityOptions)[number])
      ? (input?.severity as QueueViewFilters['severity'])
      : fallback.severity,
    route: routeOptions.includes(input?.route as (typeof routeOptions)[number])
      ? (input?.route as QueueViewFilters['route'])
      : fallback.route,
    ownership: ownershipOptions.includes(input?.ownership as (typeof ownershipOptions)[number])
      ? (input?.ownership as QueueViewFilters['ownership'])
      : fallback.ownership,
    assignee:
      typeof input?.assignee === 'string' && input.assignee.trim().length > 0
        ? input.assignee
        : fallback.assignee,
    audit: auditOptions.includes(input?.audit as (typeof auditOptions)[number])
      ? (input?.audit as QueueViewFilters['audit'])
      : fallback.audit,
    breachedOnly: input?.breachedOnly === true,
  };
}

function normalizeStoredCustomQueuePresets(input: unknown): QueueViewPreset[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (item): item is { id?: unknown; label?: unknown; description?: unknown; filters?: unknown } =>
        Boolean(item) && typeof item === 'object'
    )
    .map((item) => {
      const label =
        typeof item.label === 'string' && item.label.trim().length > 0
          ? item.label.trim()
          : 'Custom View';
      const id =
        typeof item.id === 'string' && item.id.trim().length > 0
          ? item.id
          : `custom:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

      return {
        id,
        label,
        description:
          typeof item.description === 'string' && item.description.trim().length > 0
            ? item.description.trim()
            : 'Saved custom triage view.',
        filters: normalizeQueueViewFilters(
          item.filters && typeof item.filters === 'object'
            ? (item.filters as Partial<QueueViewFilters>)
            : null
        ),
      } satisfies QueueViewPreset;
    });
}

const QUEUE_VIEW_PRESETS: QueueViewPreset[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Baseline queue: pending review, all lanes.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'all',
      route: 'all',
      ownership: 'all',
      assignee: 'all',
      audit: 'all',
      breachedOnly: false,
    },
  },
  {
    id: 'unresolved_critical',
    label: 'Unresolved Critical',
    description: 'Critical items still pending review.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'critical',
      route: 'all',
      ownership: 'all',
      assignee: 'all',
      audit: 'all',
      breachedOnly: false,
    },
  },
  {
    id: 'breached_unassigned',
    label: 'Breached Unassigned',
    description: 'Out-of-SLA tasks with no owner.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'all',
      route: 'all',
      ownership: 'unassigned',
      assignee: 'all',
      audit: 'all',
      breachedOnly: true,
    },
  },
  {
    id: 'reporting_critical',
    label: 'Reporting Critical',
    description: 'Critical reporting-lane follow-ups.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'critical',
      route: 'reporting',
      ownership: 'all',
      assignee: 'all',
      audit: 'all',
      breachedOnly: false,
    },
  },
  {
    id: 'finance_reconciliation',
    label: 'Finance Reconciliation',
    description: 'Finance-lane work already running or queued for review.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'all',
      route: 'finance',
      ownership: 'all',
      assignee: 'all',
      audit: 'all',
      breachedOnly: false,
    },
  },
  {
    id: 'pipeline_escalation',
    label: 'Pipeline Escalation',
    description: 'Critical pipeline-lane issues needing immediate movement.',
    filters: {
      status: 'all',
      review: 'pending',
      severity: 'critical',
      route: 'pipeline',
      ownership: 'all',
      assignee: 'all',
      audit: 'all',
      breachedOnly: false,
    },
  },
];

export default function FundingOperatingSystemFollowUpsPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  const [customQueuePresets, setCustomQueuePresets] = useState<QueueViewPreset[]>([]);
  const [customPresetsHydrated, setCustomPresetsHydrated] = useState(false);
  const [selectedCustomPresetId, setSelectedCustomPresetId] = useState<string | null>(null);
  const [confirmClearCustomPresets, setConfirmClearCustomPresets] = useState(false);
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renamePresetDraft, setRenamePresetDraft] = useState('');
  const [showSavePresetForm, setShowSavePresetForm] = useState(false);
  const [showImportPresetsForm, setShowImportPresetsForm] = useState(false);
  const [importPresetsDraft, setImportPresetsDraft] = useState('');
  const [presetDraftName, setPresetDraftName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copyingTriageView, setCopyingTriageView] = useState(false);
  const [copiedTriageView, setCopiedTriageView] = useState(false);
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [reviewingDecision, setReviewingDecision] = useState<'acknowledged' | 'resolved' | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string | null>(null);
  const [updatingStatusValue, setUpdatingStatusValue] = useState<'queued' | 'running' | 'completed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('pending');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [routingClassFilter, setRoutingClassFilter] = useState<
    'all' | 'pipeline' | 'reporting' | 'finance' | 'general'
  >('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [auditOriginFilter, setAuditOriginFilter] = useState<'all' | 'system' | 'manual'>('all');
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, string>>({});

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '60');
      params.set('status', statusFilter);
      params.set('reviewStatus', reviewFilter);
      params.set('severity', severityFilter);
      params.set('routingClass', routingClassFilter);
      params.set('assignment', assignmentFilter);
      if (assigneeFilter !== 'all') {
        params.set('assignedAgentId', assigneeFilter);
      }

      const response = await fetch(`/api/admin/funding/os/followups?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load Funding OS follow-up queue');
      }

      setTasks(payload.data || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load Funding OS follow-up queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const nextStatus =
      parseEnumParam(searchParams, 'status', [
        'all',
        'queued',
        'pending',
        'running',
        'in_progress',
        'completed',
        'failed',
      ] as const) || 'all';
    const nextReview =
      parseEnumParam(searchParams, 'review', [
        'all',
        'pending',
        'acknowledged',
        'resolved',
      ] as const) || 'pending';
    const nextSeverity =
      parseEnumParam(searchParams, 'severity', [
        'all',
        'critical',
        'high',
        'medium',
        'low',
      ] as const) || 'all';
    const nextRoute =
      parseEnumParam(searchParams, 'route', [
        'all',
        'pipeline',
        'reporting',
        'finance',
        'general',
      ] as const) ||
      parseEnumParam(searchParams, 'routingClass', [
        'all',
        'pipeline',
        'reporting',
        'finance',
        'general',
      ] as const) || 'all';
    const nextAssignment =
      parseEnumParam(searchParams, 'ownership', [
        'all',
        'assigned',
        'unassigned',
      ] as const) || 'all';
    const nextAudit =
      parseEnumParam(searchParams, 'audit', ['all', 'system', 'manual'] as const) || 'all';
    const nextAssignee = searchParams.get('assignee') || 'all';
    const nextBreached = searchParams.get('breached') === '1';

    setStatusFilter(nextStatus);
    setReviewFilter(nextReview);
    setSeverityFilter(nextSeverity);
    setRoutingClassFilter(nextRoute);
    setAssignmentFilter(nextAssignee !== 'all' && nextAssignment === 'unassigned' ? 'assigned' : nextAssignment);
    setAssigneeFilter(nextAssignee);
    setAuditOriginFilter(nextAudit);
    setBreachedOnly(nextBreached);
    setFiltersHydrated(true);
  }, []);

  useEffect(() => {
    if (!filtersHydrated) {
      return;
    }
    fetchData();
  }, [
    assignmentFilter,
    assigneeFilter,
    filtersHydrated,
    reviewFilter,
    routingClassFilter,
    severityFilter,
    statusFilter,
  ]);

  useEffect(() => {
    let active = true;

    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/admin/funding/os/followups/agents');
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load assignable agents');
        }

        if (active) {
          setAgents(payload.data || []);
        }
      } catch (fetchError) {
        if (active) {
          setNotice({
            type: 'error',
            message:
              fetchError instanceof Error ? fetchError.message : 'Failed to load assignable agents',
          });
        }
      }
    };

    fetchAgents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FOLLOW_UP_CUSTOM_PRESETS_STORAGE_KEY);
      if (!raw) {
        setCustomQueuePresets([]);
        setCustomPresetsHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw);
      setCustomQueuePresets(normalizeStoredCustomQueuePresets(parsed));
    } catch {
      setCustomQueuePresets([]);
    } finally {
      setCustomPresetsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!customPresetsHydrated) {
      return;
    }

    window.localStorage.setItem(
      FOLLOW_UP_CUSTOM_PRESETS_STORAGE_KEY,
      JSON.stringify(customQueuePresets)
    );
  }, [customPresetsHydrated, customQueuePresets]);

  const triageViewHref = useMemo(() => {
    const params = new URLSearchParams();

    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (reviewFilter !== 'pending') params.set('review', reviewFilter);
    if (severityFilter !== 'all') params.set('severity', severityFilter);
    if (routingClassFilter !== 'all') params.set('route', routingClassFilter);
    if (assignmentFilter !== 'all') params.set('ownership', assignmentFilter);
    if (assigneeFilter !== 'all') params.set('assignee', assigneeFilter);
    if (auditOriginFilter !== 'all') params.set('audit', auditOriginFilter);
    if (breachedOnly) params.set('breached', '1');

    const query = params.toString();
    return query
      ? `/admin/funding/os/followups?${query}`
      : '/admin/funding/os/followups';
  }, [
    assigneeFilter,
    assignmentFilter,
    auditOriginFilter,
    breachedOnly,
    reviewFilter,
    routingClassFilter,
    severityFilter,
    statusFilter,
  ]);

  const currentQueueViewFilters = useMemo<QueueViewFilters>(() => {
    return {
      status: statusFilter,
      review: reviewFilter,
      severity: severityFilter,
      route: routingClassFilter,
      ownership: assignmentFilter,
      assignee: assigneeFilter,
      audit: auditOriginFilter,
      breachedOnly,
    };
  }, [
    assigneeFilter,
    assignmentFilter,
    auditOriginFilter,
    breachedOnly,
    reviewFilter,
    routingClassFilter,
    severityFilter,
    statusFilter,
  ]);

  const allQueueViewPresets = useMemo(() => {
    return [...QUEUE_VIEW_PRESETS, ...customQueuePresets];
  }, [customQueuePresets]);

  useEffect(() => {
    if (!filtersHydrated) {
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== triageViewHref) {
      window.history.replaceState(null, '', triageViewHref);
    }
  }, [filtersHydrated, triageViewHref]);

  const copyTriageView = async () => {
    setCopyingTriageView(true);
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser');
      }

      const absoluteUrl = `${window.location.origin}${triageViewHref}`;
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedTriageView(true);
      setNotice({
        type: 'success',
        message: 'Copied shareable triage view link.',
      });
    } catch (copyError) {
      setNotice({
        type: 'error',
        message:
          copyError instanceof Error ? copyError.message : 'Failed to copy triage view link',
      });
    } finally {
      setCopyingTriageView(false);
    }
  };

  useEffect(() => {
    setAssignmentSelections(() => {
      const next: Record<string, string> = {};
      tasks.forEach((task) => {
        next[task.id] = task.assignedAgentId || '';
      });
      return next;
    });
  }, [tasks]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!copiedTriageView) return;
    const timer = setTimeout(() => setCopiedTriageView(false), 2000);
    return () => clearTimeout(timer);
  }, [copiedTriageView]);

  const reviewTask = async (taskId: string, decision: 'acknowledged' | 'resolved') => {
    setReviewingTaskId(taskId);
    setReviewingDecision(decision);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/followups/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, decision }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update follow-up task');
      }

      setNotice({
        type: 'success',
        message:
          decision === 'resolved'
            ? 'Follow-up task resolved. Linked digest state was updated.'
            : 'Follow-up task acknowledged.',
      });
      await fetchData(true);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to update follow-up task');
      setNotice({
        type: 'error',
        message: reviewError instanceof Error ? reviewError.message : 'Failed to update follow-up task',
      });
    } finally {
      setReviewingTaskId(null);
      setReviewingDecision(null);
    }
  };

  const assignTask = async (
    taskId: string,
    agentId?: string | null,
    customSuccessMessage?: string
  ) => {
    setAssigningTaskId(taskId);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/followups/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          agentId: agentId && agentId.trim().length > 0 ? agentId : null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to assign follow-up task');
      }

      setNotice({
        type: 'success',
        message:
          customSuccessMessage ||
          (payload.assignedAgentId ? 'Follow-up task assigned.' : 'Follow-up task unassigned.'),
      });
      await fetchData(true);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Failed to assign follow-up task');
      setNotice({
        type: 'error',
        message:
          assignError instanceof Error ? assignError.message : 'Failed to assign follow-up task',
      });
    } finally {
      setAssigningTaskId(null);
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    status: 'queued' | 'running' | 'completed'
  ) => {
    setUpdatingStatusTaskId(taskId);
    setUpdatingStatusValue(status);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/followups/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update follow-up task status');
      }

      setNotice({
        type: 'success',
        message:
          status === 'queued'
            ? 'Follow-up task returned to queue.'
            : status === 'running'
              ? 'Follow-up task moved to running.'
              : 'Follow-up task marked completed.',
      });
      await fetchData(true);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'Failed to update follow-up task status'
      );
      setNotice({
        type: 'error',
        message:
          statusError instanceof Error
            ? statusError.message
            : 'Failed to update follow-up task status',
      });
    } finally {
      setUpdatingStatusTaskId(null);
      setUpdatingStatusValue(null);
    }
  };

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (breachedOnly && getSlaSignal(task).state !== 'breach') {
        return false;
      }

      if (auditOriginFilter === 'all') {
        return true;
      }

      const origin = task.lastAudit?.actorId === 'system' ? 'system' : 'manual';
      return origin === auditOriginFilter;
    });
  }, [auditOriginFilter, breachedOnly, tasks]);

  const metrics = useMemo(() => {
    const pending = visibleTasks.filter((task) => !task.reviewDecision).length;
    const running = visibleTasks.filter(
      (task) => task.status === 'running' || task.status === 'in_progress'
    ).length;
    const assigned = visibleTasks.filter((task) => !!task.assignedAgentId).length;
    const slaBreached = visibleTasks.filter((task) => getSlaSignal(task).state === 'breach').length;

    return {
      total: visibleTasks.length,
      pending,
      running,
      assigned,
      slaBreached,
    };
  }, [visibleTasks]);

  const agentNameById = useMemo(() => {
    return new Map(agents.map((agent) => [agent.id, agent]));
  }, [agents]);

  const dispatchTasks = useMemo<FundingOperatingDispatchTask[]>(() => {
    return visibleTasks.map((task) => {
      const sla = getSlaSignal(task);

      return {
        id: task.id,
        title: task.title,
        assignedAgentId: task.assignedAgentId,
        routingClass: task.routingClass,
        status: task.status,
        slaState: sla.state,
        ageHours: sla.ageHours,
      };
    });
  }, [visibleTasks]);

  const workloadByAssignee = useMemo(() => {
    const buckets = new Map<
      string,
      {
        agentId: string;
        label: string;
        domain?: string | null;
        total: number;
        running: number;
        pendingReview: number;
        critical: number;
        slaBreached: number;
        routeMix: {
          pipeline: number;
          reporting: number;
          finance: number;
          general: number;
        };
        routeBreachedMix: {
          pipeline: number;
          reporting: number;
          finance: number;
          general: number;
        };
        routeOldestAge: {
          pipeline: number | null;
          reporting: number | null;
          finance: number | null;
          general: number | null;
        };
        dominantRoute: 'pipeline' | 'reporting' | 'finance' | 'general';
        dominantBreachedRoute: 'pipeline' | 'reporting' | 'finance' | 'general';
        dominantAgingRoute: 'pipeline' | 'reporting' | 'finance' | 'general';
      }
    >();

    visibleTasks.forEach((task) => {
      const agentId = task.assignedAgentId || '__unassigned__';
      const agent = task.assignedAgentId ? agentNameById.get(task.assignedAgentId) || null : null;
      const existing = buckets.get(agentId) || {
        agentId,
        label: agent ? agent.name : 'Unassigned',
        domain: agent?.domain || null,
        total: 0,
        running: 0,
        pendingReview: 0,
        critical: 0,
        slaBreached: 0,
        routeMix: {
          pipeline: 0,
          reporting: 0,
          finance: 0,
          general: 0,
        },
        routeBreachedMix: {
          pipeline: 0,
          reporting: 0,
          finance: 0,
          general: 0,
        },
        routeOldestAge: {
          pipeline: null,
          reporting: null,
          finance: null,
          general: null,
        },
        dominantRoute: 'general' as const,
        dominantBreachedRoute: 'general' as const,
        dominantAgingRoute: 'general' as const,
      };

      existing.total += 1;
      const routeClass =
        (task.routingClass || 'general') as 'pipeline' | 'reporting' | 'finance' | 'general';
      existing.routeMix[routeClass] += 1;
      if (task.status === 'running' || task.status === 'in_progress') {
        existing.running += 1;
      }
      if (!task.reviewDecision) {
        existing.pendingReview += 1;
      }
      if (task.severity === 'critical') {
        existing.critical += 1;
      }
      if (getSlaSignal(task).state === 'breach') {
        existing.slaBreached += 1;
        existing.routeBreachedMix[routeClass] += 1;
      }
      const taskAgeHours = getSlaSignal(task).ageHours;
      if (
        task.status !== 'completed' &&
        typeof taskAgeHours === 'number' &&
        (existing.routeOldestAge[routeClass] === null || taskAgeHours > existing.routeOldestAge[routeClass])
      ) {
        existing.routeOldestAge[routeClass] = taskAgeHours;
      }

      existing.dominantRoute = (Object.entries(existing.routeMix).sort((left, right) => {
        if (right[1] !== left[1]) return right[1] - left[1];
        return left[0].localeCompare(right[0]);
      })[0]?.[0] || 'general') as 'pipeline' | 'reporting' | 'finance' | 'general';
      existing.dominantBreachedRoute = (Object.entries(existing.routeBreachedMix).sort((left, right) => {
        if (right[1] !== left[1]) return right[1] - left[1];
        return left[0].localeCompare(right[0]);
      })[0]?.[0] || existing.dominantRoute) as 'pipeline' | 'reporting' | 'finance' | 'general';
      existing.dominantAgingRoute = (Object.entries(existing.routeOldestAge).sort((left, right) => {
        const leftAge = typeof left[1] === 'number' ? left[1] : -1;
        const rightAge = typeof right[1] === 'number' ? right[1] : -1;
        if (rightAge !== leftAge) return rightAge - leftAge;
        return left[0].localeCompare(right[0]);
      })[0]?.[0] || existing.dominantRoute) as 'pipeline' | 'reporting' | 'finance' | 'general';

      buckets.set(agentId, existing);
    });

    return Array.from(buckets.values()).sort((left, right) => {
      if (left.agentId === '__unassigned__') return -1;
      if (right.agentId === '__unassigned__') return 1;
      if (right.total !== left.total) return right.total - left.total;
      return left.label.localeCompare(right.label);
    });
  }, [agentNameById, visibleTasks]);

  const rebalancingSignal = useMemo(() => {
    const assignedBuckets = workloadByAssignee.filter((bucket) => bucket.agentId !== '__unassigned__');
    if (assignedBuckets.length === 0) {
      return null;
    }
    const candidates = assignedBuckets
      .map((bucket) => {
        const routeClass = bucket.dominantBreachedRoute;
        const routeBreached = bucket.routeBreachedMix[routeClass];
        const routeTotals = assignedBuckets.map((entry) => entry.routeBreachedMix[routeClass]);
        const totalRouteBreached = routeTotals.reduce((sum, count) => sum + count, 0);
        const rankedRouteCounts = [...routeTotals].sort((left, right) => right - left);
        const nextRouteBreached =
          rankedRouteCounts.find((count) => count < routeBreached) ?? 0;

        return {
          bucket,
          routeClass,
          routeBreached,
          totalRouteBreached,
          share: totalRouteBreached > 0 ? routeBreached / totalRouteBreached : 0,
          gap: routeBreached - nextRouteBreached,
        };
      })
      .filter((entry) => entry.routeBreached > 0 && entry.totalRouteBreached > 0)
      .sort((left, right) => {
        if (right.routeBreached !== left.routeBreached) {
          return right.routeBreached - left.routeBreached;
        }
        if (right.share !== left.share) {
          return right.share - left.share;
        }
        return left.bucket.label.localeCompare(right.bucket.label);
      });

    const top = candidates[0];
    if (!top || (top.share < 0.5 && top.gap < 2)) {
      return null;
    }

    return {
      owner: top.bucket.label,
      ownerId: top.bucket.agentId,
      breached: top.routeBreached,
      totalBreached: top.totalRouteBreached,
      share: top.share,
      gap: top.gap,
      routeClass: top.routeClass,
    };
  }, [workloadByAssignee]);

  const rebalanceRecommendation = useMemo(() => {
    if (!rebalancingSignal) {
      return null;
    }

    return buildFundingOperatingRebalanceRecommendation({
      agents,
      tasks: dispatchTasks,
      ownerId: rebalancingSignal.ownerId,
      routeClass: rebalancingSignal.routeClass,
    });
  }, [agents, dispatchTasks, rebalancingSignal]);

  const ownerRebalanceRecommendations = useMemo(() => {
    const recommendations = new Map<
      string,
      {
        routeClass: 'pipeline' | 'reporting' | 'finance' | 'general';
        taskId: string;
        toOwner: string;
        toOwnerId: string;
        toOwnerDomain?: string | null;
      }
    >();

    workloadByAssignee
      .filter((bucket) => bucket.agentId !== '__unassigned__' && bucket.slaBreached > 0)
      .forEach((bucket) => {
        const dominantRouteClass = bucket.dominantBreachedRoute;
        const recommendation = buildFundingOperatingRebalanceRecommendation({
          agents,
          tasks: dispatchTasks,
          ownerId: bucket.agentId,
          routeClass: dominantRouteClass,
        });

        if (!recommendation) {
          return;
        }

        recommendations.set(bucket.agentId, {
          routeClass: recommendation.routeClass,
          taskId: recommendation.taskId,
          toOwner: recommendation.toOwner,
          toOwnerId: recommendation.toOwnerId,
          toOwnerDomain: recommendation.toOwnerDomain,
        });
      });

    return recommendations;
  }, [agents, dispatchTasks, workloadByAssignee]);

  const routeClassSummary = useMemo(() => {
    const routeOrder = ['pipeline', 'reporting', 'finance', 'general'] as const;
    const labels: Record<(typeof routeOrder)[number], string> = {
      pipeline: 'Pipeline',
      reporting: 'Reporting',
      finance: 'Finance',
      general: 'General',
    };

    return routeOrder.map((routeClass) => {
      const routeTasks = visibleTasks.filter(
        (task) => (task.routingClass || 'general') === routeClass
      );
      const criticalCount = routeTasks.filter((task) => task.severity === 'critical').length;
      const nonCriticalCount = Math.max(0, routeTasks.length - criticalCount);
      const oldestAgeHours = routeTasks.reduce<number | null>((oldest, task) => {
        if (task.status === 'completed') {
          return oldest;
        }

        const ageHours = getSlaSignal(task).ageHours;
        if (typeof ageHours !== 'number') {
          return oldest;
        }

        if (oldest === null || ageHours > oldest) {
          return ageHours;
        }

        return oldest;
      }, null);

      return {
        routeClass,
        label: labels[routeClass],
        count: routeTasks.length,
        criticalCount,
        nonCriticalCount,
        oldestAgeHours,
      };
    });
  }, [visibleTasks]);

  const globalRouteAgingSignal = useMemo(() => {
    const routeOrder = ['pipeline', 'reporting', 'finance', 'general'] as const;
    const labels: Record<(typeof routeOrder)[number], string> = {
      pipeline: 'Pipeline',
      reporting: 'Reporting',
      finance: 'Finance',
      general: 'General',
    };

    const summary = routeOrder
      .map((routeClass) => {
        const routeTasks = visibleTasks.filter(
          (task) => (task.routingClass || 'general') === routeClass && task.status !== 'completed'
        );
        const oldestAgeHours = routeTasks.reduce<number | null>((oldest, task) => {
          const ageHours = getSlaSignal(task).ageHours;
          if (typeof ageHours !== 'number') {
            return oldest;
          }
          if (oldest === null || ageHours > oldest) {
            return ageHours;
          }
          return oldest;
        }, null);

        return {
          routeClass,
          label: labels[routeClass],
          activeCount: routeTasks.length,
          oldestAgeHours,
        };
      })
      .filter((entry) => typeof entry.oldestAgeHours === 'number')
      .sort((left, right) => {
        if ((right.oldestAgeHours || 0) !== (left.oldestAgeHours || 0)) {
          return (right.oldestAgeHours || 0) - (left.oldestAgeHours || 0);
        }
        if (right.activeCount !== left.activeCount) {
          return right.activeCount - left.activeCount;
        }
        return left.routeClass.localeCompare(right.routeClass);
      });

    return summary[0] || null;
  }, [visibleTasks]);

  const activeTriageFilters = useMemo(() => {
    const statusLabels: Record<
      'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed',
      string
    > = {
      queued: 'Queued',
      pending: 'Pending',
      running: 'Running',
      in_progress: 'In progress',
      completed: 'Completed',
      failed: 'Failed',
    };
    const reviewLabels: Record<'pending' | 'acknowledged' | 'resolved', string> = {
      pending: 'Pending',
      acknowledged: 'Acknowledged',
      resolved: 'Resolved',
    };
    const routeLabels: Record<'pipeline' | 'reporting' | 'finance' | 'general', string> = {
      pipeline: 'Pipeline',
      reporting: 'Reporting',
      finance: 'Finance',
      general: 'General',
    };
    const severityLabels: Record<'critical' | 'high' | 'medium' | 'low', string> = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };
    const originLabels: Record<'system' | 'manual', string> = {
      system: 'System only',
      manual: 'Manual only',
    };
    const ownershipLabels: Record<'assigned' | 'unassigned', string> = {
      assigned: 'Assigned only',
      unassigned: 'Unassigned only',
    };

    const items: Array<{
      key: string;
      label: string;
      clear: () => void;
    }> = [];

    if (statusFilter !== 'all') {
      items.push({
        key: `status:${statusFilter}`,
        label: `Status: ${statusLabels[statusFilter]}`,
        clear: () => setStatusFilter('all'),
      });
    }

    if (reviewFilter !== 'all') {
      items.push({
        key: `review:${reviewFilter}`,
        label: `Review: ${reviewLabels[reviewFilter]}`,
        clear: () => setReviewFilter('all'),
      });
    }

    if (routingClassFilter !== 'all') {
      items.push({
        key: `route:${routingClassFilter}`,
        label: `Route: ${routeLabels[routingClassFilter]}`,
        clear: () => setRoutingClassFilter('all'),
      });
    }

    if (severityFilter !== 'all') {
      items.push({
        key: `severity:${severityFilter}`,
        label: `Severity: ${severityLabels[severityFilter]}`,
        clear: () => setSeverityFilter('all'),
      });
    }

    if (breachedOnly) {
      items.push({
        key: 'sla:breached',
        label: 'SLA: Breached only',
        clear: () => setBreachedOnly(false),
      });
    }

    if (auditOriginFilter !== 'all') {
      items.push({
        key: `audit:${auditOriginFilter}`,
        label: `Audit: ${originLabels[auditOriginFilter]}`,
        clear: () => setAuditOriginFilter('all'),
      });
    }

    if (assignmentFilter !== 'all') {
      items.push({
        key: `ownership:${assignmentFilter}`,
        label: `Ownership: ${ownershipLabels[assignmentFilter]}`,
        clear: () => setAssignmentFilter('all'),
      });
    }

    if (assigneeFilter !== 'all') {
      const agent = agentNameById.get(assigneeFilter);
      items.push({
        key: `assignee:${assigneeFilter}`,
        label: `Assignee: ${agent?.name || assigneeFilter}`,
        clear: () => setAssigneeFilter('all'),
      });
    }

    return items;
  }, [
    agentNameById,
    assigneeFilter,
    assignmentFilter,
    auditOriginFilter,
    breachedOnly,
    reviewFilter,
    routingClassFilter,
    severityFilter,
    statusFilter,
  ]);

  const isDefaultQueueView =
    statusFilter === 'all' &&
    reviewFilter === 'pending' &&
    severityFilter === 'all' &&
    routingClassFilter === 'all' &&
    assignmentFilter === 'all' &&
    assigneeFilter === 'all' &&
    auditOriginFilter === 'all' &&
    breachedOnly === false;

  const resetToDefaultQueueView = () => {
    setStatusFilter('all');
    setReviewFilter('pending');
    setSeverityFilter('all');
    setRoutingClassFilter('all');
    setAssignmentFilter('all');
    setAssigneeFilter('all');
    setAuditOriginFilter('all');
    setBreachedOnly(false);
    setSelectedCustomPresetId(null);
  };

  const applyQueueViewPreset = (preset: QueueViewPreset) => {
    setStatusFilter(preset.filters.status);
    setReviewFilter(preset.filters.review);
    setSeverityFilter(preset.filters.severity);
    setRoutingClassFilter(preset.filters.route);
    setAssignmentFilter(preset.filters.ownership);
    setAssigneeFilter(preset.filters.assignee);
    setAuditOriginFilter(preset.filters.audit);
    setBreachedOnly(preset.filters.breachedOnly);
    setSelectedCustomPresetId(preset.id.startsWith('custom:') ? preset.id : null);
  };

  const saveCurrentQueueViewAsPreset = () => {
    const name = presetDraftName.trim();
    if (!name) {
      setNotice({
        type: 'error',
        message: 'Preset name is required.',
      });
      return;
    }

    const presetId = `custom:${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'view'}`;

    const nextPreset: QueueViewPreset = {
      id: presetId,
      label: name,
      description: 'Saved custom triage view.',
      filters: currentQueueViewFilters,
    };

    setCustomQueuePresets((current) => {
      const remaining = current.filter((preset) => preset.id !== presetId);
      return [...remaining, nextPreset].sort((left, right) => left.label.localeCompare(right.label));
    });
    setSelectedCustomPresetId(presetId);
    setPresetDraftName('');
    setShowSavePresetForm(false);
    setNotice({
      type: 'success',
      message: `Saved custom queue preset: ${name}.`,
    });
  };

  const exportCustomQueuePresets = async () => {
    if (customQueuePresets.length === 0) {
      setNotice({
        type: 'error',
        message: 'There are no custom queue presets to export.',
      });
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser');
      }

      await navigator.clipboard.writeText(JSON.stringify(customQueuePresets, null, 2));
      setNotice({
        type: 'success',
        message: 'Copied custom queue presets JSON to clipboard.',
      });
    } catch (exportError) {
      setNotice({
        type: 'error',
        message:
          exportError instanceof Error
            ? exportError.message
            : 'Failed to export custom queue presets',
      });
    }
  };

  const exportSingleCustomQueuePreset = async (presetId: string) => {
    const preset = customQueuePresets.find((entry) => entry.id === presetId);
    if (!preset) {
      setNotice({
        type: 'error',
        message: 'Custom queue preset not found.',
      });
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser');
      }

      await navigator.clipboard.writeText(JSON.stringify([preset], null, 2));
      setNotice({
        type: 'success',
        message: `Copied custom queue preset JSON: ${preset.label}.`,
      });
    } catch (exportError) {
      setNotice({
        type: 'error',
        message:
          exportError instanceof Error
            ? exportError.message
            : 'Failed to export custom queue preset',
      });
    }
  };

  const importCustomQueuePresets = () => {
    if (!importPreview?.valid) {
      setNotice({
        type: 'error',
        message:
          importPreview?.error || 'Failed to import custom queue presets',
      });
      return;
    }

    const imported = importPreview.presets;
    setCustomQueuePresets((current) => {
      const merged = new Map(current.map((preset) => [preset.id, preset]));
      imported.forEach((preset) => {
        merged.set(preset.id, preset);
      });
      return Array.from(merged.values()).sort((left, right) =>
        left.label.localeCompare(right.label)
      );
    });
    setImportPresetsDraft('');
    setShowImportPresetsForm(false);
    setNotice({
      type: 'success',
      message: `Imported ${imported.length} custom queue preset${imported.length === 1 ? '' : 's'}.`,
    });
  };

  const deleteCustomQueuePreset = (presetId: string) => {
    const existing = customQueuePresets.find((preset) => preset.id === presetId);
    if (!existing) {
      return;
    }

    setCustomQueuePresets((current) => current.filter((preset) => preset.id !== presetId));
    if (selectedCustomPresetId === presetId) {
      setSelectedCustomPresetId(null);
    }
    setNotice({
      type: 'success',
      message: `Deleted custom queue preset: ${existing.label}.`,
    });
  };

  const clearAllCustomQueuePresets = () => {
    if (customQueuePresets.length === 0) {
      setConfirmClearCustomPresets(false);
      return;
    }

    setCustomQueuePresets([]);
    setSelectedCustomPresetId(null);
    setRenamingPresetId(null);
    setRenamePresetDraft('');
    setConfirmClearCustomPresets(false);
    setNotice({
      type: 'success',
      message: 'Cleared all local custom queue presets.',
    });
  };

  const startRenamingCustomPreset = (presetId: string) => {
    const existing = customQueuePresets.find((preset) => preset.id === presetId);
    if (!existing) {
      return;
    }

    setRenamingPresetId(presetId);
    setRenamePresetDraft(existing.label);
  };

  const cancelRenamingCustomPreset = () => {
    setRenamingPresetId(null);
    setRenamePresetDraft('');
  };

  const saveRenamedCustomPreset = (presetId: string) => {
    const nextLabel = renamePresetDraft.trim();
    if (!nextLabel) {
      setNotice({
        type: 'error',
        message: 'Preset name is required.',
      });
      return;
    }

    const existing = customQueuePresets.find((preset) => preset.id === presetId);
    if (!existing) {
      cancelRenamingCustomPreset();
      return;
    }

    setCustomQueuePresets((current) =>
      current
        .map((preset) =>
          preset.id === presetId
            ? {
                ...preset,
                label: nextLabel,
              }
            : preset
        )
        .sort((left, right) => left.label.localeCompare(right.label))
    );
    cancelRenamingCustomPreset();
    setNotice({
      type: 'success',
      message: `Renamed custom queue preset to ${nextLabel}.`,
    });
  };

  const duplicateCustomQueuePreset = (presetId: string) => {
    const existing = customQueuePresets.find((preset) => preset.id === presetId);
    if (!existing) {
      return;
    }

    const nextLabel = `${existing.label} Copy`;
    const baseId =
      nextLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'view';

    let nextId = `custom:${baseId}`;
    let suffix = 2;
    const existingIds = new Set(customQueuePresets.map((preset) => preset.id));
    while (existingIds.has(nextId)) {
      nextId = `custom:${baseId}-${suffix}`;
      suffix += 1;
    }

    const nextPreset: QueueViewPreset = {
      id: nextId,
      label: nextLabel,
      description: existing.description,
      filters: existing.filters,
    };

    setCustomQueuePresets((current) =>
      [...current, nextPreset].sort((left, right) => left.label.localeCompare(right.label))
    );
    setSelectedCustomPresetId(nextId);
    setNotice({
      type: 'success',
      message: `Duplicated custom queue preset: ${existing.label}.`,
    });
  };

  const overwriteSelectedCustomPreset = () => {
    if (!selectedCustomPresetId) {
      return;
    }

    const existing = customQueuePresets.find((preset) => preset.id === selectedCustomPresetId);
    if (!existing) {
      setSelectedCustomPresetId(null);
      return;
    }

    setCustomQueuePresets((current) =>
      current
        .map((preset) =>
          preset.id === selectedCustomPresetId
            ? {
                ...preset,
                filters: currentQueueViewFilters,
              }
            : preset
        )
        .sort((left, right) => left.label.localeCompare(right.label))
    );
    setNotice({
      type: 'success',
      message: `Updated custom queue preset: ${existing.label}.`,
    });
  };

  const revertToSelectedCustomPreset = () => {
    if (!selectedCustomPreset) {
      return;
    }

    applyQueueViewPreset(selectedCustomPreset);
    setNotice({
      type: 'success',
      message: `Reverted to saved custom queue preset: ${selectedCustomPreset.label}.`,
    });
  };

  const activeQueuePresetId = useMemo(() => {
    const matchingPreset = allQueueViewPresets.find((preset) => {
      return (
        preset.filters.status === currentQueueViewFilters.status &&
        preset.filters.review === currentQueueViewFilters.review &&
        preset.filters.severity === currentQueueViewFilters.severity &&
        preset.filters.route === currentQueueViewFilters.route &&
        preset.filters.ownership === currentQueueViewFilters.ownership &&
        preset.filters.assignee === currentQueueViewFilters.assignee &&
        preset.filters.audit === currentQueueViewFilters.audit &&
        preset.filters.breachedOnly === currentQueueViewFilters.breachedOnly
      );
    });

    return matchingPreset?.id || null;
  }, [
    allQueueViewPresets,
    currentQueueViewFilters,
  ]);

  const activeQueuePreset = useMemo(() => {
    if (!activeQueuePresetId) {
      return null;
    }

    return allQueueViewPresets.find((preset) => preset.id === activeQueuePresetId) || null;
  }, [activeQueuePresetId, allQueueViewPresets]);

  const selectedCustomPreset = useMemo(() => {
    if (!selectedCustomPresetId) {
      return null;
    }

    return customQueuePresets.find((preset) => preset.id === selectedCustomPresetId) || null;
  }, [customQueuePresets, selectedCustomPresetId]);

  const selectedCustomPresetIsDirty = useMemo(() => {
    if (!selectedCustomPreset) {
      return false;
    }

    return (
      selectedCustomPreset.filters.status !== currentQueueViewFilters.status ||
      selectedCustomPreset.filters.review !== currentQueueViewFilters.review ||
      selectedCustomPreset.filters.severity !== currentQueueViewFilters.severity ||
      selectedCustomPreset.filters.route !== currentQueueViewFilters.route ||
      selectedCustomPreset.filters.ownership !== currentQueueViewFilters.ownership ||
      selectedCustomPreset.filters.assignee !== currentQueueViewFilters.assignee ||
      selectedCustomPreset.filters.audit !== currentQueueViewFilters.audit ||
      selectedCustomPreset.filters.breachedOnly !== currentQueueViewFilters.breachedOnly
    );
  }, [currentQueueViewFilters, selectedCustomPreset]);

  useEffect(() => {
    if (selectedCustomPresetId) {
      return;
    }

    if (activeQueuePreset && activeQueuePreset.id.startsWith('custom:')) {
      setSelectedCustomPresetId(activeQueuePreset.id);
    }
  }, [activeQueuePreset, selectedCustomPresetId]);

  const importPreview = useMemo(() => {
    if (!importPresetsDraft.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(importPresetsDraft);
      const presets = normalizeStoredCustomQueuePresets(parsed);

      if (presets.length === 0) {
        return {
          valid: false as const,
          presets: [] as QueueViewPreset[],
          newCount: 0,
          overwriteCount: 0,
          error: 'No valid custom presets found in import payload.',
        };
      }

      const existingIds = new Set(customQueuePresets.map((preset) => preset.id));
      const overwriteCount = presets.filter((preset) => existingIds.has(preset.id)).length;

      return {
        valid: true as const,
        presets,
        newCount: presets.length - overwriteCount,
        overwriteCount,
        error: null,
      };
    } catch (error) {
      return {
        valid: false as const,
        presets: [] as QueueViewPreset[],
        newCount: 0,
        overwriteCount: 0,
        error: error instanceof Error ? error.message : 'Invalid JSON payload.',
      };
    }
  }, [customQueuePresets, importPresetsDraft]);

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
                Back to Funding OS Review
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#ef4444] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Funding OS Follow-up Queue</h1>
                  <p className="text-base text-gray-600">
                    Critical follow-up tasks generated from unresolved Funding OS alert digests.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
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
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-red-50 border-red-500 text-red-800'
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Visible Tasks</div>
              <div className="text-4xl font-black text-black">{metrics.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Pending Review</div>
              <div className="text-4xl font-black text-amber-700">{metrics.pending}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Running</div>
              <div className="text-4xl font-black text-blue-700">{metrics.running}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Assigned</div>
              <div className="text-4xl font-black text-emerald-700">{metrics.assigned}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">SLA Breached</div>
              <div className="text-4xl font-black text-red-700">{metrics.slaBreached}</div>
            </div>
          </div>

          <section className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h2 className="text-lg font-black text-black">Route Pressure</h2>
                <p className="text-sm text-gray-600">
                  Visible queue volume grouped by deterministic routing lane.
                </p>
                <div className="text-[11px] font-bold text-gray-500 mt-1">
                  {customQueuePresets.length} custom preset{customQueuePresets.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={copyTriageView}
                  disabled={copyingTriageView}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {copyingTriageView
                    ? 'Copying…'
                    : copiedTriageView
                      ? 'Copied'
                      : 'Copy Triage View'}
                </button>
                <Link
                  href={triageViewHref}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                >
                  Open Shared View
                </Link>
                {!showSavePresetForm ? (
                  <button
                    onClick={() => setShowSavePresetForm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Save Current as Preset
                  </button>
                ) : null}
                {!showImportPresetsForm ? (
                  <button
                    onClick={() => setShowImportPresetsForm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Import Presets
                  </button>
                ) : null}
                <button
                  onClick={exportCustomQueuePresets}
                  disabled={customQueuePresets.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Export Presets
                </button>
                {customQueuePresets.length > 0 &&
                  (!confirmClearCustomPresets ? (
                    <button
                      onClick={() => setConfirmClearCustomPresets(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Clear Custom Presets
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={clearAllCustomQueuePresets}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] transition-colors"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setConfirmClearCustomPresets(false)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Cancel Clear
                      </button>
                    </>
                  ))}
                {selectedCustomPreset && (
                  <>
                    <button
                      onClick={overwriteSelectedCustomPreset}
                      disabled={!selectedCustomPresetIsDirty}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {selectedCustomPresetIsDirty
                        ? `Update ${selectedCustomPreset.label}`
                        : `${selectedCustomPreset.label} Up to Date`}
                    </button>
                    {selectedCustomPresetIsDirty && (
                      <button
                        onClick={revertToSelectedCustomPreset}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Revert {selectedCustomPreset.label}
                      </button>
                    )}
                  </>
                )}
                {!isDefaultQueueView && (
                  <button
                    onClick={resetToDefaultQueueView}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Default View
                  </button>
                )}
                {(routingClassFilter !== 'all' ||
                  severityFilter !== 'all' ||
                  breachedOnly) && (
                  <button
                    onClick={() => {
                      setRoutingClassFilter('all');
                      setSeverityFilter('all');
                      setBreachedOnly(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Reset Triage
                  </button>
                )}
                {routingClassFilter !== 'all' && (
                  <button
                    onClick={() => setRoutingClassFilter('all')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Show All Routes
                  </button>
                )}
              </div>
            </div>
            {showSavePresetForm && (
              <div className="border-2 border-black bg-white p-4 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <label className="flex-1 text-xs font-bold text-gray-700">
                    Preset Name
                    <input
                      value={presetDraftName}
                      onChange={(event) => setPresetDraftName(event.target.value)}
                      placeholder="Community review sprint"
                      className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={saveCurrentQueueViewAsPreset}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Save Preset
                    </button>
                    <button
                      onClick={() => {
                        setShowSavePresetForm(false);
                        setPresetDraftName('');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showImportPresetsForm && (
              <div className="border-2 border-black bg-white p-4 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-gray-700">
                    Presets JSON
                    <textarea
                      value={importPresetsDraft}
                      onChange={(event) => setImportPresetsDraft(event.target.value)}
                      rows={6}
                      placeholder='[{"id":"custom:team-view","label":"Team View","description":"Saved custom triage view.","filters":{...}}]'
                      className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                    />
                  </label>
                  <div className="text-[11px] text-gray-600">
                    Import expects a JSON array of custom presets. Full exports and single-preset
                    exports from this page can both be pasted directly here.
                  </div>
                  {importPreview && (
                    <div
                      className={`border p-3 text-xs font-bold ${
                        importPreview.valid
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-red-300 bg-red-50 text-red-800'
                      }`}
                    >
                      {importPreview.valid ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <span>Ready to import {importPreview.presets.length} preset{importPreview.presets.length === 1 ? '' : 's'}.</span>
                          <span>New: {importPreview.newCount}</span>
                          <span>Overwrite: {importPreview.overwriteCount}</span>
                        </div>
                      ) : (
                        <span>{importPreview.error}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={importCustomQueuePresets}
                      disabled={!importPreview?.valid}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Import JSON
                    </button>
                    <button
                      onClick={() => {
                        setShowImportPresetsForm(false);
                        setImportPresetsDraft('');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {allQueueViewPresets.map((preset) => {
                const isActive = activeQueuePresetId === preset.id;
                const isCustom = preset.id.startsWith('custom:');
                const isRenaming = renamingPresetId === preset.id;
                const isSelectedCustom = selectedCustomPresetId === preset.id;
                const isDirtyCustom = isSelectedCustom && selectedCustomPresetIsDirty;
                return (
                  <div
                    key={preset.id}
                    className={`text-left border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                      isActive ? 'bg-[#eef4ff]' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                      {isCustom ? 'Custom View' : 'Saved View'}
                    </div>
                    {isDirtyCustom && (
                      <div className="inline-flex items-center gap-2 px-2 py-1 mb-2 text-[11px] font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                        Dirty
                      </div>
                    )}
                    {isRenaming ? (
                      <label className="block text-xs font-bold text-gray-700">
                        Rename Preset
                        <input
                          value={renamePresetDraft}
                          onChange={(event) => setRenamePresetDraft(event.target.value)}
                          className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                    ) : (
                      <div className="text-sm font-black text-black">{preset.label}</div>
                    )}
                    <div className="text-[11px] text-gray-600 mt-1">{preset.description}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isRenaming ? (
                        <>
                          <button
                            onClick={() => saveRenamedCustomPreset(preset.id)}
                            className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                          >
                            Save Name
                          </button>
                          <button
                            onClick={cancelRenamingCustomPreset}
                            className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => applyQueueViewPreset(preset)}
                            className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                          >
                            {isActive ? 'Active preset' : 'Apply preset'}
                          </button>
                          {isCustom && (
                            <>
                              <button
                                onClick={() => exportSingleCustomQueuePreset(preset.id)}
                                className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                              >
                                Export
                              </button>
                              <button
                                onClick={() => duplicateCustomQueuePreset(preset.id)}
                                className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => startRenamingCustomPreset(preset.id)}
                                className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => deleteCustomQueuePreset(preset.id)}
                                className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {routeClassSummary.map((item) => {
                const isFocused = routingClassFilter === item.routeClass;
                const isCriticalFocused = isFocused && severityFilter === 'critical';
                return (
                  <div
                    key={item.routeClass}
                    className={`text-left border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                      isFocused ? 'bg-[#eef4ff]' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      {item.label}
                    </div>
                    <div className="text-3xl font-black text-black">{item.count}</div>
                    <div className="text-[11px] font-bold text-gray-600 mt-2">
                      Oldest {formatAgeFromHours(item.oldestAgeHours)}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-1">
                      Critical {item.criticalCount} • Other {item.nonCriticalCount}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setRoutingClassFilter(item.routeClass)}
                        className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        {isFocused ? 'Focused route' : 'Focus route'}
                      </button>
                      <button
                        onClick={() => {
                          setRoutingClassFilter(item.routeClass);
                          setSeverityFilter('critical');
                        }}
                        disabled={item.criticalCount === 0}
                        className={`inline-flex items-center gap-2 px-2 py-1 text-[11px] font-black border border-black transition-colors disabled:opacity-50 ${
                          isCriticalFocused
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {isCriticalFocused ? 'Critical Focused' : 'Focus Critical'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {(activeTriageFilters.length > 0 || (activeQueuePreset && activeQueuePreset.id !== 'default')) && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-gray-600 uppercase">Active Triage</span>
              {activeQueuePreset && activeQueuePreset.id !== 'default' && (
                <span className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                  Saved View: {activeQueuePreset.label}
                  {selectedCustomPreset &&
                    activeQueuePreset.id === selectedCustomPreset.id &&
                    selectedCustomPresetIsDirty && (
                      <span className="inline-flex items-center gap-2 px-2 py-1 text-[10px] font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                        Dirty
                      </span>
                    )}
                </span>
              )}
              {!activeQueuePreset && activeTriageFilters.length > 0 && (
                <span className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                  Custom View
                </span>
              )}
              {activeTriageFilters.map((item) => (
                <button
                  key={item.key}
                  onClick={item.clear}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                >
                  {item.label}
                  <span className="text-[10px] font-black">×</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setBreachedOnly(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black transition-colors ${
                breachedOnly ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              Breached Only
            </button>
            <button
              onClick={() => setBreachedOnly(false)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black transition-colors ${
                !breachedOnly ? 'bg-[#eef4ff] text-[#1d4ed8]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              All Visible
            </button>
            <button
              onClick={() => {
                setBreachedOnly(true);
                setAssignmentFilter('unassigned');
                setAssigneeFilter('all');
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
            >
              Breached + Unassigned
            </button>
            {breachedOnly && (
              <span className="text-xs font-medium text-gray-600">
                Showing only follow-up tasks currently outside SLA.
              </span>
            )}
          </div>

          {(rebalancingSignal || globalRouteAgingSignal) && !breachedOnly && (
            <div className="border-2 border-black bg-[#fff7ed] p-4 mb-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-black">Rebalancing Signal</div>
                  {rebalancingSignal && (
                    <div className="text-sm text-gray-700 mt-1">
                      {rebalancingSignal.owner} currently holds {rebalancingSignal.breached} of{' '}
                      {rebalancingSignal.totalBreached} breached {rebalancingSignal.routeClass} tasks
                      in this visible queue.
                    </div>
                  )}
                  {globalRouteAgingSignal && (
                    <div className="text-sm text-gray-700 mt-1">
                      Oldest unresolved work is in {globalRouteAgingSignal.label.toLowerCase()} at{' '}
                      {formatAgeFromHours(globalRouteAgingSignal.oldestAgeHours)} across{' '}
                      {globalRouteAgingSignal.activeCount} visible tasks.
                    </div>
                  )}
                  {rebalanceRecommendation && (
                    <div className="text-xs text-gray-600 mt-2">
                      Suggested move: one {rebalanceRecommendation.routeClass} task to{' '}
                      {rebalanceRecommendation.toOwner}
                      {rebalanceRecommendation.toOwnerDomain
                        ? ` • ${rebalanceRecommendation.toOwnerDomain}`
                        : ''}
                      .
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {globalRouteAgingSignal && (
                    <button
                      onClick={() => setRoutingClassFilter(globalRouteAgingSignal.routeClass)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Focus Oldest Route
                    </button>
                  )}
                  {rebalancingSignal && (
                    <button
                      onClick={() => {
                        setBreachedOnly(true);
                        setAssignmentFilter('assigned');
                        setAssigneeFilter(rebalancingSignal.ownerId);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                      Focus Breached Owner
                    </button>
                  )}
                  {rebalanceRecommendation && (
                    <button
                      onClick={() =>
                        assignTask(
                          rebalanceRecommendation.taskId,
                          rebalanceRecommendation.toOwnerId,
                          `Reassigned one ${rebalanceRecommendation.routeClass} breached task to ${rebalanceRecommendation.toOwner}.`
                        )
                      }
                      disabled={assigningTaskId === rebalanceRecommendation.taskId}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {assigningTaskId === rebalanceRecommendation.taskId
                        ? 'Reassigning…'
                        : `Reassign 1 To ${rebalanceRecommendation.toOwner}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {workloadByAssignee.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-lg font-black text-black">Owner Workload</h2>
                  <p className="text-sm text-gray-600">
                    Visible follow-up tasks grouped by assignee for faster routing.
                  </p>
                </div>
                {(assigneeFilter !== 'all' || assignmentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setAssigneeFilter('all');
                      setAssignmentFilter('all');
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Show All Owners
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workloadByAssignee.map((bucket) => {
                  const isFocused =
                    bucket.agentId === '__unassigned__'
                      ? assignmentFilter === 'unassigned'
                      : assigneeFilter === bucket.agentId;
                  const ownerRecommendation =
                    bucket.agentId !== '__unassigned__'
                      ? ownerRebalanceRecommendations.get(bucket.agentId) || null
                      : null;

                  return (
                    <div
                      key={bucket.agentId}
                      className={`border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        isFocused ? 'bg-[#eef4ff]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-sm font-black text-black">{bucket.label}</div>
                          <div className="text-[11px] text-gray-500">
                            {bucket.domain || (bucket.agentId === '__unassigned__' ? 'Needs routing' : 'Active owner')}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-bold border border-black bg-white">
                          {bucket.total} tasks
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[11px] mb-4">
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Running</div>
                          <div className="text-sm font-black text-blue-700">{bucket.running}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Pending</div>
                          <div className="text-sm font-black text-amber-700">{bucket.pendingReview}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Critical</div>
                          <div className="text-sm font-black text-red-700">{bucket.critical}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">SLA</div>
                          <div className="text-sm font-black text-red-700">{bucket.slaBreached}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-[11px] font-bold text-gray-600 mb-2">
                          Route Mix • dominant {bucket.dominantRoute}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Pipeline</div>
                            <div className="text-sm font-black text-black">{bucket.routeMix.pipeline}</div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Reporting</div>
                            <div className="text-sm font-black text-black">{bucket.routeMix.reporting}</div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Finance</div>
                            <div className="text-sm font-black text-black">{bucket.routeMix.finance}</div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">General</div>
                            <div className="text-sm font-black text-black">{bucket.routeMix.general}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-[11px] font-bold text-gray-600 mb-2">
                          Aging Pressure • oldest {bucket.dominantAgingRoute}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Pipeline</div>
                            <div className="text-sm font-black text-black">
                              {formatAgeFromHours(bucket.routeOldestAge.pipeline)}
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Reporting</div>
                            <div className="text-sm font-black text-black">
                              {formatAgeFromHours(bucket.routeOldestAge.reporting)}
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">Finance</div>
                            <div className="text-sm font-black text-black">
                              {formatAgeFromHours(bucket.routeOldestAge.finance)}
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 p-2">
                            <div className="font-bold text-gray-600">General</div>
                            <div className="text-sm font-black text-black">
                              {formatAgeFromHours(bucket.routeOldestAge.general)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {ownerRecommendation && (
                        <div className="mb-4 border border-gray-200 bg-[#f8fafc] p-3">
                          <div className="text-[11px] font-bold text-gray-600">
                            Suggested Rebalance
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            Move one {ownerRecommendation.routeClass} breached task to{' '}
                            {ownerRecommendation.toOwner}
                            {ownerRecommendation.toOwnerDomain
                              ? ` • ${ownerRecommendation.toOwnerDomain}`
                              : ''}
                            .
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (bucket.agentId === '__unassigned__') {
                            setAssignmentFilter('unassigned');
                            setAssigneeFilter('all');
                            return;
                          }

                          setAssignmentFilter('assigned');
                          setAssigneeFilter(bucket.agentId);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        {bucket.agentId === '__unassigned__' ? 'Focus Unassigned' : 'Focus Owner'}
                      </button>
                      {ownerRecommendation && (
                        <button
                          onClick={() =>
                            assignTask(
                              ownerRecommendation.taskId,
                              ownerRecommendation.toOwnerId,
                              `Reassigned one ${ownerRecommendation.routeClass} breached task to ${ownerRecommendation.toOwner}.`
                            )
                          }
                          disabled={assigningTaskId === ownerRecommendation.taskId}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {assigningTaskId === ownerRecommendation.taskId
                            ? 'Reassigning…'
                            : `Reassign 1 To ${ownerRecommendation.toOwner}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-5 py-4 border-b-2 border-black bg-[#f8fafc]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
                <label className="text-xs font-bold text-gray-700">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | 'all'
                          | 'queued'
                          | 'pending'
                          | 'running'
                          | 'in_progress'
                          | 'completed'
                          | 'failed'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All status</option>
                    <option value="queued">Queued</option>
                    <option value="pending">Pending</option>
                    <option value="running">Running</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Review
                  <select
                    value={reviewFilter}
                    onChange={(event) =>
                      setReviewFilter(
                        event.target.value as 'all' | 'pending' | 'acknowledged' | 'resolved'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All review</option>
                    <option value="pending">Pending</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Severity
                  <select
                    value={severityFilter}
                    onChange={(event) =>
                      setSeverityFilter(
                        event.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Route
                  <select
                    value={routingClassFilter}
                    onChange={(event) =>
                      setRoutingClassFilter(
                        event.target.value as
                          | 'all'
                          | 'pipeline'
                          | 'reporting'
                          | 'finance'
                          | 'general'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All routes</option>
                    <option value="pipeline">Pipeline</option>
                    <option value="reporting">Reporting</option>
                    <option value="finance">Finance</option>
                    <option value="general">General</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Ownership
                  <select
                    value={assignmentFilter}
                    onChange={(event) =>
                      {
                        const nextValue = event.target.value as 'all' | 'assigned' | 'unassigned';
                        setAssignmentFilter(nextValue);
                        if (nextValue === 'unassigned' && assigneeFilter !== 'all') {
                          setAssigneeFilter('all');
                        }
                      }
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All ownership</option>
                    <option value="assigned">Assigned only</option>
                    <option value="unassigned">Unassigned only</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Assignee
                  <select
                    value={assigneeFilter}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setAssigneeFilter(nextValue);
                      if (nextValue !== 'all' && assignmentFilter === 'unassigned') {
                        setAssignmentFilter('assigned');
                      }
                    }}
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All agents</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                        {agent.domain ? ` • ${agent.domain}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Audit Origin
                  <select
                    value={auditOriginFilter}
                    onChange={(event) =>
                      setAuditOriginFilter(
                        event.target.value as 'all' | 'system' | 'manual'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All origin</option>
                    <option value="system">System only</option>
                    <option value="manual">Manual only</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-5 text-sm text-gray-500">Loading follow-up tasks…</div>
              ) : visibleTasks.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">
                  {breachedOnly
                    ? 'No follow-up tasks are currently outside SLA for this filter.'
                    : 'No follow-up tasks match this filter.'}
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const assignedAgent = task.assignedAgentId
                    ? agentNameById.get(task.assignedAgentId) || null
                    : null;
                  const sla = getSlaSignal(task);
                  const summaryTotal =
                    task.summary.overdueCommunityReports +
                    task.summary.spendWithoutValidation +
                    task.summary.strongMatchesNotEngaged +
                    task.summary.awardsWithoutCommitments +
                    task.summary.commitmentsWithoutUpdates +
                    task.summary.engagedMatchesStalled;

                  const remediationHref =
                    task.targetOrganizationId
                      ? task.summary.strongMatchesNotEngaged > 0 || task.summary.engagedMatchesStalled > 0
                        ? `/admin/funding/os/pipeline?organizationId=${task.targetOrganizationId}`
                        : `/admin/funding/os/community-reporting?organizationId=${task.targetOrganizationId}&status=all`
                      : task.summary.strongMatchesNotEngaged > 0 || task.summary.engagedMatchesStalled > 0
                        ? '/admin/funding/os/pipeline'
                        : '/admin/funding/os/community-reporting?status=all';

                  return (
                    <div key={task.id} className="p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-sm font-black text-black">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.targetOrganizationId
                              ? `org ${task.targetOrganizationId}`
                              : 'global'} • queued {formatDate(task.createdAt)}
                          </div>
                          <div className="text-xs text-gray-600 mt-2">{task.description}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-bold ${severityClass(task.severity)}`}>
                            {task.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold ${statusClass(task.status)}`}>
                            {task.status || 'queued'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold ${slaClass(sla.state)}`}>
                            {sla.label}
                          </span>
                          <span className="px-2 py-1 text-xs font-bold bg-white border border-black">
                            P{task.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold ${reviewClass(task.reviewDecision)}`}>
                            {task.reviewDecision || 'pending'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 text-xs mt-4">
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Issues</div>
                          <div className="text-black font-black">{summaryTotal}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Overdue</div>
                          <div className="text-black font-black">{task.summary.overdueCommunityReports}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">No Validation</div>
                          <div className="text-black font-black">{task.summary.spendWithoutValidation}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">No Commitments</div>
                          <div className="text-black font-black">{task.summary.awardsWithoutCommitments}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">No Updates</div>
                          <div className="text-black font-black">{task.summary.commitmentsWithoutUpdates}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Stalled / Idle</div>
                          <div className="text-black font-black">
                            {task.summary.strongMatchesNotEngaged + task.summary.engagedMatchesStalled}
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Queue Age</div>
                          <div className="text-black font-black">
                            {formatAgeFromHours(hoursSince(task.createdAt))}
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Run Age</div>
                          <div className="text-black font-black">
                            {task.status === 'running' || task.status === 'in_progress'
                              ? formatAgeFromHours(
                                  hoursSince(task.startedAt || task.createdAt)
                                )
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="w-full rounded-none border border-black bg-[#f8fafc] p-3">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-wide text-gray-600">
                                Ownership
                              </div>
                              <div className="text-xs font-medium text-black mt-1">
                                {assignedAgent
                                  ? `${assignedAgent.name}${assignedAgent.domain ? ` • ${assignedAgent.domain}` : ''}`
                                  : task.assignedAgentId
                                    ? `Assigned to ${task.assignedAgentId}`
                                    : 'No agent assigned'}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-1">
                                Route {task.routingClass || 'general'}
                                {task.routingRule ? ` • ${task.routingRule}` : ''}
                                {task.autoAssigned ? ' • auto' : ''}
                              </div>
                              {task.lastAudit && (
                                <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-gray-500">
                                  <span className="font-medium">Audit:</span>
                                  <span
                                    className={`px-1.5 py-0.5 font-bold ${auditOriginMeta(task.lastAudit.actorId).className}`}
                                  >
                                    {auditOriginMeta(task.lastAudit.actorId).label}
                                  </span>
                                  <span>{task.lastAudit.summary}</span>
                                  {task.lastAudit.at ? <span>• {formatDate(task.lastAudit.at)}</span> : null}
                                  {typeof task.auditEntryCount === 'number' ? (
                                    <span>
                                      • {task.auditEntryCount} entr{task.auditEntryCount === 1 ? 'y' : 'ies'}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                              {task.recentAudit && task.recentAudit.length > 1 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-[11px] font-bold text-gray-600">
                                    View Recent Audit Trail
                                  </summary>
                                  <div className="mt-2 space-y-1">
                                    {task.recentAudit.map((entry, index) => (
                                      <div
                                        key={`${task.id}-audit-${index}`}
                                        className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500"
                                      >
                                        <span
                                          className={`px-1.5 py-0.5 font-bold ${auditOriginMeta(entry.actorId).className}`}
                                        >
                                          {auditOriginMeta(entry.actorId).label}
                                        </span>
                                        <span>{entry.summary}</span>
                                        {entry.at ? <span>• {formatDate(entry.at)}</span> : null}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <select
                                value={assignmentSelections[task.id] ?? ''}
                                onChange={(event) =>
                                  setAssignmentSelections((current) => ({
                                    ...current,
                                    [task.id]: event.target.value,
                                  }))
                                }
                                className="min-w-[220px] rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold"
                              >
                                <option value="">Unassigned</option>
                                {agents.map((agent) => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                    {agent.domain ? ` • ${agent.domain}` : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  assignTask(task.id, assignmentSelections[task.id] || null)
                                }
                                disabled={
                                  assigningTaskId === task.id ||
                                  (assignmentSelections[task.id] || '') ===
                                    (task.assignedAgentId || '')
                                }
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                              >
                                {assigningTaskId === task.id ? 'Saving…' : 'Apply Owner'}
                              </button>
                            </div>
                          </div>
                        </div>
                        {task.status !== 'running' && task.status !== 'in_progress' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'running')}
                            disabled={updatingStatusTaskId === task.id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                          >
                            {updatingStatusTaskId === task.id && updatingStatusValue === 'running'
                              ? 'Saving…'
                              : 'Start Work'}
                          </button>
                        )}
                        {task.status !== 'queued' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'queued')}
                            disabled={updatingStatusTaskId === task.id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#fff7ed] text-[#9a3412] hover:bg-[#ffedd5] transition-colors disabled:opacity-50"
                          >
                            {updatingStatusTaskId === task.id && updatingStatusValue === 'queued'
                              ? 'Saving…'
                              : 'Return to Queue'}
                          </button>
                        )}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            disabled={updatingStatusTaskId === task.id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#e7f8ee] text-[#166534] hover:bg-[#d2f4de] transition-colors disabled:opacity-50"
                          >
                            {updatingStatusTaskId === task.id && updatingStatusValue === 'completed'
                              ? 'Saving…'
                              : 'Mark Complete'}
                          </button>
                        )}
                        <Link
                          href={remediationHref}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                        >
                          Open Remediation
                        </Link>
                        {!task.reviewDecision && (
                          <button
                            onClick={() => reviewTask(task.id, 'acknowledged')}
                            disabled={reviewingTaskId === task.id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                          >
                            {reviewingTaskId === task.id && reviewingDecision === 'acknowledged'
                              ? 'Saving…'
                              : 'Acknowledge'}
                          </button>
                        )}
                        {task.reviewDecision !== 'resolved' && (
                          <button
                            onClick={() => reviewTask(task.id, 'resolved')}
                            disabled={reviewingTaskId === task.id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#e7f8ee] text-[#166534] hover:bg-[#d2f4de] transition-colors disabled:opacity-50"
                          >
                            {reviewingTaskId === task.id && reviewingDecision === 'resolved'
                              ? 'Saving…'
                              : 'Resolve'}
                          </button>
                        )}
                        {task.reviewedAt ? (
                          <span className="text-[11px] text-gray-500">
                            Reviewed {formatDate(task.reviewedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
