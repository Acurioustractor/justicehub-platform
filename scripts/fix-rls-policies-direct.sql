-- Fix RLS policies for service key access
-- Run this SQL in Supabase SQL Editor

-- Enable service role access for scraped_content
DROP POLICY IF EXISTS "Enable all for service role" ON scraped_content;
CREATE POLICY "Enable all for service role" ON scraped_content
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for scraper_health
DROP POLICY IF EXISTS "Enable all for service role" ON scraper_health;
CREATE POLICY "Enable all for service role" ON scraper_health
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for court_statistics
DROP POLICY IF EXISTS "Enable all for service role" ON court_statistics;
CREATE POLICY "Enable all for service role" ON court_statistics
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for court_sentencing
DROP POLICY IF EXISTS "Enable all for service role" ON court_sentencing;
CREATE POLICY "Enable all for service role" ON court_sentencing
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for youth_crimes
DROP POLICY IF EXISTS "Enable all for service role" ON youth_crimes;
CREATE POLICY "Enable all for service role" ON youth_crimes
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for youth_crime_patterns
DROP POLICY IF EXISTS "Enable all for service role" ON youth_crime_patterns;
CREATE POLICY "Enable all for service role" ON youth_crime_patterns
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for rti_requests
DROP POLICY IF EXISTS "Enable all for service role" ON rti_requests;
CREATE POLICY "Enable all for service role" ON rti_requests
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for youth_statistics
DROP POLICY IF EXISTS "Enable all for service role" ON youth_statistics;
CREATE POLICY "Enable all for service role" ON youth_statistics
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for budget_allocations
DROP POLICY IF EXISTS "Enable all for service role" ON budget_allocations;
CREATE POLICY "Enable all for service role" ON budget_allocations
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable service role access for parliamentary_documents
DROP POLICY IF EXISTS "Enable all for service role" ON parliamentary_documents;
CREATE POLICY "Enable all for service role" ON parliamentary_documents
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);