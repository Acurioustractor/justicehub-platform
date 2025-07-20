-- Fix RLS for scraped_content table
DROP POLICY IF EXISTS "Allow public read access" ON scraped_content;
DROP POLICY IF EXISTS "service_role_all" ON scraped_content;

-- Create comprehensive policies
CREATE POLICY "service_role_all" ON scraped_content
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON scraped_content
    FOR SELECT TO anon USING (true);

-- Test the fix
INSERT INTO scraped_content (
    type, content, mentions, url, source, data_type
) VALUES (
    'test', 'RLS test content', 1, 'https://test.com', 'RLS Test', 'test'
);

DELETE FROM scraped_content WHERE type = 'test';

SELECT 'scraped_content RLS fixed!' as message;