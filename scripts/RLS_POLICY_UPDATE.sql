-- ================================================================
-- RLS POLICY UPDATE: Allow Public Viewing of Published Community Controlled
-- ================================================================
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run"
--
-- This will allow the NT showcase page to display Aboriginal-led programs
-- (Oochiumpa, NAAJA, AMSANT) to anonymous users.
--
-- ================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Public can view published public interventions" ON alma_interventions;

-- Create new policy that allows BOTH Public Knowledge Commons AND Community Controlled (if Published)
CREATE POLICY "Public can view published interventions"
  ON alma_interventions
  FOR SELECT
  TO anon, authenticated
  USING (
    review_status = 'Published'
    AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );

-- Verify the policy was created
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'alma_interventions'
  AND policyname = 'Public can view published interventions';
