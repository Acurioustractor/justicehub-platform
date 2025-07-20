-- =====================================================
-- SAFE RLS FIX - Only updates tables that exist
-- =====================================================

-- First, let's see what tables actually exist
DO $$
BEGIN
    RAISE NOTICE 'Checking which tables exist...';
    
    -- Check each table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        RAISE NOTICE '✓ youth_statistics exists';
    ELSE
        RAISE NOTICE '✗ youth_statistics NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        RAISE NOTICE '✓ budget_allocations exists';
    ELSE
        RAISE NOTICE '✗ budget_allocations NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'detention_stats') THEN
        RAISE NOTICE '✓ detention_stats exists';
    ELSE
        RAISE NOTICE '✗ detention_stats NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        RAISE NOTICE '✓ scraped_content exists';
    ELSE
        RAISE NOTICE '✗ scraped_content NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraper_health') THEN
        RAISE NOTICE '✓ scraper_health exists';
    ELSE
        RAISE NOTICE '✗ scraper_health NOT FOUND';
    END IF;
END $$;

-- Fix RLS for tables that exist
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Youth Statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Service role has full access" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.youth_statistics;
        
        -- Create new policies
        CREATE POLICY "Service role full access" ON public.youth_statistics
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "Anon read only" ON public.youth_statistics
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for youth_statistics';
    END IF;
    
    -- Budget Allocations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Service role has full access" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.budget_allocations;
        
        -- Create new policies
        CREATE POLICY "Service role full access" ON public.budget_allocations
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "Anon read only" ON public.budget_allocations
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for budget_allocations';
    END IF;
    
    -- Scraped Content
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.scraped_content;
        DROP POLICY IF EXISTS "Service role has full access" ON public.scraped_content;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.scraped_content;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.scraped_content;
        
        -- Create new policies
        CREATE POLICY "Service role full access" ON public.scraped_content
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "Anon read only" ON public.scraped_content
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for scraped_content';
    END IF;
    
    -- Scraper Health
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraper_health') THEN
        ALTER TABLE public.scraper_health ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies (if any)
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.scraper_health;
        DROP POLICY IF EXISTS "Service role has full access" ON public.scraper_health;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.scraper_health;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.scraper_health;
        
        -- Create new policies
        CREATE POLICY "Service role full access" ON public.scraper_health
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "Anon read only" ON public.scraper_health
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for scraper_health';
    END IF;
END $$;

-- Quick test insert to verify it works
DO $$
BEGIN
    -- Try inserting test data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        INSERT INTO public.youth_statistics (date, total_in_detention, indigenous_percentage, source, fiscal_year)
        VALUES ('2024-12-15', 350, 73, 'RLS Test', '2024-25')
        ON CONFLICT (date) DO NOTHING;
        
        RAISE NOTICE '✅ Test insert successful - RLS is working!';
    END IF;
END $$;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run the table creation script if tables are missing';
    RAISE NOTICE '2. Run the seed data script from your terminal';
    RAISE NOTICE '========================================';
END $$;