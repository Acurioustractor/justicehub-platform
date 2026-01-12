-- Transparency Module Tables
-- These tables support the Money Trail / Budget Transparency feature

-- Budget allocations and spending by department/category
CREATE TABLE IF NOT EXISTS transparency_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  allocated BIGINT NOT NULL, -- Amount in cents to avoid floating point issues
  spent BIGINT NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN allocated > 0 THEN (spent::DECIMAL / allocated * 100) ELSE 0 END
  ) STORED,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  state TEXT NOT NULL DEFAULT 'QLD',
  financial_year TEXT NOT NULL DEFAULT '2023-24',
  source_url TEXT,
  source_document TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_transparency_budget_state_year
  ON transparency_budget(state, financial_year);
CREATE INDEX IF NOT EXISTS idx_transparency_budget_department
  ON transparency_budget(department);

-- Transparency alerts for budget issues
CREATE TABLE IF NOT EXISTS transparency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('budget_exceeded', 'underspend', 'new_allocation', 'transparency_issue')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT, -- Amount in cents
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')) NOT NULL DEFAULT 'medium',
  state TEXT NOT NULL DEFAULT 'QLD',
  is_active BOOLEAN DEFAULT true,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for active alerts
CREATE INDEX IF NOT EXISTS idx_transparency_alerts_active
  ON transparency_alerts(is_active, state, date DESC);

-- Key metrics for dashboard display
CREATE TABLE IF NOT EXISTS transparency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL, -- Display value (e.g., "$213M", "67%")
  raw_value BIGINT, -- Raw numeric value for calculations
  change TEXT, -- e.g., "+8.5%"
  positive BOOLEAN DEFAULT false,
  type TEXT NOT NULL, -- e.g., 'total_budget', 'detention_cost', 'transparency_score'
  state TEXT NOT NULL DEFAULT 'QLD',
  financial_year TEXT NOT NULL DEFAULT '2023-24',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for metrics lookup
CREATE INDEX IF NOT EXISTS idx_transparency_metrics_state_year
  ON transparency_metrics(state, financial_year);

-- Document tracking for scraped government documents
CREATE TABLE IF NOT EXISTS transparency_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'budget_paper', 'annual_report', 'foi', 'qon', 'court_stats'
  source_url TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'QLD',
  financial_year TEXT,
  published_date DATE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_hash TEXT, -- For change detection
  raw_content TEXT,
  extracted_data JSONB,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transparency_documents_type
  ON transparency_documents(document_type, state);
CREATE INDEX IF NOT EXISTS idx_transparency_documents_scraped
  ON transparency_documents(scraped_at DESC);

-- Enable RLS
ALTER TABLE transparency_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for all transparency data
CREATE POLICY "Public read access" ON transparency_budget FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transparency_alerts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transparency_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transparency_documents FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service role write access" ON transparency_budget
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON transparency_alerts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON transparency_metrics
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON transparency_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data (same as API fallback data)
INSERT INTO transparency_budget (department, category, allocated, spent, trend, state, financial_year, last_updated)
VALUES
  ('Youth Justice', 'Detention Centers', 12500000000, 11850000000, 'up', 'QLD', '2023-24', '2024-01-15'),
  ('Youth Justice', 'Community Programs', 4500000000, 4120000000, 'stable', 'QLD', '2023-24', '2024-01-15'),
  ('Courts', 'Youth Court Operations', 2800000000, 2680000000, 'down', 'QLD', '2023-24', '2024-01-12'),
  ('Legal Aid', 'Youth Legal Representation', 1500000000, 1230000000, 'down', 'QLD', '2023-24', '2024-01-10')
ON CONFLICT DO NOTHING;

INSERT INTO transparency_alerts (type, title, description, amount, severity, state, date)
VALUES
  ('budget_exceeded', 'Detention Center Overtime Costs', 'Staff overtime costs have exceeded budget by 12% this quarter', 150000000, 'high', 'QLD', '2024-01-15'),
  ('underspend', 'Community Programs Underspend', 'Community-based programs showing significant underspend', 380000000, 'medium', 'QLD', '2024-01-12'),
  ('transparency_issue', 'Missing Financial Reports', 'Q2 detention facility reports not yet published', NULL, 'high', 'QLD', '2024-01-10')
ON CONFLICT DO NOTHING;

INSERT INTO transparency_metrics (label, value, raw_value, change, positive, type, state, financial_year)
VALUES
  ('Total Youth Justice Budget', '$213M', 21300000000, '+8.5%', false, 'total_budget', 'QLD', '2023-24'),
  ('Cost Per Youth in Detention', '$847K', 84700000, '+12.3%', false, 'detention_cost', 'QLD', '2023-24'),
  ('Community Program Investment', '$45M', 4500000000, '-2.1%', false, 'community_investment', 'QLD', '2023-24'),
  ('Budget Transparency Score', '67%', 67, '+5.2%', true, 'transparency_score', 'QLD', '2023-24')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE transparency_budget IS 'Youth justice budget allocations and spending by department/category';
COMMENT ON TABLE transparency_alerts IS 'Active alerts for budget issues, underspends, and transparency concerns';
COMMENT ON TABLE transparency_metrics IS 'Key metrics displayed on transparency dashboard';
COMMENT ON TABLE transparency_documents IS 'Tracked government documents for automated scraping';
