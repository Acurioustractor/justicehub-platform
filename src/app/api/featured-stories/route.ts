import { NextResponse } from 'next/server';
import {
  getFeaturedJusticeStories,
  isEmpathyLedgerConfigured,
} from '@/lib/supabase/empathy-ledger';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to fetch featured justice-related stories from Empathy Ledger
 * Returns stories directly (not profiles) since profile RLS blocks direct access
 * Filters to only show stories relevant to youth justice themes
 */
export async function GET() {
  try {
    if (!isEmpathyLedgerConfigured) {
      return NextResponse.json({
        stories: [],
        count: 0,
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
      });
    }

    const stories = await getFeaturedJusticeStories(6);

    return NextResponse.json({
      stories,
      count: stories.length
    });
  } catch (error) {
    console.error('Error fetching featured stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured stories', stories: [] },
      { status: 500 }
    );
  }
}
