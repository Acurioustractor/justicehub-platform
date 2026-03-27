import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export default async function ForFundersLayout({ children }: { children: React.ReactNode }) {
  // Skip auth on localhost (dev bypass — login page also skips on localhost)
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?redirect=/for-funders');
    }
  }

  return <>{children}</>;
}
