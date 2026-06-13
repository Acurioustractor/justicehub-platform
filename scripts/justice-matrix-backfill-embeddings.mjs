#!/usr/bin/env node
/**
 * Backfill embeddings on justice_matrix_cases rows that have NULL embedding
 * (33 today). These rows are invisible to semantic search until embedded, so
 * the /ask retrieval and /explore semantic toggle silently miss them. This
 * script makes the full case corpus reachable.
 *
 * It ONLY UPDATEs the embedding column on EXISTING rows. It never inserts a
 * row, never touches campaigns or evidence, never writes any other field.
 *
 * Text is composed exactly as the app composes it (caseEmbeddingText in
 * src/lib/justice-matrix/embeddings.ts): case_citation | jurisdiction | year |
 * strategic_issue | key_holding, embedded with text-embedding-3-small.
 *
 * DRY RUN BY DEFAULT. Prints what it would update and writes nothing. Pass
 * --apply to actually write. HUMAN-RUN ONLY — never queue this into AFK/cron.
 *
 * Usage:
 *   node scripts/justice-matrix-backfill-embeddings.mjs               (dry run)
 *   node scripts/justice-matrix-backfill-embeddings.mjs --apply       (write)
 *   node scripts/justice-matrix-backfill-embeddings.mjs --apply --batch 50
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
if (!env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY required (set it in .env.local)');
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const BATCH = (() => {
  const i = argv.indexOf('--batch');
  const n = i >= 0 ? parseInt(argv[i + 1], 10) : 40;
  return Number.isFinite(n) && n > 0 ? n : 40;
})();

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Compose the canonical case text. Copied VERBATIM from caseEmbeddingText in
 * src/lib/justice-matrix/embeddings.ts so the backfilled vectors share the
 * exact text representation the app uses everywhere else.
 */
function caseText(c) {
  return [
    c.case_citation ?? '',
    c.jurisdiction ?? '',
    c.year ? String(c.year) : '',
    c.strategic_issue ?? '',
    c.key_holding ?? '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 4000);
}

async function embedBatch(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

function toPgVec(arr) {
  return `[${arr.join(',')}]`;
}

async function run() {
  console.log(
    `\nJustice Matrix case-embedding backfill  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}  |  batch ${BATCH}`,
  );

  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,year,strategic_issue,key_holding')
    .is('embedding', null);
  if (error) throw new Error(`load justice_matrix_cases: ${error.message}`);

  const rows = data ?? [];
  if (!rows.length) {
    console.log('justice_matrix_cases: no rows missing embedding. Nothing to do.');
    return;
  }

  console.log(`justice_matrix_cases: ${rows.length} row(s) with NULL embedding`);

  let written = 0;
  let skipped = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const texts = slice.map(caseText);
    // Guard rows with no usable text: never send an empty input to OpenAI, and
    // never overwrite the embedding column for a row we cannot represent.
    const skipMask = texts.map((t) => t.trim().length < 5);
    const inputs = texts.map((t, j) => (skipMask[j] ? 'placeholder' : t));

    if (!APPLY) {
      for (let j = 0; j < slice.length; j++) {
        if (skipMask[j]) {
          console.log(`  [dry-run] SKIP ${slice[j].id} — no usable text`);
          skipped++;
        } else {
          console.log(
            `  [dry-run] WOULD UPDATE ${slice[j].id} — ${(slice[j].case_citation ?? '(no citation)').slice(0, 70)}`,
          );
          written++;
        }
      }
      continue;
    }

    let vectors;
    try {
      vectors = await embedBatch(inputs);
    } catch (e) {
      console.log(`  batch ${i + 1}-${Math.min(i + BATCH, rows.length)} failed: ${(e?.message ?? '').slice(0, 200)}`);
      continue;
    }

    for (let j = 0; j < slice.length; j++) {
      if (skipMask[j]) {
        console.log(`  SKIP ${slice[j].id} — no usable text`);
        skipped++;
        continue;
      }
      const { error: upErr } = await supabase
        .from('justice_matrix_cases')
        .update({ embedding: toPgVec(vectors[j]) })
        .eq('id', slice[j].id);
      if (upErr) {
        console.log(`  update ${slice[j].id}: ${upErr.message}`);
        continue;
      }
      written++;
      console.log(`  updated ${slice[j].id}`);
    }
  }

  console.log(
    `\n${APPLY ? 'Done.' : 'Dry run done.'}  ${APPLY ? 'wrote' : 'would write'} ${written}, skipped ${skipped} of ${rows.length}.`,
  );
  if (!APPLY) {
    console.log('Re-run with --apply to write. Human-run only — never queue into AFK/cron.');
  }
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
