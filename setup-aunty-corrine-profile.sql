-- =========================================
-- AUNTY CORRINE PROFILE SETUP
-- Run this to create Aunty Corrine's profile page
-- =========================================

-- This creates a profile that will be auto-linked to the story
-- when you run setup-aunty-corrine-story.sql

-- =========================================
-- CREATE PROFILE
-- =========================================

INSERT INTO public_profiles (
  id,
  slug,
  name,
  role,
  location,
  bio,
  expertise_areas,
  profile_image,
  profile_image_alt,
  contact_email,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aunty-corrine',
  'Aunty Corrine',
  'Community Elder & Youth Justice Advocate',
  'Mount Isa, Queensland',
  'Aunty Corrine has supported 25 young people through the justice system over 20 years in Mount Isa—unpaid, 24/7, using knowledge that no qualification can teach. When government services with millions in funding talk about "tick-and-flick," she''s the one sitting in Cleveland Youth Detention at 2am, the one young people call when the system has given up on them.

Her expertise comes from lived experience: raising children in a remote mining town where services don''t talk to each other, where young people get labeled "bad" instead of supported, where Aunties do the work that keeps communities safe while fighting for recognition and resources.

"I need voices behind me," she says. Not just funding—voices. Decision-making power. The ability to build something sustainable that doesn''t depend on her answering calls at midnight forever.',
  ARRAY[
    'Youth justice support',
    'Community-led intervention',
    'Elder knowledge systems',
    'Family support and advocacy',
    'Systems navigation',
    'Cultural connection and healing'
  ],
  '/images/profiles/aunty-corrine/profile.jpg',
  'Aunty Corrine sitting in her living room in Mount Isa, Queensland',
  NULL, -- Protect privacy unless she wants to share
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  expertise_areas = EXCLUDED.expertise_areas,
  updated_at = NOW();

-- Verify profile was created
SELECT
  id,
  name,
  slug,
  role,
  location,
  is_public
FROM public_profiles
WHERE slug = 'aunty-corrine';

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ PROFILE CREATED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Aunty Corrine profile: /people/aunty-corrine';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Upload profile image to: /public/images/profiles/aunty-corrine/profile.jpg';
  RAISE NOTICE '2. Run setup-aunty-corrine-story.sql to create the story';
  RAISE NOTICE '3. Story will auto-link to this profile';
  RAISE NOTICE '';
  RAISE NOTICE 'Profile will show:';
  RAISE NOTICE '- All articles featuring Aunty Corrine';
  RAISE NOTICE '- All programs she''s connected to';
  RAISE NOTICE '- Her expertise areas and bio';
END $$;

-- =========================================
-- OPTIONAL: Add profile tags
-- =========================================

-- Link profile to relevant tags
INSERT INTO profile_tags (profile_id, tag_id)
SELECT
  p.id,
  t.id
FROM public_profiles p
CROSS JOIN tags t
WHERE p.slug = 'aunty-corrine'
  AND t.slug IN (
    'elder-knowledge',
    'community-led',
    'youth-justice',
    'mount-isa',
    'indigenous-leadership'
  )
ON CONFLICT (profile_id, tag_id) DO NOTHING;

-- Verify tags were linked
SELECT
  p.name as profile_name,
  t.name as tag_name
FROM public_profiles p
LEFT JOIN profile_tags pt ON p.id = pt.profile_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.slug = 'aunty-corrine'
ORDER BY t.name;
