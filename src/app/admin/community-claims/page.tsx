import { Metadata } from 'next';
import { requireAdmin } from '@/lib/supabase/admin';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ClaimsQueueClient, type ClaimRow } from './ClaimsQueueClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Claims | Admin',
};

export default async function CommunityClaimsPage() {
  const { supabase } = await requireAdmin('/admin/community-claims');

  const { data: claims, error } = await supabase
    .from('org_claims')
    .select('*, organizations(id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) console.error('[community-claims] fetch failed:', error.message);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Community claims</h1>
        <p className="text-sm opacity-70 mb-8 max-w-2xl">
          Claims are recorded here after the confirming conversation with the
          organisation. Approving a claim opens a 14 day invite window and
          gives you a link to send personally. The contact becomes the
          organisation&apos;s first owner when they accept.
        </p>
        <ClaimsQueueClient initialClaims={(claims ?? []) as ClaimRow[]} />
      </main>
      <Footer />
    </div>
  );
}
