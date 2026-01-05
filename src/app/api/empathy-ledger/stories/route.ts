import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedStories, getPublicStories } from '@/lib/supabase/empathy-ledger';

/**
 * GET /api/empathy-ledger/stories
 *
 * Fetches public stories from the Empathy Ledger platform
 * Query params:
 *   - limit: number of stories to return (default: 10)
 *   - featured: if 'true', prioritize featured stories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true';

    let stories;

    if (featured) {
      stories = await getFeaturedStories(limit);
    } else {
      stories = await getPublicStories(limit);
    }

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length
    });
  } catch (error: any) {
    console.error('Empathy Ledger stories API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
