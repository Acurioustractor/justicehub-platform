#!/usr/bin/env node
/**
 * Import ACNC Charities to Organizations
 *
 * Bulk-imports records from acnc_charities into the organizations table,
 * deduplicating by ABN to avoid creating duplicates.
 *
 * Usage:
 *   node scripts/import-acnc-to-organizations.mjs --dry-run
 *   node scripts/import-acnc-to-organizations.mjs --dry-run --limit 10
 *   node scripts/import-acnc-to-organizations.mjs
 *   node scripts/import-acnc-to-organizations.mjs --limit 500
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Parse CLI flags ──────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;

if (limitIdx !== -1 && (isNaN(limit) || limit <= 0)) {
  console.error('Error: --limit must be a positive integer');
  process.exit(1);
}

// ── Load environment ─────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  try {
    const content = readFileSync(join(root, '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    console.error('Warning: Could not read .env.local');
  }
  return env;
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Pagination helper ────────────────────────────────────────

async function paginate(table, select, filter) {
  const all = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) { console.error(`  Error loading ${table}:`, error.message); break; }
    if (!data?.length) break;
    all.push(...data);
    process.stderr.write(`\r  Loading ${table}... ${all.length}`);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (all.length > 0) process.stderr.write('\n');
  return all;
}

// ── Map ACNC charity to organization record ──────────────────

function mapCharityToOrg(charity) {
  return {
    name: charity.charity_legal_name,
    abn: charity.abn,
    state: charity.state || null,
    city: charity.town_city || null,
    website: charity.website || null,
    is_active: true,
    type: 'charity',
    acnc_data: {
      charity_legal_name: charity.charity_legal_name,
      abn: charity.abn,
      town_city: charity.town_city,
      state: charity.state,
      postcode: charity.postcode,
      website: charity.website,
      charity_size: charity.charity_size,
      date_organisation_established: charity.date_organisation_established,
      imported_at: new Date().toISOString(),
    },
  };
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('ACNC Charities -> Organizations Import');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE IMPORT'}`);
  if (limit) console.log(`Limit: ${limit} records`);
  console.log();

  // Step 1: Fetch existing ABNs
  console.log('Step 1: Loading existing organization ABNs...');
  const existingOrgs = await paginate('organizations', 'abn', (q) => q.not('abn', 'is', null));
  const existingABNs = new Set(existingOrgs.map((o) => o.abn).filter(Boolean));
  console.log(`  Found ${existingABNs.size} unique ABNs already in organizations`);

  // Step 2: Fetch all ACNC charities
  console.log('\nStep 2: Loading ACNC charities...');
  const charities = await paginate('acnc_charities', 'abn,charity_legal_name,town_city,state,postcode,website,charity_size,date_organisation_established');
  console.log(`  Found ${charities.length} total ACNC charities`);

  // Step 3: Deduplicate
  console.log('\nStep 3: Deduplicating...');
  let newCharities = charities.filter((c) => c.abn && !existingABNs.has(c.abn));
  const skippedNoABN = charities.filter((c) => !c.abn).length;
  const skippedDuplicate = charities.length - newCharities.length - skippedNoABN;

  console.log(`  Skipped (no ABN): ${skippedNoABN}`);
  console.log(`  Skipped (ABN already exists): ${skippedDuplicate}`);
  console.log(`  New charities to import: ${newCharities.length}`);

  if (limit && newCharities.length > limit) {
    console.log(`  Applying --limit ${limit}`);
    newCharities = newCharities.slice(0, limit);
  }

  if (newCharities.length === 0) {
    console.log('\nNothing to import.');
    return;
  }

  // Dry run: show stats
  if (dryRun) {
    console.log('\n--- DRY RUN: No records will be inserted ---');
    console.log(`Would insert ${newCharities.length} new organizations\n`);
    const samples = newCharities.slice(0, 5);
    console.log('Sample records:');
    for (const c of samples) console.log(`  - ${c.charity_legal_name} (ABN: ${c.abn}, ${c.state || 'no state'})`);
    if (newCharities.length > 5) console.log(`  ... and ${newCharities.length - 5} more`);

    const stateCounts = {};
    for (const c of newCharities) { const st = c.state || 'Unknown'; stateCounts[st] = (stateCounts[st] || 0) + 1; }
    console.log('\nState distribution:');
    for (const [state, count] of Object.entries(stateCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${state}: ${count}`);
    }
    return;
  }

  // Step 4: Insert in batches
  console.log(`\nStep 4: Inserting ${newCharities.length} organizations in batches of 500...`);
  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  const failedABNs = [];

  for (let i = 0; i < newCharities.length; i += BATCH_SIZE) {
    const batch = newCharities.slice(i, i + BATCH_SIZE);
    const records = batch.map(mapCharityToOrg);

    const { data, error } = await supabase.from('organizations').insert(records).select('id');

    if (error) {
      console.error(`\n  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      console.log('  Falling back to individual inserts...');
      for (const record of records) {
        const { error: singleError } = await supabase.from('organizations').insert(record);
        if (singleError) {
          errors++;
          failedABNs.push(record.abn);
          if (errors <= 10) console.error(`    Failed: ${record.name} (${record.abn}): ${singleError.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += (data?.length || batch.length);
    }

    const total = Math.min(i + BATCH_SIZE, newCharities.length);
    console.log(`  Progress: ${total}/${newCharities.length} (${inserted} inserted, ${errors} errors)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Import Complete: ${inserted} inserted, ${errors} errors`);
  console.log('='.repeat(60));
  if (failedABNs.length > 0) console.log(`  Failed ABNs: ${failedABNs.slice(0, 20).join(', ')}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
