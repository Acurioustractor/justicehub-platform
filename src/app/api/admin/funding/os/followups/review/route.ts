import { NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  reviewFundingOperatingFollowUpTask,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const decision = typeof body.decision === 'string' ? body.decision : '';

    const result = await reviewFundingOperatingFollowUpTask(
      String(body.taskId || '').trim(),
      decision as 'acknowledged' | 'resolved',
      admin.id,
      typeof body.feedback === 'string' ? body.feedback : undefined
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
