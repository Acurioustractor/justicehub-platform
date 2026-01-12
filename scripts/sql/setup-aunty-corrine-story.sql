-- =========================================
-- AUNTY CORRINE STORY - COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =========================================

-- This script will:
-- 1. Create the article record
-- 2. Add all tags
-- 3. Link article to tags
-- 4. Link to related people (if they exist)
-- 5. Link to related programs (if they exist)
-- 6. Link to related articles (if they exist)

-- =========================================
-- STEP 1: CREATE ARTICLE
-- =========================================

-- Insert main article record
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
  is_published, -- Set to FALSE for testing, TRUE when ready to publish
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '"I Need Voices Behind Me": Aunty Corrine''s 20 Years of Unpaid Justice Work',
  'aunty-corrine-mount-isa-unpaid-expertise',
  'In Mount Isa, while services with millions compete over "tick-and-flick funding," Aunty Corrine has supported 25 young people through the justice system—unpaid, 24/7, for two decades. This is what community-led actually looks like.',
  'roots', -- Elder knowledge category
  'JusticeHub Team',
  'Community Documentation',
  '2025-01-15',
  '/images/articles/aunty-corrine/featured-portrait.jpg',
  'Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years',
  'Mount Isa, Queensland',
  14, -- reading time in minutes
  false, -- Change to TRUE when ready to publish
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  updated_at = NOW();

-- Verify article was created
SELECT id, title, slug, is_published
FROM articles
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- STEP 2: CREATE TAGS (if they don't exist)
-- =========================================

-- Create all tags (safe to run multiple times)
INSERT INTO tags (name, slug, description) VALUES
  (
    'Elder-knowledge',
    'elder-knowledge',
    'Stories and insights from Aboriginal and Torres Strait Islander Elders'
  ),
  (
    'Community-led',
    'community-led',
    'Community-controlled initiatives and programs'
  ),
  (
    'Youth-justice',
    'youth-justice',
    'Youth justice system, detention, diversion, and alternatives'
  ),
  (
    'Mount-Isa',
    'mount-isa',
    'Stories and programs from Mount Isa, North West Queensland'
  ),
  (
    'Indigenous-leadership',
    'indigenous-leadership',
    'Aboriginal and Torres Strait Islander leadership and governance'
  ),
  (
    'Unpaid-labor',
    'unpaid-labor',
    'Community expertise and labor that is undervalued and uncompensated'
  ),
  (
    'Systems-critique',
    'systems-critique',
    'Critical analysis of government systems and service delivery'
  ),
  (
    'Queensland',
    'queensland',
    'Queensland-based stories, programs, and research'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Verify tags were created
SELECT id, name, slug FROM tags WHERE slug IN (
  'elder-knowledge',
  'community-led',
  'youth-justice',
  'mount-isa',
  'indigenous-leadership',
  'unpaid-labor',
  'systems-critique',
  'queensland'
);

-- =========================================
-- STEP 3: LINK ARTICLE TO TAGS
-- =========================================

-- Link all tags to the article
INSERT INTO article_tags (article_id, tag_id)
SELECT
  a.id,
  t.id
FROM articles a
CROSS JOIN tags t
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND t.slug IN (
    'elder-knowledge',
    'community-led',
    'youth-justice',
    'mount-isa',
    'indigenous-leadership',
    'unpaid-labor',
    'systems-critique',
    'queensland'
  )
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- Verify article-tag relationships
SELECT
  a.title,
  t.name as tag_name,
  t.slug as tag_slug
FROM articles a
JOIN article_tags at ON a.id = at.article_id
JOIN tags t ON at.tag_id = t.id
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
ORDER BY t.name;

-- =========================================
-- STEP 4: LINK TO RELATED PEOPLE
-- (Only runs if these profiles exist)
-- =========================================

-- Link to Aunty Corrine's profile
INSERT INTO article_people (article_id, person_id)
SELECT
  a.id,
  p.id
FROM articles a
CROSS JOIN public_profiles p
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND p.slug = 'aunty-corrine'
ON CONFLICT (article_id, person_id) DO NOTHING;

-- Verify person relationships
SELECT
  a.title as article_title,
  p.name as person_name,
  p.slug as person_slug
FROM articles a
LEFT JOIN article_people ap ON a.id = ap.article_id
LEFT JOIN public_profiles p ON ap.person_id = p.id
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- STEP 5: LINK TO RELATED PROGRAMS
-- (Only runs if these programs exist)
-- =========================================

-- Link to Mount Isa Aunties Network program
INSERT INTO article_programs (article_id, program_id)
SELECT
  a.id,
  p.id
FROM articles a
CROSS JOIN community_programs p
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND p.slug = 'mount-isa-aunties-network'
ON CONFLICT (article_id, program_id) DO NOTHING;

-- Verify program relationships
SELECT
  a.title as article_title,
  cp.name as program_name,
  cp.slug as program_slug
FROM articles a
LEFT JOIN article_programs ap ON a.id = ap.article_id
LEFT JOIN community_programs cp ON ap.program_id = cp.id
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- STEP 6: LINK TO RELATED ARTICLES
-- (Only runs if these articles exist)
-- =========================================

-- Link to NSW Youth Koori Court article
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT
  a1.id,
  a2.id,
  'evidence' -- Shows how Youth Koori Court proves Elder-led approaches work
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'nsw-youth-koori-court-evidence'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Link to Bourke Maranguka Justice Reinvestment article
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT
  a1.id,
  a2.id,
  'context' -- Provides context on successful community-led models
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'bourke-maranguka-justice-reinvestment'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Link to Queensland Youth Justice Crisis article
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT
  a1.id,
  a2.id,
  'context' -- Provides broader Queensland context
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'queensland-youth-justice-crisis'
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Verify article relationships
SELECT
  a1.title as main_article,
  a2.title as related_article,
  ar.relation_type
FROM articles a1
LEFT JOIN article_relations ar ON a1.id = ar.article_id
LEFT JOIN articles a2 ON ar.related_article_id = a2.id
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- STEP 7: FINAL VERIFICATION
-- =========================================

-- Show complete article with all relationships
SELECT
  a.id,
  a.title,
  a.slug,
  a.category,
  a.is_published,
  a.featured_image,
  a.reading_time,
  a.location,
  (SELECT COUNT(*) FROM article_tags WHERE article_id = a.id) as tag_count,
  (SELECT COUNT(*) FROM article_people WHERE article_id = a.id) as people_count,
  (SELECT COUNT(*) FROM article_programs WHERE article_id = a.id) as program_count,
  (SELECT COUNT(*) FROM article_relations WHERE article_id = a.id) as related_article_count
FROM articles a
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- OPTIONAL: PUBLISH ARTICLE
-- (Uncomment when ready to make public)
-- =========================================

-- UPDATE articles
-- SET is_published = true, updated_at = NOW()
-- WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE 'Article created: "I Need Voices Behind Me": Aunty Corrine''s 20 Years of Unpaid Justice Work';
  RAISE NOTICE 'URL: /stories/aunty-corrine-mount-isa-unpaid-expertise';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Upload featured image to: /public/images/articles/aunty-corrine/featured-portrait.jpg';
  RAISE NOTICE '2. Verify markdown file exists at: /data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md';
  RAISE NOTICE '3. Test on staging: https://staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise';
  RAISE NOTICE '4. When ready, set is_published = true (currently: false)';
  RAISE NOTICE '';
  RAISE NOTICE 'Run final verification query above to check all relationships.';
END $$;

-- =========================================
-- ROLLBACK (if needed)
-- Uncomment to undo everything
-- =========================================

-- DELETE FROM article_relations WHERE article_id IN (
--   SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
-- );

-- DELETE FROM article_programs WHERE article_id IN (
--   SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
-- );

-- DELETE FROM article_people WHERE article_id IN (
--   SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
-- );

-- DELETE FROM article_tags WHERE article_id IN (
--   SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
-- );

-- DELETE FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- =========================================
-- END OF SETUP SCRIPT
-- =========================================
