-- Create community_programs table for storing curated youth justice programs
-- This enables easy program management through database instead of hardcoded data

CREATE TABLE IF NOT EXISTS public.community_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),

  -- Categorization
  approach TEXT NOT NULL CHECK (approach IN ('Indigenous-led', 'Community-based', 'Grassroots', 'Culturally-responsive')),
  indigenous_knowledge BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Description
  description TEXT NOT NULL,
  impact_summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Metrics
  success_rate INTEGER CHECK (success_rate >= 0 AND success_rate <= 100),
  participants_served INTEGER,
  years_operating INTEGER,
  founded_year INTEGER,
  community_connection_score INTEGER CHECK (community_connection_score >= 0 AND community_connection_score <= 100),

  -- Contact Information (optional)
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,

  -- Full-text search
  search_vector TSVECTOR
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_programs_state ON public.community_programs(state);
CREATE INDEX IF NOT EXISTS idx_community_programs_approach ON public.community_programs(approach);
CREATE INDEX IF NOT EXISTS idx_community_programs_featured ON public.community_programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_programs_indigenous ON public.community_programs(indigenous_knowledge);
CREATE INDEX IF NOT EXISTS idx_community_programs_search ON public.community_programs USING GIN(search_vector);

-- Function to update the search vector
CREATE OR REPLACE FUNCTION update_community_programs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.organization, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.impact_summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER trigger_update_community_programs_search_vector
  BEFORE INSERT OR UPDATE ON public.community_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_community_programs_search_vector();

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_community_programs_updated_at
  BEFORE UPDATE ON public.community_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.community_programs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to community programs"
  ON public.community_programs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow authenticated users to insert (for future admin features)
CREATE POLICY "Allow authenticated users to insert programs"
  ON public.community_programs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update (for future admin features)
CREATE POLICY "Allow authenticated users to update programs"
  ON public.community_programs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE public.community_programs IS 'Curated community-based youth justice programs across Australia';
COMMENT ON COLUMN public.community_programs.approach IS 'Program type: Indigenous-led, Community-based, Grassroots, or Culturally-responsive';
COMMENT ON COLUMN public.community_programs.indigenous_knowledge IS 'Program incorporates traditional Indigenous knowledge and practices';
COMMENT ON COLUMN public.community_programs.is_featured IS 'Show in featured programs section on homepage';
COMMENT ON COLUMN public.community_programs.community_connection_score IS 'Assessment of community integration and local connection (0-100)';
COMMENT ON COLUMN public.community_programs.search_vector IS 'Full-text search vector for program search functionality';
