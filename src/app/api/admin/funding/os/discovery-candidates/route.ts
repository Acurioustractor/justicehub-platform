import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingDiscoveryProfileCandidates,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 24);
    const includeInitialized = searchParams.get('includeInitialized') !== 'false';

    const data = await listFundingDiscoveryProfileCandidates({
      limit: Number.isFinite(limit) ? limit : 24,
      includeInitialized,
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
