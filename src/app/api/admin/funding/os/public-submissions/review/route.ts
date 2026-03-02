import { NextRequest, NextResponse } from 'next/server';
import {
  acknowledgeFundingPublicEvidenceSubmission,
  fundingOsErrorResponse,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const kind = String(body.kind || '').trim().toLowerCase() as 'update' | 'validation';
    const submissionId = String(body.submissionId || '').trim();

    const result = await acknowledgeFundingPublicEvidenceSubmission(
      { kind, submissionId },
      adminUser.id
    );

    return NextResponse.json(result);
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
