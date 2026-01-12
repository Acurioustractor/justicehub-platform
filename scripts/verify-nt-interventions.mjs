#!/usr/bin/env node
/**
 * Verify NT Interventions in Database
 *
 * Checks if the 10 intervention records (1 Oochiumpa + 9 NT) exist in alma_interventions table.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && line.trim() && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🔍 Verifying NT Interventions in Database');
console.log('═'.repeat(80));

// Query 1: Total count
console.log('\n📊 Query 1: Total Interventions Count\n');

const { data: allData, error: allError, count: totalCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true });

if (allError) {
  console.error('❌ Error querying total count:', allError.message);
} else {
  console.log(`✅ Total interventions in database: ${totalCount}`);
}

// Query 2: Get all intervention names
console.log('\n📊 Query 2: All Intervention Names\n');

const { data: nameData, error: nameError } = await supabase
  .from('alma_interventions')
  .select('id, name, type, geography, cultural_authority, consent_level')
  .order('created_at', { ascending: false });

if (nameError) {
  console.error('❌ Error fetching names:', nameError.message);
} else {
  console.log(`Found ${nameData.length} interventions:\n`);
  nameData.forEach((intervention, idx) => {
    console.log(`${idx + 1}. ${intervention.name}`);
    console.log(`   ID: ${intervention.id}`);
    console.log(`   Type: ${intervention.type}`);
    console.log(`   Geography: ${intervention.geography?.slice(0, 3).join(', ')}`);
    console.log(`   Authority: ${intervention.cultural_authority?.substring(0, 60)}...`);
    console.log(`   Consent: ${intervention.consent_level}`);
    console.log('');
  });
}

// Query 3: NT-specific interventions
console.log('\n📊 Query 3: NT-Specific Interventions\n');

const { data: ntData, error: ntError, count: ntCount } = await supabase
  .from('alma_interventions')
  .select('name, type, consent_level', { count: 'exact' })
  .contains('geography', ['NT']);

if (ntError) {
  console.error('❌ Error fetching NT interventions:', ntError.message);
} else {
  console.log(`✅ NT interventions found: ${ntCount}\n`);
  ntData.forEach((intervention, idx) => {
    console.log(`${idx + 1}. ${intervention.name} (${intervention.type}, ${intervention.consent_level})`);
  });
}

// Query 4: Oochiumpa specifically
console.log('\n📊 Query 4: Oochiumpa Record\n');

const { data: oochiumpaData, error: oochiumpaError } = await supabase
  .from('alma_interventions')
  .select('*')
  .eq('name', 'Oochiumpa Youth Services - Holistic Aboriginal Youth Support')
  .single();

if (oochiumpaError) {
  console.error('❌ Error fetching Oochiumpa:', oochiumpaError.message);
} else {
  console.log('✅ Oochiumpa record found:');
  console.log(`   ID: ${oochiumpaData.id}`);
  console.log(`   Name: ${oochiumpaData.name}`);
  console.log(`   Type: ${oochiumpaData.type}`);
  console.log(`   Evidence Level: ${oochiumpaData.evidence_level}`);
  console.log(`   Cultural Authority: ${oochiumpaData.cultural_authority}`);
  console.log(`   Consent Level: ${oochiumpaData.consent_level}`);
  console.log(`   Funding: ${oochiumpaData.current_funding}`);
}

// Query 5: Aboriginal-led programs
console.log('\n📊 Query 5: Aboriginal-Led Programs (Community Controlled)\n');

const { data: aboriginalData, error: aboriginalError, count: aboriginalCount } = await supabase
  .from('alma_interventions')
  .select('name, cultural_authority', { count: 'exact' })
  .eq('consent_level', 'Community Controlled');

if (aboriginalError) {
  console.error('❌ Error fetching Aboriginal-led:', aboriginalError.message);
} else {
  console.log(`✅ Community Controlled interventions: ${aboriginalCount}\n`);
  aboriginalData.forEach((intervention, idx) => {
    console.log(`${idx + 1}. ${intervention.name}`);
    console.log(`   Authority: ${intervention.cultural_authority}`);
    console.log('');
  });
}

// Query 6: Test the exact query from the frontend
console.log('\n📊 Query 6: Frontend Query Test (with evidence/outcomes counts)\n');

const { data: frontendData, error: frontendError, count: frontendCount } = await supabase
  .from('alma_interventions')
  .select(`
    *,
    evidence:alma_evidence(count),
    outcomes:alma_outcomes(count)
  `, { count: 'exact' });

if (frontendError) {
  console.error('❌ Frontend query error:', frontendError.message);
  console.error('   Details:', frontendError);
} else {
  console.log(`✅ Frontend query returned: ${frontendCount} interventions`);
  if (frontendData.length > 0) {
    console.log('\nFirst 3 records:');
    frontendData.slice(0, 3).forEach((intervention) => {
      console.log(`   - ${intervention.name}`);
      console.log(`     Evidence count: ${intervention.evidence?.[0]?.count || 0}`);
      console.log(`     Outcomes count: ${intervention.outcomes?.[0]?.count || 0}`);
    });
  }
}

console.log('\n' + '═'.repeat(80));
console.log('✅ Verification Complete\n');
