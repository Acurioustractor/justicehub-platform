-- Dashboard backend increment 1: claim approval + org membership.
-- Spec: docs/community-profiles/dashboard-backend-spec.md (sections 1, 7),
-- ADAPTED to the pre-existing tables the spec missed: organization_claims
-- (claim queue, 2 verified rows) and organization_members (portal membership,
-- roles member/admin/staff/counselor/manager/owner). Everything here is
-- additive except one fix: the old org_members_basic_access policy (FOR ALL,
-- user_id = auth.uid()) let any authenticated user INSERT themselves as
-- owner/admin of any organisation or UPDATE their own role. That hole is
-- replaced with scoped policies; /contained/join's legitimate self-insert
-- (role member, status pending) keeps working.

-- organization_claims: invite-token flow (claim approved -> invite link ->
-- claimant accepts -> owner membership). 'expired' joins the status vocab.
ALTER TABLE organization_claims ADD COLUMN IF NOT EXISTS invite_token uuid;
ALTER TABLE organization_claims ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_organization_claims_invite_token
  ON organization_claims(invite_token) WHERE invite_token IS NOT NULL;

ALTER TABLE organization_claims DROP CONSTRAINT IF EXISTS organization_claims_status_check;
ALTER TABLE organization_claims ADD CONSTRAINT organization_claims_status_check
  CHECK (status = ANY (ARRAY['pending'::text,'verified'::text,'rejected'::text,'revoked'::text,'expired'::text]));

-- organization_members: dashboard roles join the portal vocabulary.
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role = ANY (ARRAY['member'::text,'admin'::text,'staff'::text,'counselor'::text,'manager'::text,'owner'::text,'editor'::text,'viewer'::text]));

-- Membership helper. SECURITY DEFINER so organization_members policies can
-- call it without RLS recursion. Role mapping, documented:
--   owner-level : owner, admin (portal org-admins hold the pen)
--   editor-level: owner, admin, editor
--   viewer-level: any ACTIVE membership (member/staff/counselor/manager read)
-- Pending self-joins from /contained/join confer nothing until activated.
CREATE OR REPLACE FUNCTION is_org_member(org uuid, min_role text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = org AND m.user_id = auth.uid() AND m.status = 'active'
      AND CASE min_role
        WHEN 'owner' THEN m.role IN ('owner','admin')
        WHEN 'editor' THEN m.role IN ('owner','admin','editor')
        ELSE true
      END
  );
$$;

-- Replace the open FOR ALL self policy with scoped ones.
DROP POLICY IF EXISTS org_members_basic_access ON organization_members;

DROP POLICY IF EXISTS org_members_select_own ON organization_members;
CREATE POLICY org_members_select_own ON organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS org_members_select_roster ON organization_members;
CREATE POLICY org_members_select_roster ON organization_members
  FOR SELECT TO authenticated USING (is_org_member(organization_id, 'viewer'));

-- /contained/join self-enrolment: member + pending only, never owner/admin.
DROP POLICY IF EXISTS org_members_self_join_pending ON organization_members;
CREATE POLICY org_members_self_join_pending ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member' AND status = 'pending');

DROP POLICY IF EXISTS org_members_owner_insert ON organization_members;
CREATE POLICY org_members_owner_insert ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_owner_update ON organization_members;
CREATE POLICY org_members_owner_update ON organization_members
  FOR UPDATE TO authenticated
  USING (is_org_member(organization_id, 'owner'))
  WITH CHECK (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_owner_delete ON organization_members;
CREATE POLICY org_members_owner_delete ON organization_members
  FOR DELETE TO authenticated
  USING (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_leave_self ON organization_members;
CREATE POLICY org_members_leave_self ON organization_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- organization_claims: admin full access via RLS (existing admin API uses the
-- service role and is unaffected; new routes run on the user client).
DROP POLICY IF EXISTS organization_claims_admin_all ON organization_claims;
CREATE POLICY organization_claims_admin_all ON organization_claims
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));
