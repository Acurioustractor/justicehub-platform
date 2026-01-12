#!/usr/bin/env node
/**
 * Apply ALMA Unification Migration
 * Uses Supabase REST API - NO psql required
 * Based on the proven pattern from apply-alma-migrations-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read .env.local manually (same pattern as apply-alma-migration.mjs)
const env = readFileSync(join(projectRoot, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

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

console.log('\n🚀 === ALMA Unification Migration ===\n');
console.log(`📍 Connected to: ${SUPABASE_URL}\n`);

const migrationFile = 'supabase/migrations/20260102_alma_unification_links.sql';

/**
 * Execute SQL using Supabase client
 * This bypasses direct PostgreSQL connection and uses Supabase REST API
 */
async function executeSqlStatement(sql) {
  // Use Supabase's query builder to execute raw SQL via PostgREST
  // This works because we're using the service role key which bypasses RLS
  const { data, error } = await supabase.rpc('exec', { sql: sql });

  if (error) {
    // If exec RPC doesn't exist, we need to handle differently
    // For DDL operations, we can use the Management API or direct HTTP
    throw error;
  }

  return data;
}

/**
 * Apply migration file
 */
async function applyMigration() {
  const fullPath = join(projectRoot, migrationFile);
  const filename = migrationFile.split('/').pop();

  console.log(`📄 Applying: ${filename}\n`);

  try {
    const sql = readFileSync(fullPath, 'utf8');
    console.log(`📖 Read ${sql.length} characters from migration file\n`);

    // Split SQL into individual statements
    // More intelligent splitting that handles CREATE TABLE, CREATE FUNCTION, etc.
    const statements = [];
    let currentStatement = '';
    let inFunction = false;

    const lines = sql.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comment-only lines
      if (trimmedLine.startsWith('--') || !trimmedLine) {
        continue;
      }

      // Track if we're inside a function definition
      if (trimmedLine.match(/CREATE.*FUNCTION/i) || trimmedLine.match(/\$\$/)) {
        inFunction = !inFunction;
      }

      currentStatement += line + '\n';

      // End of statement: semicolon not inside a function
      if (trimmedLine.endsWith(';') && !inFunction) {
        const cleanStatement = currentStatement
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .replace(/--.*$/gm, '') // Remove single-line comments
          .trim();

        if (cleanStatement && cleanStatement !== ';') {
          statements.push(cleanStatement);
        }
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`⚙️  Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');

      try {
        // For CREATE TABLE, CREATE INDEX, ALTER TABLE, etc.
        // We need to use a different approach since rpc might not work

        // Try using the postgres HTTP endpoint directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql: statement + ';' })
        });

        if (response.ok) {
          console.log(`   ✅ [${i+1}/${statements.length}] ${preview}...`);
          successCount++;
        } else {
          const errorText = await response.text();

          // Check if it's an acceptable error
          if (errorText.includes('already exists') ||
              errorText.includes('42710') ||
              errorText.includes('42P07')) {
            console.log(`   ℹ️  [${i+1}/${statements.length}] Already exists: ${preview}...`);
            skipCount++;
          } else {
            console.error(`   ❌ [${i+1}/${statements.length}] ${errorText.substring(0, 100)}`);
            errorCount++;
          }
        }
      } catch (err) {
        const errMsg = err.message || String(err);

        if (errMsg.includes('already exists') || errMsg.includes('42710')) {
          console.log(`   ℹ️  [${i+1}/${statements.length}] Already exists: ${preview}...`);
          skipCount++;
        } else {
          console.error(`   ❌ [${i+1}/${statements.length}] ${errMsg.substring(0, 100)}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ℹ️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. Check logs above.\n');
    }

  } catch (err) {
    console.error(`❌ Failed to read migration file: ${err.message}\n`);
    throw err;
  }
}

/**
 * Verify new tables exist
 */
async function verifyInstallation() {
  console.log('🔍 Verifying new tables...\n');

  const expectedTables = [
    'article_related_interventions',
    'article_related_evidence',
    'story_related_interventions',
    'alma_intervention_profiles',
  ];

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && !error.message.includes('0 rows')) {
        console.log(`   ❌ ${tableName}: Not accessible`);
      } else {
        console.log(`   ✅ ${tableName}`);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n✅ === Migration Complete ===\n');
}

// Run migration
(async () => {
  try {
    await applyMigration();
    await verifyInstallation();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
