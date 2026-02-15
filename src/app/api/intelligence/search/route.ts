/**
 * Unified Intelligence Search API
 *
 * GET /api/intelligence/search - Search across all JusticeHub data sources
 *
 * Query Parameters:
 * - q: Search query (required)
 * - type: Entity type filter (optional: intervention, service, person, organization, media, story)
 * - state: State filter (optional: NSW, VIC, QLD, WA, SA, TAS, ACT, NT, National)
 * - elder_approved: Filter to elder-approved content only (optional: true/false)
 * - sources: Comma-separated data sources (optional: internal, empathy-ledger)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 50)
 *
 * Response includes:
 * - Intelligent intent detection
 * - Results from multiple sources
 * - Faceted counts
 * - Related search suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { justiceSearch } from '@/lib/search';
import type { SearchResultType } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const typeFilter = searchParams.get('type') as SearchResultType | null;
  const stateFilter = searchParams.get('state');
  const elderApproved = searchParams.get('elder_approved') === 'true';
  const sourcesParam = searchParams.get('sources');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Validate query
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required and must be at least 2 characters' },
      { status: 400 }
    );
  }

  // Parse sources
  const sources = {
    internal: true,
    empathyLedger: true,
    external: false,
  };

  if (sourcesParam) {
    const requestedSources = sourcesParam.split(',').map((s) => s.trim().toLowerCase());
    sources.internal = requestedSources.includes('internal');
    sources.empathyLedger = requestedSources.includes('empathy-ledger');
  }

  // Build context
  const context = {
    state: stateFilter || undefined,
    entityTypes: typeFilter ? [typeFilter] : undefined,
    elderApprovedOnly: elderApproved,
    page,
    limit,
  };

  try {
    const response = await justiceSearch.search(query, {
      context,
      sources,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST for advanced search with body parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { query, context, sources } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    const response = await justiceSearch.search(query, {
      context,
      sources,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
