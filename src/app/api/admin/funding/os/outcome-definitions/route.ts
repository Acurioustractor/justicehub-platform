import { NextRequest, NextResponse } from 'next/server';
import {
  archiveFundingOutcomeDefinition,
  fundingOsErrorResponse,
  listFundingOutcomeDefinitions,
  requireAdminUser,
  upsertFundingOutcomeDefinition,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingOutcomeDefinitions({
      includeInactive: url.searchParams.get('includeInactive') === 'true',
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

async function handleUpsert(request: NextRequest, method: 'POST' | 'PUT') {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await upsertFundingOutcomeDefinition(
      {
        outcomeDefinitionId:
          method === 'PUT' ? String(body.outcomeDefinitionId || '').trim() : undefined,
        name: String(body.name || '').trim(),
        outcomeDomain: String(body.outcomeDomain || '').trim().toLowerCase() as
          | 'health'
          | 'housing'
          | 'education'
          | 'employment'
          | 'culture'
          | 'family'
          | 'community_safety'
          | 'self_determination'
          | 'system_accountability',
        unit: typeof body.unit === 'string' ? body.unit : null,
        description: typeof body.description === 'string' ? body.description : null,
        baselineMethod:
          typeof body.baselineMethod === 'string' ? body.baselineMethod : null,
        communityDefined:
          typeof body.communityDefined === 'boolean' ? body.communityDefined : undefined,
        firstNationsDataSensitive:
          typeof body.firstNationsDataSensitive === 'boolean'
            ? body.firstNationsDataSensitive
            : undefined,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
        metadata:
          body.metadata && typeof body.metadata === 'object'
            ? (body.metadata as Record<string, unknown>)
            : undefined,
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

export async function POST(request: NextRequest) {
  return handleUpsert(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleUpsert(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await archiveFundingOutcomeDefinition(
      String(body.outcomeDefinitionId || '').trim(),
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
