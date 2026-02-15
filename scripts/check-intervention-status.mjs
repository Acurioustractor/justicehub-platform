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

console.log('\n🔍 Checking Intervention Status Fields...\n');

async function check() {
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('name, review_status, consent_level')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Sample of ${data.length} interventions:\n`);

  data.forEach((i, idx) => {
    console.log(`${idx + 1}. ${i.name}`);
    console.log(`   Review Status: ${i.review_status || 'NULL'}`);
    console.log(`   Consent Level: ${i.consent_level || 'NULL'}`);
    console.log('');
  });

  // Count by status
  const { data: counts } = await supabase
    .from('alma_interventions')
    .select('review_status, consent_level')
    .not('id', 'is', null);

  const statusCounts = {};
  const consentCounts = {};

  counts.forEach(row => {
    const status = row.review_status || 'NULL';
    const consent = row.consent_level || 'NULL';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    consentCounts[consent] = (consentCounts[consent] || 0) + 1;
  });

  console.log('\n📈 Status Distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  console.log('\n📈 Consent Level Distribution:');
  Object.entries(consentCounts).forEach(([consent, count]) => {
    console.log(`   ${consent}: ${count}`);
  });
}

check();
