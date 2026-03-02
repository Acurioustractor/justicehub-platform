import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingDiscoveryOrganizations,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || undefined;
    const capabilityTag = url.searchParams.get('capabilityTag') || undefined;
    const q = url.searchParams.get('q') || undefined;
    const firstNationsLedParam = url.searchParams.get('firstNationsLed');
    const firstNationsLed =
      firstNationsLedParam === 'true'
        ? true
        : firstNationsLedParam === 'false'
          ? false
          : undefined;

    const data = await listFundingDiscoveryOrganizations({
      q,
      state,
      capabilityTag,
      firstNationsLed,
      minReadiness: url.searchParams.get('minReadiness')
        ? Number(url.searchParams.get('minReadiness'))
        : undefined,
      minTrust: url.searchParams.get('minTrust')
        ? Number(url.searchParams.get('minTrust'))
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
