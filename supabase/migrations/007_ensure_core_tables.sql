-- Create core tables if they don't exist

-- Youth statistics table
CREATE TABLE IF NOT EXISTS public.youth_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_in_detention INTEGER,
    indigenous_percentage DECIMAL(5,2),
    on_remand_percentage DECIMAL(5,2),
    average_daily_number DECIMAL(10,2),
    reoffending_rate DECIMAL(5,2),
    successful_completions INTEGER,
    source TEXT,
    fiscal_year TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget allocations table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    amount DECIMAL(15,2),
    description TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fiscal_year, category, subcategory)
);

-- Detention stats table
CREATE TABLE IF NOT EXISTS public.detention_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    centre_name TEXT NOT NULL,
    date DATE NOT NULL,
    capacity INTEGER,
    occupancy INTEGER,
    remand_count INTEGER,
    indigenous_count INTEGER,
    avg_stay_days INTEGER,
    incidents_monthly INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(centre_name, date)
);

-- Scraped content table (if not exists)
CREATE TABLE IF NOT EXISTS public.scraped_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,
    url TEXT UNIQUE,
    title TEXT,
    content TEXT,
    metadata JSONB,
    scraper_name TEXT,
    data_type TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detention_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;

-- Create read-only policies for anonymous users
CREATE POLICY "Allow anonymous read access" ON public.youth_statistics
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON public.budget_allocations
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON public.detention_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON public.scraped_content
    FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_youth_stats_date ON public.youth_statistics(date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_fiscal_year ON public.budget_allocations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_detention_stats_date ON public.detention_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_content_source ON public.scraped_content(source);
CREATE INDEX IF NOT EXISTS idx_scraped_content_type ON public.scraped_content(data_type);