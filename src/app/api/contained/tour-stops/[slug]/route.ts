import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

export const revalidate = 300;

/**
 * GET /api/contained/tour-stops/[slug]
 * Aggregate endpoint returning all data for one tour stop:
 * - Tour stop details
 * - Detention facilities in that state
 * - ROGS state spending
 * - Community orgs (basecamps) in that state
 * - Tour stories submitted at this stop
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();

    // 1. Fetch the tour stop
    const { data: stop, error: stopError } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('event_slug', slug)
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: 'Tour stop not found' }, { status: 404 });
    }

    const state = stop.state;

    // 2-5. Fetch related data in parallel
    const [facilitiesRes, storiesRes, basecampsRes, facilitiesApiRes] = await Promise.all([
      // Detention facilities in this state
      supabase
        .from('youth_detention_facilities')
        .select('name, slug, city, state, capacity_beds, security_level, facility_type, indigenous_population_percentage')
        .eq('state', state)
        .eq('operational_status', 'operational')
        .order('name'),

      // Tour stories for this stop
      supabase
        .from('tour_stories')
        .select('id, name, tour_stop, story, status, is_public, created_at')
        .eq('status', 'approved')
        .eq('is_public', true)
        .or(`tour_stop.eq.${stop.city},tour_stop.ilike.%${stop.city}%`)
        .order('created_at', { ascending: false })
        .limit(20),

      // Community orgs in this state
      supabase
        .from('organizations')
        .select('name, slug, description, location, partner_photos(photo_url, is_featured, photo_type)')
        .or(`type.eq.basecamp,slug.in.(oonchiumpa,bg-fit,mounty-yarns,picc-townsville)`)
        .order('name'),

      // ROGS state spending (reuse facilities API pattern)
      fetchStateSpending(supabase, state),
    ]);

    // Filter basecamps to those in this state
    const stateBasecamps = (basecampsRes.data || []).filter((org: any) => {
      const loc = (org.location || '').toUpperCase();
      return loc.includes(state);
    });

    // Transform basecamps
    const basecamps = stateBasecamps.map((org: any) => {
      const photos = org.partner_photos || [];
      const hero = photos.find((p: any) => p.is_featured) || photos.find((p: any) => p.photo_type === 'hero') || photos[0];
      return {
        slug: org.slug,
        name: org.name,
        description: org.description,
        location: org.location,
        image: hero?.photo_url || null,
      };
    });

    return NextResponse.json({
      stop: {
        city: stop.city,
        state: stop.state,
        venue: stop.venue,
        partner: stop.partner,
        description: stop.description,
        eventSlug: stop.event_slug,
        date: stop.date,
        status: stop.status,
        lat: Number(stop.lat) || 0,
        lng: Number(stop.lng) || 0,
        partnerQuote: stop.partner_quote || null,
        localStats: stop.local_stats || null,
        heroImageUrl: stop.hero_image_url || null,
        videoUrl: stop.video_url || null,
        interviewNotes: stop.interview_notes || null,
        servicesHighlighted: stop.services_highlighted || [],
      },
      facilities: facilitiesRes.data || [],
      stories: storiesRes.data || [],
      basecamps,
      stateSpending: facilitiesApiRes,
    });
  } catch (error) {
    console.error('Tour stop detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchStateSpending(supabase: any, state: string) {
  const key = state.toLowerCase();
  try {
    const [{ data: detRow }, { data: comRow }] = await Promise.all([
      supabase
        .from('rogs_justice_spending')
        .select(key)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('financial_year', '2024-25')
        .eq('unit', "$'000")
        .eq('service_type', 'Detention-based supervision')
        .eq('description3', 'Detention-based services')
        .limit(1)
        .single(),
      supabase
        .from('rogs_justice_spending')
        .select(key)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('financial_year', '2024-25')
        .eq('unit', "$'000")
        .eq('service_type', 'Community-based supervision')
        .eq('description3', 'Community-based services')
        .limit(1)
        .single(),
    ]);

    return {
      detention_m: detRow?.[key] ? Math.round(Number(detRow[key]) / 1000) : 0,
      community_m: comRow?.[key] ? Math.round(Number(comRow[key]) / 1000) : 0,
    };
  } catch {
    return { detention_m: 0, community_m: 0 };
  }
}
