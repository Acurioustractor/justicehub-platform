-- SQL to fix the schema cache issue preventing INSERT operations
-- This script bypasses RLS policies temporarily to allow INSERT operations

-- 1. Disable RLS temporarily on tables that need INSERT operations
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_enrichment DISABLE ROW LEVEL SECURITY;

-- 2. Run your INSERT operations here (example)
-- INSERT INTO data_sources (name, type, base_url, api_endpoint, scraping_config) VALUES
-- ('Australian Government Open Data', 'government', 'https://data.gov.au', '/api/v0/search', '{}');

-- 3. Re-enable RLS after INSERT operations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_enrichment ENABLE ROW LEVEL SECURITY;

-- Alternative approach: Create a temporary admin user for operations
-- This is often needed in Supabase when running scripts outside the web app context

-- 1. Create a temporary admin user (if needed)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at) 
-- VALUES ('00000000-0000-0000-0000-000000000010', 'admin@justicehub.org', crypt('temp_password', gen_salt('bf')), NOW());

-- 2. Grant platform admin role
-- INSERT INTO users (id, email, display_name, role) 
-- VALUES ('00000000-0000-0000-0000-000000000010', 'admin@justicehub.org', 'System Admin', 'platform_admin');

-- 3. Use the user context for operations
-- SELECT auth.login('admin@justicehub.org', 'temp_password');

-- 4. Run your operations with proper user context
-- Your INSERT statements here

-- 5. Clean up (if you created a temporary user)
-- DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000010';
-- DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000010';