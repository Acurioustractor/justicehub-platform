import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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
    const runId = typeof body.runId === 'string' ? body.runId : null;
    const taskIds = Array.isArray(body.taskIds)
      ? body.taskIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (!runId && taskIds.length === 0) {
      return NextResponse.json(
        { error: 'runId or taskIds is required' },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();
    let failedTaskQuery = serviceClient
      .from('agent_task_queue')
      .select('id, source_id, task_type, status')
      .eq('source', 'funding_system_0')
      .eq('status', 'failed');

    if (taskIds.length > 0) {
      failedTaskQuery = failedTaskQuery.in('id', taskIds);
    } else if (runId) {
      failedTaskQuery = failedTaskQuery.like('source_id', `${runId}:%`);
    }

    const { data: failedTasks, error: failedTasksError } = await failedTaskQuery;

    if (failedTasksError) {
      throw new Error(failedTasksError.message);
    }

    if (!failedTasks || failedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed tasks found to retry',
        retriedCount: 0,
      });
    }

    const retryTaskIds = failedTasks.map((task) => task.id);
    const now = new Date().toISOString();

    const { error: retryError } = await serviceClient
      .from('agent_task_queue')
      .update({
        status: 'queued',
        error: null,
        started_at: null,
        completed_at: null,
        needs_review: false,
        updated_at: now,
      })
      .in('id', retryTaskIds);

    if (retryError) {
      throw new Error(retryError.message);
    }

    return NextResponse.json({
      success: true,
      retriedCount: retryTaskIds.length,
      taskIds: retryTaskIds,
      message: `Requeued ${retryTaskIds.length} failed task(s)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
