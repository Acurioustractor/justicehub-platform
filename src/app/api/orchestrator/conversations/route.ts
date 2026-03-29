/**
 * Conversations API — list and retrieve ALMA conversations
 *
 * GET /api/orchestrator/conversations?session_id=<sid>  — list recent
 * GET /api/orchestrator/conversations?id=<conv_id>      — get one with messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversation, listConversations } from '@/lib/orchestrator/conversations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const sessionId = searchParams.get('session_id');

  try {
    if (id) {
      const conversation = await getConversation(id);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const conversations = await listConversations({
      session_id: sessionId || undefined,
      limit: 20,
    });
    return NextResponse.json({ conversations, count: conversations.length });
  } catch (error) {
    console.error('[Orchestrator Conversations] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
