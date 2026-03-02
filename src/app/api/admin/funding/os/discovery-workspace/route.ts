import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingDiscoveryReviewWorkspace,
  requireAdminUser,
  upsertFundingDiscoveryReviewWorkspace,
  type FundingDiscoveryReviewActivityInput,
  type FundingDiscoveryReviewWorkspaceInput,
} from '@/lib/funding/funding-operating-system';

function parseOrganizationIds(searchParams: URLSearchParams) {
  return (searchParams.get('organizationIds') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function toWorkspaceInput(body: Record<string, unknown>): FundingDiscoveryReviewWorkspaceInput {
  const activityRecord =
    body.activity && typeof body.activity === 'object'
      ? (body.activity as Record<string, unknown>)
      : null;

  const activity = activityRecord
    ? ({
        id: String(activityRecord.id || ''),
        timestamp: String(activityRecord.timestamp || ''),
        type: String(activityRecord.type || ''),
        detail: String(activityRecord.detail || ''),
        organizationId:
          typeof activityRecord.organizationId === 'string'
            ? activityRecord.organizationId
            : undefined,
        organizationName:
          typeof activityRecord.organizationName === 'string'
            ? activityRecord.organizationName
            : undefined,
      } satisfies FundingDiscoveryReviewActivityInput)
    : undefined;

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
    activity,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const data = await listFundingDiscoveryReviewWorkspace(
      parseOrganizationIds(searchParams)
    );

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
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const workspace = await upsertFundingDiscoveryReviewWorkspace(
      toWorkspaceInput(body),
      admin.id
    );

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
