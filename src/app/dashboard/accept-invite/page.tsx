import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navigation, Footer } from '@/components/ui/navigation';
import { AcceptInviteClient } from './AcceptInviteClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accept invite | JusticeHub',
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = token
      ? `/dashboard/accept-invite?token=${encodeURIComponent(token)}`
      : '/dashboard/accept-invite';
    redirect(`/login?redirect=${encodeURIComponent(next)}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Accept your invite</h1>
        {token ? (
          <AcceptInviteClient token={token} email={user.email ?? ''} />
        ) : (
          <p className="text-sm opacity-70">
            This page needs an invite link. Check the link you were sent, or
            contact the person who invited you.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
