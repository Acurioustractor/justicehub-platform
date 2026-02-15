#!/usr/bin/env node
/**
 * Publish NT Interventions
 *
 * Updates review_status to 'Published' for all NT interventions
 * so they're visible via RLS policies.
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
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📝 Publishing NT Interventions');
console.log('═'.repeat(80));

// Get all interventions
const { data: allInterventions, error: fetchError } = await supabase
  .from('alma_interventions')
  .select('id, name, geography, review_status, consent_level');

if (fetchError) {
  console.error('❌ Error fetching interventions:', fetchError.message);
  process.exit(1);
}

// Filter for NT
const ntInterventions = allInterventions.filter((i) => {
  const geography = i.geography;
  return geography && Array.isArray(geography) && geography.includes('NT');
});

console.log(`\nFound ${ntInterventions.length} NT interventions:\n`);

for (const intervention of ntInterventions) {
  console.log(`   ${intervention.name}`);
  console.log(`   Current: ${intervention.review_status} / ${intervention.consent_level}`);

  if (intervention.review_status !== 'Published') {
    const { error: updateError } = await supabase
      .from('alma_interventions')
      .update({ review_status: 'Published' })
      .eq('id', intervention.id);

    if (updateError) {
      console.log(`   ❌ Error updating: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated to: Published`);
    }
  } else {
    console.log(`   ✓ Already published`);
  }

  console.log('');
}

console.log('═'.repeat(80));
console.log('✅ NT Interventions Published\n');
