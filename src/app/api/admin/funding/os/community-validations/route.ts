import { NextRequest, NextResponse } from 'next/server';
import {
  createCommunityOutcomeValidation,
  fundingOsErrorResponse,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await createCommunityOutcomeValidation(
      {
        updateId: String(body.updateId || '').trim(),
        validatorKind:
          (String(body.validatorKind || '').trim().toLowerCase() as
            | 'community_member'
            | 'community_board'
            | 'elder'
            | 'participant'
            | 'independent_evaluator'
            | 'funder') || 'community_member',
        validatorName: typeof body.validatorName === 'string' ? body.validatorName : null,
        validationStatus:
          (String(body.validationStatus || '').trim().toLowerCase() as
            | 'confirmed'
            | 'contested'
            | 'mixed'
            | 'needs_follow_up') || 'confirmed',
        validationNotes:
          typeof body.validationNotes === 'string' ? body.validationNotes : null,
        impactRating: typeof body.impactRating === 'number' ? body.impactRating : null,
        trustRating: typeof body.trustRating === 'number' ? body.trustRating : null,
        validatedAt: typeof body.validatedAt === 'string' ? body.validatedAt : null,
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
