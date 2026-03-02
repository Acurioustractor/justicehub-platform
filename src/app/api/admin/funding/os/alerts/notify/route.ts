import { NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  queueFundingOperatingAlertNotifications,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await queueFundingOperatingAlertNotifications(admin.id, {
      force: body.force === true,
      minIntervalMinutes:
        typeof body.minIntervalMinutes === 'number' ? body.minIntervalMinutes : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
