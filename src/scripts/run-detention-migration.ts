#!/usr/bin/env npx ts-node
/**
 * Run Youth Detention Facilities Migration
 *
 * This script runs the migration SQL against Supabase to create
 * detention facilities tables and seed initial data.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runMigration() {
  console.log('============================================================');
  console.log('🏛️ RUNNING YOUTH DETENTION FACILITIES MIGRATION');
  console.log('============================================================\n');

  // Read the migration SQL
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20260107000002_youth_detention_facilities.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  // Split SQL into individual statements (split on semicolon followed by newline)
  const statements = sqlContent
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Extract first line for logging
    const firstLine = statement.split('\n')[0].substring(0, 60);

    try {
      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct query approach if rpc doesn't work
        throw error;
      }

      console.log(`✅ [${i + 1}/${statements.length}] ${firstLine}...`);
      successCount++;
    } catch (error: any) {
      // Some errors are expected (e.g., IF NOT EXISTS when table exists)
      if (error.message?.includes('already exists') ||
          error.code === '42P07' || // duplicate table
          error.code === '42710') { // duplicate object
        console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${firstLine}...`);
        successCount++;
      } else {
        console.log(`❌ [${i + 1}/${statements.length}] Failed: ${firstLine}...`);
        console.log(`   Error: ${error.message || error}`);
        errorCount++;
      }
    }
  }

  console.log('\n============================================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('============================================================');
  console.log(`Total statements: ${statements.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Some statements failed. Please review errors above.');
  }
}

// Alternative approach: Create tables using Supabase client
async function createTablesDirectly() {
  console.log('============================================================');
  console.log('🏛️ CREATING YOUTH DETENTION FACILITIES TABLES');
  console.log('============================================================\n');

  // Check if table already exists
  const { data: existingTables } = await supabase
    .from('youth_detention_facilities')
    .select('id')
    .limit(1);

  if (existingTables) {
    console.log('✅ youth_detention_facilities table already exists');

    // Check count
    const { count } = await supabase
      .from('youth_detention_facilities')
      .select('*', { count: 'exact', head: true });

    console.log(`   Contains ${count || 0} facilities`);
    return;
  }

  console.log('⚠️  Tables do not exist yet. Please run the SQL migration:');
  console.log('\n1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql');
  console.log('2. Copy the contents of supabase/migrations/20260107000002_youth_detention_facilities.sql');
  console.log('3. Paste and run in the SQL Editor');
  console.log('\nAlternatively, run: npx supabase db push');
}

async function main() {
  // Try to verify tables exist or provide instructions
  await createTablesDirectly();
}

main().catch(console.error);
