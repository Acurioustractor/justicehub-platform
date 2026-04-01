import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Admin auth guard for API routes.
 * Returns { supabase } on success, or a NextResponse error on failure.
 * On localhost, bypasses auth and returns a service client.
 */
const DEV_USER_ID = '00000000-0000-4000-8000-00000000da7a';

export async function requireAdminApi(): Promise<
  | { supabase: any; userId: string; error?: never }
  | { error: NextResponse; supabase?: never; userId?: never }
> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (isDev) {
    return { supabase: createServiceClient(), userId: DEV_USER_ID };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) };
  }

  return { supabase, userId: user.id };
}
