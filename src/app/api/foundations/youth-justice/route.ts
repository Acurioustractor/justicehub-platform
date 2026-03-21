import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/foundations/youth-justice
 *
 * Returns top foundations with youth justice / Indigenous focus from GrantScope data.
 * Used by the Contained act page "Target a Funder" section.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('foundations')
      .select(
        'name, total_giving_annual, avg_grant_size, thematic_focus, geographic_focus, website'
      )
      .or(
        'thematic_focus.cs.{"youth"},thematic_focus.cs.{"justice"},thematic_focus.cs.{"indigenous"},thematic_focus.cs.{"children"},thematic_focus.cs.{"community development"}'
      )
      .not('total_giving_annual', 'is', null)
      .order('total_giving_annual', { ascending: false, nullsFirst: false })
      .limit(12);

    if (error) {
      console.error('[Foundations API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch foundations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ foundations: data || [] });
  } catch (err) {
    console.error('[Foundations API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
