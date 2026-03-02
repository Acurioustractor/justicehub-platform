import { NextRequest, NextResponse } from 'next/server';
import {
  acknowledgeFundingConversationResponse,
  fundingOsErrorResponse,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();

    const result = await acknowledgeFundingConversationResponse(taskId, admin.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
