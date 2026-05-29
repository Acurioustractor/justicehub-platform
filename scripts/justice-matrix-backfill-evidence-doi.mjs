#!/usr/bin/env node
/**
 * Backfill alma_evidence.doi from CrossRef (free, no key). Deterministic title
 * match, not LLM. CrossRef indexes journal-published work, so grey literature
 * (NGO reports, program evaluations) will not match and is left null - that is
 * correct, null beats a wrong DOI.
 *
 * Conservative match guard: the CrossRef result's title must share a high token
 * overlap with ours, or we skip it. A wrong DOI is worse than no DOI.
 *
 * Usage:
 *   node scripts/justice-matrix-backfill-evidence-doi.mjs            (dry run)
 *   node scripts/justice-matrix-backfill-evidence-doi.mjs --apply
 *   node scripts/justice-matrix-backfill-evidence-doi.mjs --apply --limit 50
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = readFileSync(`${root}/.env.local`, 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => {
    const [k, ...v] = l.split('=');
    a[k.trim()] = v.join('=').trim();
    return a;
  }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = (() => {
  const i = argv.indexOf('--limit');
  return i >= 0 ? parseInt(argv[i + 1], 10) : 100;
})();
const MAILTO = 'hello@justicehub.org.au'; // CrossRef polite-pool contact

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const tokens = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 2));

// Containment of our title's significant tokens within the candidate title.
function overlap(ours, candidate) {
  const a = tokens(ours);
  const b = tokens(candidate);
  if (!a.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / a.size;
}

async function crossrefDoi(title) {
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(
    title.slice(0, 200),
  )}&rows=3&select=DOI,title&mailto=${encodeURIComponent(MAILTO)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const items = json?.message?.items ?? [];
    for (const it of items) {
      const candTitle = Array.isArray(it.title) ? it.title[0] : it.title;
      if (!candTitle || !it.DOI) continue;
      // Accept only a strong two-way match: most of our title's tokens appear in
      // the candidate, and the candidate is not wildly longer (avoids matching a
      // chapter title to a whole-journal-issue record).
      if (overlap(title, candTitle) >= 0.7 && overlap(candTitle, title) >= 0.5) {
        return { doi: it.DOI, matched: candTitle };
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function run() {
  console.log(`\nCrossRef DOI backfill - alma_evidence  |  ${APPLY ? 'APPLY' : 'DRY RUN'}  |  limit ${LIMIT}`);
  const { data, error } = await supabase
    .from('alma_evidence')
    .select('id,title,doi')
    .is('doi', null)
    .not('title', 'is', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  const rows = data ?? [];
  console.log(`Checking ${rows.length} evidence row(s) with no DOI.\n`);

  let matched = 0;
  let written = 0;
  for (const r of rows) {
    const hit = await crossrefDoi(r.title);
    if (!hit) {
      // grey lit / no DOI - expected for many ALMA rows
      continue;
    }
    matched++;
    console.log(`  ${hit.doi}  <-  ${r.title.slice(0, 70)}`);
    if (APPLY) {
      const { error: upErr } = await supabase
        .from('alma_evidence')
        .update({ doi: hit.doi, updated_at: new Date().toISOString() })
        .eq('id', r.id);
      if (!upErr) written++;
    }
    await new Promise((res) => setTimeout(res, 200)); // polite to CrossRef
  }

  console.log(`\nMatched ${matched} / ${rows.length}${APPLY ? `, wrote ${written}` : ' (dry run)'}.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
