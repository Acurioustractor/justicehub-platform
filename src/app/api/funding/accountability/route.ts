import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingCommunityAccountability,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const data = await listFundingCommunityAccountability({
      awardStatus: url.searchParams.get('awardStatus') || undefined,
      organizationQuery: url.searchParams.get('organizationQuery') || undefined,
      overdueOnly:
        url.searchParams.get('overdueOnly') === 'true'
          ? true
          : undefined,
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
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
