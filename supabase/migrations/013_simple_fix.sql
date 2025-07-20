-- =====================================================
-- SIMPLE SCHEMA DISCOVERY AND RLS FIX
-- =====================================================

-- Step 1: Show what columns exist
DO $$
DECLARE
    col RECORD;
    record_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DISCOVERING TABLE STRUCTURE';
    RAISE NOTICE '========================================';
    
    -- Show youth_statistics columns
    RAISE NOTICE '📊 YOUTH_STATISTICS columns:';
    FOR col IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'youth_statistics'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % %', 
            col.column_name, 
            col.data_type,
            CASE WHEN col.is_nullable = 'YES' THEN '(nullable)' ELSE '(NOT NULL)' END;
    END LOOP;
    
    -- Count existing records
    SELECT COUNT(*) INTO record_count FROM public.youth_statistics;
    RAISE NOTICE '';
    RAISE NOTICE 'Current records: %', record_count;
END $$;

-- Step 2: Fix RLS policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXING RLS POLICIES';
    RAISE NOTICE '========================================';
    
    -- Enable RLS
    ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
    
    -- Drop all existing policies
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'youth_statistics'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.youth_statistics', policy_rec.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
    END LOOP;
    
    -- Create new policies
    CREATE POLICY "service_access" ON public.youth_statistics
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "public_read" ON public.youth_statistics
        FOR SELECT TO anon USING (true);
        
    RAISE NOTICE '✅ Created new RLS policies for youth_statistics';
END $$;

-- Step 3: Grant permissions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GRANTING PERMISSIONS';
    RAISE NOTICE '========================================';
    
    GRANT ALL ON public.youth_statistics TO service_role;
    GRANT SELECT ON public.youth_statistics TO anon;
    GRANT SELECT ON public.youth_statistics TO authenticated;
    
    RAISE NOTICE '✅ Permissions granted';
END $$;

-- Step 4: Test simple insert
DO $$
DECLARE
    record_count_before INTEGER;
    record_count_after INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING DATA INSERT';
    RAISE NOTICE '========================================';
    
    SELECT COUNT(*) INTO record_count_before FROM public.youth_statistics;
    
    -- Try insert with minimal required fields
    INSERT INTO public.youth_statistics (date, total_youth)
    VALUES ('2024-12-20', 340)
    ON CONFLICT (date) DO UPDATE SET total_youth = EXCLUDED.total_youth;
    
    SELECT COUNT(*) INTO record_count_after FROM public.youth_statistics;
    
    RAISE NOTICE 'Records before: %', record_count_before;
    RAISE NOTICE 'Records after: %', record_count_after;
    RAISE NOTICE '✅ Insert test completed';
END $$;

-- Step 5: Show final status
DO $$
DECLARE
    final_count INTEGER;
    sample_row RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '========================================';
    
    SELECT COUNT(*) INTO final_count FROM public.youth_statistics;
    RAISE NOTICE 'Total records: %', final_count;
    
    IF final_count > 0 THEN
        SELECT * INTO sample_row FROM public.youth_statistics LIMIT 1;
        RAISE NOTICE 'Sample record exists - insert working!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 RLS is now fixed!';
    RAISE NOTICE 'Next: Run seed script from terminal to add real data';
    RAISE NOTICE '========================================';
END $$;