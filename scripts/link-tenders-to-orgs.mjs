#!/usr/bin/env node
/**
 * State Tenders -> Organizations Linker
 *
 * Links state_tenders.alma_organization_id to organizations via
 * ABN match, exact name match, then fuzzy normalized name match.
 *
 * Usage:
 *   node scripts/link-tenders-to-orgs.mjs              # dry-run (count matches)
 *   node scripts/link-tenders-to-orgs.mjs --apply       # write to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DRY_RUN = !process.argv.includes('--apply');
const STATE = 'QLD';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\bpty\.?\s*ltd\.?\b/gi, '')
    .replace(/\blimited\b/gi, '')
    .replace(/\bincorporated\b/gi, '')
    .replace(/\binc\.?\b/gi, '')
    .replace(/\bcorporation\b/gi, '')
    .replace(/\bthe\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function countUnlinked() {
  const { count, error } = await supabase
    .from('state_tenders')
    .select('*', { count: 'exact', head: true })
    .eq('state', STATE)
    .is('alma_organization_id', null);
  if (error) throw error;
  return count;
}

async function countLinked() {
  const { count, error } = await supabase
    .from('state_tenders')
    .select('*', { count: 'exact', head: true })
    .eq('state', STATE)
    .not('alma_organization_id', 'is', null);
  if (error) throw error;
  return count;
}

// ─── Phase 1: ABN Exact Match ──────────────────────────────────────────────────

async function phase1_abn() {
  console.log('\n=== Phase 1: ABN Exact Match ===');

  // Get unlinked tenders with ABNs (paginated)
  const abnSet = new Set();
  let abnOffset = 0;
  const abnPageSize = 1000;
  let totalWithAbn = 0;
  while (true) {
    const { data: tenders, error: tErr } = await supabase
      .from('state_tenders')
      .select('supplier_abn')
      .eq('state', STATE)
      .is('alma_organization_id', null)
      .not('supplier_abn', 'is', null)
      .neq('supplier_abn', '')
      .range(abnOffset, abnOffset + abnPageSize - 1);
    if (tErr) throw tErr;
    if (!tenders || tenders.length === 0) break;
    for (const t of tenders) abnSet.add(t.supplier_abn);
    totalWithAbn += tenders.length;
    abnOffset += abnPageSize;
    if (tenders.length < abnPageSize) break;
  }
  console.log(`  Unlinked tenders with ABN: ${totalWithAbn} (${abnSet.size} distinct ABNs)`);

  if (abnSet.size === 0) {
    console.log('  No ABN matches possible.');
    return 0;
  }

  // Fetch orgs with matching ABNs
  const abns = [...abnSet];
  let orgMap = new Map(); // abn -> org id
  // Fetch in batches of 500 (Supabase IN limit)
  for (let i = 0; i < abns.length; i += 500) {
    const batch = abns.slice(i, i + 500);
    const { data: orgs, error: oErr } = await supabase
      .from('organizations')
      .select('id, abn')
      .in('abn', batch);
    if (oErr) throw oErr;
    for (const o of orgs) {
      orgMap.set(o.abn, o.id);
    }
  }

  console.log(`  Orgs matched by ABN: ${orgMap.size}`);

  if (DRY_RUN) {
    // Count how many tenders would be linked by re-scanning
    let wouldLink = 0;
    let countOffset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('state_tenders')
        .select('supplier_abn')
        .eq('state', STATE)
        .is('alma_organization_id', null)
        .not('supplier_abn', 'is', null)
        .neq('supplier_abn', '')
        .range(countOffset, countOffset + 1000 - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const t of data) {
        if (orgMap.has(t.supplier_abn)) wouldLink++;
      }
      countOffset += 1000;
      if (data.length < 1000) break;
    }
    console.log(`  [DRY RUN] Would link ${wouldLink} tenders`);
    return wouldLink;
  }

  // Apply updates in batches by ABN
  let linked = 0;
  const matchedAbns = abns.filter((a) => orgMap.has(a));
  for (let i = 0; i < matchedAbns.length; i += 50) {
    const batch = matchedAbns.slice(i, i + 50);
    for (const abn of batch) {
      const orgId = orgMap.get(abn);
      const { count, error } = await supabase
        .from('state_tenders')
        .update({ alma_organization_id: orgId })
        .eq('state', STATE)
        .eq('supplier_abn', abn)
        .is('alma_organization_id', null)
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`  Error updating ABN ${abn}:`, error.message);
        continue;
      }
      linked += count || 0;
    }
    if ((i + 50) % 200 === 0) {
      console.log(`  Progress: ${Math.min(i + 50, matchedAbns.length)}/${matchedAbns.length} ABNs processed`);
    }
  }

  console.log(`  Linked ${linked} tenders via ABN match`);
  return linked;
}

// ─── Phase 2: Exact Name Match ──────────────────────────────────────────────────

async function phase2_exactName() {
  console.log('\n=== Phase 2: Exact Name Match (case-insensitive) ===');

  // Get distinct unlinked supplier names
  const allNames = new Set();
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('state_tenders')
      .select('supplier_name')
      .eq('state', STATE)
      .is('alma_organization_id', null)
      .not('supplier_name', 'is', null)
      .neq('supplier_name', '')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const t of data) allNames.add(t.supplier_name);
    offset += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`  Distinct unlinked supplier names: ${allNames.size}`);

  // Build org name map (lowercase trimmed -> id)
  const orgNameMap = new Map();
  offset = 0;
  while (true) {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!orgs || orgs.length === 0) break;
    for (const o of orgs) {
      if (o.name) {
        const key = o.name.toLowerCase().trim();
        if (!orgNameMap.has(key)) orgNameMap.set(key, o.id);
      }
    }
    offset += pageSize;
    if (orgs.length < pageSize) break;
  }

  console.log(`  Organizations loaded: ${orgNameMap.size} unique names`);

  // Find matches
  const matches = []; // { supplier_name, org_id }
  for (const name of allNames) {
    const key = name.toLowerCase().trim();
    if (orgNameMap.has(key)) {
      matches.push({ supplier_name: name, org_id: orgNameMap.get(key) });
    }
  }

  console.log(`  Exact name matches found: ${matches.length}`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would link tenders for ${matches.length} supplier names`);
    if (matches.length > 0 && matches.length <= 20) {
      for (const m of matches) console.log(`    - "${m.supplier_name}"`);
    }
    return matches.length;
  }

  // Apply updates
  let linked = 0;
  for (let i = 0; i < matches.length; i++) {
    const { supplier_name, org_id } = matches[i];
    const { count, error } = await supabase
      .from('state_tenders')
      .update({ alma_organization_id: org_id })
      .eq('state', STATE)
      .eq('supplier_name', supplier_name)
      .is('alma_organization_id', null)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`  Error updating name "${supplier_name}":`, error.message);
      continue;
    }
    linked += count || 0;
  }

  console.log(`  Linked ${linked} tenders via exact name match`);
  return linked;
}

// ─── Phase 3: Fuzzy Normalized Name Match ───────────────────────────────────────

async function phase3_fuzzyName() {
  console.log('\n=== Phase 3: Fuzzy Normalized Name Match ===');

  // Get distinct unlinked supplier names
  const supplierNames = new Set();
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('state_tenders')
      .select('supplier_name')
      .eq('state', STATE)
      .is('alma_organization_id', null)
      .not('supplier_name', 'is', null)
      .neq('supplier_name', '')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const t of data) supplierNames.add(t.supplier_name);
    offset += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`  Distinct unlinked supplier names: ${supplierNames.size}`);

  // Build org normalized name map
  const orgNormMap = new Map(); // normalized_name -> { id, name }
  offset = 0;
  while (true) {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!orgs || orgs.length === 0) break;
    for (const o of orgs) {
      if (o.name) {
        const norm = normalizeName(o.name);
        if (norm && !orgNormMap.has(norm)) {
          orgNormMap.set(norm, { id: o.id, name: o.name });
        }
      }
    }
    offset += pageSize;
    if (orgs.length < pageSize) break;
  }

  console.log(`  Organizations (normalized): ${orgNormMap.size} unique`);

  // Find fuzzy matches
  const matches = []; // { supplier_name, org_id, org_name }
  for (const name of supplierNames) {
    const norm = normalizeName(name);
    if (norm && orgNormMap.has(norm)) {
      const org = orgNormMap.get(norm);
      matches.push({ supplier_name: name, org_id: org.id, org_name: org.name });
    }
  }

  console.log(`  Fuzzy name matches found: ${matches.length}`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would link tenders for ${matches.length} supplier names`);
    if (matches.length > 0) {
      const show = matches.slice(0, 20);
      for (const m of show) {
        console.log(`    - "${m.supplier_name}" -> "${m.org_name}"`);
      }
      if (matches.length > 20) console.log(`    ... and ${matches.length - 20} more`);
    }
    return matches.length;
  }

  // Apply updates in batches
  let linked = 0;
  for (let i = 0; i < matches.length; i++) {
    const { supplier_name, org_id } = matches[i];
    const { count, error } = await supabase
      .from('state_tenders')
      .update({ alma_organization_id: org_id })
      .eq('state', STATE)
      .eq('supplier_name', supplier_name)
      .is('alma_organization_id', null)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`  Error updating name "${supplier_name}":`, error.message);
      continue;
    }
    linked += count || 0;
    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${matches.length} names processed (${linked} tenders linked)`);
    }
  }

  console.log(`  Linked ${linked} tenders via fuzzy name match`);
  return linked;
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`State Tenders -> Organizations Linker`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (use --apply to write)' : 'APPLYING CHANGES'}`);
  console.log(`Target state: ${STATE}`);

  const initialLinked = await countLinked();
  const initialUnlinked = await countUnlinked();
  const total = initialLinked + initialUnlinked;
  console.log(`\nInitial state: ${initialLinked}/${total} linked (${((initialLinked / total) * 100).toFixed(1)}%)`);

  const p1 = await phase1_abn();
  const p2 = await phase2_exactName();
  const p3 = await phase3_fuzzyName();

  const finalLinked = DRY_RUN ? initialLinked : await countLinked();
  const finalUnlinked = DRY_RUN ? initialUnlinked : await countUnlinked();

  console.log('\n=== Summary ===');
  console.log(`  Phase 1 (ABN):        ${DRY_RUN ? '~' : ''}${p1} tenders`);
  console.log(`  Phase 2 (Exact name): ${DRY_RUN ? '~' : ''}${p2} supplier names`);
  console.log(`  Phase 3 (Fuzzy name): ${DRY_RUN ? '~' : ''}${p3} supplier names`);
  if (!DRY_RUN) {
    console.log(`  Before: ${initialLinked}/${total} linked (${((initialLinked / total) * 100).toFixed(1)}%)`);
    console.log(`  After:  ${finalLinked}/${total} linked (${((finalLinked / total) * 100).toFixed(1)}%)`);
    console.log(`  New links: ${finalLinked - initialLinked}`);
  } else {
    console.log(`\n  Run with --apply to write changes.`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
