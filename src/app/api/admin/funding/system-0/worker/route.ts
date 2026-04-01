import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  processSystem0QueueWithMode,
  recoverStaleSystem0Tasks,
} from '@/lib/funding/system0-orchestrator';
import { getSystem0Policy } from '@/lib/funding/system0-policy';
import { logSystem0Event } from '@/lib/funding/system0-audit';

function parsePositiveInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const serviceClient = getServiceClient();
    const policy = await getSystem0Policy(serviceClient);
    const drain = typeof body.drain === 'boolean' ? body.drain : policy.drainEnabled;
    const defaultBatchSize = drain ? policy.drainBatchSize : policy.workerBatchSize;
    const batchSize = parsePositiveInt(body.batchSize, defaultBatchSize, 1, 20);
    const maxBatches = parsePositiveInt(body.maxBatches, policy.drainMaxBatches, 1, 50);
    const staleAfterMinutes = parsePositiveInt(body.staleAfterMinutes, policy.staleAfterMinutes, 5, 24 * 60);
    const staleRecovery = await recoverStaleSystem0Tasks(serviceClient, staleAfterMinutes);
    const queueResult = await processSystem0QueueWithMode(serviceClient, {
      batchSize,
      drain,
      maxBatches,
    });
    await logSystem0Event(serviceClient, {
      eventType: 'worker_process',
      source: 'admin_worker',
      actorId: auth.userId,
      message: 'System 0 worker processing executed via admin endpoint.',
      payload: {
        drain,
        queueResult: {
          processedCount: queueResult.processedCount,
          blocked: queueResult.blocked,
          batchesExecuted: queueResult.batchesExecuted,
          batchSize: queueResult.batchSize,
          maxBatches: queueResult.maxBatches,
        },
        staleRecovery,
      },
    });

    return NextResponse.json({
      success: true,
      ...queueResult,
      policyUsed: {
        workerBatchSize: policy.workerBatchSize,
        staleAfterMinutes: policy.staleAfterMinutes,
        drainEnabled: policy.drainEnabled,
        drainBatchSize: policy.drainBatchSize,
        drainMaxBatches: policy.drainMaxBatches,
      },
      staleRecovery,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
