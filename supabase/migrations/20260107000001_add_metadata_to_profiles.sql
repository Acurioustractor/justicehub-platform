-- Add metadata column to public_profiles for storing steward info and other flexible data
-- Created: January 7, 2026

-- Add metadata JSONB column if it doesn't exist
ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_public_profiles_metadata ON public_profiles USING gin(metadata);

-- Comment for documentation
COMMENT ON COLUMN public_profiles.metadata IS 'Flexible JSON storage for steward info (steward_motivation, steward_experience, steward_commitments, joined_as_steward), GHL contact ID, and other extensible data';
