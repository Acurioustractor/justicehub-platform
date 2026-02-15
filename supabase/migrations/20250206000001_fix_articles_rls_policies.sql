-- Fix RLS policies for articles table to allow authenticated users to create/edit
-- Currently only has SELECT policy, need INSERT/UPDATE/DELETE policies

-- Allow authenticated users to insert articles
CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own articles
CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (author_id IN (
    SELECT id FROM public_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (author_id IN (
    SELECT id FROM public_profiles WHERE user_id = auth.uid()
  ));

-- Allow users to delete their own articles
CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  TO authenticated
  USING (author_id IN (
    SELECT id FROM public_profiles WHERE user_id = auth.uid()
  ));

-- Allow users to view their own drafts (in addition to public published articles)
CREATE POLICY "Users can view their own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (
    status = 'published' OR
    author_id IN (SELECT id FROM public_profiles WHERE user_id = auth.uid())
  );
