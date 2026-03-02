import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingConversationRequests,
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
      | 'completed'
      | 'failed';
    const reviewStatus = String(searchParams.get('reviewStatus') || 'all').trim() as
      | 'all'
      | 'pending'
      | 'acknowledged'
      | 'resolved';
    const limit = Number(searchParams.get('limit') || 25);

    const data = await listFundingConversationRequests({
      status,
      reviewStatus,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
