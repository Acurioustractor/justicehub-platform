import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  updateFundingConversationRequestStatus,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const status = String(body.status || '').trim().toLowerCase() as
      | 'queued'
      | 'running'
      | 'completed';

    const result = await updateFundingConversationRequestStatus(taskId, status, admin.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
