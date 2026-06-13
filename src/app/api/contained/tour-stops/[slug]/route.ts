import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { tourStops as staticTourStops } from '@/content/campaign';

export const dynamic = 'force-dynamic';

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
    const staticStop = staticTourStops.find((s) => s.eventSlug === slug);

    // 1. Fetch the tour stop
    const { data: stop, error: stopError } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('event_slug', slug)
      .maybeSingle();

    if (stopError && !staticStop) {
      return NextResponse.json({ error: 'Tour stop not found' }, { status: 404 });
    }

    const state = staticStop?.state || stop?.state;
    const city = staticStop?.city || stop?.city;
    if (!state || !city) {
      return NextResponse.json({ error: 'Tour stop not found' }, { status: 404 });
    }

    // 2-6. Fetch related data in parallel
    const [facilitiesRes, storiesRes, basecampsRes, facilitiesApiRes, localOrgsRes] = await Promise.all([
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
        .or(`tour_stop.eq.${city},tour_stop.ilike.%${city}%`)
        .order('created_at', { ascending: false })
        .limit(20),

      // Community orgs in this state — anchor basecamps + any partner_tier='basecamp' org.
      supabase
        .from('organizations')
        .select('name, slug, description, location, partner_photos(photo_url, is_featured, photo_type)')
        .or(`partner_tier.eq.basecamp,type.eq.basecamp`)
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('name'),

      // ROGS state spending (reuse facilities API pattern)
      fetchStateSpending(supabase, state),

      // Local orgs running YJ programs in this state (via RPC or raw query)
      fetchLocalOrgs(supabase, state),
    ]);

    // Filter basecamps to those in this state.
    // Bug fix: previously used loc.includes(state) which matched "Mount Isa, QLD" → "SA"
    // because "ISA" contains "SA". Now match by tokenised segment so the state code
    // must appear as a standalone token (e.g. ", QLD" or "SA").
    const stateUpper = (state || '').toUpperCase();
    const stateBasecamps = (basecampsRes.data || []).filter((org: any) => {
      const loc = (org.location || '').toUpperCase();
      // Split on commas, slashes, parentheses, and whitespace — match state as exact token.
      const tokens = loc.split(/[,\s/()]+/).map((t: string) => t.trim()).filter(Boolean);
      return tokens.includes(stateUpper);
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
        city,
        state,
        venue: staticStop?.venue || stop?.venue || '',
        partner: staticStop?.partner || stop?.partner || '',
        description: staticStop?.description || stop?.description || '',
        eventSlug: staticStop?.eventSlug || stop?.event_slug || slug,
        date: staticStop?.date || stop?.date || '',
        status: staticStop?.status || stop?.status || 'planning',
        lat: Number(staticStop?.lat ?? stop?.lat) || 0,
        lng: Number(staticStop?.lng ?? stop?.lng) || 0,
        partnerQuote: staticStop?.partnerQuote || stop?.partner_quote || null,
        localStats: stop?.local_stats || null,
        heroImageUrl: stop?.hero_image_url || null,
        videoUrl: stop?.video_url || null,
        interviewNotes: stop?.interview_notes || null,
        servicesHighlighted: stop?.services_highlighted || [],
      },
      facilities: facilitiesRes.data || [],
      stories: storiesRes.data || [],
      basecamps,
      stateSpending: facilitiesApiRes,
      stakeholders: stop?.stakeholders || {},
      localOrgs: localOrgsRes,
      hasAccess: !!stop?.access_code,
    });
  } catch (error) {
    console.error('Tour stop detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchLocalOrgs(supabase: any, state: string) {
  try {
    // Use a two-step approach: get org IDs with interventions, then fetch org details
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select('operating_organization_id')
      .neq('verification_status', 'ai_generated');

    const orgIds = [...new Set(
      (interventions || [])
        .map((r: any) => r.operating_organization_id)
        .filter(Boolean)
    )];

    if (!orgIds.length) return [];

    const { data: orgs } = await supabase
      .from('organizations')
      .select('name, suburb, website, is_indigenous_org')
      .eq('state', state)
      .in('id', orgIds)
      .order('is_indigenous_org', { ascending: false })
      .order('name')
      .limit(50);

    return (orgs || []).map((o: any) => ({
      name: o.name,
      suburb: o.suburb,
      website: o.website,
      isIndigenous: o.is_indigenous_org,
    }));
  } catch {
    return [];
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
