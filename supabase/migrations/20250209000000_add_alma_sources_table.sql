-- Add alma_sources table for source registry
-- This replaces hardcoded source lists in scraper scripts

CREATE TABLE IF NOT EXISTS alma_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('government', 'indigenous', 'research', 'advocacy', 'media', 'international')),
  jurisdiction TEXT,
  priority INTEGER DEFAULT 50,
  cultural_authority BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  last_scraped TIMESTAMP WITH TIME ZONE,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status TEXT CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  scrape_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_alma_sources_type ON alma_sources(type);
CREATE INDEX IF NOT EXISTS idx_alma_sources_jurisdiction ON alma_sources(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_alma_sources_priority ON alma_sources(priority DESC);
CREATE INDEX IF NOT EXISTS idx_alma_sources_active ON alma_sources(active);
CREATE INDEX IF NOT EXISTS idx_alma_sources_cultural ON alma_sources(cultural_authority) WHERE cultural_authority = TRUE;

-- Enable RLS
ALTER TABLE alma_sources ENABLE ROW LEVEL SECURITY;

-- Public can read active sources
CREATE POLICY "Public can read active sources"
  ON alma_sources
  FOR SELECT
  USING (active = TRUE);

-- Only admins can modify
CREATE POLICY "Only admins can insert sources"
  ON alma_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update sources"
  ON alma_sources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = TRUE
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_alma_sources_updated_at ON alma_sources;
CREATE TRIGGER update_alma_sources_updated_at
  BEFORE UPDATE ON alma_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default sources
INSERT INTO alma_sources (name, url, type, jurisdiction, priority, cultural_authority) VALUES
  -- Government - Priority 1
  ('AIHW Youth Justice', 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice', 'government', 'National', 100, FALSE),
  ('AIHW Youth Detention', 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024', 'government', 'National', 95, FALSE),
  ('QLD Youth Justice', 'https://www.cyjma.qld.gov.au/youth-justice', 'government', 'QLD', 90, FALSE),
  ('NSW Youth Justice', 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html', 'government', 'NSW', 90, FALSE),
  ('VIC Youth Justice', 'https://www.justice.vic.gov.au/youth-justice', 'government', 'VIC', 90, FALSE),
  ('WA Youth Justice', 'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services', 'government', 'WA', 85, FALSE),
  ('SA Youth Justice', 'https://www.childprotection.sa.gov.au/youth-justice', 'government', 'SA', 85, FALSE),
  ('NT Youth Justice', 'https://justice.nt.gov.au/youth-justice', 'government', 'NT', 85, FALSE),
  ('TAS Youth Justice', 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/', 'government', 'TAS', 85, FALSE),
  ('ACT Youth Justice', 'https://www.communityservices.act.gov.au/children-and-families/youth-justice', 'government', 'ACT', 85, FALSE),

  -- Indigenous - Priority 1 (Cultural Authority)
  ('NATSILS', 'https://www.natsils.org.au/', 'indigenous', 'National', 100, TRUE),
  ('SNAICC', 'https://www.snaicc.org.au/', 'indigenous', 'National', 95, TRUE),
  ('QATSICPP', 'https://www.qatsicpp.com.au/', 'indigenous', 'QLD', 90, TRUE),
  ('ALS NSW/ACT', 'https://www.alsnswact.org.au/', 'indigenous', 'NSW/ACT', 90, TRUE),
  ('VALS', 'https://www.vals.org.au/', 'indigenous', 'VIC', 90, TRUE),
  ('NAAJA', 'https://www.naaja.org.au/', 'indigenous', 'NT', 90, TRUE),
  ('ALRM SA', 'https://www.alrm.org.au/', 'indigenous', 'SA', 90, TRUE),
  ('ALS WA', 'https://www.als.org.au/', 'indigenous', 'WA', 90, TRUE),

  -- Research - Priority 2
  ('AIC Research', 'https://www.aic.gov.au/research', 'research', 'National', 80, FALSE),
  ('Clearinghouse for Youth Justice', 'https://www.youthjusticeclearinghouse.gov.au/', 'research', 'National', 80, FALSE),

  -- Advocacy - Priority 2
  ('Youth Law Australia', 'https://www.youthlaw.asn.au/', 'advocacy', 'National', 75, FALSE),
  ('Human Rights Law Centre', 'https://www.hrlc.org.au/', 'advocacy', 'National', 75, FALSE),
  ('Amnesty Australia', 'https://www.amnesty.org.au/', 'advocacy', 'National', 70, FALSE)

ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  jurisdiction = EXCLUDED.jurisdiction,
  priority = EXCLUDED.priority,
  cultural_authority = EXCLUDED.cultural_authority,
  active = TRUE,
  updated_at = NOW();

-- Add comment to table
COMMENT ON TABLE alma_sources IS 'Registry of data sources for ALMA scraper. Replaces hardcoded source lists in scraper scripts.';
