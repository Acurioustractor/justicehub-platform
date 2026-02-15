#!/usr/bin/env node

/**
 * Apply ALMA Learning System Migration
 *
 * Applies the learning system tables to the JusticeHub database.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('📊 Applying ALMA Learning System Migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20260104000001_alma_learning_system.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.startsWith('--')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (e.g., table already exists, role doesn't exist)
        if (error.message.includes('already exists') ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  Skipped (${i + 1}/${statements.length}): ${error.message.substring(0, 100)}`);
        } else {
          console.error(`❌ Error (${i + 1}/${statements.length}):`, error.message.substring(0, 200));
          errorCount++;
        }
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ Executed ${successCount} statements...`);
        }
      }
    } catch (err) {
      console.error(`❌ Exception (${i + 1}/${statements.length}):`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📝 Total: ${statements.length}`);

  // Verify tables were created
  console.log('\n🔍 Verifying tables...');

  const tables = [
    'alma_extraction_history',
    'alma_learning_patterns',
    'alma_quality_metrics',
    'alma_human_feedback',
    'alma_extraction_strategies'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: exists`);
    }
  }

  console.log('\n✅ Migration complete!\n');
}

applyMigration().catch(console.error);
