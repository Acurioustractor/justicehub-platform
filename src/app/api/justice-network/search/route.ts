import { NextResponse } from 'next/server';
import { getYouthRemandNetworkData } from '@/lib/justice-network/youth-remand';

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? 'children on remand';

  try {
    const payload = await getYouthRemandNetworkData(q);
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('[justice-network/search] failed', error);
    return NextResponse.json({ error: 'Failed to search the JusticeHub Network' }, { status: 500 });
  }
}
