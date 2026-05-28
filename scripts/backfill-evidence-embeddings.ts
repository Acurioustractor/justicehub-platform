#!/usr/bin/env npx tsx
/**
 * Step 2 of justice-matrix-alma-evidence-linking.
 *
 * Backfill embeddings on every alma_evidence row so it can be cross-linked into
 * the Justice Matrix semantic search as a DISTINCT third kind. Embeddings are
 * computed via OpenAI text-embedding-3-small (1536-dim) — the SAME model the
 * Matrix cases/campaigns use, so cosine distances are comparable when
 * interleaved.
 *
 * Idempotent: only rows with embedding IS NULL are processed.
 *
 * NOTE: alma_evidence has NO verification_status column (that filter applies to
 * alma_interventions, not evidence), so there is no ai_generated filter here.
 *
 * Usage:
 *   npx tsx scripts/backfill-evidence-embeddings.ts                    (dry run)
 *   npx tsx scripts/backfill-evidence-embeddings.ts --apply            (write)
 *   npx tsx scripts/backfill-evidence-embeddings.ts --apply --limit 10 (sample)
 *   npx tsx scripts/backfill-evidence-embeddings.ts --apply --batch 50 (custom batch)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { evidenceEmbeddingText, embedBatch, toPgVector } from '../src/lib/justice-matrix/embeddings';

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
const intArg = (flag: string, def: number) => {
  const i = argv.indexOf(flag);
  if (i < 0) return def;
  const n = parseInt(argv[i + 1], 10);
  return Number.isFinite(n) ? n : def;
};
const BATCH = intArg('--batch', 40);
const LIMIT = intArg('--limit', 0); // 0 = no cap

interface EvidenceRow {
  id: string;
  title: string | null;
  evidence_type: string | null;
  findings: string | null;
  methodology: string | null;
  timeframe: string | null;
  author: string | null;
  organization: string | null;
}

async function run() {
  console.log(
    `\n🧬 ALMA evidence embeddings backfill  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}  |  batch ${BATCH}${LIMIT ? `  |  limit ${LIMIT}` : ''}`,
  );

  if (!env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  let query = supabase
    .from('alma_evidence')
    .select('id,title,evidence_type,findings,methodology,timeframe,author,organization')
    .is('embedding', null)
    .order('created_at', { ascending: true });
  if (LIMIT > 0) query = query.limit(LIMIT);

  const { data, error } = await query;
  if (error) throw new Error(`load alma_evidence: ${error.message}`);
  const rows = (data ?? []) as EvidenceRow[];

  if (!rows.length) {
    console.log('  ✅ alma_evidence: no rows missing embedding');
    return;
  }
  console.log(`  📥 alma_evidence: ${rows.length} row(s) missing embedding`);

  let written = 0;
  let skipped = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const texts = slice.map((r) => evidenceEmbeddingText(r));
    const skipMask = texts.map((t) => t.trim().length < 5);
    const inputs = texts.map((t, j) => (skipMask[j] ? 'placeholder' : t));
    console.log(
      `     → embedding batch ${i + 1}-${Math.min(i + BATCH, rows.length)} (${inputs.length} items)`,
    );

    let vectors: number[][];
    try {
      vectors = await embedBatch(inputs, env.OPENAI_API_KEY);
    } catch (e) {
      console.log(`     ❌ batch failed, skipping: ${(e as Error).message?.slice(0, 200)}`);
      continue;
    }

    for (let j = 0; j < slice.length; j++) {
      if (skipMask[j]) {
        skipped++;
        continue; // no usable text — leave embedding NULL
      }
      if (!APPLY) {
        written++;
        continue;
      }
      const { error: upErr } = await supabase
        .from('alma_evidence')
        .update({ embedding: toPgVector(vectors[j]), updated_at: new Date().toISOString() })
        .eq('id', slice[j].id);
      if (upErr) {
        console.log(`     ⚠️  update ${slice[j].id}: ${upErr.message}`);
        continue;
      }
      written++;
    }
  }

  console.log(
    `\n  ${APPLY ? '✅ wrote' : '🔎 would write'} ${written} embedding(s)  |  skipped ${skipped} (no usable text)`,
  );
  if (!APPLY) console.log('  (dry run — re-run with --apply to write)');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
