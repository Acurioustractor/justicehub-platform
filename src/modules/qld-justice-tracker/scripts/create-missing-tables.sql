-- Create missing tables referenced in frontend code
-- These tables were causing console errors and "No data found" issues

-- AIHW Statistics table for national youth justice data
CREATE TABLE IF NOT EXISTS aihw_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_period TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Queensland',
  total_youth_supervision INTEGER,
  indigenous_youth_supervision INTEGER, 
  indigenous_percentage DECIMAL(5,2),
  supervision_rate_per_10000 DECIMAL(8,2),
  overrepresentation_factor DECIMAL(5,2),
  community_supervision INTEGER,
  detention_supervision INTEGER,
  source_document TEXT,
  source_url TEXT,
  verified_date DATE,
  scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spending Analysis table for budget breakdown
CREATE TABLE IF NOT EXISTS spending_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year TEXT NOT NULL,
  total_youth_justice_budget BIGINT,
  detention_spending BIGINT,
  detention_percentage DECIMAL(5,2),
  community_spending BIGINT,
  community_percentage DECIMAL(5,2),
  administration_spending BIGINT,
  detention_daily_cost DECIMAL(10,2),
  community_daily_cost DECIMAL(10,2),
  cost_ratio DECIMAL(6,2),
  efficiency_score DECIMAL(5,2),
  source_document TEXT,
  source_url TEXT,
  analysis_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detention Metrics table for facility performance
CREATE TABLE IF NOT EXISTS detention_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_name TEXT NOT NULL,
  date DATE NOT NULL,
  capacity INTEGER,
  occupancy INTEGER,
  occupancy_percentage DECIMAL(5,2),
  indigenous_occupancy INTEGER,
  indigenous_percentage DECIMAL(5,2),
  on_remand INTEGER,
  remand_percentage DECIMAL(5,2),
  average_stay_days DECIMAL(8,2),
  incidents_count INTEGER,
  education_participation_rate DECIMAL(5,2),
  program_completion_rate DECIMAL(5,2),
  source_document TEXT,
  source_url TEXT,
  verified_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hidden Costs table for transparency data
CREATE TABLE IF NOT EXISTS hidden_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_category TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  reported_amount BIGINT,
  actual_amount BIGINT,
  hidden_amount BIGINT,
  hidden_percentage DECIMAL(5,2),
  cost_description TEXT,
  includes_infrastructure BOOLEAN DEFAULT FALSE,
  includes_healthcare BOOLEAN DEFAULT FALSE,
  includes_education BOOLEAN DEFAULT FALSE,
  includes_legal BOOLEAN DEFAULT FALSE,
  source_type TEXT, -- 'budget', 'audit', 'rti'
  source_document TEXT,
  source_url TEXT,
  disclosure_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Comparisons table for daily cost analysis
CREATE TABLE IF NOT EXISTS cost_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  detention_daily_cost DECIMAL(10,2),
  community_daily_cost DECIMAL(10,2),
  cost_ratio DECIMAL(6,2),
  detention_spending_percentage DECIMAL(5,2),
  youth_in_detention INTEGER,
  youth_in_community INTEGER,
  total_daily_spending BIGINT,
  cost_effectiveness_score DECIMAL(5,2),
  reoffending_rate_detention DECIMAL(5,2),
  reoffending_rate_community DECIMAL(5,2),
  source_document TEXT,
  calculated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for all new tables
ALTER TABLE aihw_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE detention_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Enable read access for all users" ON aihw_statistics FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON spending_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON detention_metrics FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON hidden_costs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON cost_comparisons FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Enable insert for service role" ON aihw_statistics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON aihw_statistics FOR UPDATE USING (true);
CREATE POLICY "Enable insert for service role" ON spending_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON spending_analysis FOR UPDATE USING (true);
CREATE POLICY "Enable insert for service role" ON detention_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON detention_metrics FOR UPDATE USING (true);
CREATE POLICY "Enable insert for service role" ON hidden_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON hidden_costs FOR UPDATE USING (true);
CREATE POLICY "Enable insert for service role" ON cost_comparisons FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON cost_comparisons FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aihw_statistics_report_period ON aihw_statistics(report_period);
CREATE INDEX IF NOT EXISTS idx_spending_analysis_fiscal_year ON spending_analysis(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_detention_metrics_date ON detention_metrics(date);
CREATE INDEX IF NOT EXISTS idx_detention_metrics_facility ON detention_metrics(facility_name);
CREATE INDEX IF NOT EXISTS idx_hidden_costs_fiscal_year ON hidden_costs(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_cost_comparisons_date ON cost_comparisons(date);