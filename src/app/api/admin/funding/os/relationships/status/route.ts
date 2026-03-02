import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  updateFundingRelationshipEngagementStatus,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const relationshipId = String(body.relationshipId || '').trim();
    const status = String(body.status || '').trim().toLowerCase() as
      | 'active'
      | 'paused'
      | 'completed'
      | 'closed';

    const result = await updateFundingRelationshipEngagementStatus(
      relationshipId,
      status,
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
