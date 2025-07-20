-- Fix RLS policies for service key access

-- Add service role policies for all tables
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON scraped_content
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON scraper_health
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON court_statistics
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON court_sentencing
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON youth_crimes
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON youth_crime_patterns
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON rti_requests
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON youth_statistics
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON budget_allocations
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all for service role" ON parliamentary_documents
FOR ALL TO service_role USING (true) WITH CHECK (true);