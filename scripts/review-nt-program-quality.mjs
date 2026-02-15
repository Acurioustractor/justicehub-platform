#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Reviewing NT Program Data Quality\n');

const { data, error } = await supabase
  .from('alma_interventions')
  .select('*')
  .order('name');

if (error) {
  console.error('Error fetching interventions:', error);
  process.exit(1);
}

const ntPrograms = (data || []).filter(i => i.geography && i.geography.includes('NT'));

console.log(`📊 Total NT Programs: ${ntPrograms.length}\n`);

// Check data completeness
const fields = [
  'description',
  'target_cohort',
  'geography',
  'evidence_level',
  'cultural_authority',
  'consent_level',
  'harm_risk_level',
  'current_funding',
  'type',
  'metadata',
  'website',
];

console.log('=== DATA COMPLETENESS ===\n');

const aboriginalLed = ntPrograms.filter(p => p.consent_level === 'Community Controlled');
const government = ntPrograms.filter(p => p.consent_level === 'Public Knowledge Commons');

console.log('ABORIGINAL-LED PROGRAMS:\n');
aboriginalLed.forEach(p => {
  const metadata = p.metadata || {};
  const issues = [];

  if (!p.description || p.description.length < 100) issues.push('Short/missing description');
  if (!p.website) issues.push('No website');
  if (!metadata.source) issues.push('No source attribution');
  if (!metadata.programs && !metadata.outcomes) issues.push('No program details or outcomes');
  if (!p.target_cohort || p.target_cohort.length === 0) issues.push('No target cohort');

  const status = issues.length === 0 ? '✅' : '⚠️';
  console.log(`${status} ${p.name}`);
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  console.log('');
});

console.log('\nGOVERNMENT PROGRAMS:\n');
government.forEach(p => {
  const metadata = p.metadata || {};
  const issues = [];

  if (!p.description || p.description.length < 100) issues.push('Short/missing description');
  if (!p.website) issues.push('No website');
  if (!metadata.source) issues.push('No source attribution');
  if (!metadata.outcomes && !metadata.participants_2023) issues.push('No outcomes data');
  if (!p.target_cohort || p.target_cohort.length === 0) issues.push('No target cohort');

  const status = issues.length === 0 ? '✅' : '⚠️';
  console.log(`${status} ${p.name}`);
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  console.log('');
});

console.log('\n=== KEY HIGHLIGHTS (Programs with Outcomes Data) ===\n');

ntPrograms.forEach(p => {
  const metadata = p.metadata || {};
  if (metadata.outcomes || metadata.comparison_to_oochiumpa) {
    console.log(`🎯 ${p.name}`);
    console.log(`   Type: ${p.type}`);
    console.log(`   Authority: ${p.cultural_authority}`);
    if (metadata.outcomes) console.log(`   Outcomes: ${metadata.outcomes}`);
    if (metadata.comparison_to_oochiumpa) console.log(`   Comparison: ${metadata.comparison_to_oochiumpa}`);
    if (metadata.funding) console.log(`   Funding: ${metadata.funding}`);
    console.log('');
  }
});
