import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingRelationshipEngagements,
  promoteFundingConversationFollowUpToRelationship,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 25);
    const status = String(searchParams.get('status') || 'all').trim().toLowerCase() as
      | 'all'
      | 'active'
      | 'paused'
      | 'completed'
      | 'closed';

    const data = await listFundingRelationshipEngagements({
      limit: Number.isFinite(limit) ? limit : 25,
      status,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const followUpTaskId = String(body.followUpTaskId || '').trim();

    const result = await promoteFundingConversationFollowUpToRelationship(
      followUpTaskId,
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
