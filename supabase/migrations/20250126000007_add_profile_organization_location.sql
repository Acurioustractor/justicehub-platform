-- Add organization and location fields to public_profiles
-- These fields are synced from Empathy Ledger to enable auto-linking

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS current_organization TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add indexes for auto-linking queries
CREATE INDEX IF NOT EXISTS idx_profiles_current_organization
ON public_profiles(current_organization)
WHERE current_organization IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location
ON public_profiles(location)
WHERE location IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public_profiles.current_organization IS 'Current organization the person is affiliated with (synced from Empathy Ledger)';
COMMENT ON COLUMN public_profiles.location IS 'Geographic location (synced from Empathy Ledger for auto-linking to local programs)';
