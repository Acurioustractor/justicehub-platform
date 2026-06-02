#!/usr/bin/env node
/**
 * Replay a salvage file from alma-org-enrichment.mjs back into
 * alma_org_enrichment_candidates. Dedupes by organization_id so re-running is
 * safe (it just skips rows that already exist).
 *
 * Usage: node scripts/replay-enrichment-salvage.mjs <path/to/salvage.json>
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Manual env loader (same pattern as alma-org-enrichment.mjs)
async function loadEnv() {
  try {
    const text = await readFile(path.resolve('.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env.local optional
  }
}
await loadEnv();

const salvagePath = process.argv[2];
if (!salvagePath) {
  console.error('Usage: node scripts/replay-enrichment-salvage.mjs <salvage.json>');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rows = JSON.parse(await readFile(salvagePath, 'utf8'));
console.log(`Loaded ${rows.length} candidates from ${salvagePath}`);

// Drop any that already exist (dedupe by organization_id + source).
const orgIds = Array.from(new Set(rows.map((r) => r.organization_id)));
const existing = new Set();
for (let i = 0; i < orgIds.length; i += 100) {
  const { data } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('organization_id')
    .in('organization_id', orgIds.slice(i, i + 100))
    .eq('source', 'website_scrape');
  for (const r of data || []) existing.add(r.organization_id);
}
const fresh = rows.filter((r) => !existing.has(r.organization_id));
console.log(`${existing.size} already in DB · ${fresh.length} to insert`);

if (fresh.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// Chunked insert with retry (same logic as the enrichment script).
let inserted = 0;
const stillFailed = [];
for (let i = 0; i < fresh.length; i += 10) {
  const chunk = fresh.slice(i, i + 10);
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error } = await supabase
        .from('alma_org_enrichment_candidates')
        .insert(chunk);
      if (error) {
        lastErr = error;
        if (!/fetch failed|ECONN|ETIMEDOUT|network|timeout/i.test(error.message)) break;
      } else {
        inserted += chunk.length;
        lastErr = null;
        break;
      }
    } catch (e) {
      lastErr = e;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  if (lastErr) {
    console.error(`chunk ${i / 10 + 1} FAILED: ${lastErr.message}`);
    stillFailed.push(...chunk);
  }
}

console.log(`\nInserted ${inserted} of ${fresh.length}.`);
if (stillFailed.length > 0) {
  const out = salvagePath.replace(/\.json$/, '-retry.json');
  await (await import('node:fs/promises')).writeFile(out, JSON.stringify(stillFailed, null, 2));
  console.error(`${stillFailed.length} still failed — saved to ${out} for another retry.`);
}
