import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingAwardAccountabilityDetail,
} from '@/lib/funding/funding-operating-system';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fundingAwardId: string }> | { fundingAwardId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const data = await getFundingAwardAccountabilityDetail(resolvedParams.fundingAwardId);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
