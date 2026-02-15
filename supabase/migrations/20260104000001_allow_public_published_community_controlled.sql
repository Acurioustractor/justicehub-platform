-- Allow Public Viewing of Published Community Controlled Interventions
--
-- This migration updates the RLS policy to allow anonymous users to view
-- Community Controlled interventions that have been Published.
--
-- Rationale: Public showcase pages (like NT showcase) need to display
-- Aboriginal-led programs alongside government programs for comparison.
-- Publishing is an explicit approval step, so Published + Community Controlled
-- means the organization has approved public display.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view published public interventions" ON alma_interventions;

-- Create new policy that allows both Public Knowledge Commons AND Community Controlled (if Published)
CREATE POLICY "Public can view published interventions"
  ON alma_interventions
  FOR SELECT
  TO anon, authenticated
  USING (
    review_status = 'Published'
    AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );

-- NOTE: The existing "Authenticated users can view approved community interventions" policy
-- remains in place for Approved (but not yet Published) Community Controlled interventions.
-- This gives organizations a staging step: Approved = visible to logged-in users, Published = visible to all.
