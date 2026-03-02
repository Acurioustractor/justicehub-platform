import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingConversationRequestPublic,
  submitFundingConversationRelationshipNoticeResponse,
  submitFundingConversationRequestResponse,
} from '@/lib/funding/funding-operating-system';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const data = await getFundingConversationRequestPublic(taskId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const mode = String(body.mode || 'conversation_response').trim().toLowerCase();

    if (mode === 'relationship_notice_response') {
      const result = await submitFundingConversationRelationshipNoticeResponse(taskId, {
        responderName:
          typeof body.responderName === 'string' || body.responderName === null
            ? (body.responderName as string | null)
            : null,
        responderEmail:
          typeof body.responderEmail === 'string' || body.responderEmail === null
            ? (body.responderEmail as string | null)
            : null,
        responseMessage: String(body.responseMessage || ''),
      });

      return NextResponse.json({
        success: true,
        mode,
        ...result,
      });
    }

    const result = await submitFundingConversationRequestResponse(taskId, {
      responderName:
        typeof body.responderName === 'string' || body.responderName === null
          ? (body.responderName as string | null)
          : null,
      responderEmail:
        typeof body.responderEmail === 'string' || body.responderEmail === null
          ? (body.responderEmail as string | null)
          : null,
      responseKind: String(body.responseKind || '').trim().toLowerCase() as
        | 'interested'
        | 'needs_more_info'
        | 'not_now',
      responseMessage: String(body.responseMessage || ''),
    });

    return NextResponse.json({
      success: true,
      mode,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
