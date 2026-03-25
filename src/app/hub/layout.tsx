import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/hub');
  }

  return <>{children}</>;
}
