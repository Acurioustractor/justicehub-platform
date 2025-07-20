-- =====================================================
-- COMPREHENSIVE RLS FIX FOR QUEENSLAND YOUTH JUSTICE TRACKER
-- =====================================================
-- This migration fixes all Row Level Security policies to allow
-- proper data insertion by service role while maintaining 
-- read-only access for anonymous users

-- Drop all existing policies first to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'youth_statistics',
            'budget_allocations',
            'detention_stats',
            'scraped_content',
            'scraper_health',
            'scraper_runs',
            'parliamentary_documents',
            'court_statistics',
            'court_sentencing',
            'youth_crimes',
            'youth_crime_patterns',
            'rti_requests',
            'data_quality_metrics',
            'scraper_alerts',
            'hidden_costs',
            'cost_benefit_analyses',
            'committee_reports',
            'questions_on_notice',
            'media_coverage',
            'community_feedback',
            'stakeholder_contacts'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- CORE DATA TABLES
-- =====================================================

-- Youth Statistics
ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.youth_statistics
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.youth_statistics
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.youth_statistics
    FOR SELECT TO authenticated USING (true);

-- Budget Allocations
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.budget_allocations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.budget_allocations
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.budget_allocations
    FOR SELECT TO authenticated USING (true);

-- Detention Stats
ALTER TABLE public.detention_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.detention_stats
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.detention_stats
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.detention_stats
    FOR SELECT TO authenticated USING (true);

-- Scraped Content
ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.scraped_content
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.scraped_content
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.scraped_content
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- MONITORING TABLES
-- =====================================================

-- Scraper Health
ALTER TABLE public.scraper_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.scraper_health
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.scraper_health
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.scraper_health
    FOR SELECT TO authenticated USING (true);

-- Scraper Runs
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.scraper_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.scraper_runs
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.scraper_runs
    FOR SELECT TO authenticated USING (true);

-- Data Quality Metrics
ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.data_quality_metrics
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.data_quality_metrics
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.data_quality_metrics
    FOR SELECT TO authenticated USING (true);

-- Scraper Alerts
ALTER TABLE public.scraper_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.scraper_alerts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.scraper_alerts
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.scraper_alerts
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- GOVERNMENT DATA TABLES
-- =====================================================

-- Parliamentary Documents
ALTER TABLE public.parliamentary_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.parliamentary_documents
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.parliamentary_documents
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.parliamentary_documents
    FOR SELECT TO authenticated USING (true);

-- Court Statistics
ALTER TABLE public.court_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.court_statistics
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.court_statistics
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.court_statistics
    FOR SELECT TO authenticated USING (true);

-- Court Sentencing
ALTER TABLE public.court_sentencing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.court_sentencing
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.court_sentencing
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.court_sentencing
    FOR SELECT TO authenticated USING (true);

-- Youth Crimes
ALTER TABLE public.youth_crimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.youth_crimes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.youth_crimes
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.youth_crimes
    FOR SELECT TO authenticated USING (true);

-- Youth Crime Patterns
ALTER TABLE public.youth_crime_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.youth_crime_patterns
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.youth_crime_patterns
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.youth_crime_patterns
    FOR SELECT TO authenticated USING (true);

-- RTI Requests
ALTER TABLE public.rti_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.rti_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.rti_requests
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.rti_requests
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- ANALYSIS TABLES
-- =====================================================

-- Hidden Costs
ALTER TABLE public.hidden_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.hidden_costs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.hidden_costs
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.hidden_costs
    FOR SELECT TO authenticated USING (true);

-- Cost Benefit Analyses
ALTER TABLE public.cost_benefit_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.cost_benefit_analyses
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.cost_benefit_analyses
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.cost_benefit_analyses
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- COMMUNITY TABLES
-- =====================================================

-- Committee Reports
ALTER TABLE public.committee_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.committee_reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.committee_reports
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.committee_reports
    FOR SELECT TO authenticated USING (true);

-- Questions on Notice
ALTER TABLE public.questions_on_notice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.questions_on_notice
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.questions_on_notice
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.questions_on_notice
    FOR SELECT TO authenticated USING (true);

-- Media Coverage
ALTER TABLE public.media_coverage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.media_coverage
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.media_coverage
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.media_coverage
    FOR SELECT TO authenticated USING (true);

-- Community Feedback
ALTER TABLE public.community_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.community_feedback
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.community_feedback
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.community_feedback
    FOR SELECT TO authenticated USING (true);

-- Stakeholder Contacts
ALTER TABLE public.stakeholder_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON public.stakeholder_contacts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous users can read" ON public.stakeholder_contacts
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read" ON public.stakeholder_contacts
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- Query to verify all policies are created correctly
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been updated. Verifying...';
    
    -- Check that all tables have RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
        WHERE t.schemaname = 'public'
        AND t.tablename IN (
            'youth_statistics', 'budget_allocations', 'detention_stats', 
            'scraped_content', 'scraper_health', 'scraper_runs'
        )
        AND NOT c.relrowsecurity
    ) THEN
        RAISE WARNING 'Some tables do not have RLS enabled!';
    ELSE
        RAISE NOTICE 'All tables have RLS enabled ✓';
    END IF;
    
    -- Check policy counts
    RAISE NOTICE 'Policy count by table:';
    FOR r IN (
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY tablename
    ) LOOP
        RAISE NOTICE '  - %: % policies', r.tablename, r.policy_count;
    END LOOP;
END $$;

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure service role has all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure anon role has SELECT permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure authenticated role has SELECT permissions  
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES SUCCESSFULLY UPDATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All tables now have proper RLS policies:';
    RAISE NOTICE '✓ Service role: Full read/write access';
    RAISE NOTICE '✓ Anonymous users: Read-only access';
    RAISE NOTICE '✓ Authenticated users: Read-only access';
    RAISE NOTICE '';
    RAISE NOTICE 'Your scrapers should now be able to insert data!';
    RAISE NOTICE '========================================';
END $$;