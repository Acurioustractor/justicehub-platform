import { NextRequest, NextResponse } from 'next/server';
import {
  createFundingOutcomeUpdate,
  fundingOsErrorResponse,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await createFundingOutcomeUpdate(
      {
        commitmentId: String(body.commitmentId || '').trim(),
        updateType:
          (String(body.updateType || '').trim().toLowerCase() as
            | 'baseline'
            | 'progress'
            | 'milestone'
            | 'final'
            | 'correction') || 'progress',
        reportedValue:
          typeof body.reportedValue === 'number' ? body.reportedValue : null,
        reportedAt: typeof body.reportedAt === 'string' ? body.reportedAt : null,
        reportingPeriodStart:
          typeof body.reportingPeriodStart === 'string' ? body.reportingPeriodStart : null,
        reportingPeriodEnd:
          typeof body.reportingPeriodEnd === 'string' ? body.reportingPeriodEnd : null,
        narrative: typeof body.narrative === 'string' ? body.narrative : null,
        evidenceUrls: Array.isArray(body.evidenceUrls)
          ? body.evidenceUrls.map((value) => String(value))
          : [],
        confidenceScore:
          typeof body.confidenceScore === 'number' ? body.confidenceScore : null,
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
