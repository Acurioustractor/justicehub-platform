import { requireAdmin } from '@/lib/supabase/admin-lite';
import { CaseReviewQueue } from './CaseReviewQueue';

export const dynamic = 'force-dynamic';

export default async function CaseReviewPage() {
  const { user } = await requireAdmin('/admin/justice-matrix/review');
  return <CaseReviewQueue reviewerEmail={user.email ?? 'admin'} />;
}
