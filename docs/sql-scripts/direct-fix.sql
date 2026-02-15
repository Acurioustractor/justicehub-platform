-- DIRECT SOLUTION: Bypass RLS for script execution
-- Run this SQL to temporarily disable RLS so your scripts can INSERT data

-- Disable RLS on all tables that need INSERT operations for the scraper
ALTER TABLE data_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_enrichment DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Now you can run your INSERT operations
-- For example:
-- INSERT INTO data_sources (name, type, base_url, scraping_config) VALUES 
-- ('Test Government Source', 'government', 'https://data.gov.au', '{}');

-- After your operations are complete, you can re-enable RLS:
-- ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scraping_metadata ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scraped_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_enrichment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Alternative approach: Run your scripts with a service role key
-- When using Supabase, you can use the service_role key which bypasses RLS
-- This is the recommended approach for server-side operations

-- Check current RLS status:
-- SELECT tablename, relrowsecurity, relreplident FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND relrowsecurity = true;