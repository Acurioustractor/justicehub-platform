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

console.log('\n📊 IDENTIFYING QLD PROGRAMS FOR ENRICHMENT\n');

// Get all QLD programs without outcomes
const { data: qldPrograms } = await supabase
  .from('alma_interventions')
  .select('id, name, type, metadata, consent_level')
  .contains('geography', ['QLD'])
  .order('name');

const withoutOutcomes = qldPrograms.filter(p => {
  const metadata = p.metadata || {};
  return !(metadata.outcomes || metadata.outcomes_data || metadata.evaluation_report);
});

console.log(`Total QLD programs: ${qldPrograms.length}`);
console.log(`QLD programs without outcomes: ${withoutOutcomes.length}`);
console.log(`\n📋 QLD PROGRAMS BY TYPE (without outcomes):\n`);

// Group by type
const byType = {};
withoutOutcomes.forEach(p => {
  const type = p.type || 'Unknown';
  if (!byType[type]) byType[type] = [];
  byType[type].push(p);
});

Object.keys(byType).sort().forEach(type => {
  console.log(`\n${type} (${byType[type].length} programs):`);
  byType[type].slice(0, 5).forEach(p => {
    console.log(`  - ${p.name} [${p.consent_level}]`);
  });
  if (byType[type].length > 5) {
    console.log(`  ... and ${byType[type].length - 5} more`);
  }
});

// Output program names for enrichment targeting
console.log('\n\n📝 FIRST 50 QLD PROGRAMS FOR BATCH ENRICHMENT:\n');
withoutOutcomes.slice(0, 50).forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.type})`);
});
