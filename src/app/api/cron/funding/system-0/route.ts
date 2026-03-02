import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { runSystem0Scheduler, type System0SchedulerOptions } from '@/lib/funding/system0-scheduler';
import { logSystem0Event } from '@/lib/funding/system0-audit';

function getCronSecret(): string | null {
  return process.env.SYSTEM0_CRON_SECRET || process.env.CRON_SECRET || null;
}

function isAuthorizedRequest(request: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  const headerSecret = request.headers.get('x-system0-cron-secret') || '';

  return token === secret || headerSecret === secret;
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

async function runScheduler(request: NextRequest) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const body = request.method === 'POST'
    ? await request.json().catch(() => ({}))
    : {};
  const queryOptions: System0SchedulerOptions = {};
  if (url.searchParams.has('batchSize')) {
    queryOptions.batchSize = parseBatchSize(url.searchParams.get('batchSize'));
  }
  if (url.searchParams.has('staleAfterMinutes')) {
    queryOptions.staleAfterMinutes = parseStaleAfterMinutes(url.searchParams.get('staleAfterMinutes'));
  }
  if (url.searchParams.has('autoStart')) {
    queryOptions.autoStart = url.searchParams.get('autoStart') !== 'false';
  }
  if (url.searchParams.has('drain')) {
    queryOptions.drain = url.searchParams.get('drain') === 'true';
  }
  if (url.searchParams.has('maxBatches')) {
    queryOptions.maxBatches = parseMaxBatches(url.searchParams.get('maxBatches'));
  }
  if (url.searchParams.has('mode')) {
    const mode = parseMode(url.searchParams.get('mode'));
    if (mode) queryOptions.mode = mode;
  }
  if (url.searchParams.has('schedulerEnabled')) {
    queryOptions.schedulerEnabled = url.searchParams.get('schedulerEnabled') === 'true';
  }

  const bodyRecord = body as Record<string, unknown>;
  const bodyOptions: System0SchedulerOptions = {};
  if (bodyRecord.batchSize !== undefined) {
    bodyOptions.batchSize = parseBatchSize(bodyRecord.batchSize);
  }
  if (bodyRecord.staleAfterMinutes !== undefined) {
    bodyOptions.staleAfterMinutes = parseStaleAfterMinutes(bodyRecord.staleAfterMinutes);
  }
  if (typeof bodyRecord.autoStart === 'boolean') {
    bodyOptions.autoStart = bodyRecord.autoStart;
  }
  if (typeof bodyRecord.drain === 'boolean') {
    bodyOptions.drain = bodyRecord.drain;
  }
  if (bodyRecord.maxBatches !== undefined) {
    bodyOptions.maxBatches = parseMaxBatches(bodyRecord.maxBatches);
  }
  if (typeof bodyRecord.schedulerEnabled === 'boolean') {
    bodyOptions.schedulerEnabled = bodyRecord.schedulerEnabled;
  }
  const bodyMode = parseMode(bodyRecord.mode);
  if (bodyMode) {
    bodyOptions.mode = bodyMode;
  }

  const serviceClient = createServiceClient();
  const result = await runSystem0Scheduler(serviceClient, {
    ...queryOptions,
    ...bodyOptions,
  });
  await logSystem0Event(serviceClient, {
    eventType: 'scheduler_tick',
    source: 'cron_scheduler',
    runId: result.triggeredRun,
    message: result.skipped
      ? 'Cron scheduler tick skipped by policy.'
      : 'Cron scheduler tick executed.',
    payload: {
      queryOptions,
      bodyOptions,
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
}

export async function GET(request: NextRequest) {
  try {
    return await runScheduler(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runScheduler(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
