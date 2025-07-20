-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budget Allocations table
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_year VARCHAR(20) NOT NULL,
    department VARCHAR(200),
    program VARCHAR(200) NOT NULL,
    category VARCHAR(100), -- 'detention' or 'community'
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    source_url VARCHAR(500),
    source_document VARCHAR(200),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenditures table
CREATE TABLE expenditures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES budget_allocations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    facility_name VARCHAR(200),
    program_type VARCHAR(100), -- 'detention' or 'community'
    daily_cost DECIMAL(10, 2), -- Cost per youth per day
    youth_count INTEGER,
    indigenous_youth_count INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Youth Statistics table
CREATE TABLE youth_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    facility_name VARCHAR(200),
    total_youth INTEGER NOT NULL,
    indigenous_youth INTEGER,
    indigenous_percentage DECIMAL(5, 2),
    average_age DECIMAL(4, 1),
    average_stay_days DECIMAL(6, 1),
    program_type VARCHAR(100), -- 'detention' or 'community'
    source_url VARCHAR(500),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parliamentary Documents table
CREATE TABLE parliamentary_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(100), -- 'hansard', 'committee_report', 'question_on_notice'
    title VARCHAR(500) NOT NULL,
    date DATE,
    author VARCHAR(200),
    url VARCHAR(500) UNIQUE,
    content TEXT,
    mentions_youth_justice BOOLEAN DEFAULT FALSE,
    mentions_spending BOOLEAN DEFAULT FALSE,
    mentions_indigenous BOOLEAN DEFAULT FALSE,
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Comparisons table
CREATE TABLE cost_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    detention_daily_cost DECIMAL(10, 2) NOT NULL, -- $857/day
    community_daily_cost DECIMAL(10, 2) NOT NULL, -- $41/day
    cost_ratio DECIMAL(5, 2),
    detention_spending_percentage DECIMAL(5, 2), -- 90.6%
    community_spending_percentage DECIMAL(5, 2), -- 9.4%
    total_budget DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RTI Requests table
CREATE TABLE rti_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_date DATE NOT NULL,
    department VARCHAR(200) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    request_text TEXT NOT NULL,
    response_date DATE,
    response_summary TEXT,
    documents_received INTEGER,
    status VARCHAR(50), -- 'pending', 'partial', 'complete', 'refused'
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    report_type VARCHAR(50), -- 'weekly', 'monthly', 'ad-hoc'
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    key_findings TEXT,
    recommendations TEXT,
    file_path VARCHAR(500),
    sent_to VARCHAR(500),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hidden Costs table
CREATE TABLE hidden_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_category VARCHAR(100) NOT NULL, -- 'travel', 'phone', 'legal', 'lost_wages'
    stakeholder_type VARCHAR(50), -- Who bears this cost
    description TEXT,
    amount_per_instance DECIMAL(10, 2),
    frequency VARCHAR(50), -- 'daily', 'weekly', 'per_visit'
    annual_estimate DECIMAL(12, 2),
    source VARCHAR(200), -- Interview, calculation, or external source
    notes TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Cost Calculations table
CREATE TABLE family_cost_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL,
    youth_location VARCHAR(200) NOT NULL, -- Detention facility
    family_location VARCHAR(200) NOT NULL, -- Home town
    
    -- Travel costs
    distance_km DECIMAL(8, 1),
    travel_cost_per_trip DECIMAL(10, 2),
    trips_per_month INTEGER,
    monthly_travel_cost DECIMAL(10, 2),
    
    -- Communication costs
    phone_calls_per_week INTEGER,
    call_cost_per_minute DECIMAL(5, 2),
    average_call_duration INTEGER,
    monthly_phone_cost DECIMAL(10, 2),
    
    -- Lost wages
    work_days_missed_per_month DECIMAL(5, 1),
    average_daily_wage DECIMAL(10, 2),
    monthly_lost_wages DECIMAL(10, 2),
    
    -- Legal costs
    legal_representation BOOLEAN,
    legal_cost_estimate DECIMAL(12, 2),
    
    -- Totals
    total_monthly_cost DECIMAL(12, 2),
    total_annual_cost DECIMAL(14, 2),
    
    -- Comparison
    official_daily_cost DECIMAL(10, 2) DEFAULT 857,
    family_cost_percentage DECIMAL(5, 2), -- Family cost as % of official cost
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Citations table
CREATE TABLE media_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication VARCHAR(200) NOT NULL,
    article_title VARCHAR(500) NOT NULL,
    article_url VARCHAR(500),
    publication_date DATE NOT NULL,
    author VARCHAR(200),
    citation_type VARCHAR(100), -- 'direct_quote', 'data_reference', 'mention'
    quoted_text TEXT,
    reach_estimate INTEGER, -- Estimated audience
    sentiment VARCHAR(50), -- 'positive', 'neutral', 'negative'
    notes TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy Changes table
CREATE TABLE policy_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    change_type VARCHAR(100), -- 'budget_reallocation', 'program_creation', 'legislation'
    date_announced DATE,
    date_implemented DATE,
    department VARCHAR(200),
    impact_estimate TEXT, -- Description of impact
    our_contribution TEXT, -- How we influenced it
    supporting_documents JSONB, -- Array of URLs
    verified BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact Metrics table
CREATE TABLE impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'rti_filed', 'media_reach', 'members_engaged'
    value DECIMAL(12, 2) NOT NULL,
    details TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_budget_allocations_fiscal_year ON budget_allocations(fiscal_year);
CREATE INDEX idx_budget_allocations_category ON budget_allocations(category);
CREATE INDEX idx_expenditures_date ON expenditures(date);
CREATE INDEX idx_youth_statistics_date ON youth_statistics(date);
CREATE INDEX idx_parliamentary_documents_date ON parliamentary_documents(date);
CREATE INDEX idx_parliamentary_documents_mentions ON parliamentary_documents(mentions_youth_justice, mentions_spending, mentions_indigenous);
CREATE INDEX idx_cost_comparisons_date ON cost_comparisons(date);
CREATE INDEX idx_media_citations_publication_date ON media_citations(publication_date);
CREATE INDEX idx_policy_changes_dates ON policy_changes(date_announced, date_implemented);
CREATE INDEX idx_impact_metrics_date ON impact_metrics(metric_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenditures_updated_at BEFORE UPDATE ON expenditures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youth_statistics_updated_at BEFORE UPDATE ON youth_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parliamentary_documents_updated_at BEFORE UPDATE ON parliamentary_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_comparisons_updated_at BEFORE UPDATE ON cost_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rti_requests_updated_at BEFORE UPDATE ON rti_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hidden_costs_updated_at BEFORE UPDATE ON hidden_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_cost_calculations_updated_at BEFORE UPDATE ON family_cost_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_citations_updated_at BEFORE UPDATE ON media_citations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_changes_updated_at BEFORE UPDATE ON policy_changes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_impact_metrics_updated_at BEFORE UPDATE ON impact_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rti_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_cost_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;

-- Create public read access policies
CREATE POLICY "Allow public read access" ON budget_allocations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON expenditures FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON youth_statistics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON parliamentary_documents FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON cost_comparisons FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON hidden_costs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON family_cost_calculations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON media_citations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON policy_changes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON impact_metrics FOR SELECT USING (true);

-- RTI requests might be private
CREATE POLICY "Allow public read of completed RTIs" ON rti_requests FOR SELECT USING (status IN ('complete', 'partial'));

-- Interview Templates table
CREATE TABLE interview_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    stakeholder_type VARCHAR(50) NOT NULL, -- 'youth', 'family', 'worker', 'provider'
    description TEXT,
    questions JSONB NOT NULL, -- JSON format
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES interview_templates(id) ON DELETE SET NULL,
    participant_code VARCHAR(50) NOT NULL, -- Anonymous code
    stakeholder_type VARCHAR(50) NOT NULL,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200),
    interviewer VARCHAR(100),
    duration_minutes INTEGER,
    consent_given BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Responses table
CREATE TABLE interview_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    response_text TEXT,
    response_type VARCHAR(50), -- 'text', 'number', 'cost', 'scale'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Themes table
CREATE TABLE interview_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    theme VARCHAR(100) NOT NULL,
    description TEXT,
    quote TEXT, -- Supporting quote from interview
    importance_score DECIMAL(3, 1), -- 1-5 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coalition Members table
CREATE TABLE coalition_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    phone VARCHAR(50),
    organization_type VARCHAR(100), -- 'ngo', 'community', 'academic', 'legal', 'media'
    location VARCHAR(200),
    website VARCHAR(500),
    areas_of_interest JSONB, -- JSON array
    active BOOLEAN DEFAULT TRUE,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coalition Actions table
CREATE TABLE coalition_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES coalition_members(id) ON DELETE CASCADE,
    action_type VARCHAR(100), -- 'email_sent', 'document_accessed', 'event_attended'
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared Documents table
CREATE TABLE shared_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100), -- 'rti_template', 'media_kit', 'research', 'guide'
    description TEXT,
    file_path VARCHAR(500),
    download_count INTEGER DEFAULT 0,
    uploaded_by VARCHAR(200),
    uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    tags JSONB, -- JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_type VARCHAR(100), -- 'meeting', 'rally', 'workshop', 'webinar'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(500),
    online_link VARCHAR(500),
    organizer VARCHAR(200),
    expected_attendance INTEGER,
    actual_attendance INTEGER,
    notes TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for new tables
CREATE INDEX idx_interview_templates_stakeholder ON interview_templates(stakeholder_type);
CREATE INDEX idx_interviews_date ON interviews(interview_date);
CREATE INDEX idx_interviews_stakeholder ON interviews(stakeholder_type);
CREATE INDEX idx_interview_responses_interview ON interview_responses(interview_id);
CREATE INDEX idx_interview_themes_interview ON interview_themes(interview_id);
CREATE INDEX idx_coalition_members_active ON coalition_members(active);
CREATE INDEX idx_coalition_members_type ON coalition_members(organization_type);
CREATE INDEX idx_coalition_actions_member ON coalition_actions(member_id);
CREATE INDEX idx_coalition_actions_date ON coalition_actions(action_date);
CREATE INDEX idx_shared_documents_category ON shared_documents(category);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_type ON events(event_type);

-- Add triggers for new tables
CREATE TRIGGER update_interview_templates_updated_at BEFORE UPDATE ON interview_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_responses_updated_at BEFORE UPDATE ON interview_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_themes_updated_at BEFORE UPDATE ON interview_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coalition_members_updated_at BEFORE UPDATE ON coalition_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coalition_actions_updated_at BEFORE UPDATE ON coalition_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_documents_updated_at BEFORE UPDATE ON shared_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create public read access policies for new tables
CREATE POLICY "Allow public read access" ON interview_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON interviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON interview_responses FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON interview_themes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON coalition_members FOR SELECT USING (active = true);
CREATE POLICY "Allow public read access" ON coalition_actions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON shared_documents FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);