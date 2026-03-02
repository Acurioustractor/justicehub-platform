import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingSpendingTransactions,
  requireAdminUser,
  upsertFundingSpendingTransaction,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingSpendingTransactions({
      status: url.searchParams.get('status') || undefined,
      fundingProgramId: url.searchParams.get('fundingProgramId') || undefined,
      organizationId: url.searchParams.get('organizationId') || undefined,
      sourceReferenceQuery:
        url.searchParams.get('sourceReferenceQuery') || undefined,
      jurisdictionQuery:
        url.searchParams.get('jurisdictionQuery') || undefined,
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

    const result = await upsertFundingSpendingTransaction(
      {
        transactionId: method === 'PUT' ? String(body.transactionId || '').trim() : undefined,
        fundingProgramId: String(body.fundingProgramId || '').trim(),
        opportunityId: typeof body.opportunityId === 'string' ? body.opportunityId : null,
        organizationId: typeof body.organizationId === 'string' ? body.organizationId : null,
        transactionType: String(body.transactionType || '').trim().toLowerCase() as
          | 'appropriation'
          | 'allocation'
          | 'contract'
          | 'grant_payment'
          | 'milestone_payment'
          | 'clawback'
          | 'reconciliation',
        transactionStatus: typeof body.transactionStatus === 'string'
          ? (String(body.transactionStatus).trim().toLowerCase() as
              | 'planned'
              | 'committed'
              | 'disbursed'
              | 'reconciled'
              | 'cancelled')
          : undefined,
        amount: typeof body.amount === 'number' ? body.amount : Number(body.amount),
        currency: typeof body.currency === 'string' ? body.currency : null,
        transactionDate: typeof body.transactionDate === 'string' ? body.transactionDate : null,
        periodStart: typeof body.periodStart === 'string' ? body.periodStart : null,
        periodEnd: typeof body.periodEnd === 'string' ? body.periodEnd : null,
        jurisdiction: typeof body.jurisdiction === 'string' ? body.jurisdiction : null,
        sourceReference: typeof body.sourceReference === 'string' ? body.sourceReference : null,
        description: typeof body.description === 'string' ? body.description : null,
        communityVisible:
          typeof body.communityVisible === 'boolean' ? body.communityVisible : undefined,
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
