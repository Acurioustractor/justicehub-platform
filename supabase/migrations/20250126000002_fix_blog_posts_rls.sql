-- Fix RLS policies for blog_posts to properly handle author_id as profile ID
-- The author_id in blog_posts references public_profiles(id), not auth.users(id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON blog_posts;

-- Recreate policies with correct logic
-- Users can view their own blog posts (matching via profile's user_id)
CREATE POLICY "Users can view their own blog posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public_profiles
      WHERE public_profiles.id = blog_posts.author_id
      AND public_profiles.user_id = auth.uid()
    )
    OR auth.uid() = ANY(
      SELECT user_id FROM public_profiles WHERE id = ANY(co_authors)
    )
  );

-- Authenticated users can create blog posts (author_id must match their profile)
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public_profiles
      WHERE public_profiles.id = author_id
      AND public_profiles.user_id = auth.uid()
    )
  );

-- Users can update their own blog posts (matching via profile's user_id)
CREATE POLICY "Users can update their own blog posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public_profiles
      WHERE public_profiles.id = blog_posts.author_id
      AND public_profiles.user_id = auth.uid()
    )
    OR auth.uid() = ANY(
      SELECT user_id FROM public_profiles WHERE id = ANY(co_authors)
    )
  );
