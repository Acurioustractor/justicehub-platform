/**
 * ECtHR HUDOC JSON-API adapter — mirrors the curia-adapter contract
 * (src/lib/justice-matrix/curia-adapter.ts). Exposes a single async function
 * `hudocApiItems(limit)` that returns validated JusticeMatrixDiscoveryItem[]
 * with no LLM in the loop — a deterministic field map, same as curia.
 *
 * Focus: ECtHR non-refoulement and expulsion case law (Article 3 removal cases
 * and Article 4 Protocol 4 collective expulsion), the refugee / asylum wedge the
 * strategy targets in Phase 1.
 *
 * LIVE-VERIFIED 2026-05-29. Endpoint, params, sort, response shape and the
 * `columns` field names below were confirmed against a live request:
 *   GET https://hudoc.echr.coe.int/app/query/results
 *   query=contentsitename:ECHR AND (documentcollectionid2="JUDGMENTS")
 *         AND (languageisocode="ENG") AND "non-refoulement"
 *   -> { resultcount: 114, results: [ { columns: { itemid, docname, appno,
 *        extractedappno, article, kpdate, ecli, conclusion, importance,
 *        respondent, languageisocode } } ] }
 * Verified counts for the candidate filters: "non-refoulement" -> 114,
 * conclusion:"expulsion" -> 89, "asylum" -> 750.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

// VERIFIED LIVE: the public HUDOC portal calls this endpoint for its result grid.
export const HUDOC_API_URL = 'https://hudoc.echr.coe.int/app/query/results';

// VERIFIED LIVE: collection facets use `=` (not `:`), free text goes in quotes,
// and the thesaurus is coded numerically so label-string filters return 0. The
// base filter is always-on; each pass appends one refugee/asylum predicate.
const HUDOC_BASE_FILTER =
  'contentsitename:ECHR AND (documentcollectionid2="JUDGMENTS") AND (languageisocode="ENG")';

// VERIFIED LIVE: the non-refoulement core (114 judgments, tightest) and the
// Article 3 expulsion/removal outcomes (89, via the conclusion facet). Run both,
// newest-first, dedup by itemid. These are the Phase-1 seed passes.
const HUDOC_QUERIES = [
  `${HUDOC_BASE_FILTER} AND "non-refoulement"`,
  `${HUDOC_BASE_FILTER} AND conclusion:"expulsion"`,
];

// VERIFIED LIVE: every one of these keys is present on the `columns` object.
const HUDOC_SELECT = [
  'itemid',
  'docname',
  'appno',
  'extractedappno',
  'article',
  'kpdate',
  'ecli',
  'conclusion',
  'importance',
  'respondent',
  'languageisocode',
].join(',');

/**
 * One row's `columns` object in the HUDOC results payload.
 * VERIFIED LIVE: result fields are nested under `columns`.
 */
interface HudocColumns {
  itemid?: string; // e.g. "001-250202"
  docname?: string; // e.g. "CASE OF J.B. v. GREECE"
  appno?: string; // first application number, e.g. "54796/16"
  extractedappno?: string; // semicolon-joined application numbers
  article?: string; // e.g. "13;13+3;3;41" (compound codes like "13+3" appear)
  kpdate?: string; // ISO datetime, e.g. "2026-05-26T00:00:00"
  ecli?: string; // e.g. "ECLI:CE:ECHR:2026:0526JUD005479616"
  conclusion?: string; // long outcome text
  importance?: string; // "1".."4"
  respondent?: string; // 3-letter country code, e.g. "GRC", "SWE"
  languageisocode?: string; // "ENG"
}

interface HudocResult {
  columns?: HudocColumns;
}

interface HudocResponse {
  // VERIFIED LIVE: results array key is `results`, count key is `resultcount`.
  results?: HudocResult[];
  resultcount?: number;
}

/** Year from a HUDOC `kpdate` ISO datetime (or any 4-digit-year string). */
function parseYear(kpdate: string | undefined): number | null {
  if (!kpdate) return null;
  const m = kpdate.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

/** Split the `article` field into discrete codes, dropping the `13+3` compound
 * tail so a bare `3` still matches. */
function articleCodes(article: string | undefined): string[] {
  if (!article) return [];
  return article
    .split(/[;,]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

/** Run one HUDOC query pass and return its raw rows. */
async function hudocFetch(query: string, length: number): Promise<HudocResult[]> {
  const params = new URLSearchParams({
    query,
    select: HUDOC_SELECT,
    // VERIFIED LIVE: `kpdate Descending` is newest-first.
    sort: 'kpdate Descending',
    start: '0',
    length: String(length),
  });

  const res = await fetch(`${HUDOC_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      // VERIFIED LIVE: HUDOC requires a browser-like UA + referer.
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: 'https://hudoc.echr.coe.int/',
    },
  });
  if (!res.ok) throw new Error(`hudoc API ${res.status}`);
  const json = (await res.json()) as HudocResponse;
  return json.results ?? [];
}

/**
 * Fetch up to `limit` ECtHR non-refoulement / expulsion judgments from HUDOC and
 * map them to discovery items. Throws on a hard non-OK response (caller records
 * it against the source); returns [] on a soft-empty payload. Same posture as
 * curiaApiItems.
 */
export async function hudocApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const length = Math.max(limit * 2, 12);

  // Run each query pass, concatenate, dedup by itemid (the non-refoulement and
  // expulsion corpora overlap).
  const rows: HudocResult[] = [];
  for (const query of HUDOC_QUERIES) {
    const pass = await hudocFetch(query, length);
    rows.push(...pass);
  }

  const items: JusticeMatrixDiscoveryItem[] = [];
  const seenItemIds = new Set<string>();

  for (const row of rows) {
    const c = row.columns ?? {};
    const itemid = c.itemid ?? '';
    const docname = (c.docname ?? '').trim();
    if (!docname) continue;
    if (itemid && seenItemIds.has(itemid)) continue;
    if (itemid) seenItemIds.add(itemid);

    const year = parseYear(c.kpdate);
    const appno = (c.appno ?? '').split(';')[0]?.trim();
    // Title mirrors curia's "{name} ({id})" shape so dedup behaves consistently.
    const title = appno ? `${docname} (no. ${appno})` : docname;

    const articles = articleCodes(c.article);
    const categories = ['refugee', 'asylum', 'non-refoulement'];
    if (articles.some((a) => /^3(\b|$|\+)/.test(a) || /\b3\b/.test(a))) {
      categories.push('article 3');
    }
    // Article 4 of Protocol No. 4 (collective expulsion) shows up as "P4-4" in
    // the article field and as "Protocol No. 4" in the conclusion text.
    if (
      articles.some((a) => /P4-4/i.test(a)) ||
      /protocol\s*no\.?\s*4/i.test(c.conclusion ?? '')
    ) {
      categories.push('article 4 prot 4');
    }

    // VERIFIED LIVE (HTTP 200): the itemid-keyed deep link resolves.
    const item_url = itemid
      ? `https://hudoc.echr.coe.int/eng?i=${encodeURIComponent(itemid)}`
      : null;

    // Deterministic enrichment from HUDOC's own fields (not editorial):
    // importance is ECtHR's own 1-4 significance rank (1 = key/Grand-Chamber).
    const precedent_strength =
      c.importance === '1' ? 'high' : c.importance === '2' ? 'medium' : c.importance ? 'low' : null;
    // Outcome from the court's stated conclusion. Strip "no violation" phrases;
    // if a real "violation" finding remains, the applicant won at least a point
    // (favorable in a refugee/asylum posture); else "no violation" -> adverse.
    const concl = (c.conclusion ?? '').toLowerCase();
    const conclNoNeg = concl.replace(/no[\s-]+violation/g, '');
    const outcome: 'favorable' | 'adverse' | 'pending' | null = /violation/.test(conclNoNeg)
      ? 'favorable'
      : /no[\s-]+violation/.test(concl)
        ? 'adverse'
        : null;

    const raw = {
      item_type: 'case' as const,
      title,
      jurisdiction: 'Council of Europe (ECtHR)',
      court: 'European Court of Human Rights',
      year,
      categories,
      precedent_strength,
      outcome,
      summary: `European Court of Human Rights judgment.${
        articles.length ? ` Articles: ${articles.join(', ')}.` : ''
      }${c.conclusion ? ` Conclusion: ${c.conclusion.slice(0, 200)}.` : ''}`.trim(),
      // ECtHR is a treaty court, not a single country. The `respondent` is the
      // defending state, not the court's jurisdiction, so leave country_code null.
      country_code: null,
      item_url,
      refugee_related: true,
      confidence: 0.7,
    };

    const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
    if (v.success) items.push(v.data);
    if (items.length >= limit) break;
  }

  return items;
}
