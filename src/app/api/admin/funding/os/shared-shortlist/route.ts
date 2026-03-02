import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingDiscoverySharedShortlist,
  replaceFundingDiscoverySharedShortlist,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

function parseOrganizationIds(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];
}

export async function GET() {
  try {
    await requireAdminUser();
    const data = await listFundingDiscoverySharedShortlist();

    return NextResponse.json({
      success: true,
      data,
      organizationIds: data.map((entry) => entry.organizationId),
      count: data.length,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data = await replaceFundingDiscoverySharedShortlist(
      parseOrganizationIds(body.organizationIds),
      admin.id
    );

    return NextResponse.json({
      success: true,
      data,
      organizationIds: data.map((entry) => entry.organizationId),
      count: data.length,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
