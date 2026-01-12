#!/usr/bin/env node
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
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔍 Checking ALMA Database...\n');

async function checkData() {
  const tables = [
    'alma_interventions',
    'alma_evidence',
    'alma_outcomes',
    'alma_community_contexts'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✓ ${table}: ${count || 0} records`);
    }
  }

  // Get a sample intervention
  const { data: sample, error: sampleError } = await supabase
    .from('alma_interventions')
    .select('name, type, consent_level')
    .limit(3);

  if (sample && sample.length > 0) {
    console.log('\n📋 Sample interventions:');
    sample.forEach(i => console.log(`  - ${i.name} (${i.type})`));
  } else {
    console.log('\n⚠️  No interventions found');
  }
}

checkData();
