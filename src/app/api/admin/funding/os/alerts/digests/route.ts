import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingOperatingAlertDigests,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingOperatingAlertDigests({
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
      scope:
        (url.searchParams.get('scope') as 'all' | 'global' | 'organization' | null) || undefined,
      severity:
        (url.searchParams.get('severity') as
          | 'all'
          | 'critical'
          | 'high'
          | 'medium'
          | 'low'
          | null) || undefined,
      reviewStatus:
        (url.searchParams.get('reviewStatus') as
          | 'all'
          | 'pending'
          | 'acknowledged'
          | 'resolved'
          | null) || undefined,
      recentDays: url.searchParams.get('recentDays')
        ? Number(url.searchParams.get('recentDays'))
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
