import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  ingestFundingOperatingSystem,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json().catch(() => ({}));

    const result = await ingestFundingOperatingSystem(
      {
        opportunityIds: parseStringArray(body?.opportunityIds),
        statuses: parseStringArray(body?.statuses),
        limit: typeof body?.limit === 'number' ? body.limit : undefined,
      },
      admin.id
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
