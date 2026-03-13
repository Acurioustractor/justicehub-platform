import { createClient } from './server-lite';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDevAdminBypassUser, hasDevAdminBypass, DEV_ADMIN_BYPASS_COOKIE } from '@/lib/dev-admin-bypass';

/**
 * Lightweight admin guard for residual admin/navigation surfaces that do not
 * need the full generated Database type graph during compilation.
 */
export async function requireAdmin(redirectPath = '/admin') {
  const cookieStore = await cookies();
  if (hasDevAdminBypass(cookieStore.get(DEV_ADMIN_BYPASS_COOKIE)?.value)) {
    const supabase = await createClient();
    return { user: getDevAdminBypassUser(), supabase };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function checkAdmin() {
  const cookieStore = await cookies();
  if (hasDevAdminBypass(cookieStore.get(DEV_ADMIN_BYPASS_COOKIE)?.value)) {
    const supabase = await createClient();
    return { user: getDevAdminBypassUser(), supabase };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileData?.role !== 'admin') return null;

  return { user, supabase };
}
