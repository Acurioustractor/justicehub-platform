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

console.log('\n🔍 Checking Current NT Programs...\n');

const { data, error } = await supabase
  .from('alma_interventions')
  .select('name, type, consent_level, cultural_authority, geography, metadata')
  .order('name');

if (error) {
  console.error('Error fetching interventions:', error);
  process.exit(1);
}

const ntPrograms = (data || []).filter(i => i.geography && i.geography.includes('NT'));

console.log('📊 Total NT Programs:', ntPrograms.length, '\n');

console.log('=== ABORIGINAL-LED PROGRAMS ===');
const aboriginalLed = ntPrograms.filter(p => p.consent_level === 'Community Controlled');
console.log('Count:', aboriginalLed.length);
aboriginalLed.forEach(p => {
  console.log(`- ${p.name}`);
  console.log(`  Authority: ${p.cultural_authority || 'Unknown'}`);
  console.log(`  Type: ${p.type}\n`);
});

console.log('\n=== GOVERNMENT PROGRAMS ===');
const government = ntPrograms.filter(p => p.consent_level === 'Public Knowledge Commons');
console.log('Count:', government.length);
government.forEach(p => {
  console.log(`- ${p.name}`);
  console.log(`  Type: ${p.type}\n`);
});
