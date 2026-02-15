/**
 * Run Migration Directly via SQL
 *
 * This bypasses Supabase CLI and runs migrations directly using the service key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('\n🚀 Running Migration: Unified Profiles System\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/20250123000001_create_unified_profiles_system.sql');

  console.log('Reading migration file...');
  console.log(`Path: ${migrationPath}\n`);

  let migrationSQL: string;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);
  } catch (error: any) {
    console.log('❌ Error reading migration file:', error.message);
    process.exit(1);
  }

  // Execute migration
  console.log('Executing migration SQL...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: migrationSQL
  });

  // If exec_sql doesn't exist, try direct query
  if (error && error.message?.includes('exec_sql')) {
    console.log('⚠️  exec_sql RPC not available, trying direct execution...\n');

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip DO blocks and RAISE NOTICE (informational only)
      if (statement.includes('RAISE NOTICE')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error: stmtError } = await supabase.rpc('exec', {
        query: statement + ';'
      });

      if (stmtError) {
        console.log(`❌ Error on statement ${i + 1}:`, stmtError.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════\n');
    console.log('Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}\n`);

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!\n');
    } else {
      console.log('⚠️  Migration completed with errors\n');
    }
  } else if (error) {
    console.log('❌ Migration failed:', error.message);
    console.log('\nFull error:', JSON.stringify(error, null, 2));
    process.exit(1);
  } else {
    console.log('✅ Migration executed successfully!\n');
    console.log('═══════════════════════════════════════════════════\n');
  }

  // Verify tables were created
  console.log('Verifying tables...\n');

  const tablesToCheck = [
    'public_profiles',
    'art_innovation_profiles',
    'community_programs_profiles',
    'services_profiles',
    'article_related_art',
    'article_related_programs'
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: Not accessible (${error.message})`);
    } else {
      console.log(`✅ ${table}: Available`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('🎯 Next Steps:');
  console.log('  1. Run: npm run script migrate-to-unified-profiles.ts');
  console.log('  2. This will create profiles for Benjamin & Nicholas');
  console.log('  3. And link them to CONTAINED\n');
}

runMigration()
  .then(() => {
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
