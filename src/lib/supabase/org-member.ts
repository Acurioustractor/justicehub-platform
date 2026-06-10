import { createClient } from './server';
import { redirect } from 'next/navigation';

export type OrgRole = 'viewer' | 'editor' | 'owner';

const ROLE_ORDER: Record<OrgRole, number> = { viewer: 0, editor: 1, owner: 2 };

export interface OrgMembership {
  organization_id: string;
  role: OrgRole;
}

/**
 * Require an authenticated user with at least `minRole` in the given org.
 * Companion to requireAdmin() in admin.ts. Admins are NOT implicit org
 * members: staff can stage, never publish (org-profile-spec rule 1), so
 * there is deliberately no admin bypass here.
 *
 * Redirects to login (unauthenticated) or /communities (not a member).
 */
export async function requireOrgMember(orgId: string, minRole: OrgRole = 'viewer') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('organization_id', orgId)
    .eq('profile_id', user.id)
    .single();

  if (!membership || ROLE_ORDER[membership.role as OrgRole] < ROLE_ORDER[minRole]) {
    redirect('/communities');
  }

  return { user, supabase, membership: membership as OrgMembership };
}

/**
 * Check membership for API routes. Returns null instead of redirecting;
 * caller handles the 401/403 response.
 */
export async function checkOrgMember(orgId: string, minRole: OrgRole = 'viewer') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('organization_id', orgId)
    .eq('profile_id', user.id)
    .single();

  if (!membership || ROLE_ORDER[membership.role as OrgRole] < ROLE_ORDER[minRole]) {
    return null;
  }

  return { user, supabase, membership: membership as OrgMembership };
}

/**
 * List all org memberships for the signed-in user (for /dashboard org
 * pickers). Returns [] when signed out.
 */
export async function listMyMemberships() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('profile_id', user.id);
  return (data ?? []) as OrgMembership[];
}
