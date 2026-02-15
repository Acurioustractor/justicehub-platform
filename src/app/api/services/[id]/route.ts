import { NextRequest, NextResponse } from 'next/server';
import { getServiceDetailResult } from '@/lib/services/service-detail';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getServiceDetailResult(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error: unknown) {
    console.error('Service detail API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch service' },
      { status: 500 }
    );
  }
}
