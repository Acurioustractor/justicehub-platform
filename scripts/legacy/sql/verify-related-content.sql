-- DEPRECATED SCRIPT (legacy quarantine)
-- This file was moved out of active workflows due to deprecated schema assumptions and/or hardcoded credential patterns.
-- Do not use in production runtime paths.
-- =========================================
-- VERIFICATION SCRIPT - Check Related Content
-- Run this in Supabase SQL Editor to see what exists
-- =========================================

-- This script checks if the related entities referenced in
-- setup-aunty-corrine-story.sql already exist in the database

-- =========================================
-- CHECK 1: Aunty Corrine Profile
-- =========================================

SELECT
  'PROFILE CHECK' as check_type,
  COUNT(*) as count,
  STRING_AGG(name || ' (' || slug || ')', ', ') as found
FROM public_profiles
WHERE slug LIKE '%corrine%'
   OR name ILIKE '%corrine%';

-- =========================================
-- CHECK 2: Mount Isa Programs
-- =========================================

SELECT
  'PROGRAM CHECK' as check_type,
  COUNT(*) as count,
  STRING_AGG(name || ' (' || slug || ')', ', ') as found
FROM community_programs
WHERE slug LIKE '%mount%isa%'
   OR slug LIKE '%aunties%'
   OR name ILIKE '%mount%isa%'
   OR name ILIKE '%aunties%';

-- =========================================
-- CHECK 3: Related Articles
-- =========================================

SELECT
  'RELATED ARTICLES CHECK' as check_type,
  slug,
  title,
  category,
  is_published
FROM articles
WHERE slug IN (
  'nsw-youth-koori-court-evidence',
  'bourke-maranguka-justice-reinvestment',
  'queensland-youth-justice-crisis'
)
ORDER BY slug;

-- =========================================
-- CHECK 4: Required Tags
-- =========================================

SELECT
  'TAG CHECK' as check_type,
  slug,
  name,
  description
FROM tags
WHERE slug IN (
  'elder-knowledge',
  'community-led',
  'youth-justice',
  'mount-isa',
  'indigenous-leadership',
  'unpaid-labor',
  'systems-critique',
  'queensland'
)
ORDER BY slug;

-- =========================================
-- SUMMARY
-- =========================================

DO $$
DECLARE
  profile_count INTEGER;
  program_count INTEGER;
  article_count INTEGER;
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public_profiles WHERE slug LIKE '%corrine%';
  SELECT COUNT(*) INTO program_count FROM community_programs WHERE slug LIKE '%mount%isa%' OR slug LIKE '%aunties%';
  SELECT COUNT(*) INTO article_count FROM articles WHERE slug IN ('nsw-youth-koori-court-evidence', 'bourke-maranguka-justice-reinvestment', 'queensland-youth-justice-crisis');
  SELECT COUNT(*) INTO tag_count FROM tags WHERE slug IN ('elder-knowledge', 'community-led', 'youth-justice', 'mount-isa', 'indigenous-leadership', 'unpaid-labor', 'systems-critique', 'queensland');

  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         RELATED CONTENT VERIFICATION SUMMARY               ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Aunty Corrine profiles found: %', profile_count;
  RAISE NOTICE '✓ Mount Isa programs found: %', program_count;
  RAISE NOTICE '✓ Related articles found: % of 3', article_count;
  RAISE NOTICE '✓ Required tags found: % of 8', tag_count;
  RAISE NOTICE '';

  IF profile_count = 0 THEN
    RAISE NOTICE '⚠ MISSING: Aunty Corrine profile - Run setup-aunty-corrine-profile.sql';
  END IF;

  IF program_count = 0 THEN
    RAISE NOTICE '⚠ MISSING: Mount Isa Aunties program - Run setup-mount-isa-program.sql';
  END IF;

  IF article_count < 3 THEN
    RAISE NOTICE '⚠ PARTIAL: Only % of 3 related articles exist', article_count;
    RAISE NOTICE '  Missing articles will be skipped in story setup (no problem!)';
  END IF;

  IF tag_count < 8 THEN
    RAISE NOTICE '⚠ PARTIAL: Only % of 8 tags exist', tag_count;
    RAISE NOTICE '  setup-aunty-corrine-story.sql will create missing tags';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run setup-aunty-corrine-story.sql';
  RAISE NOTICE 'It will auto-link to any content that exists.';
END $$;
