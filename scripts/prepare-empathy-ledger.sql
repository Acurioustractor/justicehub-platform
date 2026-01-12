-- Empathy Ledger V2 Database Preparation for JusticeHub Integration
-- Run this in Empathy Ledger Supabase → SQL Editor

-- Step 1: Add JusticeHub integration columns
ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_role TEXT;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_synced_at TIMESTAMPTZ;

-- Step 2: Create index for faster JusticeHub queries
CREATE INDEX IF NOT EXISTS idx_public_profiles_justicehub_enabled
ON public_profiles(justicehub_enabled)
WHERE justicehub_enabled = TRUE;

-- Step 3: Example - Mark profiles for JusticeHub sync
-- IMPORTANT: Replace these UUIDs with actual profile IDs from your database

-- Example 1: Mark all profiles with a specific role
-- UPDATE public_profiles
-- SET
--   justicehub_enabled = TRUE,
--   justicehub_role = 'founder'
-- WHERE role IN ('founder', 'co-founder');

-- Example 2: Mark specific profiles by ID
-- UPDATE public_profiles
-- SET
--   justicehub_enabled = TRUE,
--   justicehub_role = 'founder'
-- WHERE id IN (
--   'uuid-1',
--   'uuid-2',
--   'uuid-3'
-- );

-- Example 3: Mark featured profiles
-- UPDATE public_profiles
-- SET
--   justicehub_enabled = TRUE,
--   justicehub_featured = TRUE,
--   justicehub_role = 'researcher'
-- WHERE verified = TRUE
--   AND profile_type = 'researcher';

-- Step 4: Verify setup
SELECT
  id,
  display_name,
  role,
  justicehub_enabled,
  justicehub_role,
  justicehub_featured,
  justicehub_synced_at
FROM public_profiles
WHERE justicehub_enabled = TRUE
ORDER BY display_name;

-- Expected result: Profiles marked for JusticeHub sync
-- If no rows returned, uncomment and run one of the UPDATE examples above
