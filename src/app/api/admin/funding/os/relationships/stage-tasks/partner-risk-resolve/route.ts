import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  requireAdminUser,
  resolveFundingRelationshipPartnerRiskTask,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const taskId = String(body.taskId || '').trim();
    const note = String(body.note || '').trim();
    const resolution = String(body.resolution || '').trim().toLowerCase() as
      | 'no_relationship_impact'
      | 'pause_relationship'
      | 'escalate_pipeline_risk';

    const result = await resolveFundingRelationshipPartnerRiskTask(
      taskId,
      resolution,
      note,
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
