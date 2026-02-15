#!/usr/bin/env node
/**
 * Apply Database Migration Skill
 *
 * Usage: node scripts/apply-migration-skill.mjs <migration-file>
 * Example: node scripts/apply-migration-skill.mjs 20260102_alma_unification_links.sql
 *
 * This is the standardized migration applier used across the ACT ecosystem.
 */

import { readFileSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// Parse command line arguments
const migrationArg = process.argv[2];

if (!migrationArg) {
  console.error('❌ Usage: node scripts/apply-migration-skill.mjs <migration-file>');
  console.error('   Example: node scripts/apply-migration-skill.mjs 20260102_alma_unification_links.sql');
  process.exit(1);
}

// Resolve migration file path
const migrationFile = migrationArg.includes('/')
  ? join(root, migrationArg)
  : join(root, 'supabase/migrations', migrationArg);

console.log('\n🚀 Applying Migration');
console.log('═'.repeat(50));
console.log('');

// Read environment variables from .env.local
function loadEnv() {
  try {
    const envFile = readFileSync(join(root, '.env.local'), 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...values] = line.split('=');
        env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    return env;
  } catch (error) {
    console.error('❌ Could not read .env.local file');
    console.error('   Make sure .env.local exists in project root');
    process.exit(1);
  }
}

const env = loadEnv();

// Read migration file
console.log('📖 Reading migration file...');
try {
  var migrationSQL = readFileSync(migrationFile, 'utf-8');
  console.log(`   Migration: ${basename(migrationFile)}`);
  console.log(`   Size: ${migrationSQL.length.toLocaleString()} characters\n`);
} catch (error) {
  console.error(`❌ Could not read migration file: ${migrationFile}`);
  console.error(`   ${error.message}\n`);
  process.exit(1);
}

// Extract database connection info
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = env.SUPABASE_DB_PASSWORD;
const dbHost = env.SUPABASE_DB_HOST;

if (!supabaseUrl || !dbPassword) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_DB_PASSWORD\n');
  process.exit(1);
}

// Parse project ID from Supabase URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectId) {
  console.error('❌ Could not parse project ID from SUPABASE_URL');
  process.exit(1);
}

// Construct connection string
// Try direct connection first, fall back to pooler
const directHost = dbHost || `db.${projectId}.supabase.co`;
const poolerHost = `aws-0-us-east-1.pooler.supabase.com`;

async function tryConnection(host, port = 5432) {
  const connectionString = `postgresql://postgres:${dbPassword}@${host}:${port}/postgres`;
  console.log(`📡 Attempting connection to ${host}:${port}...`);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log(`✅ Connected successfully to ${host}\n`);
    return client;
  } catch (error) {
    console.log(`   ⚠️  Connection failed: ${error.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function applyMigration() {
  // Try direct connection first
  let client = await tryConnection(directHost, 5432);

  // If direct fails, try pooler
  if (!client) {
    console.log('   Trying pooler connection...\n');
    client = await tryConnection(poolerHost, 6543);
  }

  // If pooler fails, try alternate port
  if (!client) {
    console.log('   Trying alternate pooler port...\n');
    client = await tryConnection(poolerHost, 5432);
  }

  if (!client) {
    console.error('\n❌ Could not connect to database');
    console.error('\n📋 Manual alternative:');
    console.error('   1. Open Supabase Dashboard → SQL Editor');
    console.error('   2. https://supabase.com/dashboard/project/' + projectId + '/sql/new');
    console.error(`   3. Copy contents from: ${migrationFile}`);
    console.error('   4. Paste and run in SQL Editor\n');
    process.exit(1);
  }

  try {
    console.log('⚙️  Executing migration...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Extract table names from migration SQL for verification
    const tableMatches = migrationSQL.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi);
    const tablesToVerify = [...tableMatches].map(match => match[1]);

    // Extract ALTER TABLE additions
    const alterMatches = migrationSQL.matchAll(/ALTER\s+TABLE\s+([a-z_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi);
    const columnsToVerify = [...alterMatches].map(match => ({
      table: match[1],
      column: match[2]
    }));

    if (tablesToVerify.length > 0) {
      console.log('🔍 Verifying tables...');
      for (const table of tablesToVerify) {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [table]
        );

        if (result.rows[0].exists) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} - NOT FOUND`);
        }
      }
      console.log('');
    }

    if (columnsToVerify.length > 0) {
      console.log('🔍 Verifying columns...');
      for (const { table, column } of columnsToVerify) {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
          )`,
          [table, column]
        );

        if (result.rows[0].exists) {
          console.log(`   ✅ ${table}.${column}`);
        } else {
          console.log(`   ❌ ${table}.${column} - NOT FOUND`);
        }
      }
      console.log('');
    }

    await client.end();

    console.log('═'.repeat(50));
    console.log('🎉 Migration Complete!\n');

  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.error('');

    // Show SQL context around error if available
    if (error.position) {
      const pos = parseInt(error.position);
      const context = migrationSQL.substring(Math.max(0, pos - 100), Math.min(migrationSQL.length, pos + 100));
      console.error('📍 SQL context around error:');
      console.error('─'.repeat(50));
      console.error(context);
      console.error('─'.repeat(50));
      console.error('');
    }

    console.error('📋 Manual alternative:');
    console.error('   1. Open Supabase Dashboard → SQL Editor');
    console.error('   2. https://supabase.com/dashboard/project/' + projectId + '/sql/new');
    console.error(`   3. Copy contents from: ${migrationFile}`);
    console.error('   4. Paste and run in SQL Editor\n');

    await client.end();
    process.exit(1);
  }
}

applyMigration();
