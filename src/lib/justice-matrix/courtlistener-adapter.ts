/**
 * CourtListener REST-API adapter — mirrors the curia-adapter contract
 * (src/lib/justice-matrix/curia-adapter.ts). Exposes `courtlistenerApiItems(limit)`
 * returning validated JusticeMatrixDiscoveryItem[] with a deterministic field
 * map, no LLM.
 *
 * Focus: US immigration-detention and asylum case law (the Phase 1 wedge), plus
 * the unaccompanied-minor youth-immigration intersection.
 *
 * LIVE-VERIFIED 2026-05-29 against the v4 search endpoint:
 *   GET https://www.courtlistener.com/api/rest/v4/search/?q=immigration detention&type=o&order_by=dateFiled desc&filed_after=2015-01-01
 *   -> { count, next, previous, results: [ { caseName, dateFiled, court,
 *        court_id, citation: [...], absolute_url, docketNumber, cluster_id,
 *        judge, status, suitNature, opinions: [ { snippet, ... } ] } ] }
 * Gotchas confirmed and handled below:
 *   - v4 pagination is cursor-based: the response gives a full `next` URL with
 *     `?cursor=...`. `page` / `page_size` are NOT honoured.
 *   - The bare quoted-phrase-OR mega-query returns HTTP 400
 *     ({"semantic":["Semantic search requires semantic=true ..."]}). Simple
 *     keyword/phrase queries are required; do NOT set semantic=true (that
 *     switches to vector search).
 *   - `snippet` lives at opinions[0].snippet, NOT top-level.
 *   - `citation` is an array that can be empty ([]).
 *   - There is no top-level opinion `id`; use cluster_id / absolute_url.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

// VERIFIED LIVE: v4 is live; type=o (opinions) is the right document type.
export const COURTLISTENER_API_URL = 'https://www.courtlistener.com/api/rest/v4/search/';

/**
 * Simple keyword/phrase queries run separately and deduped by cluster_id.
 * VERIFIED LIVE: a single multi-OR mega-query triggers HTTP 400 (semantic
 * gate); these simple phrases each return a large corpus, taken newest-first.
 * `refugee` flags whether the pass is in the immigration/asylum domain (used as
 * a prior; the per-row text check still has the final say).
 */
const COURTLISTENER_QUERIES: Array<{ q: string; refugee: boolean }> = [
  { q: '"immigration detention"', refugee: true },
  { q: 'asylum', refugee: true },
  { q: '"unaccompanied minor"', refugee: true },
];

// Only pull reasonably recent law (keeps the newest-first cursor focused).
const FILED_AFTER = '2015-01-01';

// Text signals that confirm a row is actually in the immigration/asylum domain.
// Needed because BM25 keyword search bleeds (e.g. an employment case matched
// "immigration detention" in the verified probe).
const REFUGEE_SIGNAL =
  /\b(immigration|asylum|asylee|refugee|deport|removal|non-?refoulement|unaccompanied|migrant|noncitizen|alien|INA\b|BIA\b|ICE\b)/i;

interface CourtListenerOpinion {
  snippet?: string; // matched-text excerpt — VERIFIED LIVE: lives here, not top-level
  type?: string;
  download_url?: string;
}

/**
 * One result in the CourtListener v4 search payload.
 * VERIFIED LIVE field names.
 */
interface CourtListenerResult {
  caseName?: string;
  court?: string; // human-readable, e.g. "Court of Appeals for the Third Circuit"
  court_id?: string; // e.g. "ca3"
  dateFiled?: string; // ISO "YYYY-MM-DD"
  citation?: string[] | string; // reporter citation(s); array, can be empty
  docketNumber?: string;
  absolute_url?: string; // site-relative path, e.g. "/opinion/10863452/foo-v-bar/"
  cluster_id?: number; // stable opinion-cluster id; used for dedup + link fallback
  status?: string; // e.g. "Published"
  suitNature?: string;
  opinions?: CourtListenerOpinion[];
}

interface CourtListenerResponse {
  // DRF cursor-paginated envelope.
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: CourtListenerResult[];
}

/** Year from an ISO-ish `YYYY-MM-DD` date filed. */
function parseYear(dateFiled: string | undefined): number | null {
  if (!dateFiled) return null;
  const m = dateFiled.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function firstCitation(citation: CourtListenerResult['citation']): string | null {
  if (!citation) return null;
  if (Array.isArray(citation)) return citation[0] ?? null;
  return citation || null;
}

function firstSnippet(row: CourtListenerResult): string | null {
  const s = row.opinions?.[0]?.snippet;
  return s ? s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'user-agent': 'JusticeHub-JusticeMatrix/1.0 (+https://justicehub.com.au)',
  };
  // VERIFIED SHAPE: anonymous works; `Authorization: Token <key>` raises the
  // rate limit to 5,000 queries/day. Env var name kept as the scaffold's.
  if (process.env.COURTLISTENER_API_TOKEN) {
    headers['authorization'] = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }
  return headers;
}

/**
 * Run one query pass, following the v4 `next` cursor until `want` rows are
 * collected or the feed is exhausted. Capped at a few pages so a single pass
 * cannot run away.
 */
async function courtlistenerFetch(
  q: string,
  want: number
): Promise<CourtListenerResult[]> {
  const params = new URLSearchParams({
    q,
    type: 'o', // opinions
    order_by: 'dateFiled desc',
    filed_after: FILED_AFTER,
  });
  let url: string | null = `${COURTLISTENER_API_URL}?${params.toString()}`;
  const headers = buildHeaders();
  const out: CourtListenerResult[] = [];
  let pages = 0;
  const MAX_PAGES = 3;

  while (url && out.length < want && pages < MAX_PAGES) {
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`courtlistener API ${res.status}`);
    const json = (await res.json()) as CourtListenerResponse;
    out.push(...(json.results ?? []));
    // VERIFIED LIVE: follow the full `next` URL (it carries the cursor + all
    // original query params); do not synthesise our own page param.
    url = json.next ?? null;
    pages++;
  }
  return out.slice(0, want);
}

/**
 * Fetch up to `limit` US opinions from CourtListener and map them to discovery
 * items. Throws on a hard non-OK response (caller records it against the
 * source); returns [] when the payload is empty. Same posture as
 * curiaApiItems / hudocApiItems.
 */
export async function courtlistenerApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  // Spread the budget across the query passes, with a floor so each pass still
  // pulls something useful.
  const perQuery = Math.max(Math.ceil((limit * 2) / COURTLISTENER_QUERIES.length), 6);

  const rows: Array<{ row: CourtListenerResult; refugeePrior: boolean }> = [];
  for (const { q, refugee } of COURTLISTENER_QUERIES) {
    const pass = await courtlistenerFetch(q, perQuery);
    for (const row of pass) rows.push({ row, refugeePrior: refugee });
  }

  const items: JusticeMatrixDiscoveryItem[] = [];
  const seenClusters = new Set<number>();

  for (const { row, refugeePrior } of rows) {
    const name = (row.caseName ?? '').trim();
    if (!name) continue;
    if (row.cluster_id != null) {
      if (seenClusters.has(row.cluster_id)) continue;
      seenClusters.add(row.cluster_id);
    }

    const citation = firstCitation(row.citation);
    // Mirror curia/hudoc "{name} ({id})" so the dedup title fragment is stable.
    const title = citation
      ? `${name}, ${citation}`
      : row.docketNumber
        ? `${name} (${row.docketNumber})`
        : name;

    const year = parseYear(row.dateFiled);
    const snippet = firstSnippet(row);

    // refugee_related is only true when a domain signal is actually present in
    // the case name or snippet, even on an immigration-pass row. This filters
    // the BM25 keyword bleed (verified: an employment case matched the
    // "immigration detention" query).
    const haystack = `${name} ${snippet ?? ''}`;
    const immigration = refugeePrior && REFUGEE_SIGNAL.test(haystack);

    const categories = ['united states'];
    if (immigration) {
      categories.push('immigration detention');
      if (/unaccompanied|minor|juvenile/i.test(haystack)) categories.push('youth justice');
    } else {
      categories.push('case law');
    }

    // VERIFIED LIVE: absolute_url is site-relative; no top-level opinion id —
    // fall back to the cluster_id permalink.
    const item_url = row.absolute_url
      ? `https://www.courtlistener.com${row.absolute_url}`
      : row.cluster_id != null
        ? `https://www.courtlistener.com/opinion/${row.cluster_id}/`
        : null;

    const courtLabel = row.court || row.court_id;
    const raw = {
      item_type: 'case' as const,
      title,
      jurisdiction: courtLabel ? `United States (${courtLabel})` : 'United States',
      year,
      categories,
      summary: `US court opinion${courtLabel ? ` from ${courtLabel}` : ''}.${
        snippet ? ` ${snippet.slice(0, 220)}` : ''
      }`.trim(),
      country_code: 'US',
      item_url,
      refugee_related: immigration,
      confidence: 0.6,
    };

    // Gate, do not just label: BM25 keyword search bleeds in off-topic cases
    // (e.g. CSI Aviation, an Everglades suit) that merely mention a query word.
    // Only stage rows with an actual immigration/asylum signal in name+snippet,
    // so the sweep and the daily auto-publish cron do not pollute the matrix.
    if (!immigration) continue;
    const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
    if (v.success) items.push(v.data);
    if (items.length >= limit) break;
  }

  return items;
}
