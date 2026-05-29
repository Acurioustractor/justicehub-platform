/**
 * CJEU JSON-API adapter — shared by the CLI scanner (scripts/scan-justice-matrix.ts)
 * and the Vercel cron (api/cron/justice-matrix/scan-json).
 *
 * Curia is an Angular SPA, but its search is backed by a clean elastic-connector
 * API. We POST the asylum query, take only hits whose matCode highlight labels
 * mention asylum / borders / migration / refugees, and map them to discovery
 * items. Deterministic, no LLM.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

export const CURIA_API_URL = 'https://infocuriaws.curia.europa.eu/elastic-connector/search';
// One narrow 3-word term matched ~168 hits. The CJEU asylum corpus is far larger
// across several distinct doctrines, so we run a pass per concept and dedup by
// publishedId. Each term is verified to return results against the live API.
const CURIA_SEARCH_TERMS = [
  'asylum',
  'international protection',
  'subsidiary protection',
  'Dublin Regulation',
  'Qualification Directive',
  'return directive',
  'non-refoulement',
];

interface CuriaHit {
  content?: {
    publishedId?: string;
    id?: string;
    usualNameML?: Array<Record<string, string>>;
  };
  highlightFields?: Record<string, string[]>;
}

interface CuriaResponse {
  searchHits?: CuriaHit[];
  totalHits?: number;
}

async function fetchCuriaHits(searchTerm: string, pageSize: number): Promise<CuriaHit[]> {
  const body = {
    searchTerm,
    multiSearchTerms: [],
    sortTermList: [{ sortDirection: 'DESC', sortTerm: 'AFF_NUM', sortSourceTab: 'affair' }],
    pagination: { pageNumber: 0, pageSize, from: 1, to: pageSize },
    language: 'EN',
    tabName: 'affair',
    isAllTabsRequest: true,
    ecli: '',
    publishedId: '',
    usualName: '',
    logicDocId: '',
    isSearchExact: false,
    searchSources: ['document', 'metadata'],
  };
  const res = await fetch(CURIA_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      accept: 'application/json',
      referer: 'https://infocuria.curia.europa.eu/',
      origin: 'https://infocuria.curia.europa.eu',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`curia API ${res.status}`);
  const json = (await res.json()) as CuriaResponse;
  return json.searchHits ?? [];
}

function mapCuriaHit(hit: CuriaHit, publishedId: string): JusticeMatrixDiscoveryItem | null {
  const c = hit.content ?? {};
  const nameEntry = (c.usualNameML ?? []).find((x) => x.en) ?? (c.usualNameML ?? [])[0];
  const name = nameEntry ? Object.values(nameEntry)[0] : publishedId;
  const labels: string[] = Object.values(hit.highlightFields ?? {})
    .flat()
    .map((s) => String(s).replace(/<[^>]+>/g, ''));
  const subject = labels.filter((l) => /asylum|border|immigration|migrat|refugee/i.test(l));
  if (!subject.length) return null;
  const yearSuffix = publishedId.match(/\/(\d{2})$/)?.[1];
  const year = yearSuffix ? 2000 + parseInt(yearSuffix, 10) : null;
  const raw = {
    item_type: 'case' as const,
    title: `${name} (${publishedId})`,
    jurisdiction: 'European Union (CJEU)',
    year,
    categories: ['refugee', 'asylum'],
    summary: `CJEU case. Subject matter: ${[...new Set(subject)].join('; ')}.`,
    country_code: 'EU',
    item_url: `https://curia.europa.eu/juris/liste.jsf?language=en&num=${encodeURIComponent(publishedId)}`,
    refugee_related: true,
    confidence: 0.7,
  };
  const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
  return v.success ? v.data : null;
}

export async function curiaApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const perTerm = Math.max(Math.ceil(limit / 2), 12);
  const seen = new Set<string>();
  const items: JusticeMatrixDiscoveryItem[] = [];
  // One pass per concept; dedup by publishedId; stop once we have `limit`.
  for (const term of CURIA_SEARCH_TERMS) {
    if (items.length >= limit) break;
    let hits: CuriaHit[];
    try {
      hits = await fetchCuriaHits(term, perTerm);
    } catch {
      continue; // a single term failing must not sink the whole scan
    }
    for (const hit of hits) {
      if (items.length >= limit) break;
      const c = hit.content ?? {};
      const publishedId = c.publishedId ?? c.id ?? '';
      if (!publishedId || seen.has(publishedId)) continue;
      const mapped = mapCuriaHit(hit, publishedId);
      if (!mapped) continue;
      seen.add(publishedId);
      items.push(mapped);
    }
  }
  return items;
}
