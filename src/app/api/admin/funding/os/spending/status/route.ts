import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  updateFundingSpendingTransactionStatus,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await updateFundingSpendingTransactionStatus(
      String(body.transactionId || '').trim(),
      String(body.status || '').trim().toLowerCase() as
        | 'planned'
        | 'committed'
        | 'disbursed'
        | 'reconciled'
        | 'cancelled',
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
