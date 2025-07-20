-- Queensland Youth Justice Accountability Database Schema
-- Designed for tracking government spending transparency and Indigenous overrepresentation

-- Budget Transparency Tracking
CREATE TABLE IF NOT EXISTS budget_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, -- 'youth_justice_budget', 'program_breakdown', etc.
    fiscal_year VARCHAR(20),
    total_allocation VARCHAR(100), -- e.g., '$396.5 million'
    detention_costs VARCHAR(100),
    community_costs VARCHAR(100),
    administrative_costs VARCHAR(100),
    infrastructure_spending JSONB, -- Wacol, Woodford projects
    budget_figures TEXT[], -- Array of dollar amounts found
    youth_justice_mentions INTEGER DEFAULT 0,
    internal_percentage VARCHAR(20), -- e.g., '90.6%'
    outsourced_percentage VARCHAR(20), -- e.g., '9.4%'
    accountability_issues TEXT[], -- Array of identified issues
    content_preview TEXT,
    source VARCHAR(200),
    source_url VARCHAR(500),
    data_type VARCHAR(100),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIHW Statistics for Indigenous Overrepresentation
CREATE TABLE IF NOT EXISTS aihw_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, -- 'current_statistics', 'historical_statistics', etc.
    year VARCHAR(20),
    supervision_rate_qld VARCHAR(50), -- e.g., '175 per 10,000'
    supervision_rate_national VARCHAR(50),
    indigenous_overrepresentation VARCHAR(20), -- e.g., '20x'
    indigenous_percentage VARCHAR(20), -- e.g., '64%'
    indigenous_return_rate VARCHAR(20), -- e.g., '74%'
    detention_rate VARCHAR(50),
    community_supervision_rate VARCHAR(50),
    recidivism_rate VARCHAR(20),
    demographic_breakdown JSONB,
    criminal_justice_contact VARCHAR(100),
    overrepresentation_trends TEXT[],
    health_performance_indicators JSONB,
    content_preview TEXT,
    source VARCHAR(200),
    source_url VARCHAR(500),
    data_type VARCHAR(100),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children's Court Statistics for Official Admissions
CREATE TABLE IF NOT EXISTS court_accountability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, -- 'annual_report', 'indigenous_stats', etc.
    year VARCHAR(20),
    report_title VARCHAR(500),
    indigenous_percentage_10_11 DECIMAL(5,2), -- 86% of 10-11 year olds
    indigenous_percentage_12 DECIMAL(5,2), -- 81% of 12 year olds
    indigenous_percentage_13 DECIMAL(5,2), -- 65% of 13 year olds
    indigenous_percentage_14 DECIMAL(5,2), -- 58% of 14 year olds
    indigenous_overrepresentation_factor DECIMAL(5,2), -- 11.5x more likely
    detention_overrepresentation_factor DECIMAL(5,2), -- 21.4x more likely
    watch_house_children_count INTEGER, -- 470 children
    watch_house_avg_days VARCHAR(20), -- '5-14 days'
    total_court_appearances INTEGER,
    year_over_year_change DECIMAL(5,2), -- -8.2% decrease
    sentencing_disparities JSONB,
    content_preview TEXT,
    source VARCHAR(200),
    source_url VARCHAR(500),
    pdf_url VARCHAR(500),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government Accountability Failures
CREATE TABLE IF NOT EXISTS accountability_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    failure_type VARCHAR(100) NOT NULL, -- 'no_single_accountability', 'transparency_gap', etc.
    title VARCHAR(500),
    description TEXT,
    government_promise TEXT,
    actual_outcome TEXT,
    impact_severity INTEGER, -- 1-10 scale
    affected_demographics VARCHAR(200), -- 'Indigenous youth', 'All youth', etc.
    financial_impact VARCHAR(100), -- e.g., '$1.38 billion misallocation'
    source_type VARCHAR(100), -- 'parliamentary_inquiry', 'audit_report', etc.
    source_document VARCHAR(500),
    source_url VARCHAR(500),
    date_identified DATE,
    date_promise_made DATE,
    accountability_gap_description TEXT,
    reform_recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Transparency and Hidden Spending
CREATE TABLE IF NOT EXISTS cost_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_category VARCHAR(100) NOT NULL, -- 'detention', 'community_program', 'hidden_costs'
    fiscal_year VARCHAR(20),
    official_cost_per_day DECIMAL(10,2), -- $857 (official)
    true_cost_per_day DECIMAL(10,2), -- $1,570 (including hidden costs)
    transparency_gap DECIMAL(10,2), -- Difference between official and true
    cost_per_youth_annual DECIMAL(15,2), -- $312,905 annually
    hidden_cost_factors TEXT[], -- ['police time', 'court processing', 'victim services']
    comparative_community_cost DECIMAL(10,2), -- Community program costs for comparison
    cost_effectiveness_ratio DECIMAL(5,2), -- Community vs detention cost ratio
    outcomes_data JSONB, -- Recidivism rates, success metrics
    source_calculation TEXT, -- How the cost was calculated
    source VARCHAR(200),
    source_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parliamentary Inquiry Findings
CREATE TABLE IF NOT EXISTS parliamentary_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_name VARCHAR(500) NOT NULL,
    committee_name VARCHAR(200),
    inquiry_type VARCHAR(100), -- 'select_committee', 'audit_office', 'royal_commission'
    year VARCHAR(20),
    key_finding TEXT,
    government_response TEXT,
    implementation_status VARCHAR(100), -- 'implemented', 'partially_implemented', 'ignored'
    recommendation_number INTEGER,
    total_recommendations INTEGER,
    accountability_issues TEXT[], -- Specific accountability failures identified
    system_failures TEXT[], -- System-wide failures documented
    financial_findings JSONB, -- Budget and spending findings
    indigenous_specific_findings TEXT[],
    outcome_measures JSONB,
    source_document VARCHAR(500),
    source_url VARCHAR(500),
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government Performance Tracking
CREATE TABLE IF NOT EXISTS government_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(200) NOT NULL,
    metric_category VARCHAR(100), -- 'spending_efficiency', 'outcome_effectiveness', 'transparency'
    current_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    benchmark_value DECIMAL(10,2), -- Other states/international
    improvement_direction VARCHAR(20), -- 'increase', 'decrease', 'maintain'
    performance_status VARCHAR(50), -- 'meeting_target', 'below_target', 'exceeding_target'
    year VARCHAR(20),
    data_source VARCHAR(200),
    calculation_method TEXT,
    accountability_notes TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_budget_transparency_fiscal_year ON budget_transparency(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_transparency_type ON budget_transparency(type);
CREATE INDEX IF NOT EXISTS idx_aihw_statistics_year ON aihw_statistics(year);
CREATE INDEX IF NOT EXISTS idx_aihw_statistics_type ON aihw_statistics(type);
CREATE INDEX IF NOT EXISTS idx_court_accountability_year ON court_accountability(year);
CREATE INDEX IF NOT EXISTS idx_accountability_failures_type ON accountability_failures(failure_type);
CREATE INDEX IF NOT EXISTS idx_cost_transparency_fiscal_year ON cost_transparency(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_parliamentary_findings_year ON parliamentary_findings(year);
CREATE INDEX IF NOT EXISTS idx_government_performance_year ON government_performance(year);
CREATE INDEX IF NOT EXISTS idx_government_performance_category ON government_performance(metric_category);

-- Enable RLS and create service role policies
ALTER TABLE budget_transparency ENABLE ROW LEVEL SECURITY;
ALTER TABLE aihw_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_accountability ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_transparency ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_performance ENABLE ROW LEVEL SECURITY;

-- Service role policies (for scrapers)
CREATE POLICY "service_role_all_budget" ON budget_transparency FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_aihw" ON aihw_statistics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_court" ON court_accountability FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_failures" ON accountability_failures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_costs" ON cost_transparency FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_parliament" ON parliamentary_findings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_performance" ON government_performance FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read policies
CREATE POLICY "public_read_budget" ON budget_transparency FOR SELECT USING (true);
CREATE POLICY "public_read_aihw" ON aihw_statistics FOR SELECT USING (true);
CREATE POLICY "public_read_court" ON court_accountability FOR SELECT USING (true);
CREATE POLICY "public_read_failures" ON accountability_failures FOR SELECT USING (true);
CREATE POLICY "public_read_costs" ON cost_transparency FOR SELECT USING (true);
CREATE POLICY "public_read_parliament" ON parliamentary_findings FOR SELECT USING (true);
CREATE POLICY "public_read_performance" ON government_performance FOR SELECT USING (true);