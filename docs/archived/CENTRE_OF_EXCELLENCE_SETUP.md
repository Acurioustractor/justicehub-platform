# Centre of Excellence Database Setup

## Status: Tables need to be created in Supabase

The migration SQL file has been created at:
`/supabase/migrations/20250126000004_create_centre_of_excellence.sql`

## Next Steps

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/supabase/migrations/20250126000004_create_centre_of_excellence.sql`
4. Run the SQL

### Option 2: Use Supabase CLI

If you have Supabase CLI configured:

```bash
supabase db push
```

### Option 3: Manual Creation (Simplified)

Use this simplified script if the full migration has issues:

```sql
-- Create tables with TEXT fields instead of ENUMs for simplicity

CREATE TABLE IF NOT EXISTS international_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city_location TEXT,
  program_type TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  approach_summary TEXT NOT NULL,
  target_population TEXT,
  year_established INTEGER,
  key_outcomes JSONB DEFAULT '[]'::jsonb,
  recidivism_rate NUMERIC(5,2),
  recidivism_comparison TEXT,
  evidence_strength TEXT,
  research_citations JSONB DEFAULT '[]'::jsonb,
  cost_benefit_ratio TEXT,
  scale TEXT,
  population_served INTEGER,
  australian_adaptations TEXT[],
  visit_status TEXT,
  visit_date DATE,
  visit_notes TEXT,
  collaboration_opportunities TEXT,
  featured_image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  related_story_ids UUID[],
  related_program_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value TEXT NOT NULL,
  comparison_value TEXT,
  timeframe TEXT,
  sample_size INTEGER,
  source TEXT,
  source_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  supporting_research TEXT,
  example_programs UUID[],
  australian_implementation TEXT,
  challenges TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('in_person', 'virtual', 'conference', 'exchange')),
  visit_date DATE NOT NULL,
  participants TEXT[],
  organizations TEXT[],
  purpose TEXT,
  outcomes TEXT,
  follow_up_actions TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_international_programs_region ON international_programs(region);
CREATE INDEX IF NOT EXISTS idx_international_programs_country ON international_programs(country);
CREATE INDEX IF NOT EXISTS idx_international_programs_type ON international_programs USING GIN (program_type);
CREATE INDEX IF NOT EXISTS idx_international_programs_slug ON international_programs(slug);
CREATE INDEX IF NOT EXISTS idx_international_programs_status ON international_programs(status);

-- Enable RLS
ALTER TABLE international_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access)
DROP POLICY IF EXISTS "International programs are viewable by everyone" ON international_programs;
CREATE POLICY "International programs are viewable by everyone"
  ON international_programs FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Enable insert for service role" ON international_programs;
CREATE POLICY "Enable insert for service role"
  ON international_programs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for service role" ON international_programs;
CREATE POLICY "Enable update for service role"
  ON international_programs FOR UPDATE
  USING (true);
```

## After Tables Are Created

Run this script to populate the initial programs:

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/populate-global-programs.ts
```

## Database Schema Overview

### Tables Created

1. **international_programs** - Main table for global best practice programs
2. **program_outcomes** - Detailed outcome metrics for each program
3. **best_practices** - Cross-cutting principles and themes
4. **program_visits** - Track visits and exchanges
5. **international_invitations** - Manage invitations to Australian events

### Initial Programs to be Loaded

- Missouri Model (USA)
- MST/FFT Family Therapy (USA)
- Wraparound Milwaukee (USA)
- Roca Inc. (USA)
- JDAI (USA)
- Youth Conferencing (Northern Ireland)
- HALT Program (Netherlands)
- Police Cautioning (Hong Kong)
- Family Group Conferencing (New Zealand)
- Maranguka Justice Reinvestment (Australia)
- NICRO Diversion (South Africa)
- Progression Units (Brazil)
