import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { tourStops as staticTourStops } from '@/content/campaign';

export const revalidate = 300; // 5 min cache

/**
 * GET /api/contained/tour-stops
 * Returns tour stops from DB, falls back to static campaign.ts data.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: stops, error } = await supabase
      .from('tour_stops')
      .select('id, city, state, venue, partner, description, event_slug, date, status, lat, lng, partner_quote, local_stats')
      .eq('campaign_slug', 'the-contained')
      .order('date', { ascending: true });

    if (error) throw error;

    if (stops && stops.length > 0) {
      // Map DB format to match the TourStop interface used by frontend
      const mapped = stops.map(s => ({
        city: s.city,
        state: s.state,
        venue: s.venue || '',
        partner: s.partner || '',
        description: s.description || '',
        eventSlug: s.event_slug || '',
        date: s.date || '',
        status: s.status || 'planning',
        lat: Number(s.lat) || 0,
        lng: Number(s.lng) || 0,
        partnerQuote: s.partner_quote || undefined,
        localStats: s.local_stats || undefined,
      }));
      return NextResponse.json(mapped);
    }

    // Fallback to static data
    return NextResponse.json(staticTourStops);
  } catch (error) {
    console.error('Tour stops GET error:', error);
    // Fallback to static data on error
    return NextResponse.json(staticTourStops);
  }
}
