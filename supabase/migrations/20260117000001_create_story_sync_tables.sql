-- Story Sync Tables
-- For caching Empathy Ledger stories locally on JusticeHub

-- Sync metadata table to track sync status
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE,
  last_synced_at TIMESTAMPTZ,
  last_sync_count INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Synced stories from Empathy Ledger
CREATE TABLE IF NOT EXISTS synced_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empathy_ledger_id UUID UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  story_image_url TEXT,
  story_type TEXT,
  story_category TEXT,
  themes TEXT[],
  is_featured BOOLEAN DEFAULT false,
  cultural_sensitivity_level TEXT,
  source TEXT NOT NULL DEFAULT 'empathy_ledger',
  source_published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for synced_stories
CREATE INDEX idx_synced_stories_empathy_ledger_id ON synced_stories(empathy_ledger_id);
CREATE INDEX idx_synced_stories_source ON synced_stories(source);
CREATE INDEX idx_synced_stories_featured ON synced_stories(is_featured) WHERE is_featured = true;
CREATE INDEX idx_synced_stories_synced_at ON synced_stories(synced_at);

-- Enable RLS
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_stories ENABLE ROW LEVEL SECURITY;

-- Public read access to synced stories
CREATE POLICY "synced_stories_public_read" ON synced_stories
  FOR SELECT USING (true);

-- Service role can manage sync tables
CREATE POLICY "sync_metadata_service_manage" ON sync_metadata
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "synced_stories_service_manage" ON synced_stories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_metadata_updated_at
  BEFORE UPDATE ON sync_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_stories_updated_at
  BEFORE UPDATE ON synced_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE sync_metadata IS 'Tracks sync status for external data sources';
COMMENT ON TABLE synced_stories IS 'Locally cached stories from Empathy Ledger for faster access';
COMMENT ON COLUMN synced_stories.empathy_ledger_id IS 'Original story ID in Empathy Ledger';
COMMENT ON COLUMN synced_stories.source IS 'Source of the synced content (empathy_ledger)';
