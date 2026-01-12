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

const { data } = await supabase
  .from('alma_interventions')
  .select('name, metadata, consent_level, geography')
  .order('name');

const without = data.filter(p => {
  const metadata = p.metadata || {};
  return !(metadata.outcomes || metadata.outcomes_data || metadata.evaluation_report);
});

console.log(`\nPrograms WITHOUT outcomes: ${without.length}/${data.length}\n`);

console.log('Aboriginal programs WITHOUT outcomes (first 15):');
without.filter(p => p.consent_level === 'Community Controlled').slice(0, 15).forEach(p => {
  console.log(`  - ${p.name} (${(p.geography || []).join(', ')})`);
});

console.log('\nGovernment/NGO programs WITHOUT outcomes (first 15):');
without.filter(p => p.consent_level !== 'Community Controlled').slice(0, 15).forEach(p => {
  console.log(`  - ${p.name} (${(p.geography || []).join(', ')})`);
});
