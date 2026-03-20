#!/usr/bin/env node
/**
 * Find and deduplicate ALMA interventions with the same name.
 * Keeps the one with more data, merges evidence/findings, deactivates duplicates.
 *
 * Usage: node scripts/fix-duplicate-interventions.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.argv.includes('--dry-run');

function scoreIntervention(i) {
  let s = 0;
  if (i.description?.length > 50) s += 3;
  if (i.operating_organization_id) s += 3;
  if (i.evidence_level && !i.evidence_level.includes('Untested')) s += 2;
  if (i.website) s += 1;
  if (i.target_cohort) s += 1;
  if (i.implementation_cost) s += 1;
  if (i.gs_entity_id) s += 2;
  return s;
}

async function main() {
  console.log(`Duplicate intervention merger${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Get all verified interventions
  const { data: interventions } = await sb
    .from('alma_interventions')
    .select('*')
    .neq('verification_status', 'ai_generated');

  // Group by lowercase name
  const nameMap = new Map();
  for (const i of interventions || []) {
    const key = i.name?.toLowerCase().trim();
    if (!key) continue;
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(i);
  }

  const duplicates = [...nameMap.entries()].filter(([, group]) => group.length > 1);
  console.log(`Found ${duplicates.length} duplicate name groups\n`);

  let totalMerged = 0;

  for (const [name, group] of duplicates) {
    // Check if they're truly duplicates (same org) or distinct programs
    const orgIds = new Set(group.map(i => i.operating_organization_id).filter(Boolean));
    const orgs = new Set(group.map(i => i.operating_organization).filter(Boolean));

    console.log(`"${name}" (${group.length} copies):`);
    for (const i of group) {
      console.log(`  - id:${i.id} org:"${i.operating_organization || 'none'}" evidence:${i.evidence_level?.split(' ')[0] || 'null'} score:${scoreIntervention(i)}`);
    }

    // If different orgs, these are distinct programs — skip
    if (orgIds.size > 1 || orgs.size > 1) {
      console.log(`  → SKIP: different organizations (${[...orgs].join(', ')})`);
      console.log('');
      continue;
    }

    // Same org (or no org) — merge
    group.sort((a, b) => scoreIntervention(b) - scoreIntervention(a));
    const keep = group[0];
    const dupes = group.slice(1);

    console.log(`  → KEEP: id:${keep.id} (score: ${scoreIntervention(keep)})`);

    // Reassign evidence, findings, media, stories pointing to dupes
    const linkTables = [
      { table: 'alma_evidence', col: 'intervention_id' },
      { table: 'alma_research_findings', col: 'intervention_id' },
      { table: 'alma_media_articles', col: 'intervention_id' },
      { table: 'alma_stories', col: 'intervention_id' },
      { table: 'justice_funding', col: 'alma_intervention_id' },
    ];

    for (const dupe of dupes) {
      for (const { table, col } of linkTables) {
        try {
          const { data } = await sb
            .from(table)
            .select('id')
            .eq(col, dupe.id);
          if (data?.length > 0) {
            if (!DRY_RUN) {
              await sb.from(table).update({ [col]: keep.id }).eq(col, dupe.id);
            }
            console.log(`  Reassigned ${data.length} ${table} records`);
          }
        } catch {
          // skip if table/col doesn't exist
        }
      }

      // Mark duplicate as ai_generated (our way of soft-deleting)
      if (!DRY_RUN) {
        await sb
          .from('alma_interventions')
          .update({ verification_status: 'ai_generated', metadata: { ...(dupe.metadata || {}), merged_into: keep.id } })
          .eq('id', dupe.id);
      }
      console.log(`  Marked duplicate ${dupe.id} as ai_generated`);
      totalMerged++;
    }
    console.log('');
  }

  console.log('Results:');
  console.log(`  Duplicate groups: ${duplicates.length}`);
  console.log(`  Interventions merged: ${totalMerged}`);
}

main().catch(console.error);
