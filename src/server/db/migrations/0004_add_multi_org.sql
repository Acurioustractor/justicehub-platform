-- Organization members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  invited_at TIMESTAMP,
  invited_by TEXT REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- Indexes for organization members
CREATE INDEX idx_org_member_user ON organization_members(user_id);
CREATE INDEX idx_org_member_org ON organization_members(organization_id);
CREATE INDEX idx_org_member_active ON organization_members(is_active);

-- Organization invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by TEXT REFERENCES users(id),
  rejected_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for organization invitations
CREATE INDEX idx_org_invitation_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitation_email ON organization_invitations(email);
CREATE INDEX idx_org_invitation_token ON organization_invitations(token);

-- Organization activity log
CREATE TABLE IF NOT EXISTS organization_activity_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for activity log
CREATE INDEX idx_org_activity_org ON organization_activity_log(organization_id);
CREATE INDEX idx_org_activity_user ON organization_activity_log(user_id);
CREATE INDEX idx_org_activity_created ON organization_activity_log(created_at);

-- Migrate existing organizationId relationships to organization_members
-- This preserves existing single-org relationships while enabling multi-org
INSERT INTO organization_members (id, organization_id, user_id, role, is_primary, joined_at)
SELECT 
  gen_random_uuid()::text,
  organization_id,
  id as user_id,
  CASE 
    WHEN role = 'org_admin' THEN 'admin'
    WHEN role = 'platform_admin' THEN 'owner'
    ELSE 'member'
  END as role,
  TRUE as is_primary,
  created_at as joined_at
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Add current_organization_id to users for tracking active organization
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_organization_id TEXT REFERENCES organizations(id);

-- Update current_organization_id to match existing organization_id
UPDATE users SET current_organization_id = organization_id WHERE organization_id IS NOT NULL;

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organization_members
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();