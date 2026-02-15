-- Add reading time column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.reading_time_minutes IS 'Estimated reading time in minutes (calculated as word_count / 200)';
