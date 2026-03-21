#!/usr/bin/env node
/**
 * Link orphan interventions (those without any outcome links) to
 * appropriate alma_outcomes based on their intervention type.
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env
const envFile = readFileSync(
  new URL('../.env.local', import.meta.url),
  'utf-8'
);
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const eq = l.indexOf('=');
      return [l.slice(0, eq), l.slice(eq + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping: intervention type -> outcome keyword patterns
const TYPE_OUTCOME_MAP = {
  'Wraparound Support': ['mental health', 'family', 'community safety', 'wellbeing'],
  'Prevention': ['diversion', 'recidiv', 'reoffend', 'community safety'],
  'Cultural Connection': ['cultural', 'recidiv', 'reoffend'],
  'Community-Led': ['community', 'cultural', 'recidiv', 'reoffend'],
  'Justice Reinvestment': ['cost', 'economic', 'detention', 'incarceration', 'recidiv', 'reoffend'],
  'Therapeutic': ['mental health', 'substance', 'drug', 'alcohol', 'recidiv', 'reoffend'],
  'Early Intervention': ['diversion', 'education', 'school', 'recidiv', 'reoffend'],
  'Family Strengthening': ['family', 'mental health', 'wellbeing'],
  'Education/Employment': ['education', 'school', 'employment', 'job', 'training'],
  'Diversion': ['diversion', 'detention', 'incarceration', 'pretrial'],
};

async function main() {
  console.log('Fetching alma_outcomes...');
  const { data: outcomes, error: oErr } = await supabase
    .from('alma_outcomes')
    .select('id, name');
  if (oErr) throw oErr;
  console.log(`  Found ${outcomes.length} outcome types`);

  // Build type -> outcome IDs mapping
  const typeOutcomeIds = {};
  for (const [type, keywords] of Object.entries(TYPE_OUTCOME_MAP)) {
    const matched = outcomes.filter((o) =>
      keywords.some((kw) => o.name.toLowerCase().includes(kw.toLowerCase()))
    );
    typeOutcomeIds[type] = matched.map((o) => o.id);
    console.log(`  ${type}: ${matched.length} outcomes matched`);
    for (const m of matched) {
      console.log(`    - ${m.name}`);
    }
  }

  // Get all intervention IDs already linked
  console.log('\nFetching existing intervention_outcome links...');
  const { data: existingLinks, error: elErr } = await supabase
    .from('alma_intervention_outcomes')
    .select('intervention_id');
  if (elErr) throw elErr;
  const linkedIds = new Set(existingLinks.map((l) => l.intervention_id));
  console.log(`  ${linkedIds.size} interventions already linked`);

  // Get all non-ai_generated interventions
  console.log('Fetching all verified interventions...');
  const { data: interventions, error: iErr } = await supabase
    .from('alma_interventions')
    .select('id, type, name')
    .neq('verification_status', 'ai_generated');
  if (iErr) throw iErr;
  console.log(`  ${interventions.length} total verified interventions`);

  // Filter to orphans
  const orphans = interventions.filter((i) => !linkedIds.has(i.id));
  console.log(`  ${orphans.length} orphan interventions (no outcome links)\n`);

  if (orphans.length === 0) {
    console.log('No orphans to link. Done!');
    return;
  }

  // Build insert rows
  const rows = [];
  const countsByType = {};

  for (const intervention of orphans) {
    const outcomeIds = typeOutcomeIds[intervention.type] || [];
    if (outcomeIds.length === 0) {
      console.warn(`  WARNING: No outcome mapping for type "${intervention.type}" (${intervention.name})`);
      continue;
    }
    countsByType[intervention.type] = (countsByType[intervention.type] || 0) + 1;
    for (const outcome_id of outcomeIds) {
      rows.push({ intervention_id: intervention.id, outcome_id });
    }
  }

  console.log(`Inserting ${rows.length} intervention-outcome links...`);
  console.log('Counts by type:');
  for (const [type, count] of Object.entries(countsByType).sort((a, b) => b[1] - a[1])) {
    const numOutcomes = typeOutcomeIds[type]?.length || 0;
    console.log(`  ${type}: ${count} interventions x ${numOutcomes} outcomes = ${count * numOutcomes} links`);
  }

  // Batch insert in chunks of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('alma_intervention_outcomes')
      .upsert(batch, { onConflict: 'intervention_id,outcome_id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      // Fallback: insert one by one
      for (const row of batch) {
        const { error: sErr } = await supabase
          .from('alma_intervention_outcomes')
          .upsert(row, { onConflict: 'intervention_id,outcome_id', ignoreDuplicates: true });
        if (sErr) skipped++;
        else inserted++;
      }
    } else {
      inserted += data?.length || batch.length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data?.length || batch.length} rows`);
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped/errors: ${skipped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
