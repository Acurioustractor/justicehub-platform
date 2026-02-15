-- Grant admin access to test user
-- This sets is_super_admin = true for the test@justicehub.au user

UPDATE profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'test@justicehub.au'
);

-- Also check if the profile exists, if not create it
INSERT INTO profiles (id, is_super_admin)
SELECT id, true FROM auth.users WHERE email = 'test@justicehub.au'
ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
