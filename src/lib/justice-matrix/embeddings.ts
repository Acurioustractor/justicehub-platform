/**
 * Embedding helpers for the Justice Matrix.
 *
 * One canonical text representation per item, sent to OpenAI's
 * text-embedding-3-small (1536-dim). Used for backfill and for semantic dedup
 * inside the scanner — the old title-ILIKE check missed citation variants and
 * cross-table near-duplicates.
 */

import OpenAI from 'openai';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIM = 1536;
/**
 * Cosine distance threshold below which two items are considered duplicates.
 * Picked conservatively — text-embedding-3-small returns ~0.1-0.25 for true
 * paraphrases, ~0.4-0.6 for same-topic-different-case. Tunable per source.
 */
export const DUP_DISTANCE_THRESHOLD = 0.18;

let _client: OpenAI | null = null;
function client(apiKey?: string): OpenAI {
  if (_client) return _client;
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  _client = new OpenAI({ apiKey: key });
  return _client;
}

/**
 * Compose the canonical text for a case. Order matters: citation first so the
 * embedding leans on the formal identifier; key_holding included because it
 * carries the substance, when present.
 */
export function caseEmbeddingText(c: {
  case_citation?: string | null;
  jurisdiction?: string | null;
  year?: number | null;
  strategic_issue?: string | null;
  key_holding?: string | null;
}): string {
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

export function campaignEmbeddingText(c: {
  campaign_name?: string | null;
  country_region?: string | null;
  start_year?: number | null;
  goals?: string | null;
  notable_tactics?: string | null;
}): string {
  return [
    c.campaign_name ?? '',
    c.country_region ?? '',
    c.start_year ? String(c.start_year) : '',
    c.goals ?? '',
    c.notable_tactics ?? '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 4000);
}

/**
 * Compose the canonical text for an ALMA evidence row. Title first (the formal
 * identifier), then findings (the substance), then methodology/context. Used to
 * cross-link Australian youth-justice evidence into Matrix semantic search as a
 * distinct kind — never merged into the cases/campaigns tables.
 */
export function evidenceEmbeddingText(e: {
  title?: string | null;
  evidence_type?: string | null;
  findings?: string | null;
  methodology?: string | null;
  timeframe?: string | null;
  author?: string | null;
  organization?: string | null;
}): string {
  return [
    e.title ?? '',
    e.evidence_type ?? '',
    e.findings ?? '',
    e.methodology ?? '',
    e.timeframe ?? '',
    e.author ?? '',
    e.organization ?? '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 4000);
}

/** Composes the canonical text for a discovered item using its extracted fields. */
export function discoveryEmbeddingText(d: {
  extracted_title: string;
  extracted_jurisdiction?: string | null;
  extracted_year?: number | null;
  extracted_summary?: string | null;
}): string {
  return [
    d.extracted_title,
    d.extracted_jurisdiction ?? '',
    d.extracted_year ? String(d.extracted_year) : '',
    d.extracted_summary ?? '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 4000);
}

export async function embed(text: string, apiKey?: string): Promise<number[]> {
  const res = await client(apiKey).embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

/** Same call shape, batched for throughput when backfilling. */
export async function embedBatch(texts: string[], apiKey?: string): Promise<number[][]> {
  if (!texts.length) return [];
  const res = await client(apiKey).embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

/**
 * Format a JS number[] as a pgvector literal — `'[0.1,0.2,...]'` — for direct
 * use in INSERT/UPDATE strings or .update() RPC calls. Supabase-js does not
 * auto-serialise vector arrays.
 */
export function toPgVector(values: number[]): string {
  return `[${values.join(',')}]`;
}

export interface SemanticMatch {
  id: string;
  title: string;
  distance: number;
}

/**
 * Find the nearest existing case or campaign for a candidate item by cosine
 * distance on the embedding. Returns null if nothing is close enough, or if
 * the OpenAI/RPC call fails — the caller treats that as "no semantic match
 * found" and falls back to the title-ILIKE check.
 *
 * `apply` choice: when DUP_DISTANCE_THRESHOLD is too tight you'll miss real
 * paraphrases; when too loose you'll false-positive across the same domain.
 * Default 0.18 was picked from the AAA Rwanda neighbour fan-out, where same-
 * domain-different-case is in the 0.38-0.50 band.
 */
export async function findSemanticDuplicate(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  itemType: 'case' | 'campaign';
  text: string;
  apiKey?: string;
  threshold?: number;
}): Promise<SemanticMatch | null> {
  const { supabase, itemType, text, apiKey } = opts;
  const threshold = opts.threshold ?? DUP_DISTANCE_THRESHOLD;
  if (!text || text.trim().length < 5) return null;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embed(text, apiKey);
  } catch {
    return null;
  }
  const queryVec = toPgVector(queryEmbedding);

  const rpc = itemType === 'case' ? 'justice_matrix_nearest_case' : 'justice_matrix_nearest_campaign';
  const { data, error } = await supabase.rpc(rpc, {
    query_embedding: queryVec,
    max_distance: threshold,
  });
  if (error || !data?.length) return null;
  const row = data[0];
  return {
    id: row.id,
    title: itemType === 'case' ? row.case_citation : row.campaign_name,
    distance: Number(row.distance),
  };
}
