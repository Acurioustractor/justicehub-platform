/**
 * ECtHR HUDOC JSON-API adapter — mirrors the curia-adapter contract
 * (src/lib/justice-matrix/curia-adapter.ts). Exposes a single async function
 * `hudocApiItems(limit)` that returns validated JusticeMatrixDiscoveryItem[]
 * with no LLM in the loop — a deterministic field map, same as curia.
 *
 * Focus: ECtHR child-detention and Article 3 / 5 / 8 case law (the youth-justice
 * and immigration-detention wedge the strategy targets in Phase 1).
 *
 * ⚠️ SCAFFOLD — LIVE-API VERIFICATION REQUIRED.
 * HUDOC exposes an undocumented Solr/Lucene-backed search endpoint that the
 * public portal (https://hudoc.echr.coe.int) calls. The endpoint, query-param
 * names, and response field names below are best-effort and MUST be confirmed
 * against a live request before this adapter is wired into an active source.
 * Every unverified detail is tagged `TODO(live-api)`.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

// TODO(live-api): confirm the HUDOC search endpoint. The portal is observed to
// call an `app/query/results` path on `hudoc.echr.coe.int`; the exact host and
// path need a live network-tab capture to confirm.
// Reference: https://hudoc.echr.coe.int (open the network tab, filter XHR).
export const HUDOC_API_URL = 'https://hudoc.echr.coe.int/app/query/results';

// TODO(live-api): confirm the Lucene query syntax HUDOC accepts in the `query`
// param. Below is a best-effort filter for English-language Chamber/Grand
// Chamber judgments mentioning child detention and the relevant Articles.
const HUDOC_QUERY =
  '(contentsitename:ECHR) AND (documentcollectionid2:"JUDGMENTS") AND ' +
  '("detention of minors" OR "child detention" OR "Article 3" OR "Article 5" OR "Article 8")';

// TODO(live-api): confirm the `select` field list HUDOC returns. These are the
// field names observed in older HUDOC payloads; some may have been renamed.
const HUDOC_SELECT = [
  'itemid',
  'docname',
  'appno',
  'article',
  'kpdate',
  'ecli',
  'importance',
  'conclusion',
].join(',');

/**
 * One row in the HUDOC results payload.
 * TODO(live-api): the live API nests result fields under `columns` in some
 * versions and flat in others. This interface models the flat-`columns` shape;
 * adjust once a live response is captured.
 */
interface HudocColumns {
  itemid?: string;
  docname?: string; // e.g. "CASE OF A. AND OTHERS v. FRANCE"
  appno?: string; // application number(s), often semicolon-joined
  article?: string; // e.g. "3;5;8"
  kpdate?: string; // judgment date, TODO(live-api): confirm format (ISO vs dd/mm/yyyy)
  ecli?: string;
  conclusion?: string;
}

interface HudocResult {
  columns?: HudocColumns;
}

interface HudocResponse {
  // TODO(live-api): confirm the results array key. Older payloads use
  // `results`; some proxies wrap it in `{ "response": { "docs": [...] } }`.
  results?: HudocResult[];
  resultcount?: number;
}

/** Best-effort year parse from a HUDOC date string of unknown format. */
function parseYear(kpdate: string | undefined): number | null {
  if (!kpdate) return null;
  // Match a 4-digit year anywhere in the string (covers ISO `2021-...` and
  // `dd/mm/yyyy`). TODO(live-api): tighten once the real format is confirmed.
  const m = kpdate.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Fetch up to `limit` ECtHR judgments from HUDOC and map them to discovery
 * items. Returns [] on any non-OK response rather than throwing on a soft
 * failure, but throws on a hard network error so the caller can record it
 * against the source (same posture as curiaApiItems).
 */
export async function hudocApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const length = Math.max(limit * 2, 12);

  // TODO(live-api): confirm param names. The HUDOC portal is observed to use
  // `query`, `select`, `sort`, `start`, `length`. `rankingModelId` and
  // `contentsitename` may also be required — capture a live request to confirm.
  const params = new URLSearchParams({
    query: HUDOC_QUERY,
    select: HUDOC_SELECT,
    sort: 'kpdate Descending',
    start: '0',
    length: String(length),
  });

  const res = await fetch(`${HUDOC_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      // HUDOC rejects requests without a browser-like UA in some deployments.
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: 'https://hudoc.echr.coe.int/',
    },
  });
  if (!res.ok) throw new Error(`hudoc API ${res.status}`);

  const json = (await res.json()) as HudocResponse;
  const rows = json.results ?? [];

  const items: JusticeMatrixDiscoveryItem[] = [];
  for (const row of rows) {
    const c = row.columns ?? {};
    const itemid = c.itemid ?? '';
    const docname = (c.docname ?? '').trim();
    if (!docname) continue;

    const year = parseYear(c.kpdate);
    const appno = (c.appno ?? '').split(';')[0]?.trim();
    // Title mirrors curia's "{name} ({id})" shape so dedup behaves consistently.
    const title = appno ? `${docname} (no. ${appno})` : docname;

    const articles = (c.article ?? '')
      .split(/[;,]/)
      .map((a) => a.trim())
      .filter(Boolean);
    const categories = ['human rights', 'detention'];
    if (articles.some((a) => /\b3\b/.test(a))) categories.push('article 3');
    if (articles.some((a) => /\b5\b/.test(a))) categories.push('article 5');
    if (articles.some((a) => /\b8\b/.test(a))) categories.push('article 8');

    // TODO(live-api): confirm the canonical public deep-link. The portal uses
    // an `#{"itemid":["..."]}` hash fragment; an itemid-keyed link is the most
    // stable guess.
    const item_url = itemid
      ? `https://hudoc.echr.coe.int/eng?i=${encodeURIComponent(itemid)}`
      : null;

    const raw = {
      item_type: 'case' as const,
      title,
      jurisdiction: 'Council of Europe (ECtHR)',
      year,
      categories,
      summary: `European Court of Human Rights judgment.${
        articles.length ? ` Articles: ${articles.join(', ')}.` : ''
      }${c.conclusion ? ` Conclusion: ${c.conclusion.slice(0, 200)}.` : ''}`.trim(),
      // ECtHR is a treaty court, not a single country. Leave country_code null.
      country_code: null,
      item_url,
      // The HUDOC filter targets detention / child-detention; flag as in-domain
      // for the refugee/immigration-detention wedge.
      refugee_related: true,
      confidence: 0.65,
    };

    const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
    if (v.success) items.push(v.data);
    if (items.length >= limit) break;
  }

  return items;
}
