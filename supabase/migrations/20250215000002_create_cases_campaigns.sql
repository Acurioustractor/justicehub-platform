CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clearinghouse_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT,
  jurisdiction TEXT,
  court TEXT,
  matter_type TEXT,
  issue_tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','closed','archived','verified')),
  stage TEXT,
  summary TEXT,
  outcome TEXT,
  orders TEXT,
  sensitivity TEXT DEFAULT 'public' CHECK (sensitivity IN ('public','restricted')),
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_url TEXT,
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_cases_source_system ON clearinghouse_cases(source_system);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_cases_status ON clearinghouse_cases(status);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_cases_sensitivity ON clearinghouse_cases(sensitivity);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_cases_issue_tags ON clearinghouse_cases USING GIN(issue_tags);

CREATE TABLE IF NOT EXISTS clearinghouse_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES clearinghouse_cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','closed','verified')),
  channels TEXT[] DEFAULT '{}',
  calls_to_action TEXT,
  summary TEXT,
  issue_tags TEXT[] DEFAULT '{}',
  sensitivity TEXT DEFAULT 'public' CHECK (sensitivity IN ('public','restricted')),
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_url TEXT,
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_campaigns_source_system ON clearinghouse_campaigns(source_system);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_campaigns_status ON clearinghouse_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_campaigns_sensitivity ON clearinghouse_campaigns(sensitivity);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_campaigns_issue_tags ON clearinghouse_campaigns USING GIN(issue_tags);

COMMENT ON TABLE clearinghouse_cases IS 'Court cases / matters shared via clearinghouse with advocacy context';
COMMENT ON TABLE clearinghouse_campaigns IS 'Advocacy campaigns tied to cases or standalone';
