-- Scraped Content table for Firecrawl data
CREATE TABLE scraped_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    content TEXT,
    mentions INTEGER DEFAULT 0,
    budget_figures JSONB,
    url VARCHAR(500),
    source VARCHAR(200),
    source_url VARCHAR(500),
    data_type VARCHAR(100),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scraped_content_type ON scraped_content(type);
CREATE INDEX idx_scraped_content_data_type ON scraped_content(data_type);
CREATE INDEX idx_scraped_content_scraped_at ON scraped_content(scraped_at);
CREATE INDEX idx_scraped_content_source ON scraped_content(source);

-- Create trigger for updated_at
CREATE TRIGGER update_scraped_content_updated_at BEFORE UPDATE ON scraped_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;

-- Create public read access policy
CREATE POLICY "Allow public read access" ON scraped_content FOR SELECT USING (true);