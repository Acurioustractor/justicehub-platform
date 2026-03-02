import { NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingDiscoveryOrganizationDetail,
} from '@/lib/funding/funding-operating-system';

export async function GET(
  _request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const data = await getFundingDiscoveryOrganizationDetail(params.organizationId);
    if (!data) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
