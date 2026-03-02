import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  promoteFundingMatchRecommendation,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const recommendationId = String(body.recommendationId || '').trim();

    const result = await promoteFundingMatchRecommendation(recommendationId, admin.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
