import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a user has access to an organization's hub.
 * Admins can access any org. Org members can access their own org.
 *
 * @param userId - The auth user ID (from supabase.auth.getUser())
 * @param orgId - The organization UUID
 */
export async function checkOrgAccess(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  // profiles.id matches auth user id
  const profile = (await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()).data;

  if (!profile) return false;

  // Admin can access any org
  if (profile.role === 'admin') return true;

  // Org member can access their own org (using auth user id for membership lookup)
  const { data: member } = await (supabase as any)
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  return !!member;
}
