import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { queueNotionSyncTasks } from '@/lib/funding/notion-worker-queue';

const DEFAULT_STAGE_FILTER = ['Matched', 'Matched - New', 'New'];

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

async function isAdmin(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

function parseStageFilter(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_STAGE_FILTER;
  }
  const parsed = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);
  return parsed.length > 0 ? Array.from(new Set(parsed)) : DEFAULT_STAGE_FILTER;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const serviceClient = getServiceClient();

    const [{ data: queueRows }, { count: queuedTasks }, { data: oldestQueuedTask }] = await Promise.all([
      serviceClient
        .from('notion_opportunities')
        .select('stage')
        .limit(500),
      serviceClient
        .from('agent_task_queue')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'notion_worker')
        .in('status', ['queued', 'pending', 'running', 'in_progress']),
      serviceClient
        .from('agent_task_queue')
        .select('id, created_at, status')
        .eq('source', 'notion_worker')
        .in('status', ['queued', 'pending', 'running', 'in_progress'])
        .order('created_at', { ascending: true })
        .limit(1),
    ]);

    const byStage: Record<string, number> = {};
    for (const row of queueRows || []) {
      const stage = row.stage || 'unknown';
      byStage[stage] = (byStage[stage] || 0) + 1;
    }

    return NextResponse.json({
      queue: {
        byStage,
        inWorkerQueue:
          (byStage.Matched || 0) + (byStage['Matched - New'] || 0) + (byStage.New || 0),
        defaultStageFilter: DEFAULT_STAGE_FILTER,
      },
      workers: {
        queuedTasks: queuedTasks || 0,
        oldestQueuedTask: oldestQueuedTask?.[0] || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(100, Number(body.limit || 25)));
    const dryRun = body.dryRun === true;
    const stageFilter = parseStageFilter(body.stageFilter);
    const serviceClient = getServiceClient();
    const result = await queueNotionSyncTasks(serviceClient, {
      limit,
      dryRun,
      stageFilter,
      source: 'notion_worker',
    });

    return NextResponse.json({
      success: true,
      dryRun,
      stageFilter,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
