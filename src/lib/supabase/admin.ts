import { createClient } from './server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDevAdminBypassUser, hasDevAdminBypass, DEV_ADMIN_BYPASS_COOKIE } from '@/lib/dev-admin-bypass';

/**
 * Require authenticated admin user for server components/pages.
 * Checks profiles.role = 'admin' (the canonical admin field).
 * Redirects to login or home if unauthorized.
 *
 * @param redirectPath - Where to redirect after login (defaults to /admin)
 * @returns The authenticated user object
 */
export async function requireAdmin(redirectPath = '/admin') {
  const cookieStore = await cookies();
  if (hasDevAdminBypass(cookieStore.get(DEV_ADMIN_BYPASS_COOKIE)?.value)) {
    const supabase = await createClient();
    return { user: getDevAdminBypassUser(), supabase };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${redirectPath}`);
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileData?.role !== 'admin') {
    redirect('/');
  }

  return { user, supabase };
}

/**
 * Check if the current user is an admin (for API routes).
 * Returns the user if admin, null otherwise.
 * Does NOT redirect - caller handles the 401/403 response.
 */
export async function checkAdmin() {
  const cookieStore = await cookies();
  if (hasDevAdminBypass(cookieStore.get(DEV_ADMIN_BYPASS_COOKIE)?.value)) {
    const supabase = await createClient();
    return { user: getDevAdminBypassUser(), supabase };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileData?.role !== 'admin') return null;

  return { user, supabase };
}
