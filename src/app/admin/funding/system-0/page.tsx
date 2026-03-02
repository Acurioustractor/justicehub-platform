'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  Bot,
  DollarSign,
  RefreshCw,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

interface System0RunSummary {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  summary: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
  };
}

interface System0Metrics {
  queue: {
    queued: number;
    running: number;
    failed: number;
    needsReview: number;
  };
  runs: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
    avgDurationMs: number | null;
    lastRunAt: string | null;
  };
  review: {
    pending: number;
    reviewed: number;
    total: number;
  };
  recentRuns: System0RunSummary[];
}

interface RunTask {
  id: string;
  task_type: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string | null;
  output: Record<string, unknown> | null;
}

interface RunStatus {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  summary: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
  };
  createdAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  tasks: RunTask[];
}

interface NotionWorkerStatus {
  queue: {
    byStage: Record<string, number>;
    inWorkerQueue: number;
    defaultStageFilter?: string[];
  };
  workers: {
    queuedTasks: number;
    oldestQueuedTask?: {
      id: string;
      created_at: string | null;
      status: string | null;
    } | null;
  };
}

interface System0Policy {
  policyKey: string;
  schedulerEnabled: boolean;
  autoStart: boolean;
  runMode: 'incremental' | 'full';
  workerBatchSize: number;
  staleAfterMinutes: number;
  drainEnabled: boolean;
  drainBatchSize: number;
  drainMaxBatches: number;
  autoProcessEnabled: boolean;
  autoProcessIntervalSec: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface System0AuditEvent {
  id: string;
  eventType: string;
  source: string;
  actorId: string | null;
  runId: string | null;
  message: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface AuditFilterState {
  eventTypeFilter: string;
  eventSourceFilter: string;
  eventRunIdFilter: string;
  eventFromDate: string;
  eventToDate: string;
  eventsLimit: number;
}

interface AuditFilterPreset {
  id: string;
  name: string;
  filters: AuditFilterState;
  isShared: boolean;
  createdBy?: string | null;
}

const SYSTEM0_EVENT_TYPE_OPTIONS = [
  '',
  'policy_updated',
  'filter_preset_saved',
  'filter_preset_deleted',
  'scheduler_tick',
  'worker_process',
  'run_enqueued',
] as const;

const SYSTEM0_EVENT_SOURCE_OPTIONS = [
  '',
  'admin_policy',
  'admin_presets',
  'admin_scheduler',
  'admin_worker',
  'admin_run',
  'cron_scheduler',
] as const;

type NoticeType = 'success' | 'info' | 'warning' | 'error';
type PresetScopeFilter = 'all' | 'shared' | 'private' | 'mine';
type ProcessQueueOptions = {
  silent?: boolean;
  batchSize?: number;
  source?: 'manual' | 'auto';
  drain?: boolean;
  maxBatches?: number;
};

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) return '—';
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return `${minutes}m ${remSeconds}s`;
}

function statusBadge(status: string | null | undefined) {
  if (status === 'completed') return 'bg-green-100 text-green-800';
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'running') return 'bg-blue-100 text-blue-800';
  if (status === 'queued') return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

function formatOutputPreview(output: Record<string, unknown> | null) {
  if (!output) return '—';
  const value = JSON.stringify(output);
  if (value.length <= 280) return value;
  return `${value.slice(0, 280)}…`;
}

function formatAgeFromNow(iso: string | null | undefined) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return '—';
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes === 0 ? `${hours}h ago` : `${hours}h ${remMinutes}m ago`;
}

function eventBadgeClass(eventType: string) {
  if (eventType === 'policy_updated') return 'bg-indigo-100 text-indigo-800';
  if (eventType === 'filter_preset_saved') return 'bg-violet-100 text-violet-800';
  if (eventType === 'filter_preset_deleted') return 'bg-violet-100 text-violet-800';
  if (eventType === 'scheduler_tick') return 'bg-blue-100 text-blue-800';
  if (eventType === 'worker_process') return 'bg-amber-100 text-amber-800';
  if (eventType === 'run_enqueued') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-700';
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function System0ConsolePage() {
  const [metrics, setMetrics] = useState<System0Metrics | null>(null);
  const [notionStatus, setNotionStatus] = useState<NotionWorkerStatus | null>(null);
  const [policy, setPolicy] = useState<System0Policy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policySaving, setPolicySaving] = useState(false);
  const [events, setEvents] = useState<System0AuditEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [eventsCursor, setEventsCursor] = useState<string | null>(null);
  const [eventsHasMore, setEventsHasMore] = useState(false);
  const [eventsExporting, setEventsExporting] = useState(false);
  const [savedFilterPresets, setSavedFilterPresets] = useState<AuditFilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [presetViewerId, setPresetViewerId] = useState<string | null>(null);
  const [presetScopeFilter, setPresetScopeFilter] = useState<PresetScopeFilter>('all');
  const [presetIsShared, setPresetIsShared] = useState(true);
  const [presetEditorOpen, setPresetEditorOpen] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState('');
  const [presetSaveLoading, setPresetSaveLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [eventSourceFilter, setEventSourceFilter] = useState('');
  const [eventRunIdFilter, setEventRunIdFilter] = useState('');
  const [eventFromDate, setEventFromDate] = useState('');
  const [eventToDate, setEventToDate] = useState('');
  const [eventsLimit, setEventsLimit] = useState(12);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [liveRefresh, setLiveRefresh] = useState(true);
  const [autoProcess, setAutoProcess] = useState(false);
  const [autoProcessIntervalSec, setAutoProcessIntervalSec] = useState(30);
  const [lastAutoProcessedAt, setLastAutoProcessedAt] = useState<string | null>(null);
  const [notionQueueLimit, setNotionQueueLimit] = useState(25);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<RunTask | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<System0AuditEvent | null>(null);
  const [notice, setNotice] = useState<{ type: NoticeType; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoProcessBusyRef = useRef(false);
  const policyHydratedRef = useRef(false);

  const showNotice = (type: NoticeType, message: string) => {
    setNotice({ type, message });
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 6000);
  };

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const getCurrentFilterState = (): AuditFilterState => ({
    eventTypeFilter,
    eventSourceFilter,
    eventRunIdFilter,
    eventFromDate,
    eventToDate,
    eventsLimit,
  });

  const readApiError = async (response: Response, fallback: string) => {
    try {
      const payload = await response.json();
      if (payload && typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
    } catch {
      // Ignore parse failures and return fallback.
    }
    return fallback;
  };

  const fetchMetrics = async (preserveSelection = true) => {
    const response = await fetch('/api/admin/funding/system-0/metrics?days=14');
    if (!response.ok) throw new Error('Failed to load metrics');
    const payload = (await response.json()) as System0Metrics;
    setMetrics(payload);

    const hasSelection = preserveSelection && selectedRunId && payload.recentRuns.some((r) => r.runId === selectedRunId);
    const nextRunId = hasSelection ? selectedRunId : payload.recentRuns[0]?.runId || null;
    setSelectedRunId(nextRunId);
    return nextRunId;
  };

  const fetchNotionWorkerStatus = async () => {
    const response = await fetch('/api/admin/funding/notion-workers');
    if (!response.ok) throw new Error('Failed to load Notion worker status');
    const payload = (await response.json()) as NotionWorkerStatus;
    setNotionStatus(payload);
  };

  const fetchPolicy = async ({ hydrateLocal = true, silent = false }: { hydrateLocal?: boolean; silent?: boolean } = {}) => {
    if (!silent) setPolicyLoading(true);
    try {
      const response = await fetch('/api/admin/funding/system-0/policy');
      if (!response.ok) throw new Error('Failed to load System 0 policy');
      const payload = await response.json();
      const nextPolicy = payload?.policy as System0Policy;
      setPolicy(nextPolicy);
      if (hydrateLocal && !policyHydratedRef.current) {
        setAutoProcess(nextPolicy.autoProcessEnabled);
        setAutoProcessIntervalSec(nextPolicy.autoProcessIntervalSec);
        policyHydratedRef.current = true;
      }
      return nextPolicy;
    } finally {
      if (!silent) setPolicyLoading(false);
    }
  };

  const fetchPresets = async () => {
    const response = await fetch('/api/admin/funding/system-0/presets?limit=50');
    if (!response.ok) throw new Error('Failed to load audit filter presets');
    const payload = await response.json();
    setPresetViewerId(typeof payload?.viewerId === 'string' ? payload.viewerId : null);
    const presets = Array.isArray(payload?.presets)
      ? (payload.presets as AuditFilterPreset[])
      : [];
    setSavedFilterPresets(presets);
    const selectedPreset = presets.find((preset) => preset.id === selectedPresetId);
    if (selectedPreset) {
      setPresetIsShared(selectedPreset.isShared);
    } else {
      setSelectedPresetId('');
      setPresetIsShared(true);
    }
  };

  const fetchEvents = async ({
    silent = false,
    mode = 'replace',
    beforeCursor,
    override,
  }: {
    silent?: boolean;
    mode?: 'replace' | 'append';
    beforeCursor?: string | null;
    override?: {
      eventTypeFilter?: string;
      eventSourceFilter?: string;
      eventRunIdFilter?: string;
      eventFromDate?: string;
      eventToDate?: string;
      eventsLimit?: number;
    };
  } = {}) => {
    if (mode === 'append') {
      setEventsLoadingMore(true);
    } else if (!silent) {
      setEventsLoading(true);
    }
    try {
      const effectiveEventType = override?.eventTypeFilter ?? eventTypeFilter;
      const effectiveEventSource = override?.eventSourceFilter ?? eventSourceFilter;
      const effectiveRunId = override?.eventRunIdFilter ?? eventRunIdFilter;
      const effectiveFromDate = override?.eventFromDate ?? eventFromDate;
      const effectiveToDate = override?.eventToDate ?? eventToDate;
      const effectiveLimit = override?.eventsLimit ?? eventsLimit;

      const params = new URLSearchParams();
      params.set('limit', String(effectiveLimit));
      if (effectiveEventType) params.set('eventType', effectiveEventType);
      if (effectiveEventSource) params.set('source', effectiveEventSource);
      if (effectiveRunId.trim()) params.set('runId', effectiveRunId.trim());
      if (effectiveFromDate) params.set('from', effectiveFromDate);
      if (effectiveToDate) params.set('to', effectiveToDate);
      if (beforeCursor) params.set('before', beforeCursor);

      const response = await fetch(`/api/admin/funding/system-0/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load System 0 events');
      const payload = await response.json();
      const incomingEvents = Array.isArray(payload?.events) ? payload.events : [];
      const nextCursor = typeof payload?.pagination?.nextCursor === 'string'
        ? payload.pagination.nextCursor
        : null;

      if (mode === 'append') {
        setEvents((prev) => {
          const byId = new Map<string, System0AuditEvent>();
          for (const item of prev) byId.set(item.id, item);
          for (const item of incomingEvents) byId.set(item.id, item);
          return Array.from(byId.values());
        });
      } else {
        setEvents(incomingEvents);
      }

      setEventsCursor(nextCursor);
      setEventsHasMore(Boolean(nextCursor));

      const eventPool = mode === 'append' ? [...events, ...incomingEvents] : incomingEvents;
      if (selectedEvent && !eventPool.some((event: System0AuditEvent) => event.id === selectedEvent.id)) {
        setSelectedEvent(null);
      }
    } finally {
      if (mode === 'append') {
        setEventsLoadingMore(false);
      } else if (!silent) {
        setEventsLoading(false);
      }
    }
  };

  const exportEvents = async () => {
    setEventsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (eventTypeFilter) params.set('eventType', eventTypeFilter);
      if (eventSourceFilter) params.set('source', eventSourceFilter);
      if (eventRunIdFilter.trim()) params.set('runId', eventRunIdFilter.trim());
      if (eventFromDate) params.set('from', eventFromDate);
      if (eventToDate) params.set('to', eventToDate);

      const response = await fetch(`/api/admin/funding/system-0/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export System 0 events');
      const payload = await response.json();
      const eventsData = Array.isArray(payload?.events) ? payload.events : [];
      const blob = new Blob([JSON.stringify(eventsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      anchor.href = url;
      anchor.download = `system0-events-${now}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showNotice('success', `Exported ${eventsData.length} event(s) as JSON.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Failed to export events');
    } finally {
      setEventsExporting(false);
    }
  };

  const exportEventsCsv = async () => {
    setEventsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (eventTypeFilter) params.set('eventType', eventTypeFilter);
      if (eventSourceFilter) params.set('source', eventSourceFilter);
      if (eventRunIdFilter.trim()) params.set('runId', eventRunIdFilter.trim());
      if (eventFromDate) params.set('from', eventFromDate);
      if (eventToDate) params.set('to', eventToDate);
      params.set('format', 'csv');

      const response = await fetch(`/api/admin/funding/system-0/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export System 0 events as CSV');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      anchor.href = url;
      anchor.download = `system0-events-${now}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showNotice('success', 'CSV export downloaded.');
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Failed to export events as CSV');
    } finally {
      setEventsExporting(false);
    }
  };

  const loadMoreEvents = async () => {
    if (!eventsHasMore || !eventsCursor) return;
    await fetchEvents({
      mode: 'append',
      beforeCursor: eventsCursor,
    });
  };

  const clearEventFilters = () => {
    setEventTypeFilter('');
    setEventSourceFilter('');
    setEventRunIdFilter('');
    setEventFromDate('');
    setEventToDate('');
    setEventsLimit(12);
    setSelectedPresetId('');
    setPresetIsShared(true);
    setPresetEditorOpen(false);
    setPresetNameDraft('');
    setSelectedEvent(null);
    setEventsCursor(null);
    setEventsHasMore(false);
  };

  const applyDateShortcut = (days: 1 | 7 | 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const from = formatDateInput(start);
    const to = formatDateInput(end);

    setEventFromDate(from);
    setEventToDate(to);
    setSelectedPresetId('');
    setSelectedEvent(null);
    setEventsCursor(null);
    setEventsHasMore(false);
    fetchEvents({
      override: {
        eventFromDate: from,
        eventToDate: to,
      },
    }).catch((eventsError) => {
      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load events');
    });
  };

  const openPresetEditor = () => {
    setPresetNameDraft(activePreset?.name || 'System 0 audit preset');
    setPresetEditorOpen(true);
  };

  const closePresetEditor = () => {
    setPresetEditorOpen(false);
    setPresetNameDraft('');
  };

  const saveCurrentFilterPreset = async ({ forceNew = false }: { forceNew?: boolean } = {}) => {
    const name = presetNameDraft.trim();
    if (!name) return;

    setPresetSaveLoading(true);
    try {
      const response = await fetch('/api/admin/funding/system-0/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: forceNew ? undefined : (selectedPresetId || undefined),
          name,
          filters: getCurrentFilterState(),
          isShared: presetIsShared,
        }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to save preset'));
      }

      const payload = await response.json();
      const savedPreset = payload?.preset as AuditFilterPreset | undefined;
      if (!savedPreset?.id) {
        throw new Error('Failed to save preset');
      }

      await fetchPresets();
      setSelectedPresetId(savedPreset.id);
      setPresetIsShared(savedPreset.isShared);
      setPresetEditorOpen(false);
      setPresetNameDraft('');
      showNotice('success', `Saved preset "${name}".`);
    } catch (presetError) {
      setError(presetError instanceof Error ? presetError.message : 'Failed to save preset');
    } finally {
      setPresetSaveLoading(false);
    }
  };

  const applySelectedPreset = (presetId: string) => {
    if (!presetId) {
      setSelectedPresetId('');
      setPresetIsShared(true);
      return;
    }
    const preset = savedFilterPresets.find((item) => item.id === presetId);
    if (!preset) {
      setSelectedPresetId('');
      setPresetIsShared(true);
      return;
    }
    setSelectedPresetId(preset.id);
    setPresetIsShared(preset.isShared);
    setEventTypeFilter(preset.filters.eventTypeFilter);
    setEventSourceFilter(preset.filters.eventSourceFilter);
    setEventRunIdFilter(preset.filters.eventRunIdFilter);
    setEventFromDate(preset.filters.eventFromDate);
    setEventToDate(preset.filters.eventToDate);
    setEventsLimit(preset.filters.eventsLimit);
    setSelectedEvent(null);
    setEventsCursor(null);
    setEventsHasMore(false);
    fetchEvents({
      override: {
        eventTypeFilter: preset.filters.eventTypeFilter,
        eventSourceFilter: preset.filters.eventSourceFilter,
        eventRunIdFilter: preset.filters.eventRunIdFilter,
        eventFromDate: preset.filters.eventFromDate,
        eventToDate: preset.filters.eventToDate,
        eventsLimit: preset.filters.eventsLimit,
      },
    }).catch((eventsError) => {
      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load events');
    });
  };

  const deleteSelectedPreset = async () => {
    if (!selectedPresetId) return;
    const preset = savedFilterPresets.find((item) => item.id === selectedPresetId);
    if (!preset) return;
    try {
      const response = await fetch('/api/admin/funding/system-0/presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPresetId }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to delete preset'));
      }
      await fetchPresets();
      setSelectedPresetId('');
      setPresetIsShared(true);
      showNotice('info', `Deleted preset "${preset.name}".`);
    } catch (presetError) {
      setError(presetError instanceof Error ? presetError.message : 'Failed to delete preset');
    }
  };

  const applyRunIdEventFilter = (runId: string) => {
    setEventRunIdFilter(runId);
    setSelectedPresetId('');
    setSelectedEvent(null);
    setEventsCursor(null);
    setEventsHasMore(false);
    fetchEvents({ override: { eventRunIdFilter: runId } }).catch((eventsError) => {
      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load events');
    });
  };

  const fetchRunStatus = async (runId: string | null, silent = false) => {
    if (!runId) {
      setRunStatus(null);
      return;
    }
    if (!silent) setRunLoading(true);
    try {
      const response = await fetch(`/api/admin/funding/system-0/run?runId=${encodeURIComponent(runId)}`);
      if (!response.ok) throw new Error('Failed to load run status');
      setRunStatus(await response.json());
    } finally {
      if (!silent) setRunLoading(false);
    }
  };

  const refreshAll = async (silent = false) => {
    if (!silent) setError(null);
    if (!silent) setLoading(true);
    try {
      const runId = await fetchMetrics(true);
      await fetchRunStatus(runId, silent);
      try {
        await fetchNotionWorkerStatus();
      } catch (notionError) {
        console.error('Failed to refresh Notion worker status:', notionError);
      }
      try {
        await fetchEvents({ silent: true });
      } catch (eventsError) {
        console.error('Failed to refresh System 0 events:', eventsError);
      }
      setLastRefreshedAt(new Date().toISOString());
    } catch (refreshError) {
      if (silent) {
        console.error('Background refresh failed:', refreshError);
        return;
      }
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets().catch((presetError) => {
      setError(presetError instanceof Error ? presetError.message : 'Failed to load presets');
    });
    fetchPolicy({ hydrateLocal: true }).catch((policyError) => {
      setError(policyError instanceof Error ? policyError.message : 'Failed to load policy');
    });
    fetchEvents().catch((eventsError) => {
      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load events');
    });
    refreshAll();
  }, []);

  useEffect(() => {
    fetchRunStatus(selectedRunId).catch((runError) => {
      setError(runError instanceof Error ? runError.message : 'Failed to load run details');
    });
    setSelectedTask(null);
  }, [selectedRunId]);

  useEffect(() => {
    if (!liveRefresh) return;
    const interval = setInterval(() => {
      refreshAll(true).catch(() => {
        // Keep the console stable if a background poll fails.
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [liveRefresh, selectedRunId, eventTypeFilter, eventSourceFilter, eventRunIdFilter, eventFromDate, eventToDate, eventsLimit]);

  useEffect(() => {
    if (!autoProcess) return;
    const interval = setInterval(async () => {
      if (autoProcessBusyRef.current) return;
      autoProcessBusyRef.current = true;
      try {
        await processQueue({
          silent: true,
          source: 'auto',
        });
      } finally {
        autoProcessBusyRef.current = false;
      }
    }, Math.max(10, autoProcessIntervalSec) * 1000);
    return () => clearInterval(interval);
  }, [autoProcess, autoProcessIntervalSec, selectedRunId]);

  const startRun = async (mode: 'incremental' | 'full') => {
    setActionLoading(`start_${mode}`);
    try {
      const response = await fetch('/api/admin/funding/system-0/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!response.ok) throw new Error('Failed to start run');
      const payload = await response.json();
      await refreshAll();
      if (payload.runId) {
        setSelectedRunId(payload.runId);
      }
      showNotice('success', `Started ${mode} run ${payload.runId ? payload.runId.slice(0, 8) : ''}`.trim());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to start run');
    } finally {
      setActionLoading(null);
    }
  };

  const processQueue = async (options: ProcessQueueOptions = {}) => {
    const {
      silent = false,
      batchSize,
      source = 'manual',
      drain = false,
      maxBatches,
    } = options;

    if (!silent) setActionLoading(drain ? 'drain_queue' : 'process_queue');
    try {
      const requestPayload: Record<string, unknown> = { drain };
      if (typeof batchSize === 'number') {
        requestPayload.batchSize = batchSize;
      }
      if (typeof maxBatches === 'number') {
        requestPayload.maxBatches = maxBatches;
      }
      const response = await fetch('/api/admin/funding/system-0/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) throw new Error('Failed to process queue');
      const payload = await response.json();
      await refreshAll(silent);
      if (source === 'auto') {
        setLastAutoProcessedAt(new Date().toISOString());
      }
      const processed = Number(payload?.processedCount || 0);
      const recovered = Number(payload?.staleRecovery?.recovered || 0);
      const blocked = payload?.queueResult?.blocked === true;
      const batchesExecuted = Number(payload?.queueResult?.batchesExecuted || 0);
      if (silent) {
        if (processed > 0 || recovered > 0) {
          showNotice(
            recovered > 0 ? 'warning' : 'info',
            recovered > 0
              ? `Auto-processed ${processed} task(s); recovered ${recovered} stale task(s).`
              : `Auto-processed ${processed} task(s).`
          );
        }
      } else if (blocked) {
        showNotice(
          'warning',
          `Processed ${processed} task(s) across ${batchesExecuted} batch(es); queue appears blocked by dependencies.`
        );
      } else if (recovered > 0) {
        showNotice(
          'warning',
          drain
            ? `Processed ${processed} task(s) across ${batchesExecuted} batch(es); recovered ${recovered} stale task(s).`
            : `Processed ${processed} task(s); recovered ${recovered} stale task(s).`
        );
      } else {
        showNotice(
          'success',
          drain
            ? `Processed ${processed} task(s) across ${batchesExecuted} batch(es).`
            : `Processed ${processed} task(s).`
        );
      }
      return payload;
    } catch (actionError) {
      if (silent) {
        console.error('Auto process queue failed:', actionError);
      } else {
        setError(actionError instanceof Error ? actionError.message : 'Failed to process queue');
      }
      return null;
    } finally {
      if (!silent) setActionLoading(null);
    }
  };

  const savePolicy = async () => {
    if (!policy) return;
    setPolicySaving(true);
    try {
      const response = await fetch('/api/admin/funding/system-0/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy }),
      });
      if (!response.ok) throw new Error('Failed to save System 0 policy');
      const payload = await response.json();
      const saved = payload?.policy as System0Policy;
      setPolicy(saved);
      setAutoProcess(saved.autoProcessEnabled);
      setAutoProcessIntervalSec(saved.autoProcessIntervalSec);
      showNotice('success', 'System 0 autopilot policy saved.');
      await refreshAll(true);
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : 'Failed to save policy');
    } finally {
      setPolicySaving(false);
    }
  };

  const retryFailedForSelectedRun = async () => {
    if (!selectedRunId) return;
    setActionLoading('retry_failed');
    try {
      const response = await fetch('/api/admin/funding/system-0/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: selectedRunId }),
      });
      if (!response.ok) throw new Error('Failed to retry failed tasks');
      const payload = await response.json();
      await refreshAll();
      showNotice('success', `Requeued ${Number(payload?.retriedCount || 0)} failed task(s) for this run.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to retry tasks');
    } finally {
      setActionLoading(null);
    }
  };

  const retrySingleTask = async (taskId: string) => {
    setActionLoading(`retry_task_${taskId}`);
    try {
      const response = await fetch('/api/admin/funding/system-0/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: [taskId] }),
      });
      if (!response.ok) throw new Error('Failed to retry task');
      const payload = await response.json();
      await refreshAll(true);
      const retried = Number(payload?.retriedCount || 0);
      showNotice('success', retried > 0 ? 'Task requeued.' : 'No task was requeued.');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to retry task');
    } finally {
      setActionLoading(null);
    }
  };

  const queueNotionWorkers = async (dryRun = false) => {
    const actionKey = dryRun ? 'queue_notion_dry' : 'queue_notion';
    setActionLoading(actionKey);
    try {
      const response = await fetch('/api/admin/funding/notion-workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: notionQueueLimit,
          dryRun,
        }),
      });
      if (!response.ok) throw new Error('Failed to queue Notion workers');
      const payload = await response.json();
      await fetchNotionWorkerStatus();
      if (!dryRun) {
        await refreshAll(true);
      }
      const queued = Number(payload?.queued || 0);
      const scanned = Number(payload?.scanned || 0);
      const skipped = Number(payload?.skipped || 0);
      if (dryRun) {
        showNotice('info', `Dry run scanned ${scanned}; would queue ${queued}; skipped ${skipped}.`);
      } else {
        showNotice('success', `Queued ${queued} Notion worker task(s) from ${scanned} candidates.`);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to queue Notion workers');
    } finally {
      setActionLoading(null);
    }
  };

  const runSchedulerTick = async () => {
    setActionLoading('scheduler_tick');
    try {
      const response = await fetch('/api/admin/funding/system-0/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to run scheduler tick');
      const payload = await response.json();
      await refreshAll(true);
      if (payload?.skipped) {
        showNotice('info', 'Scheduler tick skipped because policy has scheduler disabled.');
        return;
      }
      const processed = Number(payload?.processedCount || 0);
      const autoStarted = payload?.autoStarted === true;
      const blocked = payload?.queueResult?.blocked === true;
      if (blocked) {
        showNotice('warning', `Scheduler tick processed ${processed} task(s), queue still blocked by dependencies.`);
      } else {
        showNotice(
          'success',
          autoStarted
            ? `Scheduler tick started a run and processed ${processed} task(s).`
            : `Scheduler tick processed ${processed} task(s).`
        );
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to run scheduler tick');
    } finally {
      setActionLoading(null);
    }
  };

  const failedTasks = useMemo(
    () => (runStatus?.tasks || []).filter((task) => task.status === 'failed'),
    [runStatus]
  );
  const activePreset = useMemo(
    () => savedFilterPresets.find((preset) => preset.id === selectedPresetId) || null,
    [savedFilterPresets, selectedPresetId]
  );
  const isPresetMine = (preset: AuditFilterPreset) => (
    Boolean(presetViewerId && preset.createdBy && preset.createdBy === presetViewerId)
  );
  const presetScopeCounts = useMemo(() => {
    const counts = {
      all: savedFilterPresets.length,
      shared: 0,
      private: 0,
      mine: 0,
    };
    for (const preset of savedFilterPresets) {
      if (preset.isShared) {
        counts.shared += 1;
      } else {
        counts.private += 1;
      }
      if (isPresetMine(preset)) {
        counts.mine += 1;
      }
    }
    return counts;
  }, [savedFilterPresets, presetViewerId]);
  const visibleFilterPresets = useMemo(() => {
    if (presetScopeFilter === 'shared') {
      return savedFilterPresets.filter((preset) => preset.isShared);
    }
    if (presetScopeFilter === 'private') {
      return savedFilterPresets.filter((preset) => !preset.isShared);
    }
    if (presetScopeFilter === 'mine') {
      return savedFilterPresets.filter((preset) => isPresetMine(preset));
    }
    return savedFilterPresets;
  }, [savedFilterPresets, presetScopeFilter, presetViewerId]);
  const selectedPresetVisible = useMemo(
    () => !selectedPresetId || visibleFilterPresets.some((preset) => preset.id === selectedPresetId),
    [selectedPresetId, visibleFilterPresets]
  );
  const notionStageRows = useMemo(
    () => Object.entries(notionStatus?.queue.byStage || {}).sort(([a], [b]) => a.localeCompare(b)),
    [notionStatus]
  );

  const copySelectedTaskJson = async () => {
    if (!selectedTask) return;
    const payload = {
      runId: selectedRunId,
      task: selectedTask,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showNotice('success', 'Task JSON copied to clipboard.');
    } catch {
      showNotice('error', 'Failed to copy JSON to clipboard.');
    }
  };

  const copySelectedEventJson = async () => {
    if (!selectedEvent) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
      showNotice('success', 'Event JSON copied to clipboard.');
    } catch {
      showNotice('error', 'Failed to copy event JSON.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />
      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="mb-6">
            <Link href="/admin/funding" className="text-sm text-gray-600 hover:text-black font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Funding
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-8 h-8 text-indigo-600" />
                <h1 className="text-4xl font-black text-black">System 0 Run Console</h1>
              </div>
              <p className="text-gray-600">Run-level monitoring, task diagnostics, and fast retry controls.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const next = !liveRefresh;
                  setLiveRefresh(next);
                  showNotice('info', `Live refresh ${next ? 'enabled' : 'paused'}.`);
                }}
                className={`px-3 py-2 border-2 border-black font-bold transition-colors ${
                  liveRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Live: {liveRefresh ? 'On (15s)' : 'Off'}
              </button>
              <button
                onClick={() => {
                  const next = !autoProcess;
                  setAutoProcess(next);
                  showNotice('info', `Auto process ${next ? 'enabled' : 'paused'}.`);
                }}
                className={`px-3 py-2 border-2 border-black font-bold transition-colors ${
                  autoProcess ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Auto: {autoProcess ? `On (${autoProcessIntervalSec}s)` : 'Off'}
              </button>
              <select
                value={String(autoProcessIntervalSec)}
                onChange={(event) => setAutoProcessIntervalSec(Number(event.target.value))}
                className="px-2 py-2 border-2 border-black bg-white font-bold text-sm"
              >
                <option value="20">20s</option>
                <option value="30">30s</option>
                <option value="45">45s</option>
                <option value="60">60s</option>
              </select>
              <button
                onClick={() => refreshAll()}
                disabled={Boolean(actionLoading) || loading}
                className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => startRun('incremental')}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 bg-indigo-600 text-white border-2 border-black font-bold hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Incremental
              </button>
              <button
                onClick={() => startRun('full')}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Full
              </button>
              <button
                onClick={() => processQueue({ batchSize: policy?.workerBatchSize })}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading === 'process_queue' ? 'animate-spin' : ''}`} />
                Process Queue
              </button>
              <button
                onClick={() => processQueue({ drain: true, batchSize: policy?.drainBatchSize, maxBatches: policy?.drainMaxBatches })}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 bg-amber-100 border-2 border-black font-bold hover:bg-amber-200 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading === 'drain_queue' ? 'animate-spin' : ''}`} />
                Drain Queue
              </button>
              <button
                onClick={runSchedulerTick}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 bg-blue-100 border-2 border-black font-bold hover:bg-blue-200 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading === 'scheduler_tick' ? 'animate-spin' : ''}`} />
                Scheduler Tick
              </button>
            </div>
          </div>

          {lastRefreshedAt && (
            <div className="text-xs text-gray-500 mb-4">
              Last refreshed: {new Date(lastRefreshedAt).toLocaleTimeString()}
            </div>
          )}

          {lastAutoProcessedAt && (
            <div className="text-xs text-gray-500 mb-4">
              Last auto-process: {new Date(lastAutoProcessedAt).toLocaleTimeString()}
            </div>
          )}

          {notice && (
            <div
              className={`border-2 p-3 mb-4 font-medium ${
                notice.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : notice.type === 'warning'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : notice.type === 'error'
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : 'bg-blue-50 border-blue-500 text-blue-800'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-500 p-4 mb-6 text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="bg-white border-2 border-black p-4 mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
              <div>
                <div className="text-sm uppercase tracking-wide font-bold text-gray-600">Autopilot Policy</div>
                <div className="text-lg font-black text-black">Shared defaults for scheduler, worker, and console</div>
                {policy?.updatedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Updated {new Date(policy.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchPolicy({ hydrateLocal: false })}
                  disabled={policyLoading || policySaving}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  {policyLoading ? 'Loading…' : 'Reload'}
                </button>
                <button
                  onClick={savePolicy}
                  disabled={!policy || policySaving}
                  className="px-3 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 disabled:opacity-50"
                >
                  {policySaving ? 'Saving…' : 'Save Policy'}
                </button>
              </div>
            </div>
            {!policy ? (
              <div className="text-sm text-gray-500">Loading policy…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                <label className="border border-gray-200 p-3 bg-gray-50 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={policy.schedulerEnabled}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, schedulerEnabled: event.target.checked } : prev))}
                  />
                  Scheduler enabled
                </label>
                <label className="border border-gray-200 p-3 bg-gray-50 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={policy.autoStart}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, autoStart: event.target.checked } : prev))}
                  />
                  Auto-start when idle
                </label>
                <label className="border border-gray-200 p-3 bg-gray-50 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={policy.drainEnabled}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, drainEnabled: event.target.checked } : prev))}
                  />
                  Drain mode on scheduler
                </label>
                <label className="border border-gray-200 p-3 bg-gray-50 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={policy.autoProcessEnabled}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setPolicy((prev) => (prev ? { ...prev, autoProcessEnabled: next } : prev));
                      setAutoProcess(next);
                    }}
                  />
                  Console auto-process default
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Run mode</div>
                  <select
                    value={policy.runMode}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, runMode: event.target.value === 'full' ? 'full' : 'incremental' } : prev))}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="incremental">Incremental</option>
                    <option value="full">Full</option>
                  </select>
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Worker batch size</div>
                  <select
                    value={String(policy.workerBatchSize)}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, workerBatchSize: Number(event.target.value) } : prev))}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Stale recovery (minutes)</div>
                  <select
                    value={String(policy.staleAfterMinutes)}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, staleAfterMinutes: Number(event.target.value) } : prev))}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                    <option value="60">60</option>
                    <option value="90">90</option>
                  </select>
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Drain batch size</div>
                  <select
                    value={String(policy.drainBatchSize)}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, drainBatchSize: Number(event.target.value) } : prev))}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Drain max batches</div>
                  <select
                    value={String(policy.drainMaxBatches)}
                    onChange={(event) => setPolicy((prev) => (prev ? { ...prev, drainMaxBatches: Number(event.target.value) } : prev))}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                  </select>
                </label>
                <label className="border border-gray-200 p-3 bg-white font-medium">
                  <div className="text-xs uppercase text-gray-600 mb-1">Console auto interval</div>
                  <select
                    value={String(policy.autoProcessIntervalSec)}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setPolicy((prev) => (prev ? { ...prev, autoProcessIntervalSec: next } : prev));
                      setAutoProcessIntervalSec(next);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 bg-white"
                  >
                    <option value="20">20s</option>
                    <option value="30">30s</option>
                    <option value="45">45s</option>
                    <option value="60">60s</option>
                    <option value="90">90s</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-black p-4 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
              <div>
                <div className="text-sm uppercase tracking-wide font-bold text-gray-600">Audit Trail</div>
                <div className="text-lg font-black text-black">Recent System 0 operations</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPresetVisible ? selectedPresetId : ''}
                  onChange={(event) => applySelectedPreset(event.target.value)}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium max-w-[220px]"
                >
                  <option value="">Saved presets</option>
                  {visibleFilterPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({isPresetMine(preset) ? 'mine, ' : ''}{preset.isShared ? 'shared' : 'private'})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 rounded border-2 border-black bg-white p-1">
                  {([
                    { key: 'all', label: 'All', count: presetScopeCounts.all },
                    { key: 'shared', label: 'Shared', count: presetScopeCounts.shared },
                    { key: 'private', label: 'Private', count: presetScopeCounts.private },
                    { key: 'mine', label: 'Mine', count: presetScopeCounts.mine },
                  ] as Array<{ key: PresetScopeFilter; label: string; count: number }>).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setPresetScopeFilter(item.key)}
                      className={`px-2 py-1 text-xs font-bold uppercase tracking-wide border ${presetScopeFilter === item.key ? 'bg-black text-white border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>
                {activePreset && !selectedPresetVisible && (
                  <div className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300">
                    Editing hidden preset: {activePreset.name}
                  </div>
                )}
                <label className="flex items-center gap-2 px-2 py-2 border-2 border-black bg-white text-xs font-bold uppercase tracking-wide">
                  <input
                    type="checkbox"
                    checked={presetIsShared}
                    onChange={(event) => setPresetIsShared(event.target.checked)}
                    className="h-4 w-4 accent-black"
                  />
                  Share with team
                </label>
                <button
                  onClick={presetEditorOpen ? closePresetEditor : openPresetEditor}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100"
                >
                  {presetEditorOpen ? 'Close Save' : 'Save Preset'}
                </button>
                <button
                  onClick={deleteSelectedPreset}
                  disabled={!selectedPresetId}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  Delete Preset
                </button>
                {presetEditorOpen && (
                  <div className="w-full border-2 border-black bg-gray-50 p-3 flex flex-col lg:flex-row lg:items-center gap-2">
                    <input
                      value={presetNameDraft}
                      onChange={(event) => setPresetNameDraft(event.target.value)}
                      placeholder="Preset name"
                      className="flex-1 px-3 py-2 border-2 border-black bg-white text-sm font-medium"
                    />
                    <button
                      onClick={() => saveCurrentFilterPreset()}
                      disabled={presetSaveLoading || !presetNameDraft.trim() || !selectedPresetId}
                      className="px-3 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 disabled:opacity-50"
                    >
                      {presetSaveLoading ? 'Saving…' : 'Update Selected'}
                    </button>
                    <button
                      onClick={() => saveCurrentFilterPreset({ forceNew: true })}
                      disabled={presetSaveLoading || !presetNameDraft.trim()}
                      className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                    >
                      {presetSaveLoading ? 'Saving…' : 'Save As New'}
                    </button>
                    <button
                      onClick={closePresetEditor}
                      disabled={presetSaveLoading}
                      className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <select
                  value={eventTypeFilter}
                  onChange={(event) => {
                    setEventTypeFilter(event.target.value);
                    setSelectedPresetId('');
                  }}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                >
                  {SYSTEM0_EVENT_TYPE_OPTIONS.map((value) => (
                    <option key={value || 'all'} value={value}>
                      {value ? value : 'All event types'}
                    </option>
                  ))}
                </select>
                <select
                  value={eventSourceFilter}
                  onChange={(event) => {
                    setEventSourceFilter(event.target.value);
                    setSelectedPresetId('');
                  }}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                >
                  {SYSTEM0_EVENT_SOURCE_OPTIONS.map((value) => (
                    <option key={value || 'all'} value={value}>
                      {value ? value : 'All sources'}
                    </option>
                  ))}
                </select>
                <input
                  value={eventRunIdFilter}
                  onChange={(event) => {
                    setEventRunIdFilter(event.target.value);
                    setSelectedPresetId('');
                  }}
                  placeholder="Run ID filter"
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                />
                <input
                  type="date"
                  value={eventFromDate}
                  onChange={(event) => {
                    setEventFromDate(event.target.value);
                    setSelectedPresetId('');
                  }}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                />
                <input
                  type="date"
                  value={eventToDate}
                  onChange={(event) => {
                    setEventToDate(event.target.value);
                    setSelectedPresetId('');
                  }}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                />
                <button
                  onClick={() => applyDateShortcut(1)}
                  className="px-2 py-2 bg-white border-2 border-black font-bold text-xs hover:bg-gray-100"
                >
                  Today
                </button>
                <button
                  onClick={() => applyDateShortcut(7)}
                  className="px-2 py-2 bg-white border-2 border-black font-bold text-xs hover:bg-gray-100"
                >
                  7d
                </button>
                <button
                  onClick={() => applyDateShortcut(30)}
                  className="px-2 py-2 bg-white border-2 border-black font-bold text-xs hover:bg-gray-100"
                >
                  30d
                </button>
                <select
                  value={String(eventsLimit)}
                  onChange={(event) => {
                    setEventsLimit(Number(event.target.value));
                    setSelectedPresetId('');
                  }}
                  className="px-2 py-2 border-2 border-black bg-white text-sm font-medium"
                >
                  <option value="12">12</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <button
                  onClick={() => fetchEvents()}
                  disabled={eventsLoading}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  {eventsLoading ? 'Loading…' : 'Apply'}
                </button>
                <button
                  onClick={() => {
                    clearEventFilters();
                    fetchEvents({
                      override: {
                        eventTypeFilter: '',
                        eventSourceFilter: '',
                        eventRunIdFilter: '',
                        eventFromDate: '',
                        eventToDate: '',
                        eventsLimit: 12,
                      },
                    }).catch((eventsError) => {
                      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load events');
                    });
                  }}
                  disabled={eventsLoading}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  onClick={exportEvents}
                  disabled={eventsExporting}
                  className="px-3 py-2 bg-indigo-100 border-2 border-black font-bold hover:bg-indigo-200 disabled:opacity-50"
                >
                  {eventsExporting ? 'Exporting…' : 'Export JSON'}
                </button>
                <button
                  onClick={exportEventsCsv}
                  disabled={eventsExporting}
                  className="px-3 py-2 bg-indigo-100 border-2 border-black font-bold hover:bg-indigo-200 disabled:opacity-50"
                >
                  {eventsExporting ? 'Exporting…' : 'Export CSV'}
                </button>
              </div>
            </div>
            {eventsLoading ? (
              <div className="text-sm text-gray-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-gray-500">No System 0 events recorded yet.</div>
            ) : (
              <div className="border border-gray-200 divide-y divide-gray-100">
                {events.map((event) => (
                  <div key={event.id} className="px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[11px] font-bold ${eventBadgeClass(event.eventType)}`}>
                        {event.eventType}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-700">
                      {event.message || 'No message'}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      source: {event.source}
                      {event.runId ? ` • run: ${event.runId.slice(0, 8)}` : ''}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {event.runId && (
                        <button
                          onClick={() => applyRunIdEventFilter(event.runId as string)}
                          className="px-2 py-1 text-[11px] font-bold bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200"
                        >
                          Filter Run
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="px-2 py-1 text-[11px] font-bold bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                      >
                        View JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!eventsLoading && eventsHasMore && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    loadMoreEvents().catch((eventsError) => {
                      setError(eventsError instanceof Error ? eventsError.message : 'Failed to load more events');
                    });
                  }}
                  disabled={eventsLoadingMore}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  {eventsLoadingMore ? 'Loading more…' : 'Load More'}
                </button>
              </div>
            )}
            {selectedEvent && (
              <div className="border border-gray-200 mt-3 p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-black">
                    Event JSON: {selectedEvent.eventType}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySelectedEventJson}
                      className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <pre className="bg-white border border-gray-200 p-3 text-[11px] text-gray-800 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-black p-4">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue</div>
              <div className="text-3xl font-black">{metrics?.queue.queued ?? 0}</div>
              <div className="text-xs text-gray-500">queued tasks</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Running</div>
              <div className="text-3xl font-black text-blue-700">{metrics?.queue.running ?? 0}</div>
              <div className="text-xs text-gray-500">active tasks</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Failed</div>
              <div className="text-3xl font-black text-red-700">{metrics?.queue.failed ?? 0}</div>
              <div className="text-xs text-gray-500">needs intervention</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">Review Inbox</div>
              <div className="text-3xl font-black text-amber-700">{metrics?.review.pending ?? 0}</div>
              <div className="text-xs text-gray-500">pending human review</div>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-4 mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-3">
              <div>
                <div className="text-sm uppercase tracking-wide font-bold text-gray-600">Notion Worker Lane</div>
                <div className="text-lg font-black text-black">Queue candidates into `notion_worker` tasks</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={String(notionQueueLimit)}
                  onChange={(event) => setNotionQueueLimit(Number(event.target.value))}
                  className="px-2 py-2 border-2 border-black bg-white font-bold text-sm"
                >
                  <option value="10">Limit 10</option>
                  <option value="25">Limit 25</option>
                  <option value="50">Limit 50</option>
                  <option value="100">Limit 100</option>
                </select>
                <button
                  onClick={() => queueNotionWorkers(true)}
                  disabled={Boolean(actionLoading)}
                  className="px-3 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  {actionLoading === 'queue_notion_dry' ? 'Dry Run…' : 'Dry Run'}
                </button>
                <button
                  onClick={() => queueNotionWorkers(false)}
                  disabled={Boolean(actionLoading)}
                  className="px-3 py-2 bg-indigo-600 text-white border-2 border-black font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === 'queue_notion' ? 'Queueing…' : 'Queue Workers'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="border border-gray-200 p-3 bg-gray-50">
                <div className="text-xs uppercase font-bold text-gray-600">Eligible Stages</div>
                <div className="text-2xl font-black text-black">{notionStatus?.queue.inWorkerQueue ?? 0}</div>
                <div className="text-xs text-gray-500">Matched / Matched-New / New</div>
              </div>
              <div className="border border-gray-200 p-3 bg-gray-50">
                <div className="text-xs uppercase font-bold text-gray-600">Worker Backlog</div>
                <div className="text-2xl font-black text-indigo-700">{notionStatus?.workers.queuedTasks ?? 0}</div>
                <div className="text-xs text-gray-500">queued/running `notion_worker` tasks</div>
              </div>
              <div className="border border-gray-200 p-3 bg-gray-50">
                <div className="text-xs uppercase font-bold text-gray-600">Oldest Worker Task</div>
                <div className="text-sm font-bold text-black">
                  {notionStatus?.workers.oldestQueuedTask?.id
                    ? notionStatus.workers.oldestQueuedTask.id.slice(0, 8)
                    : '—'}
                </div>
                <div className="text-xs text-gray-500">
                  {formatAgeFromNow(notionStatus?.workers.oldestQueuedTask?.created_at)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {notionStageRows.length > 0 ? notionStageRows.map(([stage, count]) => (
                <span key={stage} className="px-2 py-1 bg-gray-100 border border-gray-300 font-semibold text-gray-700">
                  {stage}: {count}
                </span>
              )) : (
                <span className="text-gray-500">No Notion stage data yet.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border-2 border-black">
              <div className="px-4 py-3 border-b border-gray-200 font-bold">Recent Runs (14 days)</div>
              <div className="max-h-[520px] overflow-auto divide-y divide-gray-100">
                {metrics?.recentRuns?.length ? metrics.recentRuns.map((run) => (
                  <button
                    key={run.runId}
                    onClick={() => setSelectedRunId(run.runId)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedRunId === run.runId ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gray-600">{run.runId.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold ${statusBadge(run.status)}`}>{run.status}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {run.summary.completed}/{run.summary.total} complete
                      {run.summary.failed > 0 ? ` • ${run.summary.failed} failed` : ''}
                    </div>
                    <div className="text-xs text-gray-500">{formatDuration(run.durationMs)}</div>
                  </button>
                )) : (
                  <div className="px-4 py-6 text-sm text-gray-500">No runs found in lookback window.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border-2 border-black">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold">Run Detail</div>
                  {selectedRunId && <div className="text-xs text-gray-500 font-mono">{selectedRunId}</div>}
                </div>
                <button
                  onClick={retryFailedForSelectedRun}
                  disabled={Boolean(actionLoading) || !selectedRunId || failedTasks.length === 0}
                  className="px-3 py-1.5 text-sm bg-red-50 border border-red-400 text-red-700 font-bold hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Failed ({failedTasks.length})
                </button>
              </div>

              {runLoading ? (
                <div className="p-6 text-gray-600 inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading run details...
                </div>
              ) : !runStatus ? (
                <div className="p-6 text-gray-600">Select a run to inspect tasks.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 bg-gray-50">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Status</div>
                      <div className={`inline-flex mt-1 px-2 py-0.5 text-xs font-bold ${statusBadge(runStatus.status)}`}>{runStatus.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Completed</div>
                      <div className="text-lg font-black text-green-700">{runStatus.summary.completed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Failed</div>
                      <div className="text-lg font-black text-red-700">{runStatus.summary.failed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Duration</div>
                      <div className="text-lg font-black">{formatDuration(runStatus.durationMs)}</div>
                    </div>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 font-bold">Task</th>
                          <th className="text-left px-4 py-2 font-bold">Status</th>
                          <th className="text-left px-4 py-2 font-bold">Timing</th>
                          <th className="text-left px-4 py-2 font-bold">Error / Output</th>
                          <th className="text-left px-4 py-2 font-bold">Inspect</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runStatus.tasks.map((task) => (
                          <tr key={task.id} className="border-b border-gray-100 align-top">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{task.task_type || 'Unknown task'}</div>
                              <div className="font-mono text-xs text-gray-500">{task.id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-bold ${statusBadge(task.status)}`}>{task.status || 'unknown'}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              <div>Start: {task.started_at ? new Date(task.started_at).toLocaleString() : '—'}</div>
                              <div>End: {task.completed_at ? new Date(task.completed_at).toLocaleString() : '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {task.error ? (
                                <div className="space-y-2">
                                  <div className="text-red-700 inline-flex items-start gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                                    <span>{task.error}</span>
                                  </div>
                                  <button
                                    onClick={() => retrySingleTask(task.id)}
                                    disabled={Boolean(actionLoading)}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-red-50 border border-red-400 text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Retry Task
                                  </button>
                                </div>
                              ) : (
                                <div className="text-gray-600">{formatOutputPreview(task.output)}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                              >
                                View JSON
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedTask && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-black">
                          Raw Task JSON: {selectedTask.id.slice(0, 8)}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copySelectedTaskJson}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200"
                          >
                            Copy JSON
                          </button>
                          <button
                            onClick={() => setSelectedTask(null)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      <pre className="bg-white border border-gray-200 p-3 text-[11px] text-gray-800 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                        {JSON.stringify(
                          {
                            runId: selectedRunId,
                            task: selectedTask,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/admin/funding" className="bg-white border-2 border-black p-4 hover:bg-gray-50">
              <DollarSign className="w-5 h-5 mb-2" />
              <div className="font-bold">Funding Pipeline</div>
              <div className="text-xs text-gray-600">Back to opportunities and filters</div>
            </Link>
            <Link href="/admin/funding?view=reports" className="bg-white border-2 border-black p-4 hover:bg-gray-50">
              <CheckCircle2 className="w-5 h-5 mb-2" />
              <div className="font-bold">Reports</div>
              <div className="text-xs text-gray-600">Weekly funding report outputs</div>
            </Link>
            <Link href="/admin/funding?view=applications" className="bg-white border-2 border-black p-4 hover:bg-gray-50">
              <Clock3 className="w-5 h-5 mb-2" />
              <div className="font-bold">Applications</div>
              <div className="text-xs text-gray-600">Track active grant applications</div>
            </Link>
            <Link href="/admin/funding" className="bg-white border-2 border-black p-4 hover:bg-gray-50">
              <XCircle className="w-5 h-5 mb-2" />
              <div className="font-bold">Review Inbox</div>
              <div className="text-xs text-gray-600">Approve/hold low-confidence matches</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
