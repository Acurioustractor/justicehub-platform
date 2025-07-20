-- Enable Row Level Security on all tables
ALTER TABLE youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON youth_statistics;
DROP POLICY IF EXISTS "Enable read access for all users" ON budget_allocations;
DROP POLICY IF EXISTS "Enable read access for all users" ON court_statistics;
DROP POLICY IF EXISTS "Enable read access for all users" ON parliamentary_documents;
DROP POLICY IF EXISTS "Enable read access for all users" ON scraped_content;
DROP POLICY IF EXISTS "Enable read access for all users" ON cost_comparisons;
DROP POLICY IF EXISTS "Enable read access for all users" ON hidden_costs;

-- Create read-only policies for anonymous users
CREATE POLICY "Enable read access for all users" ON youth_statistics
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON budget_allocations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON court_statistics
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON parliamentary_documents
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON scraped_content
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON cost_comparisons
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable read access for all users" ON hidden_costs
  FOR SELECT
  TO anon
  USING (true);

-- Create write policies for service role only
CREATE POLICY "Service role can do everything" ON youth_statistics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON budget_allocations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON court_statistics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON parliamentary_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON scraped_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON cost_comparisons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON hidden_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_youth_statistics_date ON youth_statistics(date DESC);
CREATE INDEX IF NOT EXISTS idx_youth_statistics_facility ON youth_statistics(facility_name);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_fiscal_year ON budget_allocations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_department ON budget_allocations(department);
CREATE INDEX IF NOT EXISTS idx_court_statistics_report_period ON court_statistics(report_period);
CREATE INDEX IF NOT EXISTS idx_parliamentary_documents_date ON parliamentary_documents(date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_content_scraped_at ON scraped_content(scraped_at DESC);

-- Add comments for documentation
COMMENT ON POLICY "Enable read access for all users" ON youth_statistics IS 'Allow anonymous users to read youth statistics data';
COMMENT ON POLICY "Service role can do everything" ON youth_statistics IS 'Allow service role full access for data updates';

-- Verify RLS is enabled
DO $$ 
BEGIN 
  RAISE NOTICE 'RLS Status Check:';
  RAISE NOTICE 'youth_statistics: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'youth_statistics');
  RAISE NOTICE 'budget_allocations: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'budget_allocations');
  RAISE NOTICE 'court_statistics: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'court_statistics');
  RAISE NOTICE 'parliamentary_documents: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'parliamentary_documents');
  RAISE NOTICE 'scraped_content: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'scraped_content');
  RAISE NOTICE 'cost_comparisons: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'cost_comparisons');
  RAISE NOTICE 'hidden_costs: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'hidden_costs');
END $$;