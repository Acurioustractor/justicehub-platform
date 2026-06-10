-- Dashboard backend increment 1: claim approval + org membership
-- Spec: docs/community-profiles/dashboard-backend-spec.md (sections 1, 7)
-- Tables: org_claims (admin-only claim queue), org_members (org membership)
-- Helper: is_org_member(org, min_role) — SECURITY DEFINER so org_members
-- policies can call it without RLS recursion.

CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, organization_id)
);

CREATE TABLE IF NOT EXISTS org_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  claimant_email text NOT NULL,
  claimant_name text NOT NULL,
  role_in_org text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','expired')),
  invite_token uuid DEFAULT gen_random_uuid(),
  invite_expires_at timestamptz,
  decided_by uuid REFERENCES profiles(id),
  decided_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_profile ON org_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_org_claims_status ON org_claims(status);
CREATE INDEX IF NOT EXISTS idx_org_claims_token ON org_claims(invite_token)
  WHERE invite_token IS NOT NULL;

CREATE OR REPLACE FUNCTION is_org_member(org uuid, min_role text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.organization_id = org AND m.profile_id = auth.uid()
      AND CASE min_role WHEN 'viewer' THEN m.role IN ('viewer','editor','owner')
                        WHEN 'editor' THEN m.role IN ('editor','owner')
                        ELSE m.role = 'owner' END
  );
$$;

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_claims ENABLE ROW LEVEL SECURITY;

-- org_members: members read their own org's roster. Owners manage rows for
-- their org. Anyone may leave (delete their own row). No anon access.
-- The FIRST owner row for an org cannot be created by any client policy:
-- it is inserted by the service role during invite-token acceptance, the
-- only service-role write in the dashboard system (never-rule 3).
DROP POLICY IF EXISTS org_members_select_own_org ON org_members;
CREATE POLICY org_members_select_own_org ON org_members
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, 'viewer'));

DROP POLICY IF EXISTS org_members_owner_insert ON org_members;
CREATE POLICY org_members_owner_insert ON org_members
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_owner_update ON org_members;
CREATE POLICY org_members_owner_update ON org_members
  FOR UPDATE TO authenticated
  USING (is_org_member(organization_id, 'owner'))
  WITH CHECK (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_owner_delete ON org_members;
CREATE POLICY org_members_owner_delete ON org_members
  FOR DELETE TO authenticated
  USING (is_org_member(organization_id, 'owner'));

DROP POLICY IF EXISTS org_members_leave_self ON org_members;
CREATE POLICY org_members_leave_self ON org_members
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- org_claims: admin-only, no anon access at all. Token acceptance happens in
-- a service-role server route that validates token + email match.
DROP POLICY IF EXISTS org_claims_admin_all ON org_claims;
CREATE POLICY org_claims_admin_all ON org_claims
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
