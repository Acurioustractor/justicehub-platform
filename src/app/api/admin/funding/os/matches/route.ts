import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  generateFundingMatchRecommendations,
  listFundingMatchRecommendations,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingMatchRecommendations({
      opportunityId: url.searchParams.get('opportunityId') || undefined,
      organizationId: url.searchParams.get('organizationId') || undefined,
      status: url.searchParams.get('status') || undefined,
      minScore: url.searchParams.get('minScore')
        ? Number(url.searchParams.get('minScore'))
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json().catch(() => ({}));

    const result = await generateFundingMatchRecommendations(
      {
        opportunityIds: parseStringArray(body?.opportunityIds),
        organizationIds: parseStringArray(body?.organizationIds),
        statuses: parseStringArray(body?.statuses),
        minScore: typeof body?.minScore === 'number' ? body.minScore : undefined,
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
