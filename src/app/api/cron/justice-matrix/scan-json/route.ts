/**
 * Vercel cron: weekly scan of JSON-API sources in justice_matrix_sources.
 *
 * Stays inside the serverless runtime by handling only sources that expose a
 * direct JSON API (data_format='json'). HTML / Playwright sources are still
 * run manually via `npx tsx scripts/scan-justice-matrix.ts --apply`.
 *
 * Schedule lives in vercel.json. Vercel calls GET with an Authorization
 * header that matches CRON_SECRET; we accept that header or no header in
 * local dev.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { curiaApiItems } from '@/lib/justice-matrix/curia-adapter';
import {
  discoveryEmbeddingText,
  findSemanticDuplicate,
  type SemanticMatch,
} from '@/lib/justice-matrix/embeddings';
import type { JusticeMatrixDiscoveryItem } from '@/lib/ai/llm-schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

interface SourceRow {
  id: string;
  name: string;
  url: string;
  data_format: string | null;
  total_items_found: number | null;
}

const LIMIT_PER_SOURCE = 8;

/**
 * Check whether a candidate item exactly matches an item already live or
 * pending. Exact matches are skipped outright (no point re-staging the same
 * thing for review). Semantic near-matches are NOT exact — they get flagged
 * but still staged so the curator can confirm the duplicate in the queue.
 */
async function exactDuplicate(supabase: Db, item: JusticeMatrixDiscoveryItem): Promise<boolean> {
  const titleFragment = item.title.trim().slice(0, 40);
  const table = item.item_type === 'case' ? 'justice_matrix_cases' : 'justice_matrix_campaigns';
  const titleCol = item.item_type === 'case' ? 'case_citation' : 'campaign_name';
  const { data: live } = await supabase
    .from(table)
    .select('id')
    .ilike(titleCol, `%${titleFragment}%`)
    .limit(1);
  if (live?.length) return true;
  const { data: queued } = await supabase
    .from('justice_matrix_discovered')
    .select('id')
    .ilike('extracted_title', `%${titleFragment}%`)
    .limit(1);
  return !!queued?.length;
}

async function scanCuriaSource(supabase: Db, source: SourceRow) {
  const items = await curiaApiItems(LIMIT_PER_SOURCE);
  let staged = 0;
  for (const item of items) {
    if (await exactDuplicate(supabase, item)) continue;

    // Semantic dedup: compute the candidate's embedding and look for a close
    // existing case / campaign. If found, stage anyway but flag the candidate
    // with potential_duplicate_id + similarity_score so the curator queue
    // surfaces it and the human decides.
    let semantic: SemanticMatch | null = null;
    try {
      semantic = await findSemanticDuplicate({
        supabase,
        itemType: item.item_type === 'case' ? 'case' : 'campaign',
        text: discoveryEmbeddingText({
          extracted_title: item.title,
          extracted_jurisdiction: item.jurisdiction,
          extracted_year: item.year,
          extracted_summary: item.summary,
        }),
      });
    } catch {
      // Embedding-side failures should not block staging.
    }

    const { error } = await supabase.from('justice_matrix_discovered').insert({
      source_id: source.id,
      source_url: item.item_url || source.url,
      item_type: item.item_type,
      raw_data: {
        extracted: item,
        scanner: 'cron/scan-json',
        scanned_at: new Date().toISOString(),
        semantic_match: semantic ?? null,
      },
      extracted_title: item.title,
      extracted_jurisdiction: item.jurisdiction ?? null,
      extracted_year: item.year ?? null,
      extracted_categories: item.categories ?? [],
      extracted_summary: item.summary ?? null,
      extracted_country_code: item.country_code ?? null,
      extraction_confidence: item.confidence,
      potential_duplicate_id: semantic?.id ?? null,
      similarity_score: semantic ? Math.round((1 - semantic.distance) * 100) : null,
      status: 'pending',
    });
    if (!error) staged++;
  }
  return staged;
}

export async function GET(request: Request) {
  // Honour the Vercel cron secret in production; allow no header locally.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = request.headers.get('authorization');
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceClient() as Db;
  const { data: sources, error } = await supabase
    .from('justice_matrix_sources')
    .select('id,name,url,data_format,total_items_found')
    .eq('is_active', true)
    .eq('data_format', 'json');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ source: string; staged: number; error?: string }> = [];
  let totalStaged = 0;
  for (const source of (sources ?? []) as SourceRow[]) {
    const now = new Date().toISOString();
    try {
      // Currently only the InfoCuria endpoint is supported; new JSON sources
      // get their own adapter branch as they are added.
      let staged = 0;
      if (/curia\.europa\.eu/.test(source.url)) {
        staged = await scanCuriaSource(supabase, source);
      } else {
        results.push({ source: source.name, staged: 0, error: 'no adapter for this JSON source yet' });
        continue;
      }
      totalStaged += staged;
      await supabase
        .from('justice_matrix_sources')
        .update({
          last_scraped_at: now,
          last_success_at: now,
          last_error: null,
          total_items_found: (source.total_items_found ?? 0) + staged,
          updated_at: now,
        })
        .eq('id', source.id);
      results.push({ source: source.name, staged });
    } catch (e) {
      const message = e instanceof Error ? e.message.slice(0, 300) : String(e);
      await supabase
        .from('justice_matrix_sources')
        .update({ last_scraped_at: now, last_error: message, updated_at: now })
        .eq('id', source.id);
      results.push({ source: source.name, staged: 0, error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned_at: new Date().toISOString(),
    json_sources_seen: (sources ?? []).length,
    total_staged: totalStaged,
    per_source: results,
  });
}
