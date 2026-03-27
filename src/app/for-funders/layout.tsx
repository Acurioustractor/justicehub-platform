import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ForFundersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/for-funders');
  }

  return <>{children}</>;
}
