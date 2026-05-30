/**
 * CanLII REST-API adapter — mirrors the courtlistener-adapter contract
 * (src/lib/justice-matrix/courtlistener-adapter.ts). Exposes
 * `canliiApiItems(limit)` returning validated JusticeMatrixDiscoveryItem[] with
 * a deterministic field map, no LLM.
 *
 * Focus: Canadian refugee and asylum jurisprudence — the Immigration and
 * Refugee Board plus the federal courts' judicial review of protection
 * decisions, and the Supreme Court of Canada (e.g. Singh).
 *
 * CanLII API (v1) shape, verified live 2026-05-30:
 *   GET /v1/caseBrowse/en/{databaseId}/?offset=0&resultCount=N&api_key=KEY
 *     -> { cases: [ { databaseId, caseId: { en }, title, citation } ] }  (newest first)
 *   GET /v1/caseBrowse/en/{databaseId}/{caseId}/?api_key=KEY
 *     -> { url, title, citation, decisionDate, docketNumber, keywords, topics, ... }
 * Gotchas:
 *   - Auth is an `api_key` QUERY PARAM, not a header. Key is REQUIRED (no
 *     anonymous tier), so a missing key throws (recorded against the source).
 *   - The browse list has only title + citation; the per-case metadata call is
 *     what carries the canlii.ca permalink, decisionDate and indexed keywords.
 *   - There is no full text / abstract over the open API; the nightly facts
 *     enricher fetches the page and deepens the case after promotion.
 *   - The IRB database (cisr) is entirely in-domain; the courts hear all subject
 *     matter, so their rows are signal-filtered on title then on keywords.
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

const CANLII_API = 'https://api.canlii.org/v1';

// Refugee / immigration-relevant CanLII case databases, most-relevant first.
// `allInDomain` = every decision is immigration/refugee (the IRB); the courts
// hear all subject matter, so their rows must pass the REFUGEE_SIGNAL gate.
const CANLII_DATABASES: Array<{ id: string; court: string; allInDomain: boolean }> = [
  { id: 'cisr', court: 'Immigration and Refugee Board of Canada', allInDomain: true },
  { id: 'fct', court: 'Federal Court', allInDomain: false },
  { id: 'fca', court: 'Federal Court of Appeal', allInDomain: false },
  { id: 'csc-scc', court: 'Supreme Court of Canada', allInDomain: false },
];

// Confirms a court row is actually in the immigration/asylum domain. The two
// respondent ministries ("Citizenship and Immigration", "Public Safety and
// Emergency Preparedness") are the strongest title signals for Canadian
// protection litigation.
const REFUGEE_SIGNAL =
  /\b(immigration|citizenship|refugee|asylum|asylee|protected person|deport|removal|non-?refoulement|public safety|emergency preparedness|migrant|noncitizen|IRPA|IRB)\b/i;

interface CanliiListCase {
  databaseId?: string;
  caseId?: { en?: string } | string;
  title?: string;
  citation?: string;
}
interface CanliiListResponse {
  cases?: CanliiListCase[];
}
interface CanliiCaseMeta {
  url?: string;
  title?: string;
  citation?: string;
  decisionDate?: string; // ISO "YYYY-MM-DD"
  docketNumber?: string;
  keywords?: string; // freeform indexed terms, e.g. "detention — credibility — ..."
  topics?: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function canliiGet<T>(key: string, path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${CANLII_API}${path}${sep}api_key=${encodeURIComponent(key)}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'JusticeHub-JusticeMatrix/1.0 (+https://justicehub.com.au)',
    },
  });
  if (!res.ok) throw new Error(`canlii API ${res.status}`);
  return (await res.json()) as T;
}

function parseYear(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function caseIdOf(c: CanliiListCase): string | null {
  const cid = c.caseId;
  if (!cid) return null;
  return typeof cid === 'object' ? cid.en ?? null : cid;
}

/**
 * Fetch up to `limit` Canadian refugee/immigration opinions across the IRB and
 * the federal courts, newest-first, and map them to discovery items. Throws on
 * a missing key or a hard non-OK on the primary database (caller records it
 * against the source); a single unreadable case is skipped, and a secondary
 * database being unavailable does not abort the pass. Same posture as
 * courtlistenerApiItems / hudocApiItems.
 */
export async function canliiApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const key = process.env.CANLII_API_KEY;
  if (!key) throw new Error('CANLII_API_KEY not set');

  const items: JusticeMatrixDiscoveryItem[] = [];

  for (const db of CANLII_DATABASES) {
    if (items.length >= limit) break;
    // Pull more than we keep on the courts, since most rows there are off-domain
    // and get filtered out. The IRB needs no headroom (all in-domain).
    const want = Math.min(Math.max(limit - items.length, 4) * (db.allInDomain ? 1 : 3), 50);

    let list: CanliiListResponse;
    try {
      list = await canliiGet<CanliiListResponse>(key, `/caseBrowse/en/${db.id}/?offset=0&resultCount=${want}`);
    } catch (e) {
      // Surface the failure only if the primary (IRB) database is down and we
      // have nothing yet; otherwise skip this database and keep going.
      if (db.allInDomain && items.length === 0) throw e;
      continue;
    }

    for (const c of list.cases ?? []) {
      if (items.length >= limit) break;
      const caseId = caseIdOf(c);
      if (!caseId) continue;

      // Cheap title pre-filter for the courts before spending a metadata call.
      if (!db.allInDomain && !REFUGEE_SIGNAL.test(`${c.title ?? ''} ${c.citation ?? ''}`)) continue;

      let meta: CanliiCaseMeta;
      try {
        meta = await canliiGet<CanliiCaseMeta>(key, `/caseBrowse/en/${db.id}/${caseId}/`);
      } catch {
        continue; // a single unreadable case must not kill the pass
      }
      await sleep(120); // be gentle on the CanLII rate limit

      const name = (meta.title ?? c.title ?? '').trim();
      if (!name) continue;
      const keywords = (meta.keywords ?? '').trim();

      // Confirm the court rows on the richer metadata (keywords catch matters
      // the bare title misses).
      if (!db.allInDomain && !REFUGEE_SIGNAL.test(`${name} ${keywords}`)) continue;

      const citation = (meta.citation ?? c.citation ?? '').trim();
      // Mirror courtlistener "{name}, {citation}" so the dedup title fragment is stable.
      const title = citation ? `${name}, ${citation}` : name;
      const year = parseYear(meta.decisionDate) ?? parseYear(citation);
      const url =
        meta.url || `https://www.canlii.org/en/ca/${db.id}/doc/${caseId}/`;

      const categories = ['canada', 'refugee', 'asylum'];
      if (/detention/i.test(keywords)) categories.push('immigration detention');
      if (/refoulement/i.test(`${name} ${keywords}`)) categories.push('non-refoulement');

      const summary = `Canadian decision of the ${db.court}${
        meta.docketNumber ? ` (docket ${meta.docketNumber})` : ''
      }.${keywords ? ` Indexed terms: ${keywords}.` : ''}`
        .trim()
        .slice(0, 600);

      const raw = {
        item_type: 'case' as const,
        title,
        jurisdiction: `Canada (${db.court})`,
        court: db.court,
        year,
        categories,
        summary,
        country_code: 'CA',
        item_url: url,
        refugee_related: true,
        confidence: 0.6,
      };

      const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
      if (v.success) items.push(v.data);
    }
  }

  return items.slice(0, limit);
}
