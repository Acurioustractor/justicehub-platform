import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingApplicationDraftWorkspaceRecord,
  requireAdminUser,
  upsertFundingApplicationDraftWorkspace,
  type FundingApplicationDraftWorkspaceInput,
} from '@/lib/funding/funding-operating-system';

function toDraftInput(body: Record<string, unknown>): FundingApplicationDraftWorkspaceInput {
  return {
    organizationId: String(body.organizationId || ''),
    opportunityId: String(body.opportunityId || ''),
    applicationId:
      typeof body.applicationId === 'string' ? body.applicationId : undefined,
    narrativeDraft:
      Object.prototype.hasOwnProperty.call(body, 'narrativeDraft') &&
      (typeof body.narrativeDraft === 'string' || body.narrativeDraft === null)
        ? (body.narrativeDraft as string | null)
        : undefined,
    supportMaterial: Array.isArray(body.supportMaterial)
      ? body.supportMaterial.map((item) => String(item))
      : undefined,
    communityReviewNotes: Array.isArray(body.communityReviewNotes)
      ? body.communityReviewNotes.map((item) => String(item))
      : undefined,
    budgetNotes:
      Object.prototype.hasOwnProperty.call(body, 'budgetNotes') &&
      (typeof body.budgetNotes === 'string' || body.budgetNotes === null)
        ? (body.budgetNotes as string | null)
        : undefined,
    draftStatus:
      Object.prototype.hasOwnProperty.call(body, 'draftStatus') &&
      (typeof body.draftStatus === 'string' || body.draftStatus === null)
        ? (body.draftStatus as FundingApplicationDraftWorkspaceInput['draftStatus'])
        : undefined,
    lastReviewRequestedAt:
      typeof body.lastReviewRequestedAt === 'string'
        ? body.lastReviewRequestedAt
        : undefined,
    lastReviewCompletedAt:
      typeof body.lastReviewCompletedAt === 'string'
        ? body.lastReviewCompletedAt
        : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const organizationId = String(searchParams.get('organizationId') || '').trim();
    const opportunityId = String(searchParams.get('opportunityId') || '').trim();

    if (!organizationId || !opportunityId) {
      return NextResponse.json(
        { error: 'organizationId and opportunityId are required' },
        { status: 400 }
      );
    }

    const draft = await getFundingApplicationDraftWorkspaceRecord(
      organizationId,
      opportunityId
    );

    return NextResponse.json({
      success: true,
      draft,
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
    const draft = await upsertFundingApplicationDraftWorkspace(
      toDraftInput(body),
      admin.id
    );

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
