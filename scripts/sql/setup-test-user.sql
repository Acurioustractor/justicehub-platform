-- Setup Test User for Profile Editing
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add user to users table (using the ID from above)
INSERT INTO users (id, email, role, is_active)
VALUES ('91908dc4-0c85-4a91-bd45-3091e5c77e85', 'test@justicehub.au', 'platform_admin', true)
ON CONFLICT (id) DO UPDATE SET role = 'platform_admin';

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
  u.role
FROM public_profiles p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.slug = 'benjamin-knight';
