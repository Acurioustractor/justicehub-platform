import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { searchService } from '@/services/searchService';

// Main search endpoint
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const searchOptions = {
      query: body.query || '',
      filters: body.filters || {},
      limit: body.limit || 20,
      offset: body.offset || 0,
      includeContent: body.includeContent || false,
      fuzzySearch: body.fuzzySearch || true
    };

    if (!searchOptions.query || searchOptions.query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Perform search
    const searchResults = await searchService.search(searchOptions, user);

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

// Get trending searches
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const trending = await searchService.getTrendingSearches(limit);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending searches' },
      { status: 500 }
    );
  }
}