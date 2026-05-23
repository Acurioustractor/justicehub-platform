#!/usr/bin/env node
/**
 * Import the 6,003 ABNs that received justice_funding but don't have a
 * corresponding row in `organizations`. Pull canonical names + state from
 * abr_registry (20M-row Australian Business Register) and create stub org
 * rows so they can be classified, claimed, and rendered alongside known orgs.
 *
 * Each imported org gets:
 *   - abn, name (from abr_registry.entity_name)
 *   - state (from abr_registry.state)
 *   - type = 'imported_funding_recipient'
 *   - is_active = true, archived = false
 *   - description noting source
 *
 * Idempotent on abn. Re-runnable.
 *
 * Usage:
 *   node scripts/civic/import-orphan-funding-abns.mjs               # dry-run
 *   node scripts/civic/import-orphan-funding-abns.mjs --apply       # write
 *   node scripts/civic/import-orphan-funding-abns.mjs --apply --limit 1000
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : null;

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

async function main() {
  console.log(`Orphan funding ABN import · ${APPLY ? 'APPLY' : 'DRY-RUN'}${LIMIT ? ` · limit=${LIMIT}` : ''}\n`);

  // 1. Find all distinct recipient ABNs in justice_funding that are NOT in organizations.
  console.log('Finding orphan ABNs from justice_funding...');
  const fundingAbns = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('justice_funding')
      .select('recipient_abn')
      .not('recipient_abn', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) if (r.recipient_abn) fundingAbns.add(r.recipient_abn);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  ${fundingAbns.size} distinct ABNs in justice_funding`);

  // 2. Subtract ABNs already in organizations
  console.log('Loading existing organizations ABNs...');
  const knownAbns = new Set();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('organizations')
      .select('abn')
      .not('abn', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) if (r.abn) knownAbns.add(r.abn);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  ${knownAbns.size} ABNs already in organizations`);

  const orphanAbns = Array.from(fundingAbns).filter((a) => !knownAbns.has(a));
  console.log(`  ${orphanAbns.length} orphan ABNs to import\n`);

  if (orphanAbns.length === 0) {
    console.log('Nothing to import.');
    return;
  }

  const target = LIMIT ? orphanAbns.slice(0, LIMIT) : orphanAbns;

  // 3. For each orphan ABN, fetch name + state from abr_registry
  console.log(`Looking up ${target.length} ABNs in abr_registry...`);
  const abrByAbn = new Map();
  for (let i = 0; i < target.length; i += 100) {
    const chunk = target.slice(i, i + 100);
    const { data, error } = await supabase
      .from('abr_registry')
      .select('abn, entity_name, entity_type, state, charity_type, status')
      .in('abn', chunk);
    if (error) throw new Error(`abr lookup: ${error.message}`);
    for (const r of data || []) abrByAbn.set(r.abn, r);
    if ((i + 100) % 1000 === 0 || i + 100 >= target.length) {
      console.log(`  ${Math.min(i + 100, target.length)}/${target.length} looked up...`);
    }
  }
  console.log(`  ${abrByAbn.size} ABR lookups succeeded\n`);

  // 4. Build insert payloads and insert
  let inserted = 0;
  let notInAbr = 0;
  let errors = 0;
  const usedSlugs = new Set();

  for (const abn of target) {
    const entry = abrByAbn.get(abn);
    if (!entry || !entry.entity_name) {
      notInAbr++;
      continue;
    }
    // Slug — start with normalized name + ABN suffix to guarantee uniqueness
    let baseSlug = slugify(entry.entity_name);
    if (!baseSlug) baseSlug = `entity-${abn.slice(-6)}`;
    let slug = `${baseSlug}-${abn.slice(-6)}`;
    let attempt = 0;
    while (usedSlugs.has(slug) && attempt < 10) {
      attempt++;
      slug = `${baseSlug}-${abn.slice(-6)}-${attempt}`;
    }
    usedSlugs.add(slug);

    const payload = {
      abn,
      name: entry.entity_name,
      slug,
      state: entry.state || null,
      type: 'imported_funding_recipient',
      is_active: true,
      archived: false,
      description: `Imported from abr_registry. Entity type: ${entry.entity_type || 'unknown'}${entry.charity_type ? `; Charity type: ${entry.charity_type}` : ''}. Identified via justice_funding records.`,
      updated_at: new Date().toISOString(),
    };

    if (!APPLY) {
      inserted++;
      continue;
    }

    const { error } = await supabase.from('organizations').insert(payload);
    if (error) {
      errors++;
      // Slug collisions might still happen if there are pre-existing rows
      if (error.message.includes('duplicate')) {
        // skip silently
        continue;
      }
      console.warn(`  ! ${entry.entity_name}: ${error.message}`);
      continue;
    }
    inserted++;
    if (inserted % 100 === 0) console.log(`  ${inserted}/${target.length} inserted...`);
  }

  console.log(`\n${APPLY ? 'Inserted' : 'Would insert'} ${inserted} · not in ABR ${notInAbr} · errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
