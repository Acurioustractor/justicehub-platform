-- Migration: Unify Story Authors with public_profiles
-- Goal: Stories reference public_profiles like articles do
-- This enables consistent author attribution across all content types

-- Add new column for public_profile_id reference
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS public_profile_id UUID REFERENCES public_profiles(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stories_public_profile_id ON stories(public_profile_id);

-- Migrate existing data: link stories to public_profiles via user_id bridge
-- This finds public_profiles where user_id matches the story's author_id
-- Only migrate rows where author_id is a valid UUID format
UPDATE stories s
SET public_profile_id = pp.id
FROM public_profiles pp
WHERE s.author_id IS NOT NULL
  AND s.author_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND s.author_id::uuid = pp.user_id
  AND s.public_profile_id IS NULL;

-- Add comment to mark old column as deprecated
COMMENT ON COLUMN stories.author_id IS 'DEPRECATED: Use public_profile_id instead. This column references auth.users but public_profile_id references public_profiles for consistent author attribution.';

-- Add comment explaining the new column
COMMENT ON COLUMN stories.public_profile_id IS 'Links to public_profiles for author attribution. This is the preferred column for author references, replacing the deprecated author_id.';

-- Log migration summary
DO $$
DECLARE
  total_stories INTEGER;
  migrated_stories INTEGER;
  unmigrated_stories INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_stories FROM stories;
  SELECT COUNT(*) INTO migrated_stories FROM stories WHERE public_profile_id IS NOT NULL;
  SELECT COUNT(*) INTO unmigrated_stories FROM stories WHERE public_profile_id IS NULL AND author_id IS NOT NULL;

  RAISE NOTICE 'Story Author Migration Summary:';
  RAISE NOTICE '  Total stories: %', total_stories;
  RAISE NOTICE '  Migrated to public_profile_id: %', migrated_stories;
  RAISE NOTICE '  Could not migrate (no matching public_profile): %', unmigrated_stories;
END $$;
