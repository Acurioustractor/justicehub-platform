#!/usr/bin/env node
/**
 * Backfill ABNs into oric_corporations from abr_registry by name match.
 *
 * 4,081 ORIC corporations have no ABN. We pull each one, query abr_registry
 * for entity_name starting with the same first word, and pick the highest
 * Jaccard-trigram match >= 0.55.
 *
 * Per-org query strategy is the speed trick — bare trigram update against
 * 20M-row abr_registry times out, but a prefix-restricted query per ORIC
 * row is bounded.
 *
 * Idempotent. Re-running picks up new ORIC rows + retries previously
 * unmatched ones (in case ABR refresh added new entities).
 *
 * Usage:
 *   node scripts/civic/backfill-oric-abns.mjs              # dry-run
 *   node scripts/civic/backfill-oric-abns.mjs --apply
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const MIN_SIM = 0.55;

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

async function fetchAllMissing() {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('oric_corporations')
      .select('id, name')
      .is('abn', null)
      .not('name', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function searchAbrForOric(name) {
  // Take first 2 tokens of the ORIC name as the prefix for ILIKE.
  const tokens = name.split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length === 0) return null;
  const prefix = tokens.slice(0, 2).join(' ');

  const { data, error } = await supabase
    .from('abr_registry')
    .select('abn, entity_name, status')
    .ilike('entity_name', `${prefix}%`)
    .limit(20);
  if (error || !data || data.length === 0) return null;

  // Prefer Active entities; pick highest trigram similarity
  const ours = trigrams(name.toLowerCase());
  let best = { abn: null, sim: 0, entity_name: null, status: null };
  for (const r of data) {
    if (!r.entity_name) continue;
    const sim = jaccard(ours, trigrams(r.entity_name.toLowerCase()));
    // Slight bonus for active entities
    const adjusted = sim + (r.status === 'Active' || r.status === 'ACT' ? 0.02 : 0);
    if (adjusted > best.sim) {
      best = { abn: r.abn, sim, entity_name: r.entity_name, status: r.status };
    }
  }
  return best.abn ? best : null;
}

async function main() {
  console.log(`ORIC ABN backfill · ${APPLY ? 'APPLY' : 'DRY-RUN'} · trigram match against abr_registry\n`);

  const missing = await fetchAllMissing();
  console.log(`ORIC corporations with NULL abn: ${missing.length}\n`);

  const matches = [];
  const stats = { matched: 0, no_match: 0, errors: 0 };
  const startedAt = Date.now();
  for (let i = 0; i < missing.length; i++) {
    const orc = missing[i];
    if ((i + 1) % 200 === 0) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const eta = (elapsed / (i + 1)) * (missing.length - i - 1);
      console.log(`  ${i + 1}/${missing.length} · matched ${stats.matched} · eta ${eta.toFixed(0)}s`);
    }
    try {
      const best = await searchAbrForOric(orc.name);
      if (!best || best.sim < MIN_SIM) {
        stats.no_match++;
        continue;
      }
      matches.push({ id: orc.id, name: orc.name, abn: best.abn, sim: best.sim, entity_name: best.entity_name });
      stats.matched++;
    } catch (e) {
      stats.errors++;
    }
  }

  console.log(`\nMatched ${stats.matched} · no_match ${stats.no_match} · errors ${stats.errors}`);

  if (matches.length > 0) {
    console.log('\nFirst 10 matches:');
    for (const m of matches.slice(0, 10)) {
      console.log(`  ${m.name.slice(0, 45).padEnd(47)} → ${m.abn} (${m.sim.toFixed(2)}) [${m.entity_name?.slice(0, 35)}]`);
    }
  }

  if (!APPLY) {
    console.log('\nDry-run — pass --apply to write.');
    return;
  }

  let written = 0;
  let errors = 0;
  for (const m of matches) {
    const { error } = await supabase
      .from('oric_corporations')
      .update({ abn: m.abn, updated_at: new Date().toISOString() })
      .eq('id', m.id);
    if (error) {
      errors++;
      continue;
    }
    written++;
    if (written % 200 === 0) console.log(`  ${written}/${matches.length} written...`);
  }
  console.log(`\nWrote ${written} · errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
