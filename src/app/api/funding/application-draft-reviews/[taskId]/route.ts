import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingApplicationDraftCommunityReviewPublic,
  submitFundingApplicationDraftCommunityReviewResponse,
} from '@/lib/funding/funding-operating-system';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const data = await getFundingApplicationDraftCommunityReviewPublic(taskId);

    return NextResponse.json({ success: true, data });
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
    const result = await submitFundingApplicationDraftCommunityReviewResponse(taskId, {
      reviewerName:
        typeof body.reviewerName === 'string' || body.reviewerName === null
          ? (body.reviewerName as string | null)
          : null,
      reviewerConnection:
        typeof body.reviewerConnection === 'string' || body.reviewerConnection === null
          ? (body.reviewerConnection as string | null)
          : null,
      recommendation: String(body.recommendation || '').trim().toLowerCase() as
        | 'endorse'
        | 'request_changes'
        | 'raise_concern',
      note: String(body.note || ''),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
