-- Justice Matrix: Global Strategic Litigation & Advocacy Clearing House
-- Partnership with The Justice Project / OHCHR

-- Strategic Cases Table
CREATE TABLE IF NOT EXISTS justice_matrix_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction TEXT NOT NULL,
    case_citation TEXT NOT NULL,
    year INTEGER,
    court TEXT,
    strategic_issue TEXT,
    key_holding TEXT,
    authoritative_link TEXT,

    -- Metadata
    region TEXT, -- e.g., 'Asia-Pacific', 'Europe', 'Americas'
    case_type TEXT, -- e.g., 'Asylum', 'Detention', 'Deportation', 'Family Separation'
    status TEXT DEFAULT 'active', -- active, superseded, pending

    -- Source tracking
    source TEXT DEFAULT 'partner_contribution', -- ai_scraped, partner_contribution, manual
    contributor_org TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advocacy Campaigns Table
CREATE TABLE IF NOT EXISTS justice_matrix_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_region TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    lead_organizations TEXT,
    goals TEXT,
    notable_tactics TEXT,
    outcome_status TEXT,
    campaign_link TEXT,

    -- Metadata
    start_year INTEGER,
    end_year INTEGER, -- NULL if ongoing
    is_ongoing BOOLEAN DEFAULT TRUE,
    campaign_type TEXT, -- e.g., 'Detention', 'Deportation', 'Family Reunification', 'Resettlement'

    -- Source tracking
    source TEXT DEFAULT 'partner_contribution',
    contributor_org TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Resources Table (for pleadings, briefs, etc.)
CREATE TABLE IF NOT EXISTS justice_matrix_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'pleading', 'brief', 'judgment', 'advocacy_toolkit', 'research_paper'
    description TEXT,
    jurisdiction TEXT,
    case_id UUID REFERENCES justice_matrix_cases(id),
    campaign_id UUID REFERENCES justice_matrix_campaigns(id),

    -- File/Link info
    file_url TEXT,
    external_link TEXT,

    -- Metadata
    author TEXT,
    organization TEXT,
    publish_date DATE,
    language TEXT DEFAULT 'en',

    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    requires_registration BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON justice_matrix_cases(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_cases_year ON justice_matrix_cases(year);
CREATE INDEX IF NOT EXISTS idx_cases_region ON justice_matrix_cases(region);
CREATE INDEX IF NOT EXISTS idx_campaigns_country ON justice_matrix_campaigns(country_region);
CREATE INDEX IF NOT EXISTS idx_campaigns_ongoing ON justice_matrix_campaigns(is_ongoing);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_cases_fts ON justice_matrix_cases
    USING gin(to_tsvector('english', coalesce(case_citation, '') || ' ' || coalesce(strategic_issue, '') || ' ' || coalesce(key_holding, '')));

CREATE INDEX IF NOT EXISTS idx_campaigns_fts ON justice_matrix_campaigns
    USING gin(to_tsvector('english', coalesce(campaign_name, '') || ' ' || coalesce(goals, '') || ' ' || coalesce(notable_tactics, '')));

-- RLS Policies
ALTER TABLE justice_matrix_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE justice_matrix_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE justice_matrix_resources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for cases" ON justice_matrix_cases
    FOR SELECT USING (true);

CREATE POLICY "Public read access for campaigns" ON justice_matrix_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Public read access for resources" ON justice_matrix_resources
    FOR SELECT USING (is_public = true);

-- Comments
COMMENT ON TABLE justice_matrix_cases IS 'Strategic refugee/asylum cases from around the world - Justice Matrix project';
COMMENT ON TABLE justice_matrix_campaigns IS 'Advocacy campaigns for refugees and asylum seekers - Justice Matrix project';
COMMENT ON TABLE justice_matrix_resources IS 'Legal resources, pleadings, and advocacy materials - Justice Matrix project';
