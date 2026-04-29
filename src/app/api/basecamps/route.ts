import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

// Cache the basecamp list for 5 minutes. Basecamps change rarely and the
// underlying query joins partner_photos and partner_impact_metrics, so each
// uncached call costs real disk IO. 5 minutes is the right tradeoff between
// freshness for the CoE landing page and IO budget on the Micro tier.
export const revalidate = 300;

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

  return NextResponse.json(transformed || []);
}
