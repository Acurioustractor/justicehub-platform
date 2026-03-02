import { NextResponse } from 'next/server';
import {
  assignFundingOperatingFollowUpTask,
  fundingOsErrorResponse,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await assignFundingOperatingFollowUpTask(
      String(body.taskId || '').trim(),
      admin.id,
      typeof body.agentId === 'string' && body.agentId.trim().length > 0 ? body.agentId : null
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
