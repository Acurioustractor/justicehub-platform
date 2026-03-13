import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  processSystem0QueueWithMode,
  recoverStaleSystem0Tasks,
} from '@/lib/funding/system0-orchestrator';
import { getSystem0Policy } from '@/lib/funding/system0-policy';
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

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

function parsePositiveInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

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
      actorId: user.id,
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
