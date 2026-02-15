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

console.log('\n🔍 Finding and Removing Duplicate NT Programs\n');

const { data } = await supabase
  .from('alma_interventions')
  .select('id, name, type, consent_level, geography, created_at')
  .order('name');

const ntPrograms = (data || []).filter(i => i.geography && i.geography.includes('NT'));

// Group by name to find duplicates
const programsByName = {};
ntPrograms.forEach(p => {
  if (!programsByName[p.name]) {
    programsByName[p.name] = [];
  }
  programsByName[p.name].push(p);
});

// Find duplicates
const duplicates = Object.entries(programsByName).filter(([name, programs]) => programs.length > 1);

console.log(`Found ${duplicates.length} duplicate program names:\n`);

let removedCount = 0;

for (const [name, programs] of duplicates) {
  console.log(`📝 ${name} (${programs.length} copies)`);

  // Keep the oldest one (first created), delete the rest
  const sorted = programs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const toKeep = sorted[0];
  const toDelete = sorted.slice(1);

  console.log(`  ✅ Keeping: ${toKeep.id} (created ${toKeep.created_at})`);

  for (const dup of toDelete) {
    console.log(`  ❌ Deleting: ${dup.id} (created ${dup.created_at})`);
    const { error } = await supabase
      .from('alma_interventions')
      .delete()
      .eq('id', dup.id);

    if (error) {
      console.log(`     Error: ${error.message}`);
    } else {
      removedCount++;
    }
  }
  console.log('');
}

console.log(`\n✨ Removed ${removedCount} duplicate programs\n`);
