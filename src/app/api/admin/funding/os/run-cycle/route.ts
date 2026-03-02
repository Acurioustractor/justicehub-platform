import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  runFundingOperatingSystemCycle,
} from '@/lib/funding/funding-operating-system';

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await runFundingOperatingSystemCycle(
      {
        opportunityIds: parseStringArray(body.opportunityIds),
        organizationIds: parseStringArray(body.organizationIds),
        statuses: parseStringArray(body.statuses),
        ingestLimit: typeof body.ingestLimit === 'number' ? body.ingestLimit : undefined,
        matchLimit: typeof body.matchLimit === 'number' ? body.matchLimit : undefined,
        minScore: typeof body.minScore === 'number' ? body.minScore : undefined,
        notifyOnAlerts: body.notifyOnAlerts === true,
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
