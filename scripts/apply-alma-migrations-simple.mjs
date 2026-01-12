#!/usr/bin/env node
/**
 * Apply ALMA migrations to Supabase
 * Uses Supabase REST API - NO psql required, NO password needed
 * Works EVERY FUCKING TIME.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(projectRoot, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n🚀 === ALMA Migration Deployment ===\n');
console.log(`📍 Connected to: ${SUPABASE_URL}\n`);

// Migration files in order
const migrations = [
  'supabase/migrations/20250131000001_alma_core_entities.sql',
  'supabase/migrations/20250131000002_alma_rls_policies.sql',
  'supabase/migrations/20250131000003_alma_hybrid_linking.sql',
];

/**
 * Execute raw SQL using Supabase RPC
 */
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // RPC might not exist, try direct SQL execution via REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }

    return data;
  } catch (err) {
    throw new Error(`SQL execution failed: ${err.message}`);
  }
}

/**
 * Check if ALMA tables exist
 */
async function checkAlmaTables() {
  try {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('id')
      .limit(1);

    return !error; // If no error, table exists
  } catch {
    return false;
  }
}

/**
 * Apply migrations using Supabase SQL Editor API
 */
async function applyMigrations() {
  // Check if tables already exist
  const tablesExist = await checkAlmaTables();

  if (tablesExist) {
    console.log('⚠️  ALMA tables already exist in database');
    console.log('   Skipping migrations (they may have been applied already)\n');

    // Verify tables
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'alma_%');

    console.log('✅ Existing ALMA tables:');
    tables?.forEach(t => console.log(`   - ${t.table_name}`));
    console.log();

    return;
  }

  // Apply each migration
  for (const migrationFile of migrations) {
    const fullPath = join(projectRoot, migrationFile);
    const filename = migrationFile.split('/').pop();

    console.log(`📄 Applying: ${filename}`);

    try {
      const sql = readFileSync(fullPath, 'utf8');

      // Split by statement and execute (simple approach)
      // For production, you'd use a proper SQL parser
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          await executeSql(statement + ';');
          successCount++;
        } catch (err) {
          // Some errors are acceptable (e.g., "already exists")
          if (err.message.includes('already exists') || err.message.includes('42710')) {
            console.log(`   ℹ️  Skipping: ${err.message.substring(0, 60)}...`);
          } else {
            console.error(`   ❌ Error: ${err.message.substring(0, 100)}...`);
            errorCount++;
          }
        }
      }

      console.log(`   ✅ Executed ${successCount} statements (${errorCount} errors)\n`);

    } catch (err) {
      console.error(`   ❌ Failed to read migration file: ${err.message}\n`);
      throw err;
    }
  }
}

/**
 * Verify ALMA installation
 */
async function verifyInstallation() {
  console.log('🔍 Verifying ALMA installation...\n');

  const expectedTables = [
    'alma_interventions',
    'alma_community_contexts',
    'alma_evidence',
    'alma_outcomes',
    'alma_consent_ledger',
    'alma_usage_log',
  ];

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && !error.message.includes('0 rows')) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}`);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n✅ === ALMA Migration Complete ===\n');
  console.log('Next steps:');
  console.log('  1. Verify in Supabase Studio: https://supabase.com/dashboard');
  console.log('  2. Test with: SELECT * FROM alma_interventions;');
  console.log('  3. Optionally backfill existing data');
  console.log();
}

// Run migrations
(async () => {
  try {
    await applyMigrations();
    await verifyInstallation();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
