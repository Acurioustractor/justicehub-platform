import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingPublicEvidenceSubmissions,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(request.url);
    const kind = String(searchParams.get('kind') || 'all')
      .trim()
      .toLowerCase() as 'update' | 'validation' | 'all';
    const review = String(searchParams.get('review') || 'all')
      .trim()
      .toLowerCase() as 'all' | 'pending' | 'acknowledged';
    const limit = Number(searchParams.get('limit') || '60');

    const data = await listFundingPublicEvidenceSubmissions({
      kind,
      review,
      limit: Number.isFinite(limit) ? limit : 60,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
