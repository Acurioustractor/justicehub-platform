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
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔍 Checking Metadata Fields...\n');

async function check() {
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('name, metadata, target_cohort, geography, operating_organization')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Sample of ${data.length} interventions:\n`);

  data.forEach((i, idx) => {
    console.log(`${idx + 1}. ${i.name}`);
    console.log(`   Metadata: ${JSON.stringify(i.metadata)}`);
    console.log(`   Target Cohort (column): ${i.target_cohort}`);
    console.log(`   Geography (column): ${i.geography}`);
    console.log(`   Operating Organization: ${i.operating_organization || 'NULL'}`);
    console.log('');
  });

  // Count interventions with state in metadata
  const { data: withState } = await supabase
    .from('alma_interventions')
    .select('metadata')
    .not('metadata->>state', 'is', null);

  console.log(`\n📈 Interventions with state in metadata: ${withState?.length || 0}/120`);

  // Show unique states
  if (withState && withState.length > 0) {
    const states = new Set();
    withState.forEach(row => {
      if (row.metadata?.state) states.add(row.metadata.state);
    });
    console.log(`   Unique states: ${Array.from(states).join(', ')}`);
  }
}

check();
