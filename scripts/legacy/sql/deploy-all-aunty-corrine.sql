-- DEPRECATED SCRIPT (legacy quarantine)
-- This file was moved out of active workflows due to deprecated schema assumptions and/or hardcoded credential patterns.
-- Do not use in production runtime paths.
-- =========================================
-- MASTER DEPLOYMENT SCRIPT
-- Aunty Corrine Complete Content Package
-- =========================================

-- Run this single file to deploy everything:
-- 1. Aunty Corrine profile
-- 2. Mount Isa Aunties Network program
-- 3. Main story article
-- 4. All tags and relationships

-- IMPORTANT: Review each section before running
-- Some steps are marked OPTIONAL and can be skipped

-- =========================================
-- SECTION 1: CREATE TAGS (FOUNDATION)
-- =========================================

-- Create all tags first (needed by everything else)
INSERT INTO tags (name, slug, description) VALUES
  ('Elder-knowledge', 'elder-knowledge', 'Stories and insights from Aboriginal and Torres Strait Islander Elders'),
  ('Community-led', 'community-led', 'Community-controlled initiatives and programs'),
  ('Youth-justice', 'youth-justice', 'Youth justice system, detention, diversion, and alternatives'),
  ('Mount-Isa', 'mount-isa', 'Stories and programs from Mount Isa, North West Queensland'),
  ('Indigenous-leadership', 'indigenous-leadership', 'Aboriginal and Torres Strait Islander leadership and governance'),
  ('Unpaid-labor', 'unpaid-labor', 'Community expertise and labor that is undervalued and uncompensated'),
  ('Systems-critique', 'systems-critique', 'Critical analysis of government systems and service delivery'),
  ('Queensland', 'queensland', 'Queensland-based stories, programs, and research')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

RAISE NOTICE '✓ Tags created/updated';

-- =========================================
-- SECTION 2: CREATE AUNTY CORRINE PROFILE
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

RAISE NOTICE '✓ Profile created/updated';

-- Link profile to tags
INSERT INTO profile_tags (profile_id, tag_id)
SELECT p.id, t.id
FROM public_profiles p
CROSS JOIN tags t
WHERE p.slug = 'aunty-corrine'
  AND t.slug IN ('elder-knowledge', 'community-led', 'youth-justice', 'mount-isa', 'indigenous-leadership')
ON CONFLICT (profile_id, tag_id) DO NOTHING;

RAISE NOTICE '✓ Profile tags linked';

-- =========================================
-- SECTION 3: CREATE MOUNT ISA AUNTIES PROGRAM
-- =========================================

INSERT INTO community_programs (
  id,
  slug,
  name,
  tagline,
  description,
  location,
  region,
  status,
  funding_model,
  year_established,
  contact_info,
  featured_image,
  featured_image_alt,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'mount-isa-aunties-network',
  'Mount Isa Aunties Network',
  'Unpaid, 24/7 youth justice support that keeps the community safe',
  'The Mount Isa Aunties Network isn''t a formal program—it''s what happens when government services fail and Aunties step in. For over 20 years, Aunty Corrine and other Aunties have provided 24/7 support to young people caught in the justice system, unpaid and unrecognized.

## What They Do

- Answer calls at 2am when young people are in crisis
- Sit with youth in Cleveland Detention Centre for hours
- Navigate systems that don''t talk to each other
- Provide stable housing when families are struggling
- Keep young people connected to culture and community
- Fight for resources while doing the work services are funded to do

## The Reality

While services with millions in funding compete over "tick-and-flick" approaches, Aunties are doing the actual work of keeping young people out of detention. They know every young person''s story, every family''s struggle, every system failure—because they live it.

## What''s Needed

Not another service extracting data and delivering nothing. What''s needed is:

- **Voices, not just funding** - Decision-making power for Aunties
- **Infrastructure, not services** - A building Aunties control
- **Compensation for expertise** - Fair payment for 20 years of work
- **Sustainability** - Systems that don''t depend on unpaid labor forever',
  'Mount Isa, Queensland',
  'North West Queensland',
  'active',
  'unfunded',
  2004,
  jsonb_build_object(
    'note', 'This is informal community work, not a formal organization',
    'contact_via', 'JusticeHub can facilitate connections'
  ),
  '/images/programs/mount-isa-aunties/network.jpg',
  'Aunties gathering in Mount Isa to support young people',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Add outcomes data
UPDATE community_programs
SET outcomes = jsonb_build_object(
  'young_people_supported', 25,
  'years_active', 20,
  'funding_received', 0,
  'key_outcomes', jsonb_build_array(
    'Most young people now independent and stable',
    'Strong family and community connections maintained',
    'Youth diverted from long-term detention',
    'Crisis intervention available 24/7',
    'Navigation support through complex systems'
  )
)
WHERE slug = 'mount-isa-aunties-network';

RAISE NOTICE '✓ Program created/updated';

-- Link program to tags
INSERT INTO program_tags (program_id, tag_id)
SELECT cp.id, t.id
FROM community_programs cp
CROSS JOIN tags t
WHERE cp.slug = 'mount-isa-aunties-network'
  AND t.slug IN ('community-led', 'youth-justice', 'mount-isa', 'elder-knowledge', 'indigenous-leadership', 'unpaid-labor', 'queensland')
ON CONFLICT (program_id, tag_id) DO NOTHING;

-- Link Aunty Corrine to program
INSERT INTO program_people (program_id, person_id, role)
SELECT cp.id, p.id, 'Founding Member & Core Supporter'
FROM community_programs cp
CROSS JOIN public_profiles p
WHERE cp.slug = 'mount-isa-aunties-network'
  AND p.slug = 'aunty-corrine'
ON CONFLICT (program_id, person_id) DO UPDATE SET role = EXCLUDED.role;

RAISE NOTICE '✓ Program relationships linked';

-- =========================================
-- SECTION 4: CREATE MAIN STORY ARTICLE
-- =========================================

INSERT INTO articles (
  id,
  title,
  slug,
  excerpt,
  category,
  author,
  author_role,
  published_date,
  featured_image,
  featured_image_alt,
  location,
  reading_time,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '"I Need Voices Behind Me": Aunty Corrine''s 20 Years of Unpaid Justice Work',
  'aunty-corrine-mount-isa-unpaid-expertise',
  'In Mount Isa, while services with millions compete over "tick-and-flick funding," Aunty Corrine has supported 25 young people through the justice system—unpaid, 24/7, for two decades. This is what community-led actually looks like.',
  'roots',
  'JusticeHub Team',
  'Community Documentation',
  '2025-01-15',
  '/images/articles/aunty-corrine/featured-portrait.jpg',
  'Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years',
  'Mount Isa, Queensland',
  14,
  false, -- Set to TRUE when ready to publish
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  updated_at = NOW();

RAISE NOTICE '✓ Article created/updated';

-- Link article to tags
INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM articles a
CROSS JOIN tags t
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND t.slug IN ('elder-knowledge', 'community-led', 'youth-justice', 'mount-isa', 'indigenous-leadership', 'unpaid-labor', 'systems-critique', 'queensland')
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- Link article to Aunty Corrine profile
INSERT INTO article_people (article_id, person_id)
SELECT a.id, p.id
FROM articles a
CROSS JOIN public_profiles p
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND p.slug = 'aunty-corrine'
ON CONFLICT (article_id, person_id) DO NOTHING;

-- Link article to Mount Isa program
INSERT INTO article_programs (article_id, program_id)
SELECT a.id, cp.id
FROM articles a
CROSS JOIN community_programs cp
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND cp.slug = 'mount-isa-aunties-network'
ON CONFLICT (article_id, program_id) DO NOTHING;

RAISE NOTICE '✓ Article relationships linked';

-- =========================================
-- SECTION 5: LINK TO RELATED ARTICLES (OPTIONAL)
-- Only runs if these articles exist
-- =========================================

-- Link to NSW Youth Koori Court
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT a1.id, a2.id, 'evidence'
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'nsw-youth-koori-court-evidence'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Link to Bourke Maranguka
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT a1.id, a2.id, 'context'
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'bourke-maranguka-justice-reinvestment'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Link to QLD Youth Justice Crisis
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT a1.id, a2.id, 'context'
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'queensland-youth-justice-crisis'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

RAISE NOTICE '✓ Related articles linked (if they exist)';

-- =========================================
-- FINAL VERIFICATION
-- =========================================

DO $$
DECLARE
  article_count INTEGER;
  profile_count INTEGER;
  program_count INTEGER;
  tag_count INTEGER;
  article_tag_count INTEGER;
  article_people_count INTEGER;
  article_program_count INTEGER;
BEGIN
  -- Count what was created
  SELECT COUNT(*) INTO article_count FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
  SELECT COUNT(*) INTO profile_count FROM public_profiles WHERE slug = 'aunty-corrine';
  SELECT COUNT(*) INTO program_count FROM community_programs WHERE slug = 'mount-isa-aunties-network';
  SELECT COUNT(*) INTO tag_count FROM tags WHERE slug IN ('elder-knowledge', 'community-led', 'youth-justice', 'mount-isa', 'indigenous-leadership', 'unpaid-labor', 'systems-critique', 'queensland');

  -- Count relationships
  SELECT COUNT(*) INTO article_tag_count FROM article_tags WHERE article_id IN (SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise');
  SELECT COUNT(*) INTO article_people_count FROM article_people WHERE article_id IN (SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise');
  SELECT COUNT(*) INTO article_program_count FROM article_programs WHERE article_id IN (SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise');

  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         DEPLOYMENT COMPLETE - VERIFICATION REPORT          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📄 Content Created:';
  RAISE NOTICE '   Articles: % (expected: 1)', article_count;
  RAISE NOTICE '   Profiles: % (expected: 1)', profile_count;
  RAISE NOTICE '   Programs: % (expected: 1)', program_count;
  RAISE NOTICE '   Tags: % (expected: 8)', tag_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Relationships Created:';
  RAISE NOTICE '   Article ↔ Tags: % (expected: 8)', article_tag_count;
  RAISE NOTICE '   Article ↔ People: % (expected: 1)', article_people_count;
  RAISE NOTICE '   Article ↔ Programs: % (expected: 1)', article_program_count;
  RAISE NOTICE '';
  RAISE NOTICE '🌐 URLs Created:';
  RAISE NOTICE '   Story: /stories/aunty-corrine-mount-isa-unpaid-expertise';
  RAISE NOTICE '   Profile: /people/aunty-corrine';
  RAISE NOTICE '   Program: /programs/mount-isa-aunties-network';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Upload images to /public/images/ directories';
  RAISE NOTICE '   2. Verify markdown file exists at:';
  RAISE NOTICE '      /data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md';
  RAISE NOTICE '   3. Test on staging';
  RAISE NOTICE '   4. Get Aunty Corrine''s consent';
  RAISE NOTICE '   5. Set is_published = true when ready';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database setup complete!';
END $$;
