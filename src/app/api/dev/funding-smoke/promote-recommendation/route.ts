import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  promoteFundingMatchRecommendation,
} from '@/lib/funding/funding-operating-system';

function getSmokeSecret() {
  return String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const configuredSecret = getSmokeSecret();
  const providedSecret =
    request.headers.get('x-funding-smoke-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const recommendationId = String(body.recommendationId || '').trim();
    const result = await promoteFundingMatchRecommendation(recommendationId, null);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
