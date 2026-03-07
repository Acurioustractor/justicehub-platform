#!/usr/bin/env node
/**
 * ALMA Cohort Cleanup
 *
 * Removes geography terms that have leaked into target_cohort TEXT[] arrays.
 * Pure SQL array manipulation — zero AI cost.
 *
 * Usage:
 *   node scripts/alma-cleanup-cohorts.mjs           # dry-run
 *   node scripts/alma-cleanup-cohorts.mjs --apply    # write to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

// Geography terms to remove from target_cohort
const GEOGRAPHY_TERMS = [
  // State/territory abbreviations
  'QLD', 'NSW', 'VIC', 'WA', 'SA', 'NT', 'ACT', 'TAS',
  // State/territory full names
  'Queensland', 'Victoria', 'New South Wales', 'Western Australia',
  'South Australia', 'Northern Territory', 'Tasmania',
  'Australian Capital Territory',
  // Scope terms
  'National', 'Statewide', 'State-wide', 'Nationwide', 'Australia-wide',
  // Major cities
  'Perth', 'Melbourne', 'Sydney', 'Brisbane', 'Adelaide',
  'Alice Springs', 'Darwin', 'Hobart', 'Canberra', 'Cairns',
  'Townsville', 'Gold Coast', 'Geelong', 'Newcastle', 'Wollongong',
  // Regional qualifiers
  'Regional VIC', 'Regional NSW', 'Regional QLD', 'Regional WA',
  'Regional SA', 'Regional NT', 'Regional TAS',
  'Rural', 'Remote', 'Metropolitan', 'Urban',
  'Regional', 'Outer metropolitan',
];

console.log('\n🧹 ALMA Cohort Cleanup');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}`);
console.log(`Geography terms to remove: ${GEOGRAPHY_TERMS.length}\n`);

async function main() {
  // Get all interventions with target_cohort
  const { data: interventions, error } = await supabase
    .from('alma_interventions')
    .select('id, name, target_cohort')
    .not('target_cohort', 'is', null);

  if (error) throw error;

  const withCohort = interventions.filter(
    (i) => i.target_cohort && i.target_cohort.length > 0
  );
  console.log(`Interventions with target_cohort: ${withCohort.length}`);

  // Scan for geography pollution
  let totalPolluted = 0;
  let totalTermsRemoved = 0;
  const changes = [];

  for (const intervention of withCohort) {
    const original = intervention.target_cohort;
    const cleaned = original.filter(
      (term) => !GEOGRAPHY_TERMS.some(
        (geo) => term.toLowerCase() === geo.toLowerCase()
      )
    );

    const removed = original.length - cleaned.length;
    if (removed > 0) {
      totalPolluted++;
      totalTermsRemoved += removed;
      const removedTerms = original.filter(
        (term) => GEOGRAPHY_TERMS.some(
          (geo) => term.toLowerCase() === geo.toLowerCase()
        )
      );
      changes.push({
        id: intervention.id,
        name: intervention.name,
        before: original,
        after: cleaned.length > 0 ? cleaned : null,
        removed: removedTerms,
      });
    }
  }

  console.log(`\nPolluted records: ${totalPolluted}`);
  console.log(`Total geography terms to remove: ${totalTermsRemoved}`);

  if (changes.length === 0) {
    console.log('\n✅ No geography pollution found!');
    return;
  }

  // Show samples
  console.log('\nSample changes:');
  for (const c of changes.slice(0, 10)) {
    console.log(`  "${c.name}":`);
    console.log(`    before: [${c.before.join(', ')}]`);
    console.log(`    after:  [${(c.after || []).join(', ')}]`);
    console.log(`    removed: [${c.removed.join(', ')}]`);
  }

  if (applyMode) {
    console.log(`\nApplying ${changes.length} cleanups...`);
    let applied = 0;
    let errors = 0;

    for (const change of changes) {
      const { error: updateErr } = await supabase
        .from('alma_interventions')
        .update({ target_cohort: change.after })
        .eq('id', change.id);

      if (updateErr) {
        console.error(`  ✗ ${change.name}: ${updateErr.message}`);
        errors++;
      } else {
        applied++;
      }
    }

    console.log(`\n✅ Applied: ${applied}, Errors: ${errors}`);
  } else {
    console.log('\nRun with --apply to write changes.');
  }

  // Stats summary
  const beforeEmptyCount = changes.filter((c) => c.after === null).length;
  console.log(`\nRecords that will become null (all terms were geography): ${beforeEmptyCount}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
