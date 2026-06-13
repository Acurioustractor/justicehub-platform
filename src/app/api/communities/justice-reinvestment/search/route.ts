import { NextRequest, NextResponse } from 'next/server';
import { jrSitesSearchProvider } from '@/lib/search/providers';

export const dynamic = 'force-dynamic';

/**
 * Cross-site search for the Justice Reinvestment network.
 *
 * Searches every JR site by place, lead organisation, program, person, partner,
 * and impact metric, returning the site each match belongs to. Backed by the
 * curated JSON layer (sites.json + site-research.json) in memory, so it is fast
 * and needs no database round trip.
 *
 * Query params: q (>=2 chars, required), state (optional filter), limit (<=50).
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const state = searchParams.get('state') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

    if (q.length < 2) {
      return NextResponse.json({ query: q, results: [], stateCounts: {}, total: 0, timing_ms: Date.now() - start });
    }

    const results = await jrSitesSearchProvider.search(q, { state, limit });

    const stateCounts: Record<string, number> = {};
    for (const r of results) {
      const s = typeof r.metadata.state === 'string' ? r.metadata.state : null;
      if (s) stateCounts[s] = (stateCounts[s] || 0) + 1;
    }

    return NextResponse.json({
      query: q,
      results,
      stateCounts,
      total: results.length,
      timing_ms: Date.now() - start,
    });
  } catch (error) {
    console.error('JR network search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
