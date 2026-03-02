-- Centre of Excellence: Global Best Practice Programs Database
-- Migration: 20250126000004

-- Create regions enum
CREATE TYPE global_region AS ENUM (
  'north_america',
  'europe',
  'asia_pacific',
  'africa',
  'latin_america',
  'middle_east',
  'australasia'
);

-- Create program types enum
CREATE TYPE program_type AS ENUM (
  'custodial_reform',
  'diversion',
  'restorative_justice',
  'family_therapy',
  'community_based',
  'education_vocational',
  'mentoring',
  'prevention',
  'reentry_support',
  'policy_initiative',
  'traditional_practice'
);

-- Create evidence strength enum
CREATE TYPE evidence_strength AS ENUM (
  'rigorous_rct',
  'quasi_experimental',
  'longitudinal_study',
  'evaluation_report',
  'promising_practice',
  'emerging'
);

-- Main table for international programs
CREATE TABLE IF NOT EXISTS international_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  region global_region NOT NULL,
  city_location TEXT,

  -- Program Details
  program_type program_type[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  approach_summary TEXT NOT NULL,
  target_population TEXT,
  year_established INTEGER,

  -- Outcomes and Evidence
  key_outcomes JSONB DEFAULT '[]'::jsonb, -- Array of outcome objects
  recidivism_rate NUMERIC(5,2), -- e.g., 8.00 for 8%
  recidivism_comparison TEXT, -- e.g., "vs 50% for traditional detention"
  evidence_strength evidence_strength,
  research_citations JSONB DEFAULT '[]'::jsonb,

  -- Implementation Details
  cost_benefit_ratio TEXT, -- e.g., "$7-21 return per $1 invested"
  scale TEXT, -- e.g., "300+ counties", "nationwide"
  population_served INTEGER, -- annual or cumulative

  -- Australian Connections
  australian_adaptations TEXT[], -- Programs inspired by this
  visit_status TEXT, -- "planned", "completed", "invited"
  visit_date DATE,
  visit_notes TEXT,
  collaboration_opportunities TEXT,

  -- Media and Resources
  featured_image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  documents JSONB DEFAULT '[]'::jsonb, -- PDFs, reports, etc.

  -- Related Content
  related_story_ids UUID[], -- Links to articles/stories
  related_program_ids UUID[], -- Links to Australian programs

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Table for specific program outcomes (for detailed tracking)
CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,

  outcome_type TEXT NOT NULL, -- e.g., "recidivism", "education", "employment"
  metric_name TEXT NOT NULL,
  value TEXT NOT NULL,
  comparison_value TEXT,
  timeframe TEXT, -- e.g., "within 2 years", "at program completion"
  sample_size INTEGER,

  source TEXT,
  source_year INTEGER,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for best practice principles (cross-cutting themes)
CREATE TABLE IF NOT EXISTS best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- e.g., "Minimal Incarceration", "Restorative Justice"
  description TEXT NOT NULL,

  -- Evidence and Examples
  supporting_research TEXT,
  example_programs UUID[], -- References to international_programs

  -- Australian Context
  australian_implementation TEXT,
  challenges TEXT,
  recommendations TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking visits and exchanges
CREATE TABLE IF NOT EXISTS program_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,

  visit_type TEXT NOT NULL CHECK (visit_type IN ('in_person', 'virtual', 'conference', 'exchange')),
  visit_date DATE NOT NULL,

  participants TEXT[], -- Names of Australian visitors
  organizations TEXT[], -- Participating Australian organizations

  purpose TEXT,
  outcomes TEXT,
  follow_up_actions TEXT,

  documents JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for invitations to Australia
CREATE TABLE IF NOT EXISTS international_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES international_programs(id),

  invitee_name TEXT NOT NULL,
  invitee_role TEXT,
  invitee_email TEXT,

  invitation_status TEXT DEFAULT 'draft' CHECK (
    invitation_status IN ('draft', 'sent', 'accepted', 'declined', 'completed')
  ),
  invitation_date DATE,

  visit_purpose TEXT,
  proposed_dates TEXT,
  hosting_organization TEXT,

  visit_completed BOOLEAN DEFAULT FALSE,
  visit_report TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_international_programs_region ON international_programs(region);
CREATE INDEX idx_international_programs_country ON international_programs(country);
CREATE INDEX idx_international_programs_type ON international_programs USING GIN (program_type);
CREATE INDEX idx_international_programs_slug ON international_programs(slug);
CREATE INDEX idx_international_programs_status ON international_programs(status);

CREATE INDEX idx_program_outcomes_program ON program_outcomes(program_id);
CREATE INDEX idx_program_visits_program ON program_visits(program_id);
CREATE INDEX idx_invitations_program ON international_invitations(program_id);

-- Enable Row Level Security
ALTER TABLE international_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_invitations ENABLE ROW LEVEL SECURITY;

-- Public read access for published programs
CREATE POLICY "International programs are viewable by everyone"
  ON international_programs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Program outcomes are viewable by everyone"
  ON program_outcomes FOR SELECT
  USING (true);

CREATE POLICY "Best practices are viewable by everyone"
  ON best_practices FOR SELECT
  USING (true);

CREATE POLICY "Program visits are viewable by everyone"
  ON program_visits FOR SELECT
  USING (true);

-- Authenticated users can manage (for admin)
CREATE POLICY "Authenticated users can insert international programs"
  ON international_programs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update international programs"
  ON international_programs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_international_programs_updated_at
  BEFORE UPDATE ON international_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_best_practices_updated_at
  BEFORE UPDATE ON best_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
