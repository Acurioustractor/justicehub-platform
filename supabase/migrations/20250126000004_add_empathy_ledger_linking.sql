-- Add Empathy Ledger linking columns to JusticeHub tables
-- This allows bi-directional sync and consent-controlled content display

-- 1. Add columns to public_profiles for Empathy Ledger linking
ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS empathy_ledger_profile_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Add constraint for sync_type
ALTER TABLE public_profiles
ADD CONSTRAINT public_profiles_sync_type_check
CHECK (sync_type IN ('reference', 'full', 'manual'));

-- Create unique index for Empathy Ledger profile ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_profiles_empathy_ledger_id
ON public_profiles(empathy_ledger_profile_id)
WHERE empathy_ledger_profile_id IS NOT NULL;

-- Create index for sync queries
CREATE INDEX IF NOT EXISTS idx_public_profiles_synced_from_empathy
ON public_profiles(synced_from_empathy_ledger)
WHERE synced_from_empathy_ledger = true;

-- 2. Add columns to organizations for Empathy Ledger linking
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS empathy_ledger_org_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Create unique index for Empathy Ledger org ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_empathy_ledger_id
ON organizations(empathy_ledger_org_id)
WHERE empathy_ledger_org_id IS NOT NULL;

-- Create index for sync queries
CREATE INDEX IF NOT EXISTS idx_organizations_synced_from_empathy
ON organizations(synced_from_empathy_ledger)
WHERE synced_from_empathy_ledger = true;

-- 3. Add columns to community_programs for Empathy Ledger project linking
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS empathy_ledger_project_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Create unique index for Empathy Ledger project ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_programs_empathy_ledger_id
ON community_programs(empathy_ledger_project_id)
WHERE empathy_ledger_project_id IS NOT NULL;

-- 4. Create profile_sync_log table for auditing
CREATE TABLE IF NOT EXISTS profile_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  empathy_ledger_profile_id UUID,
  sync_action TEXT NOT NULL CHECK (sync_action IN ('created', 'updated', 'deleted', 'linked', 'unlinked')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'partial')),
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);

-- Create index for querying sync logs
CREATE INDEX IF NOT EXISTS idx_profile_sync_log_profile
ON profile_sync_log(public_profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_sync_log_empathy_ledger
ON profile_sync_log(empathy_ledger_profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_sync_log_date
ON profile_sync_log(synced_at DESC);

-- 5. Create organization_sync_log table for auditing
CREATE TABLE IF NOT EXISTS organization_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  empathy_ledger_org_id UUID,
  sync_action TEXT NOT NULL CHECK (sync_action IN ('created', 'updated', 'deleted', 'linked', 'unlinked')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'partial')),
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);

-- Create index for querying sync logs
CREATE INDEX IF NOT EXISTS idx_organization_sync_log_org
ON organization_sync_log(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_sync_log_empathy_ledger
ON organization_sync_log(empathy_ledger_org_id);

-- 6. Add helpful comments
COMMENT ON COLUMN public_profiles.empathy_ledger_profile_id IS 'Links to Empathy Ledger profiles table for consent-controlled content sync';
COMMENT ON COLUMN public_profiles.synced_from_empathy_ledger IS 'True if this profile is managed in Empathy Ledger and synced automatically';
COMMENT ON COLUMN public_profiles.sync_type IS 'reference: link only, full: cache data locally, manual: no auto-sync';
COMMENT ON COLUMN public_profiles.last_synced_at IS 'Timestamp of last successful sync from Empathy Ledger';

COMMENT ON COLUMN organizations.empathy_ledger_org_id IS 'Links to Empathy Ledger organizations table';
COMMENT ON COLUMN organizations.synced_from_empathy_ledger IS 'True if this organization is managed in Empathy Ledger';

COMMENT ON COLUMN community_programs.empathy_ledger_project_id IS 'Links to Empathy Ledger projects table';

COMMENT ON TABLE profile_sync_log IS 'Audit log for all profile sync operations with Empathy Ledger';
COMMENT ON TABLE organization_sync_log IS 'Audit log for all organization sync operations with Empathy Ledger';
