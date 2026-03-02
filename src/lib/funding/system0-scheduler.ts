import {
  enqueueSystem0Run,
  getSystem0RunStatus,
  hasPendingSystem0Tasks,
  processSystem0QueueWithMode,
  recoverStaleSystem0Tasks,
  type System0RunConfig,
} from '@/lib/funding/system0-orchestrator';
import { getSystem0Policy } from '@/lib/funding/system0-policy';

export interface System0SchedulerOptions {
  batchSize?: number;
  staleAfterMinutes?: number;
  autoStart?: boolean;
  mode?: System0RunConfig['mode'];
  drain?: boolean;
  maxBatches?: number;
  schedulerEnabled?: boolean;
}

export interface System0SchedulerResult {
  success: true;
  skipped?: boolean;
  reason?: 'scheduler_disabled';
  triggeredRun: string | null;
  autoStarted: boolean;
  hadPendingWork: boolean;
  staleRecovery: {
    staleAfterMinutes: number;
    recovered: number;
    taskIds: string[];
  };
  queueResult: {
    drain: boolean;
    batchSize: number;
    maxBatches: number;
    batchesExecuted: number;
    blocked: boolean;
    processed: Array<Record<string, unknown>>;
    processedCount: number;
  };
  hasRemainingWork: boolean;
  processedCount: number;
  processed: Array<Record<string, unknown>>;
  runStatus: Awaited<ReturnType<typeof getSystem0RunStatus>> | null;
  policyUsed: {
    schedulerEnabled: boolean;
    autoStart: boolean;
    runMode: System0RunConfig['mode'];
    batchSize: number;
    staleAfterMinutes: number;
    drain: boolean;
    maxBatches: number;
  };
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export async function runSystem0Scheduler(
  serviceClient: any,
  options: System0SchedulerOptions = {}
): Promise<System0SchedulerResult> {
  const policy = await getSystem0Policy(serviceClient);

  const drain = typeof options.drain === 'boolean' ? options.drain : policy.drainEnabled;
  const schedulerEnabled = typeof options.schedulerEnabled === 'boolean'
    ? options.schedulerEnabled
    : policy.schedulerEnabled;
  const batchSize = clampInt(
    options.batchSize,
    drain ? policy.drainBatchSize : policy.workerBatchSize,
    1,
    20
  );
  const staleAfterMinutes = clampInt(options.staleAfterMinutes, policy.staleAfterMinutes, 5, 24 * 60);
  const autoStart = typeof options.autoStart === 'boolean' ? options.autoStart : policy.autoStart;
  const mode: System0RunConfig['mode'] = options.mode === 'full' ? 'full' : options.mode === 'incremental' ? 'incremental' : policy.runMode;
  const maxBatches = clampInt(options.maxBatches, policy.drainMaxBatches, 1, 50);

  if (!schedulerEnabled) {
    return {
      success: true,
      skipped: true,
      reason: 'scheduler_disabled',
      triggeredRun: null,
      autoStarted: false,
      hadPendingWork: false,
      staleRecovery: {
        staleAfterMinutes,
        recovered: 0,
        taskIds: [],
      },
      queueResult: {
        drain,
        batchSize,
        maxBatches,
        batchesExecuted: 0,
        blocked: false,
        processed: [],
        processedCount: 0,
      },
      hasRemainingWork: false,
      processedCount: 0,
      processed: [],
      runStatus: null,
      policyUsed: {
        schedulerEnabled,
        autoStart,
        runMode: mode,
        batchSize,
        staleAfterMinutes,
        drain,
        maxBatches,
      },
    };
  }

  const staleRecovery = await recoverStaleSystem0Tasks(serviceClient, staleAfterMinutes);
  const hadPending = await hasPendingSystem0Tasks(serviceClient);

  let runId: string | null = null;
  if (autoStart && !hadPending) {
    const run = await enqueueSystem0Run(serviceClient, {
      mode,
      source: 'scheduled',
    });
    runId = run.runId;
  }

  const queueResult = await processSystem0QueueWithMode(serviceClient, {
    batchSize,
    drain,
    maxBatches,
  });
  const hasRemainingWork = await hasPendingSystem0Tasks(serviceClient);
  const runStatus = runId ? await getSystem0RunStatus(serviceClient, runId) : null;

  return {
    success: true,
    triggeredRun: runId,
    autoStarted: Boolean(runId),
    hadPendingWork: hadPending,
    staleRecovery,
    queueResult,
    hasRemainingWork,
    processedCount: queueResult.processedCount,
    processed: queueResult.processed,
    runStatus,
    policyUsed: {
      schedulerEnabled,
      autoStart,
      runMode: mode,
      batchSize,
      staleAfterMinutes,
      drain,
      maxBatches,
    },
  };
}
