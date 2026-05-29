/**
 * CourtListener REST-API adapter — mirrors the curia-adapter contract
 * (src/lib/justice-matrix/curia-adapter.ts). Exposes `courtlistenerApiItems(limit)`
 * returning validated JusticeMatrixDiscoveryItem[] with a deterministic field
 * map, no LLM.
 *
 * Focus: US youth-justice and immigration-detention case law (the Phase 1 wedge
 * the strategy targets: 30–60 US juvenile-justice and immigration-detention
 * cases).
 *
 * CourtListener (Free Law Project) has a public, documented REST API:
 *   https://www.courtlistener.com/help/api/rest/
 * The Search endpoint (v4) is the right surface for keyword discovery. Most of
 * the call shape below is from the published docs, but the exact response field
 * names and the auth requirement are tagged `TODO(live-api)` where they need a
 * live confirmation.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

// CourtListener v4 search endpoint. Documented at
// https://www.courtlistener.com/help/api/rest/search/
// TODO(live-api): confirm the current major version path (`/api/rest/v4/`).
// The Free Law Project rev's the version; v3 is being retired. Confirm v4 is
// live and that `type=o` (opinions) is still the right document type.
export const COURTLISTENER_API_URL = 'https://www.courtlistener.com/api/rest/v4/search/';

// Keyword query for the youth-justice + immigration-detention wedge.
// TODO(live-api): confirm CourtListener search-query operators. It supports a
// Lucene-like syntax; the quoted-phrase OR form below is the documented shape.
const COURTLISTENER_QUERY =
  '("juvenile justice" OR "juvenile detention" OR "youth detention" OR ' +
  '"immigration detention" OR "detention of minors" OR "unaccompanied minor")';

/**
 * One result in the CourtListener search payload.
 * TODO(live-api): confirm field names against a live v4 response. The v4 search
 * result is observed to expose `caseName`, `dateFiled`, `court`,
 * `citation`, `absolute_url`, and an `id`. Some are nested differently than v3.
 */
interface CourtListenerResult {
  id?: number;
  caseName?: string; // TODO(live-api): v4 may use `case_name`
  court?: string; // human-readable court name
  dateFiled?: string; // TODO(live-api): v4 may use `dateFiled` or `date_filed`, ISO `YYYY-MM-DD`
  citation?: string[] | string; // reporter citation(s)
  docketNumber?: string;
  absolute_url?: string; // site-relative path, e.g. "/opinion/12345/foo-v-bar/"
  snippet?: string; // matched-text excerpt
}

interface CourtListenerResponse {
  // The DRF-style paginated envelope: { count, next, previous, results }.
  results?: CourtListenerResult[];
  count?: number;
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

/**
 * Fetch up to `limit` US opinions from CourtListener and map them to discovery
 * items. Throws on a hard network / non-OK response (caller records it against
 * the source); returns [] when the payload is empty. Same posture as
 * curiaApiItems / hudocApiItems.
 */
export async function courtlistenerApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const pageSize = Math.max(limit * 2, 12);

  // TODO(live-api): confirm search params. Documented: `q` (query),
  // `type=o` (opinions), `order_by`. Pagination is `page` + page size is
  // server-controlled in v4 (no `page_size` honoured on search) — confirm and
  // switch to cursor pagination if v4 requires it.
  const params = new URLSearchParams({
    q: COURTLISTENER_QUERY,
    type: 'o', // opinions; switch to 'r' for dockets if a docket feed is wanted
    order_by: 'dateFiled desc',
  });

  const headers: Record<string, string> = {
    accept: 'application/json',
    'user-agent': 'JusticeHub-JusticeMatrix/1.0 (+https://justicehub.com.au)',
  };
  // CourtListener allows anonymous access at a low rate limit; an API token
  // raises it substantially. TODO(live-api): confirm the header format
  // (`Authorization: Token <key>`) and the env-var name once a key is issued.
  if (process.env.COURTLISTENER_API_TOKEN) {
    headers['authorization'] = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }

  const res = await fetch(`${COURTLISTENER_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) throw new Error(`courtlistener API ${res.status}`);

  const json = (await res.json()) as CourtListenerResponse;
  const rows = (json.results ?? []).slice(0, pageSize);

  const items: JusticeMatrixDiscoveryItem[] = [];
  for (const row of rows) {
    const name = (row.caseName ?? '').trim();
    if (!name) continue;

    const citation = firstCitation(row.citation);
    // Mirror curia/hudoc "{name} ({id})" so the dedup title fragment is stable.
    const title = citation
      ? `${name}, ${citation}`
      : row.docketNumber
        ? `${name} (${row.docketNumber})`
        : name;

    const year = parseYear(row.dateFiled);

    const lower = name.toLowerCase();
    const categories = ['united states'];
    const immigration = /immigration|asylum|unaccompanied|deportation|refugee/.test(
      `${lower} ${(row.snippet ?? '').toLowerCase()}`
    );
    if (immigration) categories.push('immigration detention');
    else categories.push('youth justice');

    // absolute_url is site-relative; resolve against the origin.
    const item_url = row.absolute_url
      ? `https://www.courtlistener.com${row.absolute_url}`
      : row.id
        ? `https://www.courtlistener.com/opinion/${row.id}/`
        : null;

    const raw = {
      item_type: 'case' as const,
      title,
      jurisdiction: row.court ? `United States (${row.court})` : 'United States',
      year,
      categories,
      summary: `US court opinion${row.court ? ` from ${row.court}` : ''}.${
        row.snippet ? ` ${row.snippet.replace(/<[^>]+>/g, '').slice(0, 220)}` : ''
      }`.trim(),
      country_code: 'US',
      item_url,
      refugee_related: immigration,
      confidence: 0.6,
    };

    const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
    if (v.success) items.push(v.data);
    if (items.length >= limit) break;
  }

  return items;
}
