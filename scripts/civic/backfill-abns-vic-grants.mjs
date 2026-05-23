#!/usr/bin/env node
/**
 * Back-fill recipient_abn on vic_grants_awarded by fuzzy-matching
 * recipient_name against acnc_charities (65K rows) + organizations (92K+ ABNs).
 *
 * Stages:
 *   1. Exact name match (case-insensitive) against organizations
 *   2. Exact name match against acnc_charities (gets ABN that way)
 *   3. Normalized match (strip Inc, Ltd, Pty, etc.) against both
 *   4. Trigram fuzzy match >=0.85
 *
 * Confidence ranking: 1.0 exact > 0.95 normalized > trigram score.
 * Only writes when confidence >= 0.85.
 *
 * Idempotent — skips rows that already have recipient_abn.
 *
 * Usage:
 *   node scripts/civic/backfill-abns-vic-grants.mjs               # dry-run
 *   node scripts/civic/backfill-abns-vic-grants.mjs --apply       # write
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const MIN_CONFIDENCE = 0.85;

const SUFFIXES_RE = /\b(inc\.?|incorporated|ltd\.?|limited|pty\.?|proprietary|association|assoc\.?|co-?op(erative)?|trust|group|services?|centre|center|the|of|and|&)\b/gi;

function normalize(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(SUFFIXES_RE, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(s) {
  const p = `  ${s} `;
  const set = new Set();
  for (let i = 0; i < p.length - 2; i++) set.add(p.substring(i, i + 3));
  return set;
}

function jaccardTrigram(a, b) {
  const A = trigrams(a);
  const B = trigrams(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

async function fetchAll(table, select, filter = null) {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  console.log(`Vic grants ABN backfill · ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  // 1. Pull all vic_grants rows without ABN, distinct by recipient_name
  const grants = await fetchAll(
    'vic_grants_awarded',
    'id, recipient_name, recipient_abn',
    (q) => q.is('recipient_abn', null).not('recipient_name', 'is', null)
  );
  console.log(`Grants without ABN: ${grants.length}`);

  // Group by recipient_name
  const byName = new Map();
  for (const g of grants) {
    const n = g.recipient_name?.trim();
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(g.id);
  }
  console.log(`Distinct recipient names: ${byName.size}\n`);

  // 2. Load reference data
  console.log('Loading acnc_charities (this takes ~10s)...');
  const acnc = await fetchAll('acnc_charities', 'abn, name');
  console.log(`  ${acnc.length} ACNC rows`);

  console.log('Loading organizations with ABNs...');
  const orgs = await fetchAll(
    'organizations',
    'id, name, abn',
    (q) => q.not('abn', 'is', null).neq('archived', true)
  );
  console.log(`  ${orgs.length} org rows\n`);

  // Build lookup maps
  const acncByExact = new Map();
  const acncByNorm = new Map();
  for (const a of acnc) {
    if (!a.name || !a.abn) continue;
    acncByExact.set(a.name.toLowerCase(), a.abn);
    const n = normalize(a.name);
    if (n) {
      if (!acncByNorm.has(n)) acncByNorm.set(n, []);
      acncByNorm.get(n).push({ abn: a.abn, name: a.name });
    }
  }
  const orgByExact = new Map();
  const orgByNorm = new Map();
  for (const o of orgs) {
    if (!o.name) continue;
    orgByExact.set(o.name.toLowerCase(), o.abn);
    const n = normalize(o.name);
    if (n) {
      if (!orgByNorm.has(n)) orgByNorm.set(n, []);
      orgByNorm.get(n).push({ abn: o.abn, name: o.name });
    }
  }

  // 3. Match each unique name
  const matches = [];
  const stats = { exact_org: 0, exact_acnc: 0, normalized: 0, fuzzy: 0, no_match: 0 };
  let processed = 0;
  for (const [name, ids] of byName.entries()) {
    processed++;
    if (processed % 500 === 0) console.log(`  ${processed}/${byName.size} names processed...`);

    const lower = name.toLowerCase();
    const norm = normalize(name);

    // Stage 1: exact org name
    if (orgByExact.has(lower)) {
      matches.push({ name, ids, abn: orgByExact.get(lower), method: 'exact_org', confidence: 1.0 });
      stats.exact_org++;
      continue;
    }
    // Stage 2: exact ACNC name
    if (acncByExact.has(lower)) {
      matches.push({ name, ids, abn: acncByExact.get(lower), method: 'exact_acnc', confidence: 1.0 });
      stats.exact_acnc++;
      continue;
    }
    // Stage 3: normalized match (orgs first, then ACNC)
    if (norm) {
      if (orgByNorm.has(norm) && orgByNorm.get(norm).length === 1) {
        matches.push({ name, ids, abn: orgByNorm.get(norm)[0].abn, method: 'normalized_org', confidence: 0.95 });
        stats.normalized++;
        continue;
      }
      if (acncByNorm.has(norm) && acncByNorm.get(norm).length === 1) {
        matches.push({ name, ids, abn: acncByNorm.get(norm)[0].abn, method: 'normalized_acnc', confidence: 0.95 });
        stats.normalized++;
        continue;
      }
    }
    // Stage 4: trigram fuzzy. Restrict to candidates sharing first word for speed.
    if (norm.length >= 4) {
      const firstWord = norm.split(' ')[0];
      let best = { abn: null, sim: 0, candidate: null };
      // Cap candidates checked
      let checked = 0;
      for (const [candidateNorm, items] of acncByNorm.entries()) {
        if (!candidateNorm.startsWith(firstWord)) continue;
        checked++;
        if (checked > 100) break;
        const sim = jaccardTrigram(norm, candidateNorm);
        if (sim > best.sim) {
          best = { abn: items[0].abn, sim, candidate: items[0].name };
        }
      }
      if (best.sim >= MIN_CONFIDENCE) {
        matches.push({ name, ids, abn: best.abn, method: 'fuzzy_acnc', confidence: best.sim, candidate: best.candidate });
        stats.fuzzy++;
        continue;
      }
    }
    stats.no_match++;
  }

  console.log(`\nMatch summary:`);
  console.log(`  exact org name:  ${stats.exact_org}`);
  console.log(`  exact ACNC name: ${stats.exact_acnc}`);
  console.log(`  normalized:      ${stats.normalized}`);
  console.log(`  fuzzy (>=0.85):  ${stats.fuzzy}`);
  console.log(`  no match:        ${stats.no_match}`);
  console.log(`  TOTAL matched:   ${matches.length} unique names (${byName.size - stats.no_match})`);

  const totalRows = matches.reduce((s, m) => s + m.ids.length, 0);
  console.log(`  Total grant rows that will be updated: ${totalRows}`);

  if (!APPLY) {
    console.log('\nFirst 10 matches:');
    for (const m of matches.slice(0, 10)) {
      console.log(`  ${m.name.slice(0, 50).padEnd(52)} → ${m.abn} (${m.method} ${m.confidence.toFixed(2)})`);
    }
    console.log('\nDry-run — pass --apply to write.');
    return;
  }

  // 4. Apply updates — batch by ABN
  console.log('\nApplying...');
  let written = 0;
  let errors = 0;
  for (const m of matches) {
    // Update all rows for this recipient_name
    const { error } = await supabase
      .from('vic_grants_awarded')
      .update({ recipient_abn: m.abn })
      .in('id', m.ids);
    if (error) {
      errors++;
      console.warn(`  ! ${m.name}: ${error.message}`);
      continue;
    }
    written += m.ids.length;
    if (written % 500 === 0) console.log(`  ${written}/${totalRows} rows written...`);
  }
  console.log(`\nWrote ${written} · errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
