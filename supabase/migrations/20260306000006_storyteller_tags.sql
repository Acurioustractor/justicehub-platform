-- Add tags column to storytellers for platform-level tagging
-- e.g. 'justicehub' = visible on platform, 'contained' = visible on Contained tour page
ALTER TABLE storytellers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_storytellers_tags ON storytellers USING GIN (tags);
