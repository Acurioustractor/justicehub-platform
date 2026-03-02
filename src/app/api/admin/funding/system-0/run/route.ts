import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  enqueueSystem0Run,
  getSystem0RunStatus,
  type System0RunConfig,
} from '@/lib/funding/system0-orchestrator';
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
    const config: System0RunConfig = {
      mode: body.mode === 'full' ? 'full' : 'incremental',
      source: 'api',
      triggerUserId: user.id,
      organizationIds: Array.isArray(body.organizationIds) ? body.organizationIds : undefined,
    };

    const serviceClient = getServiceClient();
    const run = await enqueueSystem0Run(serviceClient, config);
    await logSystem0Event(serviceClient, {
      eventType: 'run_enqueued',
      source: 'admin_run',
      actorId: user.id,
      runId: run.runId,
      message: `System 0 run enqueued (${config.mode}).`,
      payload: {
        mode: config.mode,
        source: config.source,
        organizationIds: config.organizationIds || [],
      },
    });
    const status = await getSystem0RunStatus(serviceClient, run.runId);

    return NextResponse.json({
      success: true,
      runId: run.runId,
      status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const status = await getSystem0RunStatus(serviceClient, runId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
