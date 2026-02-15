#!/usr/bin/env node
/**
 * Apply ALMA migration to add consent_level to ingestion_jobs table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function applyMigration() {
  console.log('Applying ALMA migration to add consent_level columns...\n');

  // Check if columns already exist
  const { data: existingColumns, error: checkError } = await supabase
    .from('alma_ingestion_jobs')
    .select('*')
    .limit(1);

  if (checkError) {
    console.error('Error checking table:', checkError.message);
    return;
  }

  if (existingColumns && existingColumns.length > 0) {
    const firstRow = existingColumns[0];
    if ('consent_level' in firstRow) {
      console.log('✅ Migration already applied (consent_level column exists)');
      return;
    }
  }

  // Apply migration using RPC
  console.log('Executing SQL migration...');

  const migrationSQL = `
-- Add consent_level column to alma_ingestion_jobs table
ALTER TABLE alma_ingestion_jobs
ADD COLUMN IF NOT EXISTS consent_level TEXT DEFAULT 'Public Knowledge Commons';

-- Add cultural_authority flag for Indigenous sources
ALTER TABLE alma_ingestion_jobs
ADD COLUMN IF NOT EXISTS cultural_authority BOOLEAN DEFAULT FALSE;

-- Add category column for organizing sources
ALTER TABLE alma_ingestion_jobs
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alma_ingestion_jobs_consent_level ON alma_ingestion_jobs(consent_level);
CREATE INDEX IF NOT EXISTS idx_alma_ingestion_jobs_category ON alma_ingestion_jobs(category);
  `.trim();

  try {
    // Use rpc to execute SQL (requires a helper function in the database)
    // Since we might not have such a function, let's try direct query
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
      console.log('='.repeat(60));
      console.log(migrationSQL);
      console.log('='.repeat(60));
    } else {
      console.log('✅ Migration applied successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(migrationSQL);
    console.log('='.repeat(60));
  }
}

applyMigration();
