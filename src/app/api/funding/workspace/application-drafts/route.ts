import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  getFundingApplicationDraftWorkspaceRecord,
  promoteFundingApplicationDraftToLiveApplication,
  requestFundingApplicationDraftCommunityReview,
  type FundingApplicationDraftWorkspaceInput,
  upsertFundingApplicationDraftWorkspace,
} from '@/lib/funding/funding-operating-system';

function toDraftInput(body: Record<string, unknown>): FundingApplicationDraftWorkspaceInput {
  return {
    organizationId: String(body.organizationId || ''),
    opportunityId: String(body.opportunityId || ''),
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
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const requestCommunityReview = body.requestCommunityReview === true;
    const promoteToLiveApplication = body.promoteToLiveApplication === true;

    if (requestCommunityReview && promoteToLiveApplication) {
      return NextResponse.json(
        { error: 'Choose either requestCommunityReview or promoteToLiveApplication' },
        { status: 400 }
      );
    }

    const result = requestCommunityReview
      ? await requestFundingApplicationDraftCommunityReview(toDraftInput(body), null)
      : promoteToLiveApplication
        ? await promoteFundingApplicationDraftToLiveApplication(toDraftInput(body), null)
      : {
          draft: await upsertFundingApplicationDraftWorkspace(toDraftInput(body), null),
          reviewTask: null,
          existing: false,
          applicationId: null,
          awardId: null,
          recommendationId: null,
        };

    return NextResponse.json({
      success: true,
      draft: result.draft,
      reviewTask: result.reviewTask,
      existing: result.existing,
      applicationId: result.applicationId || null,
      awardId: result.awardId || null,
      recommendationId: result.recommendationId || null,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
