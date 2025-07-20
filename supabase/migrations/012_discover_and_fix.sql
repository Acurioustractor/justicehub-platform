-- =====================================================
-- DISCOVER ACTUAL SCHEMA AND FIX STEP BY STEP
-- =====================================================

-- Step 1: Show exactly what exists
DO $$
DECLARE
    col RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DISCOVERING ACTUAL TABLE STRUCTURE';
    RAISE NOTICE '========================================';
    
    -- Show youth_statistics columns
    RAISE NOTICE '';
    RAISE NOTICE '📊 YOUTH_STATISTICS columns:';
    FOR col IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'youth_statistics'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % % (default: %)', 
            col.column_name, 
            col.data_type,
            CASE WHEN col.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END,
            COALESCE(col.column_default, 'none');
    END LOOP;
    
    -- Show any existing data
    DECLARE
        record_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO record_count FROM public.youth_statistics;
        RAISE NOTICE '';
        RAISE NOTICE 'Current records in youth_statistics: %', record_count;
        
        IF record_count > 0 THEN
            RAISE NOTICE 'First few records:';
            FOR col IN 
                SELECT * FROM public.youth_statistics LIMIT 3
            LOOP
                RAISE NOTICE '  %', col;
            END LOOP;
        END IF;
    END;
END $$;

-- Step 2: Just fix RLS policies (no data insertion yet)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXING RLS POLICIES ONLY';
    RAISE NOTICE '========================================';
    
    -- Youth Statistics RLS
    ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
    
    -- Drop ALL existing policies with different names
    DO $$
    DECLARE
        policy_rec RECORD;
    BEGIN
        FOR policy_rec IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'youth_statistics'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.youth_statistics', policy_rec.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
        END LOOP;
    END $$;
    
    -- Create fresh, simple policies
    CREATE POLICY "service_all_access" ON public.youth_statistics
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_read_access" ON public.youth_statistics
        FOR SELECT TO anon USING (true);
        
    RAISE NOTICE '✅ RLS policies created for youth_statistics';
    
    -- Same for budget_allocations if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
        
        -- Drop all policies
        FOR policy_rec IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'budget_allocations'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.budget_allocations', policy_rec.policyname);
        END LOOP;
        
        CREATE POLICY "service_all_access" ON public.budget_allocations
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "anon_read_access" ON public.budget_allocations
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ RLS policies created for budget_allocations';
    END IF;
    
    -- Same for scraped_content if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;
        
        -- Drop all policies
        FOR policy_rec IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'scraped_content'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.scraped_content', policy_rec.policyname);
        END LOOP;
        
        CREATE POLICY "service_all_access" ON public.scraped_content
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        CREATE POLICY "anon_read_access" ON public.scraped_content
            FOR SELECT TO anon USING (true);
            
        RAISE NOTICE '✅ RLS policies created for scraped_content';
    END IF;
END $$;

-- Step 3: Test a simple insert using only columns we know exist
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING SIMPLE DATA INSERT';
    RAISE NOTICE '========================================';
    
    -- Try inserting with minimal columns (just the ones we know exist)
    INSERT INTO public.youth_statistics (date, total_youth, indigenous_percentage)
    VALUES ('2024-12-20', 340, 72.0)
    ON CONFLICT (date) DO UPDATE SET
        total_youth = EXCLUDED.total_youth,
        indigenous_percentage = EXCLUDED.indigenous_percentage;
    
    RAISE NOTICE '✅ Test insert successful!';
    
    -- Show what was inserted
    DECLARE
        count_after INTEGER;
    BEGIN
        SELECT COUNT(*) INTO count_after FROM public.youth_statistics;
        RAISE NOTICE 'Records after insert: %', count_after;
    END;
END $$;

-- Step 4: Grant permissions explicitly
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GRANTING PERMISSIONS';
    RAISE NOTICE '========================================';
    
    -- Grant all permissions to service role
    GRANT ALL ON public.youth_statistics TO service_role;
    GRANT SELECT ON public.youth_statistics TO anon;
    GRANT SELECT ON public.youth_statistics TO authenticated;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_allocations') THEN
        GRANT ALL ON public.budget_allocations TO service_role;
        GRANT SELECT ON public.budget_allocations TO anon;
        GRANT SELECT ON public.budget_allocations TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_content') THEN
        GRANT ALL ON public.scraped_content TO service_role;
        GRANT SELECT ON public.scraped_content TO anon;
        GRANT SELECT ON public.scraped_content TO authenticated;
    END IF;
    
    RAISE NOTICE '✅ Permissions granted';
END $$;

-- Final status
DO $$
DECLARE
    youth_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO youth_count FROM public.youth_statistics;
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('youth_statistics', 'budget_allocations', 'scraped_content');
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Tables found: %', table_count;
    RAISE NOTICE '📊 Youth statistics records: %', youth_count;
    RAISE NOTICE '';
    RAISE NOTICE 'RLS policies are now fixed!';
    RAISE NOTICE 'Next: Run the seed script from terminal to add more data.';
    RAISE NOTICE '========================================';
END $$;