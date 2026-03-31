import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ForFundersLayout({ children }: { children: React.ReactNode }) {
  // Skip auth in development (dev bypass — login page also skips in dev)
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?redirect=/for-funders');
    }
  }

  return <>{children}</>;
}
