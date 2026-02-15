-- Migration: Add Empathy Ledger Stories Table
-- For syncing stories from Empathy Ledger to JusticeHub

-- Create table for synced stories
CREATE TABLE IF NOT EXISTS empathy_ledger_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT UNIQUE NOT NULL, -- Empathy Ledger story ID
  
  -- Story content
  title TEXT,
  summary TEXT,
  content TEXT,
  story_image_url TEXT,
  story_category TEXT,
  story_type TEXT,
  themes TEXT[],
  
  -- Linkages
  service_id TEXT, -- If linked to JusticeHub service
  organization_id TEXT, -- Empathy Ledger org ID
  organization_name TEXT,
  organization_slug TEXT,
  
  -- Quality & relevance
  quality_score INTEGER DEFAULT 0,
  is_justice_related BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  justicehub_enabled BOOLEAN DEFAULT true, -- Flag if story was opted-in
  
  -- Cultural safety
  cultural_warnings TEXT[],
  cultural_sensitivity_level TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0, -- Calculated from interactions
  last_analytics_sync TIMESTAMPTZ,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  empathy_ledger_created_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_el_stories_justice_related 
ON empathy_ledger_stories(is_justice_related) WHERE is_justice_related = true;

CREATE INDEX IF NOT EXISTS idx_el_stories_quality 
ON empathy_ledger_stories(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_el_stories_featured 
ON empathy_ledger_stories(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_el_stories_published 
ON empathy_ledger_stories(published_at DESC);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_el_stories_analytics 
ON empathy_ledger_stories(view_count DESC, engagement_score DESC);

-- Enable RLS
ALTER TABLE empathy_ledger_stories ENABLE ROW LEVEL SECURITY;

-- Public can read justice-related stories
CREATE POLICY "Public can read justice-related stories"
  ON empathy_ledger_stories
  FOR SELECT
  USING (is_justice_related = true);

-- Admins can manage all
CREATE POLICY "Admins can manage stories"
  ON empathy_ledger_stories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Add story count to interventions
ALTER TABLE alma_interventions 
ADD COLUMN IF NOT EXISTS story_count INTEGER DEFAULT 0;

-- Add narrative score (for alpha signals)
ALTER TABLE alma_interventions 
ADD COLUMN IF NOT EXISTS narrative_score DECIMAL(5,2) DEFAULT 0;

-- Create story-intervention link table
CREATE TABLE IF NOT EXISTS story_intervention_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL, -- Can be Empathy Ledger ID or local ID
  intervention_id UUID REFERENCES alma_interventions(id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('features', 'mentions', 'operates', 'experienced', 'advocates')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, intervention_id)
);

CREATE INDEX IF NOT EXISTS idx_story_intervention_links_intervention 
ON story_intervention_links(intervention_id);

CREATE INDEX IF NOT EXISTS idx_story_intervention_links_story 
ON story_intervention_links(story_id);

-- Function to update intervention story counts
CREATE OR REPLACE FUNCTION update_intervention_story_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update story count for the intervention
  UPDATE alma_interventions
  SET 
    story_count = (
      SELECT COUNT(*) 
      FROM story_intervention_links 
      WHERE intervention_id = COALESCE(NEW.intervention_id, OLD.intervention_id)
    ),
    -- Calculate narrative score (0-10 scale based on story count)
    -- 0 stories = 0, 1-2 stories = 3, 3-5 stories = 6, 6+ stories = 10
    narrative_score = CASE
      WHEN (SELECT COUNT(*) FROM story_intervention_links 
            WHERE intervention_id = COALESCE(NEW.intervention_id, OLD.intervention_id)) >= 6 THEN 10
      WHEN (SELECT COUNT(*) FROM story_intervention_links 
            WHERE intervention_id = COALESCE(NEW.intervention_id, OLD.intervention_id)) >= 3 THEN 6
      WHEN (SELECT COUNT(*) FROM story_intervention_links 
            WHERE intervention_id = COALESCE(NEW.intervention_id, OLD.intervention_id)) >= 1 THEN 3
      ELSE 0
    END
  WHERE id = COALESCE(NEW.intervention_id, OLD.intervention_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update story counts
DROP TRIGGER IF EXISTS trg_update_story_count ON story_intervention_links;
CREATE TRIGGER trg_update_story_count
  AFTER INSERT OR DELETE ON story_intervention_links
  FOR EACH ROW
  EXECUTE FUNCTION update_intervention_story_count();

-- View for stories with interventions
CREATE OR REPLACE VIEW stories_with_interventions AS
SELECT 
  s.*,
  i.name as intervention_name,
  i.id as intervention_id,
  l.link_type
FROM empathy_ledger_stories s
LEFT JOIN story_intervention_links l ON s.story_id = l.story_id
LEFT JOIN alma_interventions i ON l.intervention_id = i.id
WHERE s.is_justice_related = true;

-- Create analytics table for sync tracking
CREATE TABLE IF NOT EXISTS story_sync_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  stories_processed INTEGER DEFAULT 0,
  stories_synced INTEGER DEFAULT 0,
  stories_skipped INTEGER DEFAULT 0,
  stories_failed INTEGER DEFAULT 0,
  avg_quality_score INTEGER DEFAULT 0,
  justice_related_count INTEGER DEFAULT 0,
  with_images_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sync_analytics_run_at 
ON story_sync_analytics(run_at DESC);

-- View for story analytics dashboard
CREATE OR REPLACE VIEW story_analytics_summary AS
SELECT 
  COUNT(*) as total_stories,
  COUNT(*) FILTER (WHERE is_justice_related) as justice_stories,
  COUNT(*) FILTER (WHERE story_image_url IS NOT NULL) as stories_with_images,
  COUNT(*) FILTER (WHERE service_id IS NOT NULL) as linked_to_services,
  AVG(quality_score)::INTEGER as avg_quality,
  AVG(view_count)::INTEGER as avg_views,
  MAX(synced_at) as last_sync
FROM empathy_ledger_stories;

-- Comment
COMMENT ON TABLE empathy_ledger_stories IS 'Stories synced from Empathy Ledger with consent for JusticeHub display';
COMMENT ON TABLE story_intervention_links IS 'Links stories to interventions for narrative scoring';
COMMENT ON TABLE story_sync_analytics IS 'Analytics for story sync operations';
