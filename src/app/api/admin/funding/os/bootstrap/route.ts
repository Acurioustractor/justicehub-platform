import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  runFundingOperatingSystemBootstrap,
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

    const result = await runFundingOperatingSystemBootstrap(
      {
        organizationIds: parseStringArray(body.organizationIds),
        slugs: parseStringArray(body.slugs),
        statuses: parseStringArray(body.statuses),
        opportunityIds: parseStringArray(body.opportunityIds),
        capabilitySeedLimit:
          typeof body.capabilitySeedLimit === 'number' ? body.capabilitySeedLimit : undefined,
        ingestLimit: typeof body.ingestLimit === 'number' ? body.ingestLimit : undefined,
        matchLimit: typeof body.matchLimit === 'number' ? body.matchLimit : undefined,
        minScore: typeof body.minScore === 'number' ? body.minScore : undefined,
        overwriteExistingProfiles: body.overwriteExistingProfiles === true,
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
