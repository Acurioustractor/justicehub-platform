/**
 * Orchestrator Cron — processes queued background tasks
 *
 * GET /api/cron/orchestrator?domain=research&max=10
 *
 * Called by Vercel cron every 5 minutes to drain the task queue.
 * Can also be triggered manually or from the chat API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { drainQueue } from '@/lib/orchestrator/task-executor';
import type { TaskDomain } from '@/lib/orchestrator/task-orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_DOMAINS: TaskDomain[] = ['research', 'enrichment', 'analysis', 'reporting', 'funding', 'discovery'];

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const domainParam = searchParams.get('domain');
  const maxParam = searchParams.get('max');

  const domain = domainParam && VALID_DOMAINS.includes(domainParam as TaskDomain)
    ? domainParam as TaskDomain
    : undefined;
  const maxTasks = maxParam ? Math.min(parseInt(maxParam, 10) || 10, 50) : 10;

  try {
    const result = await drainQueue({ domain, maxTasks });

    console.log(
      `[Orchestrator Cron] Processed ${result.processed} tasks: ${result.completed} completed, ${result.failed} failed`
    );

    return NextResponse.json({
      ...result,
      domain: domain || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Orchestrator Cron] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
