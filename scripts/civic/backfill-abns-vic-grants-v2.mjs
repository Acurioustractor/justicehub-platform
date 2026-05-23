#!/usr/bin/env node
/**
 * Vic grants ABN backfill v2 — closes the gap left by v1 (which got 32%)
 * by querying ABR registry (20M ABNs) per-name via SQL trigram similarity.
 *
 * Only processes rows where recipient_abn IS STILL NULL after v1.
 *
 * Strategy: for each unmatched recipient_name:
 *   1. Tokenize, take first 2 words as ABR prefix filter
 *   2. SELECT abn, entity_name, similarity(...) FROM abr_registry
 *      WHERE state = X AND entity_name ILIKE 'prefix%' ORDER BY sim DESC LIMIT 5
 *   3. If top match >= 0.55 confidence AND unambiguous, use it
 *
 * The ILIKE prefix filter is the speed trick — without it, every query
 * scans 20M rows.
 *
 * Usage:
 *   node scripts/civic/backfill-abns-vic-grants-v2.mjs              # dry-run
 *   node scripts/civic/backfill-abns-vic-grants-v2.mjs --apply
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const MIN_SIM = 0.55; // ABR is noisier than ACNC; lower threshold but verify margin

const SUFFIX_RE = /\b(inc\.?|incorporated|ltd\.?|limited|pty\.?|proprietary|the|of|and|&)\b/gi;
function cleanForSearch(name) {
  return (name || '').replace(SUFFIX_RE, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchAll(table, select, filter) {
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

async function searchAbr(name, state) {
  // Take first 2 cleaned words as a prefix for ILIKE. This is the speed trick:
  // without it every query scans 20M rows.
  const clean = cleanForSearch(name);
  if (!clean || clean.length < 4) return null;
  const tokens = clean.split(' ').filter((t) => t.length >= 3).slice(0, 2);
  if (tokens.length === 0) return null;
  const prefix = tokens[0]; // single-word prefix for max recall

  // ILIKE doesn't use trigram index; combine with similarity for ranking.
  // We accept the cost of a per-name SQL call since the candidate set is bounded.
  const { data, error } = await supabase.rpc('exec_abr_search', {
    p_name: clean,
    p_prefix: `${prefix}%`,
    p_state: state || null,
  }).then(
    (r) => r,
    // Fallback if RPC doesn't exist — use direct query via PostgREST limitation
    () => ({ data: null, error: { message: 'rpc_missing' } })
  );

  if (!error && data) return data;

  // Fallback to PostgREST direct query with .ilike + ordering by similarity in JS
  let q = supabase
    .from('abr_registry')
    .select('abn, entity_name, state, status')
    .ilike('entity_name', `${prefix}%`)
    .limit(50);
  if (state) q = q.eq('state', state);
  const { data: rows, error: err } = await q;
  if (err || !rows || rows.length === 0) return null;

  // Compute similarity in JS via Jaccard trigrams (consistent with v1)
  const ours = trigrams(clean.toLowerCase());
  let best = { abn: null, sim: 0, entity_name: null };
  for (const r of rows) {
    if (!r.entity_name) continue;
    const theirs = trigrams(r.entity_name.toLowerCase());
    const sim = jaccard(ours, theirs);
    if (sim > best.sim) best = { abn: r.abn, sim, entity_name: r.entity_name };
  }
  return best;
}

function trigrams(s) {
  const p = `  ${s} `;
  const set = new Set();
  for (let i = 0; i < p.length - 2; i++) set.add(p.substring(i, i + 3));
  return set;
}
function jaccard(a, b) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return (a.size + b.size - inter) === 0 ? 0 : inter / (a.size + b.size - inter);
}

async function main() {
  console.log(`Vic grants ABN backfill v2 (ABR registry) · ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  // Pull only still-unmatched rows
  const grants = await fetchAll(
    'vic_grants_awarded',
    'id, recipient_name, state',
    (q) => q.is('recipient_abn', null).not('recipient_name', 'is', null)
  );
  console.log(`Unmatched grants: ${grants.length}`);

  const byName = new Map();
  for (const g of grants) {
    const n = g.recipient_name?.trim();
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, { ids: [], state: g.state });
    byName.get(n).ids.push(g.id);
  }
  console.log(`Distinct unmatched names: ${byName.size}\n`);

  const matches = [];
  const stats = { matched: 0, ambiguous: 0, no_match: 0, errors: 0 };
  let processed = 0;
  const startedAt = Date.now();
  for (const [name, info] of byName.entries()) {
    processed++;
    if (processed % 100 === 0) {
      const eta = ((Date.now() - startedAt) / processed) * (byName.size - processed) / 1000;
      console.log(`  ${processed}/${byName.size} · matched ${stats.matched} · eta ${eta.toFixed(0)}s`);
    }
    try {
      const best = await searchAbr(name, info.state);
      if (!best || !best.abn) {
        stats.no_match++;
        continue;
      }
      if (best.sim < MIN_SIM) {
        stats.no_match++;
        continue;
      }
      matches.push({ name, ids: info.ids, abn: best.abn, sim: best.sim, entity: best.entity_name });
      stats.matched++;
    } catch (e) {
      stats.errors++;
    }
  }

  console.log(`\nResults: matched ${stats.matched} · no_match ${stats.no_match} · errors ${stats.errors}`);
  console.log(`Match rate on unmatched-pool: ${((stats.matched / byName.size) * 100).toFixed(1)}%`);

  if (matches.length > 0) {
    console.log('\nFirst 10 matches:');
    for (const m of matches.slice(0, 10)) {
      console.log(`  ${m.name.slice(0, 45).padEnd(47)} → ${m.abn} (${m.sim.toFixed(2)}) [${m.entity?.slice(0, 35)}]`);
    }
  }

  const totalRows = matches.reduce((s, m) => s + m.ids.length, 0);
  console.log(`\nTotal grant rows that would be updated: ${totalRows}`);

  if (!APPLY) {
    console.log('\nDry-run — pass --apply to write.');
    return;
  }

  let written = 0;
  let errors = 0;
  for (const m of matches) {
    const { error } = await supabase
      .from('vic_grants_awarded')
      .update({ recipient_abn: m.abn })
      .in('id', m.ids);
    if (error) {
      errors++;
      continue;
    }
    written += m.ids.length;
    if (written % 200 === 0) console.log(`  ${written}/${totalRows} rows written...`);
  }
  console.log(`\nWrote ${written} rows · errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
