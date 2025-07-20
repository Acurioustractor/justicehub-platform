-- Court Statistics table
CREATE TABLE court_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_type VARCHAR(100) NOT NULL,
    report_period VARCHAR(20) NOT NULL,
    total_defendants INTEGER,
    indigenous_defendants INTEGER,
    indigenous_percentage DECIMAL(5, 2),
    bail_refused_count INTEGER,
    bail_refused_percentage DECIMAL(5, 2),
    remanded_custody INTEGER,
    average_time_to_sentence_days INTEGER,
    most_common_offence VARCHAR(200),
    source_document VARCHAR(500),
    source_url VARCHAR(500),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Court Sentencing Data table
CREATE TABLE court_sentencing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offence_category VARCHAR(200) NOT NULL,
    report_period VARCHAR(20) NOT NULL,
    total_sentenced INTEGER,
    detention_orders INTEGER,
    detention_percentage DECIMAL(5, 2),
    community_orders INTEGER,
    community_percentage DECIMAL(5, 2),
    other_orders INTEGER,
    average_detention_months DECIMAL(5, 1),
    indigenous_detention_rate DECIMAL(5, 2),
    non_indigenous_detention_rate DECIMAL(5, 2),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Youth Crimes Regional Data table
CREATE TABLE youth_crimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    offense_type VARCHAR(200) NOT NULL,
    youth_offenders INTEGER,
    total_offenses INTEGER,
    property_offenses INTEGER,
    person_offenses INTEGER,
    drug_offenses INTEGER,
    public_order_offenses INTEGER,
    indigenous_offenders INTEGER,
    indigenous_percentage DECIMAL(5, 2),
    repeat_offenders INTEGER,
    repeat_offender_percentage DECIMAL(5, 2),
    most_common_age INTEGER,
    source VARCHAR(200),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Youth Crime Patterns table
CREATE TABLE youth_crime_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offence_type VARCHAR(200) NOT NULL,
    total_offences INTEGER,
    percentage_of_youth_crime DECIMAL(5, 2),
    average_age DECIMAL(4, 1),
    group_offending_rate DECIMAL(5, 2),
    night_time_percentage DECIMAL(5, 2),
    weapons_involved DECIMAL(5, 2),
    report_period VARCHAR(20),
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_court_statistics_period ON court_statistics(report_period);
CREATE INDEX idx_court_statistics_court_type ON court_statistics(court_type);
CREATE INDEX idx_court_sentencing_period ON court_sentencing(report_period);
CREATE INDEX idx_court_sentencing_category ON court_sentencing(offence_category);
CREATE INDEX idx_youth_crimes_date ON youth_crimes(date);
CREATE INDEX idx_youth_crimes_region ON youth_crimes(region);
CREATE INDEX idx_youth_crime_patterns_type ON youth_crime_patterns(offence_type);

-- Create triggers for updated_at
CREATE TRIGGER update_court_statistics_updated_at BEFORE UPDATE ON court_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_sentencing_updated_at BEFORE UPDATE ON court_sentencing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youth_crimes_updated_at BEFORE UPDATE ON youth_crimes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youth_crime_patterns_updated_at BEFORE UPDATE ON youth_crime_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE court_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sentencing ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_crime_patterns ENABLE ROW LEVEL SECURITY;

-- Create public read access policies
CREATE POLICY "Allow public read access" ON court_statistics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON court_sentencing FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON youth_crimes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON youth_crime_patterns FOR SELECT USING (true);