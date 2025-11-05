-- Fix articles RLS policy to allow users to claim and update articles with NULL author_id
-- This handles legacy articles that were created without an author

-- Drop the old update policy
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;

-- Create new policy that allows:
-- 1. Users to update their own articles (where author_id matches)
-- 2. Users to claim and update articles with NULL author_id
CREATE POLICY "Users can update their own articles or claim orphaned articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    author_id IS NULL OR
    author_id IN (
      SELECT id FROM public_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- After update, author_id must be either NULL or belong to the user
    author_id IS NULL OR
    author_id IN (
      SELECT id FROM public_profiles WHERE user_id = auth.uid()
    )
  );
