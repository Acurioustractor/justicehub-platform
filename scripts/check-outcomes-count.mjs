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

console.log('\n📊 CHECKING OUTCOMES COVERAGE\n');

const { data: allPrograms, error } = await supabase
  .from('alma_interventions')
  .select('metadata, consent_level, geography, name');

if (error) {
  console.log('Error:', error);
  process.exit(1);
}

const withOutcomes = allPrograms.filter(p => {
  const metadata = p.metadata || {};
  return metadata.outcomes || metadata.outcomes_data || metadata.evaluation_report;
});

const aboriginal = withOutcomes.filter(p => p.consent_level === 'Community Controlled').length;

console.log(`Total programs in database: ${allPrograms.length}`);
console.log(`Programs with outcomes: ${withOutcomes.length}`);
console.log(`Aboriginal programs with outcomes: ${aboriginal}`);
console.log(`\n🎯 Target: 100+ programs with outcomes`);
console.log(`📈 Progress: ${withOutcomes.length}/100 (${Math.min(100, (withOutcomes.length/100*100)).toFixed(0)}%)`);

if (withOutcomes.length >= 100) {
  console.log(`\n✅ TARGET ACHIEVED: 100+ programs with documented outcomes!\n`);
} else {
  console.log(`\n📈 Almost there: ${100 - withOutcomes.length} more programs needed\n`);
}

// State breakdown
const stateBreakdown = {};
withOutcomes.forEach(p => {
  if (p.geography && Array.isArray(p.geography)) {
    p.geography.forEach(state => {
      if (!stateBreakdown[state]) stateBreakdown[state] = 0;
      stateBreakdown[state]++;
    });
  }
});

console.log(`📊 Outcomes Coverage by State:\n`);
Object.keys(stateBreakdown).sort().forEach(state => {
  console.log(`${state}: ${stateBreakdown[state]} programs`);
});
console.log('');
