import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { runSystem0Scheduler, type System0SchedulerOptions } from '@/lib/funding/system0-scheduler';
import { logSystem0Event } from '@/lib/funding/system0-audit';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

function parseBatchSize(value: unknown): number {
  return Math.max(1, Math.min(20, Number(value || 4)));
}

function parseMaxBatches(value: unknown): number {
  return Math.max(1, Math.min(50, Number(value || 20)));
}

function parseStaleAfterMinutes(value: unknown): number {
  return Math.max(5, Math.min(24 * 60, Number(value || 45)));
}

function parseMode(value: unknown): 'incremental' | 'full' | undefined {
  if (value === 'full') return 'full';
  if (value === 'incremental') return 'incremental';
  return undefined;
}

function parseOptions(input: Record<string, unknown>): System0SchedulerOptions {
  const options: System0SchedulerOptions = {};
  if (input.batchSize !== undefined) options.batchSize = parseBatchSize(input.batchSize);
  if (input.staleAfterMinutes !== undefined) options.staleAfterMinutes = parseStaleAfterMinutes(input.staleAfterMinutes);
  if (typeof input.autoStart === 'boolean') options.autoStart = input.autoStart;
  if (typeof input.drain === 'boolean') options.drain = input.drain;
  if (input.maxBatches !== undefined) options.maxBatches = parseMaxBatches(input.maxBatches);
  if (typeof input.schedulerEnabled === 'boolean') options.schedulerEnabled = input.schedulerEnabled;
  const mode = parseMode(input.mode);
  if (mode) options.mode = mode;
  return options;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const options = parseOptions((body || {}) as Record<string, unknown>);
    const serviceClient = getServiceClient();
    const result = await runSystem0Scheduler(serviceClient, options);
    await logSystem0Event(serviceClient, {
      eventType: 'scheduler_tick',
      source: 'admin_scheduler',
      actorId: auth.userId,
      runId: result.triggeredRun,
      message: result.skipped
        ? 'Admin scheduler tick skipped by policy.'
        : 'Admin scheduler tick executed.',
      payload: {
        options,
        result: {
          skipped: Boolean(result.skipped),
          processedCount: result.processedCount,
          autoStarted: result.autoStarted,
          blocked: result.queueResult.blocked,
          policyUsed: result.policyUsed,
        },
      },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
