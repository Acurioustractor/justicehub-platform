-- Fix RLS for new tables
-- Drop any existing policies first

DROP POLICY IF EXISTS "public_read" ON court_annual_statistics;
DROP POLICY IF EXISTS "service_role_all" ON court_annual_statistics;
DROP POLICY IF EXISTS "public_read" ON detention_census;
DROP POLICY IF EXISTS "service_role_all" ON detention_census;
DROP POLICY IF EXISTS "public_read" ON police_youth_statistics;
DROP POLICY IF EXISTS "service_role_all" ON police_youth_statistics;
DROP POLICY IF EXISTS "public_read" ON budget_annual_allocations;
DROP POLICY IF EXISTS "service_role_all" ON budget_annual_allocations;

-- Create proper policies
CREATE POLICY "Enable read for all users" ON court_annual_statistics FOR SELECT USING (true);
CREATE POLICY "Enable all for service role" ON court_annual_statistics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON detention_census FOR SELECT USING (true);
CREATE POLICY "Enable all for service role" ON detention_census FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON police_youth_statistics FOR SELECT USING (true);
CREATE POLICY "Enable all for service role" ON police_youth_statistics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON budget_annual_allocations FOR SELECT USING (true);
CREATE POLICY "Enable all for service role" ON budget_annual_allocations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Test with a simple insert
INSERT INTO court_annual_statistics (
    fiscal_year,
    total_child_defendants,
    source_document,
    source_url
) VALUES (
    '2023-24',
    8457,
    'RLS Test',
    'https://test.gov.au'
);

-- Clean up test
DELETE FROM court_annual_statistics WHERE source_document = 'RLS Test';

SELECT 'RLS policies fixed!' as message;