-- ============================================================
-- PROFILE SELF-SERVICE: ROW LEVEL SECURITY POLICIES
-- ============================================================
-- This migration enables users to edit their own profiles
-- and admins to edit any profile.
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. PUBLIC PROFILES - RLS POLICIES
-- ============================================================

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "public_profiles_public_read" ON public_profiles;
DROP POLICY IF EXISTS "public_profiles_authenticated_read" ON public_profiles;
DROP POLICY IF EXISTS "public_profiles_service_manage" ON public_profiles;
DROP POLICY IF EXISTS "Users can read own and public profiles" ON public_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public_profiles;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON public_profiles;

-- Allow everyone to read public profiles
CREATE POLICY "Anyone can view public profiles"
ON public_profiles FOR SELECT
USING (is_public = true);

-- Allow users to read their own profile (even if private)
CREATE POLICY "Users can view own profile"
ON public_profiles FOR SELECT
USING (user_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to create profiles for themselves
CREATE POLICY "Users can create own profile"
ON public_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Service role (admin scripts) can do everything
CREATE POLICY "Service role full access"
ON public_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 2. STORAGE - IMAGE UPLOAD POLICIES
-- ============================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images or admins can update any" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images or admins can delete any" ON storage.objects;

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload images to specific folders
CREATE POLICY "Authenticated users upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow users to update images they uploaded
CREATE POLICY "Users update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid());

-- Allow users to delete images they uploaded
CREATE POLICY "Users delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid());

-- Service role can manage all images
CREATE POLICY "Service role manages all images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- ============================================================
-- 3. CREATE HELPER FUNCTION FOR ADMIN CHECK (Optional Enhancement)
-- ============================================================

-- Create a function to check if user is admin (for future use in policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'platform_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now we can add admin override policies using the function
CREATE POLICY "Admins can view all profiles"
ON public_profiles FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update any profile"
ON public_profiles FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete profiles"
ON public_profiles FOR DELETE
USING (is_admin());

-- Admins can manage all images
CREATE POLICY "Admins manage all images update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND is_admin());

CREATE POLICY "Admins manage all images delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND is_admin());

-- ============================================================
-- 4. VERIFICATION MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Profile Self-Service RLS Policies Created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies Created:';
  RAISE NOTICE '  - Anyone can view public profiles';
  RAISE NOTICE '  - Users can view their own profile';
  RAISE NOTICE '  - Users can update their own profile';
  RAISE NOTICE '  - Users can create their own profile';
  RAISE NOTICE '  - Admins can view/edit/delete any profile';
  RAISE NOTICE '  - Anyone can view images';
  RAISE NOTICE '  - Authenticated users can upload images';
  RAISE NOTICE '  - Users can manage their own images';
  RAISE NOTICE '  - Admins can manage all images';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Link user accounts to profiles:';
  RAISE NOTICE '     UPDATE public_profiles SET user_id = ''[auth-user-id]'' WHERE slug = ''person-slug'';';
  RAISE NOTICE '  2. Users can now edit profiles at: /people/[slug]/edit';
  RAISE NOTICE '  3. Photo upload works automatically!';
  RAISE NOTICE '';
END $$;
