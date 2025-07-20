-- =====================================================
-- CHECK AND FIX SCHEMA - Discover what columns exist
-- =====================================================

-- First, let's see what columns each table actually has
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CHECKING EXISTING TABLE SCHEMAS';
    RAISE NOTICE '========================================';
END $$;

-- Check youth_statistics columns
DO $$
DECLARE
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        RAISE NOTICE '';
        RAISE NOTICE '📊 YOUTH_STATISTICS columns:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'youth_statistics'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (%)', col.column_name, col.data_type, 
                CASE WHEN col.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ youth_statistics table does not exist';
    END IF;
END $$;

-- Check budget_allocations columns
DO $$
DECLARE
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        RAISE NOTICE '';
        RAISE NOTICE '💰 BUDGET_ALLOCATIONS columns:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'budget_allocations'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (%)', col.column_name, col.data_type, 
                CASE WHEN col.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ budget_allocations table does not exist';
    END IF;
END $$;

-- Check scraped_content columns
DO $$
DECLARE
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🌐 SCRAPED_CONTENT columns:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'scraped_content'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (%)', col.column_name, col.data_type, 
                CASE WHEN col.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ scraped_content table does not exist';
    END IF;
END $$;

-- Now let's add missing columns to youth_statistics if needed
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADDING MISSING COLUMNS';
    RAISE NOTICE '========================================';
    
    -- Add columns to youth_statistics if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        -- Check and add each column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'total_in_detention') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN total_in_detention INTEGER;
            RAISE NOTICE '✅ Added total_in_detention to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'indigenous_percentage') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN indigenous_percentage DECIMAL(5,2);
            RAISE NOTICE '✅ Added indigenous_percentage to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'on_remand_percentage') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN on_remand_percentage DECIMAL(5,2);
            RAISE NOTICE '✅ Added on_remand_percentage to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'average_daily_number') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN average_daily_number DECIMAL(10,2);
            RAISE NOTICE '✅ Added average_daily_number to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'reoffending_rate') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN reoffending_rate DECIMAL(5,2);
            RAISE NOTICE '✅ Added reoffending_rate to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'successful_completions') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN successful_completions INTEGER;
            RAISE NOTICE '✅ Added successful_completions to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'source') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN source TEXT;
            RAISE NOTICE '✅ Added source to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'fiscal_year') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN fiscal_year TEXT;
            RAISE NOTICE '✅ Added fiscal_year to youth_statistics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'youth_statistics' AND column_name = 'date') THEN
            ALTER TABLE public.youth_statistics ADD COLUMN date DATE;
            RAISE NOTICE '✅ Added date to youth_statistics';
        END IF;
    END IF;
END $$;

-- Fix RLS policies
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXING RLS POLICIES';
    RAISE NOTICE '========================================';
    
    -- Youth Statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youth_statistics') THEN
        ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
        
        -- Drop ALL existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Service role has full access" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Service role full access" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Anon read only" ON public.youth_statistics;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.youth_statistics;
        
        -- Create simple policies
        CREATE POLICY "service_role_all" ON public.youth_statistics
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "anon_select" ON public.youth_statistics
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for youth_statistics';
    END IF;
    
    -- Budget Allocations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
        
        -- Drop ALL existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Service role has full access" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Service role full access" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Anon read only" ON public.budget_allocations;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.budget_allocations;
        
        -- Create simple policies
        CREATE POLICY "service_role_all" ON public.budget_allocations
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "anon_select" ON public.budget_allocations
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for budget_allocations';
    END IF;
    
    -- Scraped Content
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;
        
        -- Drop ALL existing policies
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.scraped_content;
        DROP POLICY IF EXISTS "Service role has full access" ON public.scraped_content;
        DROP POLICY IF EXISTS "Service role full access" ON public.scraped_content;
        DROP POLICY IF EXISTS "Anonymous users can read" ON public.scraped_content;
        DROP POLICY IF EXISTS "Anon read only" ON public.scraped_content;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.scraped_content;
        
        -- Create simple policies
        CREATE POLICY "service_role_all" ON public.scraped_content
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "anon_select" ON public.scraped_content
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ Fixed RLS for scraped_content';
    END IF;
END $$;

-- Test insert
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING DATA INSERT';
    RAISE NOTICE '========================================';
    
    -- Try inserting test data
    INSERT INTO public.youth_statistics (date, total_in_detention, indigenous_percentage, on_remand_percentage, source, fiscal_year)
    VALUES 
        ('2024-12-01', 340, 72, 74.5, 'Queensland Government', '2024-25'),
        ('2024-11-01', 328, 71, 73.2, 'Queensland Government', '2024-25')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.budget_allocations (fiscal_year, category, subcategory, amount, description, source)
    VALUES 
        ('2024-25', 'detention', 'Operations', 453000000, 'Youth detention operations', 'Budget Papers 2024-25'),
        ('2024-25', 'community', 'Programs', 127000000, 'Community programs', 'Budget Papers 2024-25')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Test data inserted successfully!';
END $$;

-- Final check
DO $$
DECLARE
    youth_count INTEGER;
    budget_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO youth_count FROM public.youth_statistics;
    SELECT COUNT(*) INTO budget_count FROM public.budget_allocations;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ youth_statistics has % records', youth_count;
    RAISE NOTICE '✅ budget_allocations has % records', budget_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your database is ready! The website should now show data.';
    RAISE NOTICE '========================================';
END $$;