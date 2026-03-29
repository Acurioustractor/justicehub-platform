/**
 * Task Status API — poll background task progress
 *
 * GET /api/orchestrator/tasks?id=<task_or_run_id>
 * GET /api/orchestrator/tasks?conversation_id=<conv_id>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatus, getConversationTasks } from '@/lib/orchestrator/task-orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const conversationId = searchParams.get('conversation_id');

  try {
    if (id) {
      const status = await getTaskStatus(id);
      return NextResponse.json(status);
    }

    if (conversationId) {
      const tasks = await getConversationTasks(conversationId);
      return NextResponse.json({ tasks, count: tasks.length });
    }

    return NextResponse.json(
      { error: 'Provide ?id=<task_or_run_id> or ?conversation_id=<conv_id>' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Orchestrator Tasks] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
