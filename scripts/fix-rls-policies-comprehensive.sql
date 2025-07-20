-- Comprehensive RLS Policy Fix for Queensland Youth Justice Tracker
-- This script enables service role access to all tables for data insertion
-- Run this in your Supabase SQL Editor to fix the data storage issues

-- First, disable RLS on all tables temporarily to ensure clean slate
ALTER TABLE budget_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures DISABLE ROW LEVEL SECURITY;
ALTER TABLE youth_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons DISABLE ROW LEVEL SECURITY;
ALTER TABLE rti_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_cost_calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_citations DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Monitoring tables
ALTER TABLE scraper_health DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE selector_alternatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_historical_stats DISABLE ROW LEVEL SECURITY;

-- New tables from other migrations (if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scraped_content') THEN
        ALTER TABLE scraped_content DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'court_statistics') THEN
        ALTER TABLE court_statistics DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'youth_crimes') THEN
        ALTER TABLE youth_crimes DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'firecrawl_content') THEN
        ALTER TABLE firecrawl_content DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qfcc_reports') THEN
        ALTER TABLE qfcc_reports DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'aihw_statistics') THEN
        ALTER TABLE aihw_statistics DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'abs_census_data') THEN
        ALTER TABLE abs_census_data DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qld_open_data_portal') THEN
        ALTER TABLE qld_open_data_portal DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'indigenous_overrepresentation') THEN
        ALTER TABLE indigenous_overrepresentation DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'accountability_failures') THEN
        ALTER TABLE accountability_failures DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'detention_costs') THEN
        ALTER TABLE detention_costs DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Re-enable RLS on all tables
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rti_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_cost_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Monitoring tables
ALTER TABLE scraper_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE selector_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_historical_stats ENABLE ROW LEVEL SECURITY;

-- Re-enable for conditional tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scraped_content') THEN
        ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'court_statistics') THEN
        ALTER TABLE court_statistics ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'youth_crimes') THEN
        ALTER TABLE youth_crimes ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'firecrawl_content') THEN
        ALTER TABLE firecrawl_content ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qfcc_reports') THEN
        ALTER TABLE qfcc_reports ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'aihw_statistics') THEN
        ALTER TABLE aihw_statistics ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'abs_census_data') THEN
        ALTER TABLE abs_census_data ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qld_open_data_portal') THEN
        ALTER TABLE qld_open_data_portal ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'indigenous_overrepresentation') THEN
        ALTER TABLE indigenous_overrepresentation ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'accountability_failures') THEN
        ALTER TABLE accountability_failures ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'detention_costs') THEN
        ALTER TABLE detention_costs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create comprehensive policies for all tables
-- Pattern: Allow authenticated users to read, allow service role full access

-- Main data tables
CREATE POLICY "Enable read access for all users" ON budget_allocations FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON budget_allocations FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON expenditures FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON expenditures FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON youth_statistics FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON youth_statistics FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON parliamentary_documents FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON parliamentary_documents FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON cost_comparisons FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON cost_comparisons FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON reports FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON reports FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON hidden_costs FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON hidden_costs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON family_cost_calculations FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON family_cost_calculations FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON media_citations FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON media_citations FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON policy_changes FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON policy_changes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON impact_metrics FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON impact_metrics FOR ALL USING (auth.role() = 'service_role');

-- RTI requests - special handling for privacy
CREATE POLICY "Enable read of completed RTIs" ON rti_requests FOR SELECT USING (status IN ('complete', 'partial'));
CREATE POLICY "Enable all access for service role" ON rti_requests FOR ALL USING (auth.role() = 'service_role');

-- Interview and coalition tables
CREATE POLICY "Enable read access for all users" ON interview_templates FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON interview_templates FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON interviews FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON interviews FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON interview_responses FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON interview_responses FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON interview_themes FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON interview_themes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read of active members" ON coalition_members FOR SELECT USING (active = true);
CREATE POLICY "Enable all access for service role" ON coalition_members FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON coalition_actions FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON coalition_actions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON shared_documents FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON shared_documents FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON events FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON events FOR ALL USING (auth.role() = 'service_role');

-- Monitoring tables
CREATE POLICY "Enable read access for all users" ON scraper_health FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON scraper_health FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON scraper_runs FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON scraper_runs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON data_quality_metrics FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON data_quality_metrics FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON data_validation_rules FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON data_validation_rules FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON scraper_alerts FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON scraper_alerts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON selector_alternatives FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON selector_alternatives FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON proxy_configs FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON proxy_configs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON rate_limit_configs FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON rate_limit_configs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON data_historical_stats FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON data_historical_stats FOR ALL USING (auth.role() = 'service_role');

-- Handle conditional tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scraped_content') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON scraped_content FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON scraped_content FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'court_statistics') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON court_statistics FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON court_statistics FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'youth_crimes') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON youth_crimes FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON youth_crimes FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'firecrawl_content') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON firecrawl_content FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON firecrawl_content FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qfcc_reports') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON qfcc_reports FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON qfcc_reports FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'aihw_statistics') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON aihw_statistics FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON aihw_statistics FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'abs_census_data') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON abs_census_data FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON abs_census_data FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'qld_open_data_portal') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON qld_open_data_portal FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON qld_open_data_portal FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'indigenous_overrepresentation') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON indigenous_overrepresentation FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON indigenous_overrepresentation FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'accountability_failures') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON accountability_failures FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON accountability_failures FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'detention_costs') THEN
        EXECUTE 'CREATE POLICY "Enable read access for all users" ON detention_costs FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Enable all access for service role" ON detention_costs FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
END $$;

-- Grant necessary permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Verify the fix
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND policyname LIKE '%service role%';
    
    RAISE NOTICE 'Created % service role policies', v_count;
    
    SELECT COUNT(*) INTO v_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true;
    
    RAISE NOTICE 'RLS enabled on % tables', v_count;
END $$;

-- Success message
SELECT 'RLS policies have been fixed! Service role now has full access to all tables.' as message;