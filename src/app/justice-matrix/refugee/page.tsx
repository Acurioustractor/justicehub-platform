import { redirect } from 'next/navigation';
import { SURFACES } from '@/lib/justice-matrix/surfaces';

// Vanity entry URL for the global refugee & asylum surface (Surface A).
// Exists only as a memorable, shareable home; all the real work happens in the
// shared explore route with the lens preset baked in.
export const dynamic = 'force-static';

export const metadata = {
  title: 'Refugee & Asylum · Justice Matrix',
  description: SURFACES.refugee.blurb,
};

export default function RefugeeSurfacePage() {
  redirect(SURFACES.refugee.exploreHref);
}
