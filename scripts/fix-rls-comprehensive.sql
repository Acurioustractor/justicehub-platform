-- Comprehensive RLS Fix for Queensland Youth Justice Tracker
-- This script ensures service role can access all tables properly

-- Drop all existing policies first
DO $$ 
DECLARE
    pol RECORD;
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

-- Enable RLS on all main tables
ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parliamentary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;

-- Create service role policies for youth_statistics
CREATE POLICY "service_role_all" ON public.youth_statistics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.youth_statistics
    FOR SELECT TO anon USING (true);

-- Create service role policies for budget_allocations
CREATE POLICY "service_role_all" ON public.budget_allocations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.budget_allocations
    FOR SELECT TO anon USING (true);

-- Create service role policies for parliamentary_documents
CREATE POLICY "service_role_all" ON public.parliamentary_documents
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.parliamentary_documents
    FOR SELECT TO anon USING (true);

-- Create service role policies for cost_comparisons
CREATE POLICY "service_role_all" ON public.cost_comparisons
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.cost_comparisons
    FOR SELECT TO anon USING (true);

-- Create service role policies for hidden_costs
CREATE POLICY "service_role_all" ON public.hidden_costs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.hidden_costs
    FOR SELECT TO anon USING (true);

-- Create service role policies for expenditures
CREATE POLICY "service_role_all" ON public.expenditures
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.expenditures
    FOR SELECT TO anon USING (true);

-- Create scraper monitoring tables if they don't exist
CREATE TABLE IF NOT EXISTS public.scraper_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scraper_name TEXT UNIQUE NOT NULL,
    data_source TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'running', 'error', 'warning')),
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consecutive_failures INTEGER DEFAULT 0,
    last_error TEXT,
    metrics JSONB
);

CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scraper_name TEXT NOT NULL,
    run_id TEXT NOT NULL,
    status TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    errors JSONB,
    warnings JSONB,
    duration_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on monitoring tables
ALTER TABLE public.scraper_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for monitoring tables
CREATE POLICY "service_role_all" ON public.scraper_health
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.scraper_health
    FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all" ON public.scraper_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.scraper_logs
    FOR SELECT TO anon USING (true);

-- Test with a simple insert
INSERT INTO public.youth_statistics (date, total_youth, source_url)
VALUES (CURRENT_DATE, 999, 'RLS Test')
ON CONFLICT (date) DO UPDATE 
SET total_youth = 999, source_url = 'RLS Test Updated';

-- Clean up test data
DELETE FROM public.youth_statistics WHERE source_url LIKE 'RLS Test%';

-- Return success message
SELECT 'RLS policies successfully configured for all tables' as message;