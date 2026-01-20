-- Centre of Excellence: Australian Frameworks Table
-- Migration: 20260118000001
-- Purpose: Store Australian state/territory youth justice frameworks

CREATE TABLE australian_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  tagline TEXT NOT NULL,

  -- Content
  overview TEXT NOT NULL,
  key_features TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',

  -- Outcomes (JSONB array)
  -- Format: [{ metric: string, value: string, context: string }]
  outcomes JSONB DEFAULT '[]'::jsonb,

  -- Resources (JSONB array)
  -- Format: [{ title: string, type: 'research'|'policy'|'report', url: string, description: string }]
  resources JSONB DEFAULT '[]'::jsonb,

  -- Display
  color TEXT DEFAULT 'blue',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Coordinates (for map display)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_australian_frameworks_state ON australian_frameworks(state);
CREATE INDEX idx_australian_frameworks_display_order ON australian_frameworks(display_order);
CREATE INDEX idx_australian_frameworks_slug ON australian_frameworks(slug);
CREATE INDEX idx_australian_frameworks_active ON australian_frameworks(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE australian_frameworks ENABLE ROW LEVEL SECURITY;

-- Public read access for active frameworks
CREATE POLICY "Public read active frameworks"
  ON australian_frameworks FOR SELECT
  USING (is_active = true);

-- Service role can manage all frameworks
CREATE POLICY "Service role manage frameworks"
  ON australian_frameworks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can manage frameworks (for admin)
CREATE POLICY "Authenticated users can insert frameworks"
  ON australian_frameworks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update frameworks"
  ON australian_frameworks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete frameworks"
  ON australian_frameworks FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_australian_frameworks_updated_at
  BEFORE UPDATE ON australian_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE australian_frameworks IS 'Australian state/territory youth justice frameworks for Centre of Excellence';
COMMENT ON COLUMN australian_frameworks.outcomes IS 'JSON array: [{metric: string, value: string, context: string}]';
COMMENT ON COLUMN australian_frameworks.resources IS 'JSON array: [{title: string, type: research|policy|report, url: string, description: string}]';
