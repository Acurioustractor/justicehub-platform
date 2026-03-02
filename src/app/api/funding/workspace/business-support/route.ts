import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  type FundingDiscoveryReviewWorkspaceInput,
  upsertFundingDiscoveryReviewWorkspace,
} from '@/lib/funding/funding-operating-system';

function toWorkspaceInput(body: Record<string, unknown>): FundingDiscoveryReviewWorkspaceInput {
  return {
    organizationId: String(body.organizationId || ''),
    note:
      Object.prototype.hasOwnProperty.call(body, 'note') &&
      (typeof body.note === 'string' || body.note === null)
        ? (body.note as string | null)
        : undefined,
    decisionTag:
      Object.prototype.hasOwnProperty.call(body, 'decisionTag') &&
      (typeof body.decisionTag === 'string' || body.decisionTag === null)
        ? (body.decisionTag as FundingDiscoveryReviewWorkspaceInput['decisionTag'])
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const workspace = await upsertFundingDiscoveryReviewWorkspace(toWorkspaceInput(body), null);

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
