import { redirect } from 'next/navigation';
import { SURFACES } from '@/lib/justice-matrix/surfaces';

// Vanity entry URL for the Australian youth-justice clearing house (Surface B).
// Exists only as a memorable, shareable home; all the real work happens in the
// shared explore route with the lens preset baked in.
export const dynamic = 'force-static';

export const metadata = {
  title: 'Youth Justice · Justice Matrix',
  description: SURFACES.youth.blurb,
};

export default function YouthSurfacePage() {
  redirect(SURFACES.youth.exploreHref);
}
