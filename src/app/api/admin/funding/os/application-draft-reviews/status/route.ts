import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  updateFundingApplicationDraftCommunityReviewTaskStatus,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const status = String(body.status || '').trim() as 'queued' | 'running';

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (!['queued', 'running'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be queued or running' },
        { status: 400 }
      );
    }

    const data = await updateFundingApplicationDraftCommunityReviewTaskStatus(
      taskId,
      status,
      admin.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
