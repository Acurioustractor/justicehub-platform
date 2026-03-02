import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingApplicationDraftCommunityReviewTasks,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') || 'all').trim() as
      | 'all'
      | 'queued'
      | 'pending'
      | 'running'
      | 'in_progress'
      | 'completed';
    const reviewStatus = String(searchParams.get('reviewStatus') || 'all').trim() as
      | 'all'
      | 'pending'
      | 'resolved';
    const limit = Number(searchParams.get('limit') || '30');

    const data = await listFundingApplicationDraftCommunityReviewTasks({
      status,
      reviewStatus,
      limit,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
