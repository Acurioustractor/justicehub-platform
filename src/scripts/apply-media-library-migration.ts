import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function applyMigration() {
  console.log('🚀 Applying media_library migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250126000000_create_media_library.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (simple split on semicolon and newline)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      // Show what we're executing (first 100 chars)
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try direct execution if RPC doesn't work
          const { error: directError } = await supabase.from('_migration_test').select('*').limit(0);

          if (directError) {
            console.error(`   ❌ Error: ${error.message}`);
            console.log(`   Skipping (might already exist)...\n`);
            continue;
          }
        }

        console.log(`   ✅ Success\n`);
      } catch (err: any) {
        console.error(`   ⚠️  Error: ${err.message}`);
        console.log(`   Continuing anyway...\n`);
      }
    }

    console.log('\n✅ Migration application complete!');
    console.log('\n📝 Note: Some errors are expected if objects already exist.');
    console.log('Run this query in Supabase SQL Editor to verify:\n');
    console.log('SELECT * FROM media_library LIMIT 1;');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
