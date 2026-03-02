import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingOperatingAlerts,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingOperatingAlerts({
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
      strongMatchThreshold: url.searchParams.get('strongMatchThreshold')
        ? Number(url.searchParams.get('strongMatchThreshold'))
        : undefined,
      stalledEngagedAfterHours: url.searchParams.get('stalledEngagedAfterHours')
        ? Number(url.searchParams.get('stalledEngagedAfterHours'))
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
