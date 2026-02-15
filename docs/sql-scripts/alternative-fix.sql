-- Alternative SQL approach to fix the INSERT blocking issue
-- This creates policies that allow platform admin operations

-- First, ensure we're using the right schema
SET search_path TO public;

-- Create a more permissive policy for platform admins
-- This policy allows platform admins to perform all operations
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'platform_admin'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing restrictive policies on services
DROP POLICY IF EXISTS "Organization members can manage org services" ON services;

-- Create a more permissive policy for services
CREATE POLICY "Platform admins and org members can manage services" ON services
    FOR ALL USING (
        is_platform_admin() OR
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Drop existing restrictive policies on data_sources
DROP POLICY IF EXISTS "Organization admins can manage data sources" ON data_sources;

-- Create a more permissive policy for data sources
CREATE POLICY "Platform admins can manage data sources" ON data_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- For script execution context, bypass RLS completely
-- This should be used carefully and only for administrative tasks
-- ALTER TABLE services DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_sources DISABLE ROW LEVEL SECURITY;

-- Example of how to properly insert with authentication context:
-- SELECT auth.login('platform-admin@justicehub.org', 'your-password');
-- INSERT INTO data_sources (name, type, base_url, api_endpoint, scraping_config) VALUES
-- ('Test Source', 'government', 'https://example.com', '/api', '{}');

-- To run the test scraping job with proper permissions:
-- 1. Ensure you have a platform admin user
-- 2. Run the script with that user context
-- 3. The AI scraper should work correctly

-- Check current RLS status
-- SELECT tablename, relname, relacl FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND relrowsecurity = true;