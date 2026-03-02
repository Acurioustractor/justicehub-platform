import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  scheduleFundingConversationNextStep,
} from '@/lib/funding/funding-operating-system';

function getSmokeSecret() {
  return String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const configuredSecret = getSmokeSecret();
  const providedSecret =
    request.headers.get('x-funding-smoke-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const requestedKind = String(body.nextStepKind || '').trim().toLowerCase();

    const result = await scheduleFundingConversationNextStep(taskId, 'smoke-admin', {
      nextStepKind:
        requestedKind === 'reassess_relationship_pause' ||
        requestedKind === 'review_pipeline_risk_context' ||
        requestedKind === 'review_relationship_update_reply' ||
        requestedKind === 'intro_call' ||
        requestedKind === 'send_follow_up_info' ||
        requestedKind === 'check_in_later'
          ? (requestedKind as
              | 'reassess_relationship_pause'
              | 'review_pipeline_risk_context'
              | 'review_relationship_update_reply'
              | 'intro_call'
              | 'send_follow_up_info'
              | 'check_in_later')
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
