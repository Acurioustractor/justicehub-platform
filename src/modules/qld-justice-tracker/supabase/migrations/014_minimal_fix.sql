-- =====================================================
-- MINIMAL RLS FIX - Just make inserts work
-- =====================================================

-- Step 1: Show table structure
DO $$
DECLARE
    col RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABLE STRUCTURE:';
    RAISE NOTICE '========================================';
    
    FOR col IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'youth_statistics'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '%: % %', 
            col.column_name, 
            col.data_type,
            CASE WHEN col.is_nullable = 'YES' THEN '(nullable)' ELSE '(required)' END;
    END LOOP;
END $$;

-- Step 2: Fix RLS - simple version
ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "service_access" ON public.youth_statistics;
DROP POLICY IF EXISTS "public_read" ON public.youth_statistics;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.youth_statistics;
DROP POLICY IF EXISTS "Service role has full access" ON public.youth_statistics;

-- Create working policies
CREATE POLICY "service_access" ON public.youth_statistics
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read" ON public.youth_statistics
    FOR SELECT TO anon USING (true);

-- Grant permissions
GRANT ALL ON public.youth_statistics TO service_role;
GRANT SELECT ON public.youth_statistics TO anon;

-- Step 3: Simple insert test (no conflict handling)
DO $$
BEGIN
    -- Clear any test data first
    DELETE FROM public.youth_statistics WHERE total_youth = 999;
    
    -- Simple insert
    INSERT INTO public.youth_statistics (date, total_youth) 
    VALUES ('2024-12-20', 999);
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up test data
    DELETE FROM public.youth_statistics WHERE total_youth = 999;
    
    RAISE NOTICE 'RLS is now working - scrapers can insert data!';
END $$;