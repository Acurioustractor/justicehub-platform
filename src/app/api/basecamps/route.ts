import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Known basecamp slugs
const BASECAMP_SLUGS = ['oonchiumpa', 'bg-fit', 'mounty-yarns', 'picc-townsville'];

export async function GET() {
  const supabase = await createClient();

  // Fetch basecamp organizations by type OR known slugs
  const { data: basecamps, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
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
    .or(`type.eq.basecamp,slug.in.(${BASECAMP_SLUGS.join(',')})`)
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
        lat: org.latitude || 0,
        lng: org.longitude || 0,
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
