-- Organization claims table
-- Allows real organizations to claim their profile on JusticeHub
CREATE TABLE IF NOT EXISTS organization_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  role_at_org TEXT NOT NULL,
  message TEXT,
  abn TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'revoked')),
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  acnc_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ABN column on organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS abn TEXT;

-- RLS policies
ALTER TABLE organization_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit claims"
  ON organization_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own claims"
  ON organization_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());
