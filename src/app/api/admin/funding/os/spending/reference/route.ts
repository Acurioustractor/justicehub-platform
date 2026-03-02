import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingSpendingReferenceData,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingSpendingReferenceData({
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
