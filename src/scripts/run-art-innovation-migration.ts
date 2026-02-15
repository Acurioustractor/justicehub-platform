/**
 * Run the art_innovation table migration directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('\n🔧 Running Art & Innovation Migration\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250122000002_create_art_innovation_table.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('Migration file loaded:');
  console.log(`  ${migrationPath}\n`);
  console.log('Executing SQL...\n');

  // Execute the migration
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.log('❌ Migration failed:');
    console.log(`   ${error.message}\n`);
    console.log('Trying alternative method...\n');

    // Try executing via raw query
    const { error: rawError } = await (supabase as any).from('_').select('*').maybeSingle();

    console.log('Please run the migration manually in Supabase Dashboard:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Paste the contents of:');
    console.log(`   ${migrationPath}`);
    console.log('4. Run the query\n');
    return;
  }

  console.log('✅ Migration completed successfully!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  Run: npm run tsx src/scripts/add-contained-project.ts\n');
}

runMigration().catch(console.error);
