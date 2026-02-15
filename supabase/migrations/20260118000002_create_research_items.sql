-- Centre of Excellence: Research Items Table
-- Migration: 20260118000002
-- Purpose: Store research library items for Centre of Excellence

-- Create research category enum
CREATE TYPE research_category AS ENUM (
  'trauma-informed',
  'indigenous-diversion',
  'family-engagement',
  'restorative-justice',
  'youth-rights',
  'recidivism',
  'mental-health'
);

-- Create research jurisdiction enum
CREATE TYPE research_jurisdiction AS ENUM (
  'Australia',
  'Queensland',
  'New Zealand',
  'Scotland',
  'International',
  'Nordic'
);

-- Create research type enum
CREATE TYPE research_type AS ENUM (
  'research-paper',
  'systematic-review',
  'meta-analysis',
  'policy-brief',
  'case-study',
  'video',
  'report'
);

-- Main table for research items
CREATE TABLE research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,

  -- Authors and source
  authors TEXT[] DEFAULT '{}',
  organization TEXT NOT NULL,
  year INTEGER NOT NULL,

  -- Classification
  category research_category NOT NULL,
  jurisdiction research_jurisdiction NOT NULL,
  type research_type NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Content
  summary TEXT NOT NULL,
  key_findings TEXT[] DEFAULT '{}',

  -- URLs
  external_url TEXT,
  pdf_url TEXT,
  video_url TEXT,

  -- Display
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_research_items_category ON research_items(category);
CREATE INDEX idx_research_items_jurisdiction ON research_items(jurisdiction);
CREATE INDEX idx_research_items_type ON research_items(type);
CREATE INDEX idx_research_items_year ON research_items(year DESC);
CREATE INDEX idx_research_items_featured ON research_items(is_featured) WHERE is_featured = true;
CREATE INDEX idx_research_items_active ON research_items(is_active) WHERE is_active = true;
CREATE INDEX idx_research_items_tags ON research_items USING GIN(tags);
CREATE INDEX idx_research_items_slug ON research_items(slug);

-- Full-text search index
CREATE INDEX idx_research_items_search ON research_items USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || organization)
);

-- Enable Row Level Security
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active items
CREATE POLICY "Public read active research"
  ON research_items FOR SELECT
  USING (is_active = true);

-- Service role can manage all items
CREATE POLICY "Service role manage research"
  ON research_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can manage items (for admin)
CREATE POLICY "Authenticated users can insert research"
  ON research_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update research"
  ON research_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete research"
  ON research_items FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_research_items_updated_at
  BEFORE UPDATE ON research_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE research_items IS 'Research library items for Centre of Excellence';
COMMENT ON COLUMN research_items.authors IS 'Array of author names';
COMMENT ON COLUMN research_items.key_findings IS 'Array of key research findings';
COMMENT ON COLUMN research_items.tags IS 'Array of searchable tags';
