import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  scheduleFundingConversationNextStep,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const nextStepKind = String(body.nextStepKind || '').trim().toLowerCase();

    const result = await scheduleFundingConversationNextStep(taskId, admin.id, {
      nextStepKind:
        nextStepKind === 'intro_call' ||
        nextStepKind === 'send_follow_up_info' ||
        nextStepKind === 'check_in_later' ||
        nextStepKind === 'reassess_relationship_pause' ||
        nextStepKind === 'review_pipeline_risk_context' ||
        nextStepKind === 'review_relationship_update_reply'
          ? (nextStepKind as
              | 'intro_call'
              | 'send_follow_up_info'
              | 'check_in_later'
              | 'reassess_relationship_pause'
              | 'review_pipeline_risk_context'
              | 'review_relationship_update_reply')
          : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
