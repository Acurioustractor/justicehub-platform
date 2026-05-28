#!/usr/bin/env npx tsx
/**
 * Backfill embeddings on every Justice Matrix case and campaign so semantic
 * dedup works in the scanner. Embeddings are computed once via OpenAI's
 * text-embedding-3-small (1536-dim) and stored in pgvector columns.
 *
 * Idempotent: only rows with embedding IS NULL are processed. Re-run after a
 * fresh import; a future trigger could keep this current automatically.
 *
 * Usage:
 *   npx tsx scripts/backfill-matrix-embeddings.ts                    (dry run)
 *   npx tsx scripts/backfill-matrix-embeddings.ts --apply            (write)
 *   npx tsx scripts/backfill-matrix-embeddings.ts --apply --batch 50 (custom batch)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  caseEmbeddingText,
  campaignEmbeddingText,
  embedBatch,
  toPgVector,
} from '../src/lib/justice-matrix/embeddings';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce<Record<string, string>>((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const BATCH = parseInt(
  (() => {
    const i = argv.indexOf('--batch');
    return i >= 0 ? argv[i + 1] : '40';
  })(),
  10,
);

async function processTable<
  Row extends { id: string },
>(opts: {
  table: 'justice_matrix_cases' | 'justice_matrix_campaigns';
  selectCols: string;
  composeText: (row: Row) => string;
}) {
  const { table, selectCols, composeText } = opts;
  const { data, error } = await supabase
    .from(table)
    .select(`id,${selectCols}`)
    .is('embedding', null);
  if (error) throw new Error(`load ${table}: ${error.message}`);
  const rows = (data ?? []) as unknown as Row[];
  if (!rows.length) {
    console.log(`  ✅ ${table}: no rows missing embedding`);
    return { table, processed: 0, written: 0 };
  }

  console.log(`  📥 ${table}: ${rows.length} row(s) missing embedding`);
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const texts = slice.map((r) => composeText(r));
    const skipMask = texts.map((t) => t.trim().length < 5);
    const inputs = texts.map((t, j) => (skipMask[j] ? 'placeholder' : t));
    console.log(`     → embedding batch ${i + 1}-${Math.min(i + BATCH, rows.length)} (${inputs.length} items)`);

    let vectors: number[][];
    try {
      vectors = await embedBatch(inputs, env.OPENAI_API_KEY);
    } catch (e) {
      console.log(`     ❌ batch failed: ${(e as Error).message?.slice(0, 200)}`);
      continue;
    }

    if (!APPLY) {
      written += slice.length;
      continue;
    }

    for (let j = 0; j < slice.length; j++) {
      if (skipMask[j]) continue; // skip rows with no usable text
      const { error: upErr } = await supabase
        .from(table)
        .update({ embedding: toPgVector(vectors[j]), updated_at: new Date().toISOString() })
        .eq('id', slice[j].id);
      if (upErr) {
        console.log(`     ⚠️  update ${slice[j].id}: ${upErr.message}`);
        continue;
      }
      written++;
    }
  }
  return { table, processed: rows.length, written };
}

async function run() {
  console.log(`\n🧬 Justice Matrix embeddings backfill  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}  |  batch ${BATCH}`);

  if (!env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const casesResult = await processTable<{
    id: string;
    case_citation: string;
    jurisdiction: string | null;
    year: number | null;
    strategic_issue: string | null;
    key_holding: string | null;
  }>({
    table: 'justice_matrix_cases',
    selectCols: 'case_citation,jurisdiction,year,strategic_issue,key_holding',
    composeText: (r) => caseEmbeddingText(r),
  });
  const campaignsResult = await processTable<{
    id: string;
    campaign_name: string;
    country_region: string | null;
    start_year: number | null;
    goals: string | null;
    notable_tactics: string | null;
  }>({
    table: 'justice_matrix_campaigns',
    selectCols: 'campaign_name,country_region,start_year,goals,notable_tactics',
    composeText: (r) => campaignEmbeddingText(r),
  });

  console.log(`\n${APPLY ? '✅ done' : '✅ dry run done'}`);
  console.log(`  ${casesResult.table}: ${casesResult.written}/${casesResult.processed}`);
  console.log(`  ${campaignsResult.table}: ${campaignsResult.written}/${campaignsResult.processed}`);
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
