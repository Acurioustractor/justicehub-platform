// Execute SQL via Supabase REST API using service role
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function executeSql() {
  console.log('Creating partner tables via RPC...\n');

  // First, let's create each table one by one via direct insert/check
  // This approach uses the service role to work around direct SQL limitations

  // Create the tables by calling a database function if exists,
  // or we'll use the management API approach

  // Actually, let's just create a simple function to run SQL
  const createFunctionSql = `
CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

  // Try calling the function
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql_text: `
CREATE TABLE IF NOT EXISTS partner_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_id TEXT,
  platform TEXT DEFAULT 'youtube',
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  video_type TEXT DEFAULT 'documentary',
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  published_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
  });

  if (rpcError) {
    console.log('RPC not available, function may not exist');
    console.log('Error:', rpcError.message);

    // Alternative: Use raw fetch to the query endpoint
    console.log('\nTrying alternative approach - direct REST...');

    // The Supabase REST API doesn't support raw SQL execution for security
    // We need to use the SQL Editor in dashboard or supabase CLI with proper credentials

    console.log('\n📝 To create the tables, please:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql');
    console.log('2. Copy the SQL from: /Users/benknight/Code/JusticeHub/supabase/migrations/20260108000001_partner_enrichment_schema.sql');
    console.log('3. Run it in the SQL Editor');
    console.log('\nOr use the Supabase CLI with the database password.');
    return;
  }

  console.log('✓ SQL executed successfully');
}

executeSql().catch(console.error);
