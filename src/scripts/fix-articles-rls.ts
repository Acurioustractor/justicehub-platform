import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixArticlesRLS() {
  console.log('🔧 Fixing articles table RLS policies...');

  const sql = readFileSync('supabase/migrations/20250206000001_fix_articles_rls_policies.sql', 'utf-8');

  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 SQL to run manually:');
    console.log(sql);
    process.exit(1);
  }

  console.log('✅ RLS policies updated successfully!');
}

fixArticlesRLS();
