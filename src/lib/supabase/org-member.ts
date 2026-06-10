import { createClient } from './server';
import { redirect } from 'next/navigation';

/**
 * Org membership helpers over the pre-existing `organization_members` table
 * (user_id -> profiles.id, role in member/admin/staff/counselor/manager/
 * owner/editor/viewer, status in active/inactive/pending/suspended).
 *
 * Min-role semantics mirror the is_org_member() SQL helper:
 *   owner  -> role in (owner, admin)
 *   editor -> role in (owner, admin, editor)
 *   viewer -> any ACTIVE membership
 * Pending self-joins (/contained/join) confer nothing until activated.
 *
 * Deliberately no admin bypass: staff can stage, never publish
 * (org-profile-spec rule 1).
 */

export type MinRole = 'viewer' | 'editor' | 'owner';

const ROLES_FOR: Record<MinRole, string[] | null> = {
  owner: ['owner', 'admin'],
  editor: ['owner', 'admin', 'editor'],
  viewer: null, // any active role
};

export interface OrgMembership {
  organization_id: string;
  role: string;
  status: string;
}

function satisfies(membership: OrgMembership | null, minRole: MinRole): membership is OrgMembership {
  if (!membership || membership.status !== 'active') return false;
  const allowed = ROLES_FOR[minRole];
  return allowed === null || allowed.includes(membership.role);
}

/**
 * Require an authenticated user with at least `minRole` in the given org.
 * Companion to requireAdmin() in admin.ts. Redirects to login
 * (unauthenticated) or /communities (not a member).
 */
export async function requireOrgMember(orgId: string, minRole: MinRole = 'viewer') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  const membership = (data ?? null) as OrgMembership | null;
  if (!satisfies(membership, minRole)) {
    redirect('/communities');
  }

  return { user, supabase, membership };
}

/**
 * Check membership for API routes. Returns null instead of redirecting;
 * caller handles the 401/403 response.
 */
export async function checkOrgMember(orgId: string, minRole: MinRole = 'viewer') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  const membership = (data ?? null) as OrgMembership | null;
  if (!satisfies(membership, minRole)) return null;

  return { user, supabase, membership };
}

/**
 * List the signed-in user's active memberships (for /dashboard org pickers).
 * Returns [] when signed out.
 */
export async function listMyMemberships(): Promise<OrgMembership[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active');
  return (data ?? []) as OrgMembership[];
}
