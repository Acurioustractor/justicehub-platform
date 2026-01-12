#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// Read .env.local
const envFile = readFileSync(join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
    .map(([key, ...values]) => [key, values.join('=')])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking for media sentiment tables...\n');

  const tables = [
    'alma_media_articles',
    'alma_government_programs',
    'alma_program_interventions'
  ];

  const results = {};

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: NOT FOUND`);
      console.log(`   Error: ${error.message}`);
      results[table] = false;
    } else {
      console.log(`✅ ${table}: EXISTS`);
      results[table] = true;
    }
  }

  console.log('\n📋 Migration status:');
  const allExist = Object.values(results).every(v => v);

  if (!allExist) {
    console.log('⚠️  Migration needs to be applied\n');
    console.log('📝 To apply migration:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new');
    console.log('2. Copy contents of: supabase/migrations/20260101000002_add_media_sentiment_tracking.sql');
    console.log('3. Paste and click "Run"\n');
  } else {
    console.log('✅ All tables exist - migration already applied!\n');
  }

  return allExist;
}

checkTables().catch(console.error);
