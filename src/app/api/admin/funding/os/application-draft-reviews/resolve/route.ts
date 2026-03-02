import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  resolveFundingApplicationDraftCommunityReviewTask,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const resolution = String(body.resolution || '').trim() as
      | 'ready_to_submit'
      | 'needs_revision';
    const note = String(body.note || '').trim();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (!['ready_to_submit', 'needs_revision'].includes(resolution)) {
      return NextResponse.json(
        { error: 'resolution must be ready_to_submit or needs_revision' },
        { status: 400 }
      );
    }

    const data = await resolveFundingApplicationDraftCommunityReviewTask(
      taskId,
      resolution,
      note,
      admin.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
