#!/usr/bin/env node
/**
 * Apply a SQL migration to the remote Supabase database
 * Usage: node scripts/apply-migration.mjs <migration-file-path>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/apply-migration.mjs <migration-file-path>');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

console.log(`\n📦 Applying migration: ${migrationFile}`);
console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('⚡ Executing SQL...\n');

    // Execute the migration SQL
    // Note: Supabase JS client doesn't have direct SQL execution
    // We need to use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      // Try alternative approach using psql via connection string
      console.log('ℹ️  REST API not available, trying direct connection...\n');

      // We'll need to execute via psql command
      console.log('⚠️  To apply this migration, run:');
      console.log(`\n   psql "${supabaseUrl.replace('https://', 'postgresql://postgres:PASSWORD@').replace('.supabase.co', '.supabase.co:6543/postgres')}" < ${migrationFile}\n`);
      console.log('   Or copy the SQL and run it in the Supabase SQL Editor\n');
      return;
    }

    const data = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log(data);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Print SQL for manual execution
    console.log('\n📋 SQL to apply manually in Supabase SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));

    process.exit(1);
  }
}

applyMigration();
