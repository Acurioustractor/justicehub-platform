#!/usr/bin/env node
/**
 * Find and merge duplicate ABN organizations.
 * Keeps the org with more data, reassigns foreign keys, deactivates duplicates.
 *
 * Usage: node scripts/fix-duplicate-abns.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.argv.includes('--dry-run');

// Score an org by how much data it has
function scoreOrg(org) {
  let s = 0;
  if (org.description) s += 3;
  if (org.type) s += 2;
  if (org.city) s += 2;
  if (org.state) s += 1;
  if (org.website) s += 2;
  if (org.acnc_data) s += 2;
  if (org.tags?.length) s += 1;
  if (org.slug) s += 1;
  return s;
}

// Tables that reference organizations
const FK_TABLES = [
  { table: 'alma_interventions', col: 'operating_organization_id' },
  { table: 'justice_funding', col: 'alma_organization_id' },
  { table: 'registered_services', col: 'organization_id' },
  { table: 'services', col: 'organization_id' },
  { table: 'organizations_profiles', col: 'organization_id' },
  { table: 'organization_claims', col: 'organization_id' },
  { table: 'campaign_alignment_entities', col: 'entity_id' },
];

async function main() {
  console.log(`Duplicate ABN merger${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Find duplicate ABNs
  const { data: allOrgs } = await sb
    .from('organizations')
    .select('id, name, abn, type, description, city, state, website, acnc_data, tags, slug, is_active')
    .eq('is_active', true)
    .not('abn', 'is', null);

  // Group by ABN
  const abnMap = new Map();
  for (const org of allOrgs || []) {
    if (!org.abn) continue;
    const clean = org.abn.replace(/\s/g, '');
    if (!abnMap.has(clean)) abnMap.set(clean, []);
    abnMap.get(clean).push(org);
  }

  const duplicates = [...abnMap.entries()].filter(([, orgs]) => orgs.length > 1);
  console.log(`Found ${duplicates.length} duplicate ABN groups\n`);

  let totalMerged = 0;
  let totalReassigned = 0;

  for (const [abn, orgs] of duplicates) {
    // Score each org, keep the best
    orgs.sort((a, b) => scoreOrg(b) - scoreOrg(a));
    const keep = orgs[0];
    const dupes = orgs.slice(1);

    console.log(`ABN ${abn}:`);
    console.log(`  KEEP: ${keep.name} (id: ${keep.id}, score: ${scoreOrg(keep)})`);
    for (const d of dupes) {
      console.log(`  MERGE: ${d.name} (id: ${d.id}, score: ${scoreOrg(d)})`);
    }

    for (const dupe of dupes) {
      // Reassign foreign keys
      for (const { table, col } of FK_TABLES) {
        try {
          if (DRY_RUN) {
            const { count } = await sb
              .from(table)
              .select('id', { count: 'exact', head: true })
              .eq(col, dupe.id);
            if (count > 0) {
              console.log(`  Would reassign ${count} ${table} records`);
              totalReassigned += count;
            }
          } else {
            const { data, error } = await sb
              .from(table)
              .update({ [col]: keep.id })
              .eq(col, dupe.id)
              .select('id');
            if (data?.length > 0) {
              console.log(`  Reassigned ${data.length} ${table} records`);
              totalReassigned += data.length;
            }
          }
        } catch {
          // Table might not exist or col might not match, skip
        }
      }

      // Merge missing data from dupe into keeper
      const updates = {};
      if (!keep.description && dupe.description) updates.description = dupe.description;
      if (!keep.type && dupe.type) updates.type = dupe.type;
      if (!keep.city && dupe.city) updates.city = dupe.city;
      if (!keep.website && dupe.website) updates.website = dupe.website;
      if (!keep.acnc_data && dupe.acnc_data) updates.acnc_data = dupe.acnc_data;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await sb.from('organizations').update(updates).eq('id', keep.id);
        }
        console.log(`  Merged fields into keeper: ${Object.keys(updates).join(', ')}`);
      }

      // Deactivate duplicate
      if (!DRY_RUN) {
        await sb.from('organizations').update({ is_active: false }).eq('id', dupe.id);
      }
      console.log(`  Deactivated duplicate: ${dupe.name}`);
      totalMerged++;
    }
    console.log('');
  }

  console.log('Results:');
  console.log(`  Duplicate groups: ${duplicates.length}`);
  console.log(`  Orgs deactivated: ${totalMerged}`);
  console.log(`  FK records reassigned: ${totalReassigned}`);
}

main().catch(console.error);
