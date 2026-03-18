import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server-lite';
import { tourStops as staticTourStops } from '@/content/campaign';
import { StopContent } from './stop-content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Try DB first, fall back to static
  const supabase = await createClient();
  const { data: stop } = await supabase
    .from('tour_stops')
    .select('city, state, description')
    .eq('event_slug', slug)
    .single();

  const staticStop = staticTourStops.find(s => s.eventSlug === slug);
  const city = stop?.city || staticStop?.city || 'Tour Stop';
  const state = stop?.state || staticStop?.state || '';
  const description = stop?.description || staticStop?.description || 'CONTAINED tour stop';

  return {
    title: `${city}, ${state} — CONTAINED Tour`,
    description,
    openGraph: {
      title: `CONTAINED — ${city}, ${state}`,
      description,
    },
  };
}

export default async function TourStopPage({ params }: PageProps) {
  const { slug } = await params;
  return <StopContent slug={slug} />;
}
