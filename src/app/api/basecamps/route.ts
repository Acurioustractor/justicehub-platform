import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

// Force dynamic so Next does not try to pre-render this route at build time.
// The basecamp list changes rarely but the underlying client uses cookies()
// (request-scoped), so a static-with-revalidate config conflicts at build.
// We cache the response for 5 min via a Cache-Control header instead.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  // Fetch all basecamps by partner_tier (DB-driven, no hardcoded slugs)
  const { data: basecamps, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      state,
      description,
      location,
      latitude,
      longitude,
      partner_photos (
        id,
        photo_url,
        photo_type,
        is_featured
      ),
      partner_impact_metrics (
        metric_name,
        metric_value,
        is_featured
      )
    `)
    .eq('partner_tier', 'basecamp')
    .eq('is_active', true)
    .eq('verification_status', 'verified')
    .not('slug', 'is', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('name');

  if (error) {
    console.error('Error fetching basecamps:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data for the frontend
  const transformed = basecamps?.map((org) => {
    // Find featured or hero photo
    const photos = org.partner_photos || [];
    const featuredPhoto = photos.find((p: any) => p.is_featured)
      || photos.find((p: any) => p.photo_type === 'hero')
      || photos[0];

    // Get featured metrics
    const metrics = org.partner_impact_metrics || [];
    const featuredMetrics = metrics.filter((m: any) => m.is_featured).slice(0, 2);

    return {
      slug: org.slug,
      name: org.name,
      region: org.location,
      description: org.description,
      coordinates: {
        lat: Number(org.latitude),
        lng: Number(org.longitude),
      },
      image: featuredPhoto?.photo_url || null,
      stats: featuredMetrics.map((m: any) => ({
        label: m.metric_name,
        value: m.metric_value,
      })),
    };
  });

  return NextResponse.json(transformed || [], {
    headers: {
      // Cache at the CDN edge for 5 min, allow stale for another hour while
      // a fresh fetch revalidates in the background. Drops repeat-load IO to zero.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
