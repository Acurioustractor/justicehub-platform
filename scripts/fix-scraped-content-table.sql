-- Fix scraped_content table structure and RLS

-- First check if table exists, if not create it
CREATE TABLE IF NOT EXISTS scraped_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Add any missing columns
DO $$ 
BEGIN
    -- Add budget_figures if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'scraped_content' 
                  AND column_name = 'budget_figures') THEN
        ALTER TABLE scraped_content ADD COLUMN budget_figures JSONB;
    END IF;
    
    -- Add source_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'scraped_content' 
                  AND column_name = 'source_url') THEN
        ALTER TABLE scraped_content ADD COLUMN source_url VARCHAR(500);
    END IF;
    
    -- Add data_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'scraped_content' 
                  AND column_name = 'data_type') THEN
        ALTER TABLE scraped_content ADD COLUMN data_type VARCHAR(100);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_scraped_content_type ON scraped_content(type);
CREATE INDEX IF NOT EXISTS idx_scraped_content_data_type ON scraped_content(data_type);
CREATE INDEX IF NOT EXISTS idx_scraped_content_scraped_at ON scraped_content(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_content_source ON scraped_content(source);

-- Enable Row Level Security
ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON scraped_content;
DROP POLICY IF EXISTS "service_role_all" ON scraped_content;
DROP POLICY IF EXISTS "anon_read" ON scraped_content;

-- Create comprehensive policies
CREATE POLICY "service_role_all" ON scraped_content
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON scraped_content
    FOR SELECT TO anon USING (true);

-- Test the fix
INSERT INTO scraped_content (
    type, content, mentions, budget_figures, url, source, data_type
) VALUES (
    'test', 'RLS and schema test', 1, '{"test": true}'::jsonb, 'https://test.com', 'Test Source', 'test'
);

-- Check the test worked
SELECT 'scraped_content table fixed! Test record inserted.' as message,
       COUNT(*) as test_records 
FROM scraped_content 
WHERE type = 'test';

-- Clean up test
DELETE FROM scraped_content WHERE type = 'test';

-- Final confirmation
SELECT 'Table structure and RLS policies successfully configured!' as final_message;