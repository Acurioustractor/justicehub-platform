-- Add slug column to synced_stories for direct EL article slug matching
ALTER TABLE synced_stories ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE INDEX IF NOT EXISTS idx_synced_stories_slug ON synced_stories(slug) WHERE slug IS NOT NULL;
