import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ELContentManager } from './content-client';

/**
 * /contained/content is an internal EL content-management surface. Gate it
 * behind the same admin check the /admin pages use: a profiles.role === 'admin'
 * session via the server Supabase client. Anyone unauthenticated or non-admin
 * is redirected to /contained. Localhost is bypassed to match the rest of /admin
 * (the login dev-bypass would otherwise cause a redirect loop).
 */
export default async function ContainedContentPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/contained');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileData?.role !== 'admin') {
      redirect('/contained');
    }
  }

  return <ELContentManager />;
}
