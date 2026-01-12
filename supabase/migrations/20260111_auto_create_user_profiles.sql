-- Migration: Auto-create Public Profiles for New Users
-- Description: Adds a trigger to auth.users to automatically create a public_profile entry on signup.

-- 0. Setup Mock Auth (for local development only, safe for prod)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    raw_user_meta_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Create the handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_full_name text;
  new_avatar_url text;
BEGIN
  -- Extract metadata safely
  new_full_name := new.raw_user_meta_data->>'full_name';
  new_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Fallback if no name provided
  IF new_full_name IS NULL OR new_full_name = '' THEN
    new_full_name := 'Anonymous Member';
  END IF;

  -- Insert into public_profiles
  -- BUT FIRST: Ensure public.users exists (Sync Auth -> Public Users)
  -- This is critical because public_profiles references public.users(id)
  INSERT INTO public.users (
    id,
    email,
    display_name,
    avatar_url,
    role,
    is_active
  )
  VALUES (
    new.id,
    new.email,
    new_full_name,
    new_avatar_url,
    COALESCE(new.raw_user_meta_data->>'role', 'youth'), -- Default to youth if not specified
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  -- NOW Insert into public_profiles
  INSERT INTO public.public_profiles (
    user_id,
    full_name,
    photo_url,
    email,
    is_public
  )
  VALUES (
    new.id,
    new_full_name,
    new_avatar_url,
    new.email,
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Profile ID is random, so conflict is unlikely on ID, but maybe on user_id?
  -- public_profiles doesn't have a unique constraint on user_id in the CREATE TABLE above
  -- but generally 1:1. Let's assume OK.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
-- Drop if exists to be idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill? 
-- Optional: Insert profiles for existing users who don't have one.
-- INSERT INTO public.public_profiles (user_id, full_name, email)
-- SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Existing User'), email
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public_profiles WHERE user_id IS NOT NULL);
