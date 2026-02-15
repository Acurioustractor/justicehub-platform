-- Add is_super_admin column to profiles table
-- This column is used to identify super administrators with full access

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Add index for efficient admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin
ON profiles(is_super_admin)
WHERE is_super_admin = true;

-- Grant admin to test user if they exist
UPDATE profiles
SET is_super_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'test@justicehub.au'
);

-- If test user profile doesn't exist, create it
INSERT INTO profiles (id, is_super_admin, email)
SELECT id, true, email
FROM auth.users
WHERE email = 'test@justicehub.au'
ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
