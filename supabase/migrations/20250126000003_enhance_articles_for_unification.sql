-- Enhance articles table with features from blog_posts for unified content system
-- This migration adds missing columns to prepare for merging blog_posts into articles

-- Add missing columns from blog_posts
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS co_authors UUID[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN articles.featured_image_caption IS 'Caption for the featured image';
COMMENT ON COLUMN articles.co_authors IS 'Array of profile IDs for co-authors (references public_profiles.id)';
COMMENT ON COLUMN articles.tags IS 'Content tags for categorization and filtering';
COMMENT ON COLUMN articles.categories IS 'Content categories (array) - first element becomes primary category';
COMMENT ON COLUMN articles.share_count IS 'Number of times content has been shared on social media';

-- Note: We keep existing columns that have equivalents:
-- - articles.seo_title / articles.seo_description (equivalent to blog_posts.meta_title / meta_description)
-- - articles.category (will be set to categories[0] as primary category)
-- - articles.is_trending, location_tags, metadata (unique to articles, keep as is)
