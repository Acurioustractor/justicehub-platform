import { NextRequest, NextResponse } from 'next/server';
import { getServiceDetailResult } from '@/lib/services/service-detail';

export const dynamic = 'force-dynamic';

// Backward-compatible alias for older clients.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getServiceDetailResult(params.id);
    const response = NextResponse.json(
      {
        ...result.body,
        legacy_alias: true,
        canonical_endpoint: '/api/services/[id]',
      },
      { status: result.status }
    );
    response.headers.set('X-JusticeHub-Endpoint-Status', 'legacy-compat');
    response.headers.set('X-JusticeHub-Canonical-Replacement', '/api/services/[id]');
    return response;
  } catch (error: unknown) {
    console.error('Scraped service alias API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch service' },
      { status: 500 }
    );
  }
}
