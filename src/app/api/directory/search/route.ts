import { NextRequest, NextResponse } from 'next/server';
import { getDirectorySearchResults } from '@/lib/directory/org-dossier';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const state = searchParams.get('state');
  const limit = Number(searchParams.get('limit') || 12);

  try {
    const results = await getDirectorySearchResults({ query: q, state, limit });
    return NextResponse.json({
      query: q || '',
      state: state || '',
      count: results.length,
      results,
      validity: {
        publicLayer: true,
        labels: ['ABN linked', 'CivicGraph linked', 'Source linked', 'Human verified', 'Needs review'],
        caveat: 'Search results are catalogue records, not endorsements. Check source links and review gaps before relying on a record.',
      },
    });
  } catch (error) {
    console.error('[api/directory/search]', error);
    return NextResponse.json({ error: 'Directory search failed' }, { status: 500 });
  }
}
