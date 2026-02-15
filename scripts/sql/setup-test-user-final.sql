-- Setup Test User for Profile Editing (FINAL VERSION)
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add user to users table (including password_hash)
INSERT INTO users (id, email, username, name, user_role, password_hash, is_active)
VALUES (
  '91908dc4-0c85-4a91-bd45-3091e5c77e85',
  'test@justicehub.au',
  'testuser',
  'Test User',
  'admin',
  '$2a$10$dummy.hash.for.supabase.auth.user',  -- Dummy hash since auth is handled by Supabase Auth
  true
)
ON CONFLICT (id) DO UPDATE SET
  user_role = 'admin',
  is_active = true,
  password_hash = '$2a$10$dummy.hash.for.supabase.auth.user';

-- 2. Link user to Benjamin's profile
UPDATE public_profiles
SET user_id = '91908dc4-0c85-4a91-bd45-3091e5c77e85'
WHERE slug = 'benjamin-knight';

-- 3. Verify the link
SELECT
  p.full_name,
  p.slug,
  p.user_id,
  u.email,
  u.name,
  u.user_role
FROM public_profiles p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.slug = 'benjamin-knight';
