import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingOutcomeCommitments,
  requireAdminUser,
  upsertFundingOutcomeCommitment,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingOutcomeCommitments({
      status: url.searchParams.get('status') || undefined,
      organizationId: url.searchParams.get('organizationId') || undefined,
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

    const result = await upsertFundingOutcomeCommitment(
      {
        commitmentId:
          method === 'PUT' ? String(body.commitmentId || '').trim() : undefined,
        fundingAwardId: String(body.fundingAwardId || '').trim(),
        outcomeDefinitionId: String(body.outcomeDefinitionId || '').trim(),
        organizationId:
          typeof body.organizationId === 'string' ? body.organizationId : undefined,
        commitmentStatus:
          typeof body.commitmentStatus === 'string'
            ? (body.commitmentStatus as
                | 'draft'
                | 'active'
                | 'completed'
                | 'paused'
                | 'cancelled')
            : undefined,
        baselineValue:
          typeof body.baselineValue === 'number' ? body.baselineValue : null,
        targetValue:
          typeof body.targetValue === 'number' ? body.targetValue : null,
        currentValue:
          typeof body.currentValue === 'number' ? body.currentValue : null,
        targetDate: typeof body.targetDate === 'string' ? body.targetDate : null,
        measurementNotes:
          typeof body.measurementNotes === 'string' ? body.measurementNotes : null,
        evidenceConfidenceScore:
          typeof body.evidenceConfidenceScore === 'number'
            ? body.evidenceConfidenceScore
            : null,
        communityPriorityWeight:
          typeof body.communityPriorityWeight === 'number'
            ? body.communityPriorityWeight
            : null,
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
