import { requireAdmin } from '@/lib/supabase/admin-lite';
import { DiscoveriesQueue } from './DiscoveriesQueue';

export const dynamic = 'force-dynamic';

export default async function DiscoveriesReviewPage() {
  const { user } = await requireAdmin('/admin/justice-matrix/discoveries');
  return <DiscoveriesQueue reviewerEmail={user.email ?? 'admin'} />;
}
