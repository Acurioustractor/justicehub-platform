-- Profile Appearances System
-- Links Empathy Ledger profiles to JusticeHub content

-- Create profile_appearances table
CREATE TABLE IF NOT EXISTS public.profile_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to Empathy Ledger profile
  empathy_ledger_profile_id UUID NOT NULL,

  -- What this person appears on
  appears_on_type TEXT NOT NULL CHECK (appears_on_type IN ('program', 'service', 'article')),
  appears_on_id UUID NOT NULL,

  -- Context
  role TEXT, -- 'participant', 'facilitator', 'family member', 'graduate', 'mentor'
  story_excerpt TEXT, -- Brief excerpt from their story
  featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(empathy_ledger_profile_id, appears_on_type, appears_on_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_appearances_el_profile
  ON public.profile_appearances(empathy_ledger_profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_appearances_target
  ON public.profile_appearances(appears_on_type, appears_on_id);

CREATE INDEX IF NOT EXISTS idx_profile_appearances_featured
  ON public.profile_appearances(featured)
  WHERE featured = TRUE;

-- Enable RLS
ALTER TABLE public.profile_appearances ENABLE ROW LEVEL SECURITY;

-- Public read access (these are meant to be displayed)
CREATE POLICY "profile_appearances_public_read" ON public.profile_appearances
  FOR SELECT
  USING (true);

-- Admin write access (for sync scripts using service role key)
CREATE POLICY "profile_appearances_admin_write" ON public.profile_appearances
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_appearances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_appearances_updated_at
  BEFORE UPDATE ON public.profile_appearances
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_appearances_updated_at();

-- Grant permissions
GRANT SELECT ON public.profile_appearances TO anon, authenticated;
GRANT ALL ON public.profile_appearances TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.profile_appearances IS 'Links Empathy Ledger profiles to JusticeHub programs, services, and articles';
COMMENT ON COLUMN public.profile_appearances.empathy_ledger_profile_id IS 'UUID of profile in Empathy Ledger database';
COMMENT ON COLUMN public.profile_appearances.appears_on_type IS 'Type of content: program, service, or article';
COMMENT ON COLUMN public.profile_appearances.appears_on_id IS 'ID of the program, service, or article';
COMMENT ON COLUMN public.profile_appearances.role IS 'Person''s role: participant, facilitator, family member, etc.';
COMMENT ON COLUMN public.profile_appearances.story_excerpt IS 'Brief excerpt from their story for preview';
COMMENT ON COLUMN public.profile_appearances.featured IS 'Whether this should be featured prominently';
