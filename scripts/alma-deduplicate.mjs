#!/usr/bin/env node
/**
 * ALMA Deduplication - Clean up duplicate interventions
 *
 * Merges duplicate records, keeping the most complete one and deleting others.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Normalize name for comparison
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score a record's completeness
 */
function scoreCompleteness(record) {
  let score = 0;
  if (record.description?.length > 50) score += 3;
  if (record.description?.length > 200) score += 2;
  if (record.type && record.type !== 'Unknown') score += 2;
  if (record.geography?.length > 0) score += 1;
  if (record.target_cohort?.length > 0) score += 1;
  if (record.latitude) score += 2;
  if (record.source_url) score += 2;
  if (record.operating_organization) score += 1;
  if (record.website) score += 1;
  if (record.contact_phone || record.contact_email) score += 1;
  if (record.evidence_level) score += 1;
  return score;
}

/**
 * Merge two records - take best from each
 */
function mergeRecords(keeper, duplicate) {
  const merged = { ...keeper };

  // Take longer description
  if ((duplicate.description?.length || 0) > (keeper.description?.length || 0)) {
    merged.description = duplicate.description;
  }

  // Take type if keeper doesn't have one
  if (!keeper.type || keeper.type === 'Unknown') {
    merged.type = duplicate.type || keeper.type;
  }

  // Merge arrays
  if (duplicate.geography?.length) {
    merged.geography = [...new Set([...(keeper.geography || []), ...duplicate.geography])];
  }
  if (duplicate.target_cohort?.length) {
    merged.target_cohort = [...new Set([...(keeper.target_cohort || []), ...duplicate.target_cohort])];
  }

  // Take coordinates if keeper doesn't have them
  if (!keeper.latitude && duplicate.latitude) {
    merged.latitude = duplicate.latitude;
    merged.longitude = duplicate.longitude;
  }

  // Take other fields if missing
  ['source_url', 'operating_organization', 'website', 'contact_phone', 'contact_email', 'evidence_level']
    .forEach(field => {
      if (!keeper[field] && duplicate[field]) {
        merged[field] = duplicate[field];
      }
    });

  return merged;
}

/**
 * Find and merge duplicates
 */
async function deduplicateInterventions(dryRun = true) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        ALMA Deduplication - Finding & Merging Dupes       ║');
  console.log(`║                    Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}                            ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Get all interventions
  const { data: interventions, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !interventions) {
    console.error('Failed to fetch interventions:', error?.message);
    return;
  }

  console.log(`📊 Total interventions: ${interventions.length}\n`);

  // Group by normalized name
  const groups = {};
  interventions.forEach(i => {
    const norm = normalizeName(i.name);
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(i);
  });

  // Find duplicates
  const duplicateGroups = Object.entries(groups).filter(([_, items]) => items.length > 1);
  console.log(`🔍 Found ${duplicateGroups.length} groups with duplicates\n`);

  let totalMerged = 0;
  let totalDeleted = 0;

  for (const [normName, items] of duplicateGroups) {
    console.log(`\n📋 "${items[0].name}" (${items.length} copies)`);

    // Score each record
    const scored = items.map(item => ({
      ...item,
      score: scoreCompleteness(item)
    })).sort((a, b) => b.score - a.score);

    // Keep the best one
    const keeper = scored[0];
    const duplicates = scored.slice(1);

    console.log(`   Keeping: ID ${keeper.id} (score: ${keeper.score})`);

    // Merge data from duplicates into keeper
    let merged = keeper;
    for (const dupe of duplicates) {
      console.log(`   Merging: ID ${dupe.id} (score: ${dupe.score})`);
      merged = mergeRecords(merged, dupe);
    }

    if (!dryRun) {
      // Update keeper with merged data
      const { error: updateError } = await supabase
        .from('alma_interventions')
        .update({
          description: merged.description,
          type: merged.type,
          geography: merged.geography,
          target_cohort: merged.target_cohort,
          latitude: merged.latitude,
          longitude: merged.longitude,
          source_url: merged.source_url,
          operating_organization: merged.operating_organization,
          website: merged.website,
          contact_phone: merged.contact_phone,
          contact_email: merged.contact_email,
          evidence_level: merged.evidence_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', keeper.id);

      if (updateError) {
        console.log(`   ⚠️ Update failed: ${updateError.message}`);
        continue;
      }

      // Delete duplicates
      for (const dupe of duplicates) {
        const { error: deleteError } = await supabase
          .from('alma_interventions')
          .delete()
          .eq('id', dupe.id);

        if (deleteError) {
          console.log(`   ⚠️ Delete failed for ${dupe.id}: ${deleteError.message}`);
        } else {
          console.log(`   🗑️ Deleted: ${dupe.id}`);
          totalDeleted++;
        }
      }
      totalMerged++;
    } else {
      console.log(`   Would merge and delete ${duplicates.length} duplicates`);
      totalMerged++;
      totalDeleted += duplicates.length;
    }
  }

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 DEDUPLICATION SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Groups processed: ${totalMerged}`);
  console.log(`Records ${dryRun ? 'would be' : ''} deleted: ${totalDeleted}`);
  console.log(`Final count ${dryRun ? 'would be' : ''}: ${interventions.length - totalDeleted}`);

  if (dryRun) {
    console.log('\n⚠️ This was a DRY RUN. No changes made.');
    console.log('   Run with --live to actually merge and delete duplicates.');
  } else {
    console.log('\n✅ Deduplication complete!');
  }
}

// Main
const args = process.argv.slice(2);
const isLive = args.includes('--live');

await deduplicateInterventions(!isLive);
