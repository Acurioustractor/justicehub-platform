/**
 * Apply Migration SQL Directly
 *
 * Uses pg library to connect directly to Postgres and run the migration
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  console.log('\n🚀 Applying Unified Profiles Migration\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20250123000001_create_unified_profiles_system.sql'
  );

  console.log('📖 Reading migration file...');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`   ${migrationSQL.length} characters loaded\n`);

  // Get database URL from environment
  const dbUrl = process.env.YJSF_SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('❌ Database URL not found in environment variables');
    console.log('   Looking for: YJSF_SUPABASE_DB_URL or DATABASE_URL\n');
    console.log('Alternative: Copy the SQL file and paste it into Supabase SQL Editor:');
    console.log(`   File: ${migrationPath}\n`);
    process.exit(1);
  }

  console.log('📡 Connecting to database...\n');

  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });

    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('⚙️  Executing migration...\n');

    const result = await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables were created...\n');

    const tablesToCheck = [
      'public_profiles',
      'art_innovation_profiles',
      'community_programs_profiles',
      'services_profiles'
    ];

    for (const table of tablesToCheck) {
      try {
        const checkResult = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [table]
        );

        if (checkResult.rows[0].exists) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table}`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }

    await client.end();

    console.log('\n═══════════════════════════════════════════════════\n');
    console.log('🎉 Migration Complete!\n');
    console.log('Next Steps:');
    console.log('  1. Run: npm run tsx src/scripts/migrate-to-unified-profiles.ts');
    console.log('  2. This will populate profiles for Benjamin & Nicholas\n');

  } catch (error: any) {
    console.log('❌ Error executing migration:', error.message);
    console.log('\n📋 Manual alternative:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log(`   2. Copy contents from: ${migrationPath}`);
    console.log('   3. Paste and run in SQL Editor\n');
    process.exit(1);
  }
}

applyMigration();
