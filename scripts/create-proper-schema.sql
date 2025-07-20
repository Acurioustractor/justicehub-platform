-- Queensland Youth Justice Tracker - Professional Database Schema
-- Based on actual government data structure analysis

-- =====================================================
-- CORE DATA TABLES (Matching actual data sources)
-- =====================================================

-- 1. COURT STATISTICS (Annual data from Children's Court)
CREATE TABLE IF NOT EXISTS court_annual_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year VARCHAR(10) NOT NULL UNIQUE, -- e.g., "2023-24"
    
    -- Defendant numbers
    total_child_defendants INTEGER NOT NULL,
    indigenous_defendants_count INTEGER,
    indigenous_defendants_percentage DECIMAL(5,2),
    
    -- Age breakdown
    age_10_11_count INTEGER,
    age_12_13_count INTEGER,
    age_14_15_count INTEGER,
    age_16_17_count INTEGER,
    
    -- Bail statistics
    bail_applications INTEGER,
    bail_refused_count INTEGER,
    bail_refused_percentage DECIMAL(5,2),
    remanded_in_custody_count INTEGER,
    
    -- Processing metrics
    average_days_to_finalization INTEGER,
    charges_proven_count INTEGER,
    charges_proven_percentage DECIMAL(5,2),
    
    -- Sentencing outcomes
    detention_orders_count INTEGER,
    community_orders_count INTEGER,
    
    -- Source tracking
    source_document VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    data_extracted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_quality_grade CHAR(1) DEFAULT 'A',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DETENTION CENSUS (Quarterly snapshots)
CREATE TABLE IF NOT EXISTS detention_census (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    census_date DATE NOT NULL UNIQUE,
    
    -- Population counts
    total_youth_in_detention INTEGER NOT NULL,
    remanded_count INTEGER,
    remanded_percentage DECIMAL(5,2),
    sentenced_count INTEGER,
    sentenced_percentage DECIMAL(5,2),
    
    -- Demographics
    indigenous_count INTEGER,
    indigenous_percentage DECIMAL(5,2),
    male_count INTEGER,
    female_count INTEGER,
    
    -- Age groups
    age_10_13_count INTEGER,
    age_14_15_count INTEGER,
    age_16_17_count INTEGER,
    age_18_plus_count INTEGER,
    
    -- Facility metrics
    capacity_utilization DECIMAL(5,2),
    average_length_of_stay_days INTEGER,
    
    -- Source tracking
    source_document VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    data_quality_grade CHAR(1) DEFAULT 'A',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. POLICE YOUTH CRIME STATISTICS (Annual + periodic updates)
CREATE TABLE IF NOT EXISTS police_youth_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporting_period VARCHAR(20) NOT NULL UNIQUE, -- e.g., "2023-24" or "2024-Q1"
    period_type VARCHAR(20) NOT NULL, -- 'annual', 'quarterly', 'monthly'
    
    -- Offender counts
    youth_offenders_total INTEGER,
    youth_offenders_unique INTEGER,
    repeat_offenders_count INTEGER,
    repeat_offender_percentage DECIMAL(5,2),
    serious_repeat_offenders INTEGER,
    
    -- Offence data
    offences_by_youth_total INTEGER,
    clearance_rate DECIMAL(5,2),
    average_time_to_court_days INTEGER,
    
    -- Source tracking
    source_document VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    data_quality_grade CHAR(1) DEFAULT 'A',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BUDGET ALLOCATIONS (Annual budget data)
CREATE TABLE IF NOT EXISTS budget_annual_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year VARCHAR(10) NOT NULL UNIQUE,
    
    -- Total allocations
    total_youth_justice_budget DECIMAL(15,2) NOT NULL,
    detention_operations_amount DECIMAL(15,2),
    community_programs_amount DECIMAL(15,2),
    infrastructure_amount DECIMAL(15,2),
    administration_amount DECIMAL(15,2),
    
    -- Percentages
    detention_percentage DECIMAL(5,2),
    community_percentage DECIMAL(5,2),
    
    -- Unit costs
    cost_per_detention_day DECIMAL(10,2),
    budgeted_detention_capacity INTEGER,
    
    -- Source tracking
    source_document VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    data_quality_grade CHAR(1) DEFAULT 'A',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CALCULATED METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS calculated_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    
    -- Components used in calculation
    calculation_inputs JSONB,
    
    -- Tracking
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date, metric_name)
);

-- =====================================================
-- DATA QUALITY TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS data_quality_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    
    -- Quality metrics
    quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    quality_grade CHAR(1) NOT NULL,
    validation_issues TEXT[],
    
    -- Source verification
    source_verified BOOLEAN DEFAULT false,
    source_accessible BOOLEAN DEFAULT true,
    
    -- Timestamps
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS data_audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- What was extracted
    source_type VARCHAR(50) NOT NULL, -- 'court', 'detention', 'police', 'budget'
    source_document VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    
    -- Extraction details
    extraction_method VARCHAR(50), -- 'manual', 'pdf_parser', 'web_scraper'
    extracted_by VARCHAR(100),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data fingerprint for verification
    data_hash VARCHAR(64),
    
    -- Quality assessment
    quality_score INTEGER,
    quality_notes TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_court_stats_year ON court_annual_statistics(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_detention_date ON detention_census(census_date);
CREATE INDEX IF NOT EXISTS idx_police_period ON police_youth_statistics(reporting_period);
CREATE INDEX IF NOT EXISTS idx_budget_year ON budget_annual_allocations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON calculated_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_quality_table ON data_quality_log(table_name, checked_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE court_annual_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE detention_census ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_annual_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_trail ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public_read" ON court_annual_statistics FOR SELECT USING (true);
CREATE POLICY "public_read" ON detention_census FOR SELECT USING (true);
CREATE POLICY "public_read" ON police_youth_statistics FOR SELECT USING (true);
CREATE POLICY "public_read" ON budget_annual_allocations FOR SELECT USING (true);
CREATE POLICY "public_read" ON calculated_metrics FOR SELECT USING (true);
CREATE POLICY "public_read" ON data_quality_log FOR SELECT USING (true);
CREATE POLICY "public_read" ON data_audit_trail FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "service_role_all" ON court_annual_statistics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON detention_census FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON police_youth_statistics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON budget_annual_allocations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON calculated_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON data_quality_log FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON data_audit_trail FOR ALL TO service_role USING (true);

-- =====================================================
-- VIEWS FOR EASY ACCESS
-- =====================================================

-- Latest statistics view
CREATE OR REPLACE VIEW latest_statistics AS
SELECT 
    c.fiscal_year,
    c.total_child_defendants,
    c.indigenous_defendants_percentage as court_indigenous_percentage,
    d.total_youth_in_detention,
    d.indigenous_percentage as detention_indigenous_percentage,
    d.remanded_percentage,
    b.total_youth_justice_budget,
    b.detention_percentage as budget_detention_percentage,
    b.cost_per_detention_day
FROM court_annual_statistics c
LEFT JOIN LATERAL (
    SELECT * FROM detention_census 
    WHERE census_date >= c.fiscal_year::date 
    ORDER BY census_date DESC LIMIT 1
) d ON true
LEFT JOIN budget_annual_allocations b ON b.fiscal_year = c.fiscal_year
ORDER BY c.fiscal_year DESC
LIMIT 1;

-- Overrepresentation tracking view
CREATE OR REPLACE VIEW indigenous_overrepresentation AS
SELECT 
    fiscal_year,
    indigenous_defendants_percentage,
    ROUND(indigenous_defendants_percentage / 4.6, 1) as court_overrepresentation_factor,
    (SELECT indigenous_percentage FROM detention_census ORDER BY census_date DESC LIMIT 1) as detention_indigenous_percentage,
    ROUND((SELECT indigenous_percentage FROM detention_census ORDER BY census_date DESC LIMIT 1) / 4.6, 1) as detention_overrepresentation_factor
FROM court_annual_statistics
ORDER BY fiscal_year DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Professional schema created successfully!' as message,
       COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('court_annual_statistics', 'detention_census', 'police_youth_statistics', 'budget_annual_allocations');