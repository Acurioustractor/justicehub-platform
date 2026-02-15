-- Add organization linkages to community_programs
-- This connects programs to their parent organizations

-- Step 1: Add organization_id column to community_programs
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Step 2: Add service_id column (optional linkage)
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS service_id UUID;

-- Step 3: Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('ngo', 'government', 'community-org', 'indigenous-org', 'private')),
  description TEXT,

  -- Verification
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  is_indigenous_controlled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,

  -- Location
  street_address TEXT,
  suburb TEXT,
  city TEXT,
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_area TEXT[] DEFAULT '{}',

  -- Contact
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,

  -- Integration
  empathy_ledger_org_id UUID,

  -- Display
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT,
  settings JSONB DEFAULT '{}'
);

-- Step 4: Add foreign key constraints (do this after table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_programs_organization_id_fkey'
  ) THEN
    ALTER TABLE community_programs
    ADD CONSTRAINT community_programs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_programs_organization_id
  ON community_programs(organization_id);

CREATE INDEX IF NOT EXISTS idx_community_programs_service_id
  ON community_programs(service_id);

CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations(slug);

CREATE INDEX IF NOT EXISTS idx_organizations_type
  ON organizations(type);

CREATE INDEX IF NOT EXISTS idx_organizations_verification
  ON organizations(verification_status);

CREATE INDEX IF NOT EXISTS idx_organizations_indigenous
  ON organizations(is_indigenous_controlled);

-- Step 6: Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "organizations_public_read" ON organizations
  FOR SELECT
  USING (is_active = true);

-- Admin write access
CREATE POLICY "organizations_admin_write" ON organizations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 7: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Step 8: Grant permissions
GRANT SELECT ON organizations TO anon, authenticated;
GRANT ALL ON organizations TO service_role;

-- Comments
COMMENT ON TABLE organizations IS 'Organizations that provide services or run programs';
COMMENT ON COLUMN organizations.verification_status IS 'Whether organization has been verified by JusticeHub team';
COMMENT ON COLUMN organizations.empathy_ledger_org_id IS 'Link to organization in Empathy Ledger database';
COMMENT ON COLUMN organizations.is_indigenous_controlled IS 'Organization is Indigenous-controlled and led';
