import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  updateFundingRelationshipEngagementStage,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const relationshipId = String(body.relationshipId || '').trim();
    const stageKey = String(body.stageKey || '').trim().toLowerCase() as
      | 'intro_scheduled'
      | 'info_sent'
      | 'waiting_response'
      | 'engaged_partner';

    const result = await updateFundingRelationshipEngagementStage(
      relationshipId,
      stageKey,
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
