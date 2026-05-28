/**
 * Vercel cron: nightly catch-up for any Justice Matrix rows that landed
 * without an embedding (network blip during the real-time approve, manual
 * SQL insert, an early row predating the column).
 *
 * Idempotent. Bounded per run so a serverless invocation can't blow the
 * timeout if a large import lands all at once.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import {
  caseEmbeddingText,
  campaignEmbeddingText,
  embedBatch,
  toPgVector,
} from '@/lib/justice-matrix/embeddings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 40;
const MAX_PER_RUN = 200; // generous; today's whole corpus is ~160

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function topUpTable(opts: {
  supabase: Db;
  table: 'justice_matrix_cases' | 'justice_matrix_campaigns';
  selectCols: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  composeText: (row: any) => string;
}): Promise<{ found: number; embedded: number }> {
  const { supabase, table, selectCols, composeText } = opts;
  const { data, error } = await supabase
    .from(table)
    .select(`id,${selectCols}`)
    .is('embedding', null)
    .limit(MAX_PER_RUN);
  if (error) throw new Error(`load ${table}: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as Array<{ id: string } & Record<string, any>>;
  if (!rows.length) return { found: 0, embedded: 0 };

  let embedded = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const texts = slice.map(composeText);
    const skip = texts.map((t) => t.trim().length < 5);
    const inputs = texts.map((t, j) => (skip[j] ? 'placeholder' : t));
    let vecs: number[][];
    try {
      vecs = await embedBatch(inputs);
    } catch {
      continue; // try next batch
    }
    for (let j = 0; j < slice.length; j++) {
      if (skip[j]) continue;
      const { error: upErr } = await supabase
        .from(table)
        .update({ embedding: toPgVector(vecs[j]) })
        .eq('id', slice[j].id);
      if (!upErr) embedded++;
    }
  }
  return { found: rows.length, embedded };
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = request.headers.get('authorization');
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  const supabase = createServiceClient() as Db;
  let cases = { found: 0, embedded: 0 };
  let campaigns = { found: 0, embedded: 0 };
  try {
    cases = await topUpTable({
      supabase,
      table: 'justice_matrix_cases',
      selectCols: 'case_citation,jurisdiction,year,strategic_issue,key_holding',
      composeText: (r) => caseEmbeddingText(r),
    });
    campaigns = await topUpTable({
      supabase,
      table: 'justice_matrix_campaigns',
      selectCols: 'campaign_name,country_region,start_year,goals,notable_tactics',
      composeText: (r) => campaignEmbeddingText(r),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message?.slice(0, 300) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    scanned_at: new Date().toISOString(),
    cases,
    campaigns,
  });
}
