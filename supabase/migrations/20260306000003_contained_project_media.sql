-- Add project_id to partner_videos and partner_photos
-- This links media to art_innovation projects

ALTER TABLE partner_videos
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES art_innovation(id) ON DELETE SET NULL;

ALTER TABLE partner_photos
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES art_innovation(id) ON DELETE SET NULL;

-- Create synced_stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS synced_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empathy_ledger_id UUID UNIQUE,
  title TEXT,
  summary TEXT,
  content TEXT,
  story_image_url TEXT,
  story_type TEXT,
  story_category TEXT,
  themes TEXT[],
  is_featured BOOLEAN DEFAULT false,
  cultural_sensitivity_level TEXT,
  source TEXT DEFAULT 'empathy_ledger',
  source_published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  project_slugs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sync_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT UNIQUE NOT NULL,
  last_synced_at TIMESTAMPTZ,
  last_sync_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GIN index for fast @> array containment queries
CREATE INDEX IF NOT EXISTS idx_synced_stories_project_slugs
  ON synced_stories USING GIN (project_slugs);

CREATE INDEX IF NOT EXISTS idx_synced_stories_source
  ON synced_stories (source);

-- Indexes for project_id lookups
CREATE INDEX IF NOT EXISTS idx_partner_videos_project_id
  ON partner_videos (project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_photos_project_id
  ON partner_photos (project_id) WHERE project_id IS NOT NULL;

-- Seed "The Contained" project into art_innovation
-- Note: art_innovation uses "title" not "name"
INSERT INTO art_innovation (title, slug, type, description, tags)
VALUES (
  'The Contained',
  'the-contained',
  'campaign',
  'Three shipping containers revealing the reality of youth detention. An immersive experience touring Australia in 2026.',
  ARRAY['contained', 'tour', 'immersive', 'youth-justice']
)
ON CONFLICT (slug) DO NOTHING;
