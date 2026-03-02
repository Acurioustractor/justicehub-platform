import {
  GRANT_MATCH_REVIEW_SOURCE,
  runGrantMatchingForOrganization,
} from '@/lib/funding/grant-matching';
import {
  fetchNotificationTargets,
  generateClosingSoonNotifications,
  generateFundingAlertNotifications,
  persistFundingNotifications,
} from '@/lib/funding/notification-engine';
import { queueNotionSyncTasks } from '@/lib/funding/notion-worker-queue';

export const SYSTEM0_TASK_TYPES = {
  scrape: 'funding_system_0_scrape',
  match: 'funding_system_0_match',
  notion: 'funding_system_0_notion',
  notify: 'funding_system_0_notify',
} as const;
const SYSTEM0_SOURCE = 'funding_system_0';

type System0TaskType = (typeof SYSTEM0_TASK_TYPES)[keyof typeof SYSTEM0_TASK_TYPES];

export interface System0RunConfig {
  mode?: 'incremental' | 'full';
  source?: 'manual' | 'scheduled' | 'api';
  triggerUserId?: string | null;
  organizationIds?: string[];
}

function isSystem0TaskType(value: string | null | undefined): value is System0TaskType {
  return (
    value === SYSTEM0_TASK_TYPES.scrape ||
    value === SYSTEM0_TASK_TYPES.match ||
    value === SYSTEM0_TASK_TYPES.notion ||
    value === SYSTEM0_TASK_TYPES.notify
  );
}

function parseRunId(sourceId: string | null | undefined): string {
  return (sourceId || '').split(':')[0];
}

async function dependenciesComplete(serviceClient: any, task: any): Promise<boolean> {
  const dependsOn = Array.isArray(task.depends_on) ? task.depends_on : [];
  if (dependsOn.length === 0) return true;

  const { data: deps } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .in('id', dependsOn);

  if (!deps || deps.length !== dependsOn.length) return false;
  return deps.every((d: any) => d.status === 'completed');
}

export async function enqueueSystem0Run(serviceClient: any, config: System0RunConfig = {}) {
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();

  const scrapeId = crypto.randomUUID();
  const matchId = crypto.randomUUID();
  const notionId = crypto.randomUUID();
  const notifyId = crypto.randomUUID();

  const tasks = [
    {
      id: scrapeId,
      source: SYSTEM0_SOURCE,
      source_id: `${runId}:scrape`,
      task_type: SYSTEM0_TASK_TYPES.scrape,
      title: 'System 0: Queue funding scrape',
      description: 'Create ingestion job for funding opportunities',
      status: 'queued',
      priority: 1,
      depends_on: [],
      requested_by: config.triggerUserId || null,
      reply_to: { run_id: runId, config, created_at: now },
      needs_review: false,
    },
    {
      id: matchId,
      source: SYSTEM0_SOURCE,
      source_id: `${runId}:match`,
      task_type: SYSTEM0_TASK_TYPES.match,
      title: 'System 0: Run grant matching',
      description: 'Score opportunities for basecamps and queue action items',
      status: 'queued',
      priority: 1,
      depends_on: [scrapeId],
      requested_by: config.triggerUserId || null,
      reply_to: { run_id: runId, config, created_at: now },
      needs_review: false,
    },
    {
      id: notionId,
      source: SYSTEM0_SOURCE,
      source_id: `${runId}:notion`,
      task_type: SYSTEM0_TASK_TYPES.notion,
      title: 'System 0: Queue Notion sync workers',
      description: 'Hand off high-quality opportunities to Notion sync queue',
      status: 'queued',
      priority: 2,
      depends_on: [matchId],
      requested_by: config.triggerUserId || null,
      reply_to: { run_id: runId, config, created_at: now },
      needs_review: false,
    },
    {
      id: notifyId,
      source: SYSTEM0_SOURCE,
      source_id: `${runId}:notify`,
      task_type: SYSTEM0_TASK_TYPES.notify,
      title: 'System 0: Send confidence-gated notifications',
      description: 'Generate and persist high-confidence funding notifications',
      status: 'queued',
      priority: 2,
      depends_on: [notionId],
      requested_by: config.triggerUserId || null,
      reply_to: { run_id: runId, config, created_at: now },
      needs_review: false,
    },
  ];

  const { error } = await serviceClient.from('agent_task_queue').insert(tasks);
  if (error) throw new Error(error.message);

  return {
    runId,
    taskIds: {
      scrapeId,
      matchId,
      notionId,
      notifyId,
    },
  };
}

export async function claimNextSystem0Task(serviceClient: any) {
  const { data: queuedTasks, error } = await serviceClient
    .from('agent_task_queue')
    .select('*')
    .eq('source', SYSTEM0_SOURCE)
    .eq('status', 'queued')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);
  if (!queuedTasks || queuedTasks.length === 0) return null;

  for (const task of queuedTasks) {
    if (!isSystem0TaskType(task.task_type)) continue;
    if (!await dependenciesComplete(serviceClient, task)) continue;

    const { data: claimed, error: claimError } = await serviceClient
      .from('agent_task_queue')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .eq('status', 'queued')
      .select('*')
      .single();

    if (!claimError && claimed) return claimed;
  }

  return null;
}

export async function completeSystem0Task(serviceClient: any, taskId: string, output: Record<string, unknown>) {
  const { error } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      output,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function failSystem0Task(serviceClient: any, taskId: string, errorMessage: string) {
  const { error } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'failed',
      error: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      needs_review: true,
    })
    .eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function executeSystem0Task(serviceClient: any, task: any) {
  const runId = parseRunId(task.source_id);
  const cfg = (task.reply_to && typeof task.reply_to === 'object'
    ? (task.reply_to as Record<string, any>).config
    : {}) || {};

  if (task.task_type === SYSTEM0_TASK_TYPES.scrape) {
    const { data: job, error } = await serviceClient
      .from('alma_ingestion_jobs')
      .insert([
        {
          job_type: 'funding_scrape',
          status: 'pending',
          config: {
            trigger: 'funding_system_0',
            run_id: runId,
            mode: cfg.mode || 'incremental',
          },
        },
      ])
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { runId, ingestionJobId: job?.id || null };
  }

  if (task.task_type === SYSTEM0_TASK_TYPES.match) {
    let orgQuery = serviceClient
      .from('organizations')
      .select('id')
      .eq('partner_tier', 'basecamp');
    if (Array.isArray(cfg.organizationIds) && cfg.organizationIds.length > 0) {
      orgQuery = orgQuery.in('id', cfg.organizationIds);
    }
    const { data: orgs, error: orgError } = await orgQuery;
    if (orgError) throw new Error(orgError.message);

    let matched = 0;
    let highConfidence = 0;

    for (const org of orgs || []) {
      const result = await runGrantMatchingForOrganization({
        userClient: serviceClient,
        serviceClient,
        organizationId: org.id,
        queueNotionWorkers: true,
        queueReviewTasks: true,
        requestedBy: cfg.triggerUserId || null,
      });
      matched += (result.matches || []).length;
      highConfidence += (result.matches || []).filter((m: any) => m.notifyEligible).length;
    }

    return {
      runId,
      organizationsProcessed: (orgs || []).length,
      totalMatches: matched,
      highConfidenceMatches: highConfidence,
    };
  }

  if (task.task_type === SYSTEM0_TASK_TYPES.notion) {
    const queueResult = await queueNotionSyncTasks(serviceClient, {
      limit: 120,
      dryRun: false,
      source: 'notion_worker',
    });
    return { runId, ...queueResult };
  }

  if (task.task_type === SYSTEM0_TASK_TYPES.notify) {
    const targets = await fetchNotificationTargets(
      serviceClient,
      Array.isArray(cfg.organizationIds) ? cfg.organizationIds : undefined
    );
    const fundingAlerts = await generateFundingAlertNotifications(serviceClient, targets);
    const closingSoon = await generateClosingSoonNotifications(serviceClient, targets);
    const notifications = [...fundingAlerts, ...closingSoon];
    const persisted = await persistFundingNotifications(serviceClient, notifications, {
      source: 'funding_notifications_system0',
      runId,
      requestedBy: cfg.triggerUserId || null,
    });

    return {
      runId,
      targetOrganizations: targets.length,
      notificationsSent: notifications.length,
      notificationsStored: persisted.stored,
      fundingAlerts: fundingAlerts.length,
      closingSoonAlerts: closingSoon.length,
    };
  }

  throw new Error(`Unsupported System 0 task type: ${task.task_type}`);
}

export async function processSystem0Queue(serviceClient: any, batchSize = 1) {
  const normalizedBatchSize = Math.max(1, Math.min(25, batchSize));
  const processed: Array<Record<string, unknown>> = [];

  for (let i = 0; i < normalizedBatchSize; i += 1) {
    const task = await claimNextSystem0Task(serviceClient);
    if (!task) break;

    try {
      let lastError: Error | null = null;
      let output: Record<string, unknown> | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          output = await executeSystem0Task(serviceClient, task);
          lastError = null;
          break;
        } catch (error: any) {
          lastError = error;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      await completeSystem0Task(serviceClient, task.id, output || {});
      processed.push({
        taskId: task.id,
        taskType: task.task_type,
        status: 'completed',
        output,
      });
    } catch (taskError: any) {
      await failSystem0Task(serviceClient, task.id, taskError.message || 'Task failed');
      processed.push({
        taskId: task.id,
        taskType: task.task_type,
        status: 'failed',
        error: taskError.message || 'Task failed',
      });
    }
  }

  return processed;
}

export interface ProcessSystem0QueueWithModeOptions {
  batchSize?: number;
  drain?: boolean;
  maxBatches?: number;
}

export async function processSystem0QueueWithMode(
  serviceClient: any,
  options: ProcessSystem0QueueWithModeOptions = {}
) {
  const batchSize = Math.max(1, Math.min(25, Number(options.batchSize || 1)));
  const drain = options.drain === true;
  const maxBatches = Math.max(1, Math.min(50, Number(options.maxBatches || 10)));

  if (!drain) {
    const processed = await processSystem0Queue(serviceClient, batchSize);
    return {
      drain,
      batchSize,
      maxBatches: 1,
      batchesExecuted: 1,
      blocked: false,
      processed,
      processedCount: processed.length,
    };
  }

  let batchesExecuted = 0;
  let blocked = false;
  const processed: Array<Record<string, unknown>> = [];

  for (let i = 0; i < maxBatches; i += 1) {
    const batch = await processSystem0Queue(serviceClient, batchSize);
    batchesExecuted += 1;

    if (batch.length > 0) {
      processed.push(...batch);
    }

    if (batch.length < batchSize) {
      const hasPending = await hasPendingSystem0Tasks(serviceClient);
      if (!hasPending) {
        break;
      }
      if (batch.length === 0) {
        blocked = true;
        break;
      }
    }
  }

  return {
    drain,
    batchSize,
    maxBatches,
    batchesExecuted,
    blocked,
    processed,
    processedCount: processed.length,
  };
}

export async function recoverStaleSystem0Tasks(serviceClient: any, staleAfterMinutes = 45) {
  const safeMinutes = Math.max(5, Math.min(24 * 60, staleAfterMinutes));
  const staleBefore = new Date(Date.now() - safeMinutes * 60 * 1000).toISOString();
  const { data: staleTasks, error: staleError } = await serviceClient
    .from('agent_task_queue')
    .select('id')
    .eq('source', SYSTEM0_SOURCE)
    .eq('status', 'running')
    .not('started_at', 'is', null)
    .lt('started_at', staleBefore)
    .limit(250);

  if (staleError) throw new Error(staleError.message);

  const taskIds = (staleTasks || [])
    .map((task: any) => task.id)
    .filter((id: unknown): id is string => typeof id === 'string');

  if (taskIds.length === 0) {
    return {
      staleAfterMinutes: safeMinutes,
      recovered: 0,
      taskIds: [] as string[],
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'queued',
      started_at: null,
      completed_at: null,
      error: `Recovered stale running task after ${safeMinutes} minutes`,
      needs_review: true,
      updated_at: now,
    })
    .in('id', taskIds)
    .eq('status', 'running');

  if (updateError) throw new Error(updateError.message);

  return {
    staleAfterMinutes: safeMinutes,
    recovered: taskIds.length,
    taskIds,
  };
}

export async function hasPendingSystem0Tasks(serviceClient: any) {
  const { count, error } = await serviceClient
    .from('agent_task_queue')
    .select('*', { count: 'exact', head: true })
    .eq('source', SYSTEM0_SOURCE)
    .in('status', ['queued', 'running']);

  if (error) throw new Error(error.message);
  return (count || 0) > 0;
}

function deriveRunStatus(tasks: any[]) {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const failed = tasks.filter((task) => task.status === 'failed').length;
  const running = tasks.filter((task) => task.status === 'running').length;
  const queued = tasks.filter((task) => task.status === 'queued').length;

  let status: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
  if (failed > 0) status = 'failed';
  else if (completed === tasks.length && tasks.length > 0) status = 'completed';
  else if (running > 0 || completed > 0) status = 'running';

  const createdAt = tasks[0]?.created_at || null;
  const completedAt = tasks
    .filter((task) => task.completed_at)
    .map((task) => task.completed_at)
    .sort()
    .at(-1) || null;
  const durationMs = createdAt && completedAt
    ? Math.max(0, new Date(completedAt).getTime() - new Date(createdAt).getTime())
    : null;

  return {
    status,
    summary: {
      total: tasks.length,
      completed,
      failed,
      running,
      queued,
    },
    createdAt,
    completedAt,
    durationMs,
  };
}

export async function getSystem0RunStatus(serviceClient: any, runId: string) {
  const { data: tasks, error } = await serviceClient
    .from('agent_task_queue')
    .select('id, task_type, status, started_at, completed_at, error, output, created_at')
    .eq('source', SYSTEM0_SOURCE)
    .like('source_id', `${runId}:%`)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  const taskList = tasks || [];
  const runStatus = deriveRunStatus(taskList);

  return {
    runId,
    status: runStatus.status,
    summary: runStatus.summary,
    createdAt: runStatus.createdAt,
    completedAt: runStatus.completedAt,
    durationMs: runStatus.durationMs,
    tasks: taskList,
  };
}

export async function getSystem0Metrics(serviceClient: any, lookbackDays = 7) {
  const safeLookback = Math.max(1, Math.min(30, lookbackDays));
  const since = new Date(Date.now() - safeLookback * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentTasks, error: recentTasksError },
    { data: queueSnapshot, error: queueSnapshotError },
    { count: pendingReviewCount, error: pendingReviewError },
    { count: reviewedCount, error: reviewedError },
  ] = await Promise.all([
    serviceClient
      .from('agent_task_queue')
      .select('source_id, task_type, status, created_at, completed_at')
      .eq('source', SYSTEM0_SOURCE)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(2000),
    serviceClient
      .from('agent_task_queue')
      .select('status, needs_review')
      .eq('source', SYSTEM0_SOURCE)
      .in('status', ['queued', 'running', 'failed'])
      .limit(500),
    serviceClient
      .from('agent_task_queue')
      .select('*', { count: 'exact', head: true })
      .eq('source', GRANT_MATCH_REVIEW_SOURCE)
      .is('review_decision', null),
    serviceClient
      .from('agent_task_queue')
      .select('*', { count: 'exact', head: true })
      .eq('source', GRANT_MATCH_REVIEW_SOURCE)
      .not('review_decision', 'is', null),
  ]);

  if (recentTasksError) throw new Error(recentTasksError.message);
  if (queueSnapshotError) throw new Error(queueSnapshotError.message);
  if (pendingReviewError) throw new Error(pendingReviewError.message);
  if (reviewedError) throw new Error(reviewedError.message);

  const runsById = new Map<string, any[]>();
  for (const task of recentTasks || []) {
    const runId = parseRunId(task.source_id);
    if (!runId) continue;
    const existing = runsById.get(runId) || [];
    existing.push(task);
    runsById.set(runId, existing);
  }

  const runSummaries = Array.from(runsById.entries())
    .map(([runId, tasks]) => {
      const derived = deriveRunStatus(tasks);
      return {
        runId,
        status: derived.status,
        createdAt: derived.createdAt,
        completedAt: derived.completedAt,
        durationMs: derived.durationMs,
        summary: derived.summary,
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const stageIndex = new Map<string, {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
    durationTotalMs: number;
    durationSamples: number;
  }>();
  for (const task of recentTasks || []) {
    if (!isSystem0TaskType(task.task_type)) continue;
    const current = stageIndex.get(task.task_type) || {
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      queued: 0,
      durationTotalMs: 0,
      durationSamples: 0,
    };
    current.total += 1;
    if (task.status === 'completed') current.completed += 1;
    if (task.status === 'failed') current.failed += 1;
    if (task.status === 'running') current.running += 1;
    if (task.status === 'queued') current.queued += 1;
    if (task.created_at && task.completed_at) {
      current.durationTotalMs += Math.max(
        0,
        new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()
      );
      current.durationSamples += 1;
    }
    stageIndex.set(task.task_type, current);
  }

  const stageMetrics = Array.from(stageIndex.entries()).map(([taskType, stats]) => ({
    taskType,
    total: stats.total,
    completed: stats.completed,
    failed: stats.failed,
    running: stats.running,
    queued: stats.queued,
    avgDurationMs: stats.durationSamples > 0
      ? Math.round(stats.durationTotalMs / stats.durationSamples)
      : null,
  }));

  const completedRuns = runSummaries.filter((run) => run.status === 'completed');
  const averageRunDurationMs = completedRuns.length > 0
    ? Math.round(
      completedRuns
        .map((run) => run.durationMs || 0)
        .reduce((sum, current) => sum + current, 0) / completedRuns.length
    )
    : null;

  const queue = {
    queued: (queueSnapshot || []).filter((task: any) => task.status === 'queued').length,
    running: (queueSnapshot || []).filter((task: any) => task.status === 'running').length,
    failed: (queueSnapshot || []).filter((task: any) => task.status === 'failed').length,
    needsReview: (queueSnapshot || []).filter((task: any) => task.needs_review === true).length,
  };

  return {
    lookbackDays: safeLookback,
    since,
    queue,
    runs: {
      total: runSummaries.length,
      completed: runSummaries.filter((run) => run.status === 'completed').length,
      failed: runSummaries.filter((run) => run.status === 'failed').length,
      running: runSummaries.filter((run) => run.status === 'running').length,
      queued: runSummaries.filter((run) => run.status === 'queued').length,
      avgDurationMs: averageRunDurationMs,
      lastRunAt: runSummaries[0]?.createdAt || null,
    },
    review: {
      pending: pendingReviewCount || 0,
      reviewed: reviewedCount || 0,
      total: (pendingReviewCount || 0) + (reviewedCount || 0),
    },
    stages: stageMetrics,
    recentRuns: runSummaries.slice(0, 12),
  };
}
