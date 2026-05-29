/**
 * EDAL (European Database of Asylum Law) adapter — managed by ECRE, ~1,829
 * curated asylum case summaries. The single biggest clean OPEN source for
 * Surface A. Its CJEU/ECtHR summaries overlap our HUDOC/curia adapters (pgvector
 * dedup collapses those), but its ~1,428 NATIONAL summaries are unique and not
 * reachable from any court API we have, so this adapter prioritises national.
 *
 * EDAL has no JSON API; it exposes per-court sitemaps of summary URLs, and each
 * summary page carries clean metadata in og:title + meta description. So we read
 * the sitemaps for URLs, then fetch each page and map its meta tags. No LLM,
 * deterministic. Matches the curia/hudoc/courtlistener contract.
 *
 * VERIFIED LIVE 2026-05-29: sitemap index at /sitemap.xml lists
 * /sitemap.xml/summaries/{national,cjeu,ecrthr,un}; case URLs are
 * /summaries/case/<slug>; pages expose
 *   <meta property="og:title" content="CJEU - C-356/11 ... - EDAL">
 *   <meta name="description" content="...summary...">
 */

import {
  JusticeMatrixDiscoveryItemSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '@/lib/ai/llm-schemas';

const EDAL_BASE = 'https://www.asylumlawdatabase.eu';
const EDAL_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// National first: it is the unique value. CJEU/ECtHR summaries dedup against the
// curia/HUDOC adapters, so they are lower priority here.
const COURT_SITEMAPS: Array<{ path: string; jurisdiction: string | null }> = [
  { path: '/sitemap.xml/summaries/national', jurisdiction: null }, // derive from title prefix
  { path: '/sitemap.xml/summaries/cjeu', jurisdiction: 'European Union (CJEU)' },
  { path: '/sitemap.xml/summaries/ecrthr', jurisdiction: 'European Court of Human Rights' },
  { path: '/sitemap.xml/summaries/un', jurisdiction: 'United Nations' },
];

async function fetchText(url: string, timeoutMs = 12000): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': EDAL_UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function sitemapCaseUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => /\/summaries\/case\//.test(u));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;amp;/g, '&') // EDAL double-encodes some ampersands
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function deriveYear(title: string): number | null {
  const plain = title.match(/\b(19|20)\d{2}\b/);
  if (plain) return parseInt(plain[0], 10);
  // CJEU/General Court style citation "C-356/11" -> 2011.
  const cite = title.match(/[CT]-\d+\/(\d{2})\b/);
  if (cite) {
    const yy = parseInt(cite[1], 10);
    return yy > 50 ? 1900 + yy : 2000 + yy;
  }
  return null;
}

function mapCasePage(
  html: string,
  url: string,
  defaultJurisdiction: string | null,
): JusticeMatrixDiscoveryItem | null {
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1];
  if (!ogTitle) return null;
  const title = decodeEntities(ogTitle).replace(/\s*-\s*EDAL\s*$/i, '').trim();
  if (title.length < 3) return null;
  const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  const summary = desc ? decodeEntities(desc) : null;

  // Jurisdiction: for national cases, take the court/country prefix before the
  // first " - " in the title; otherwise the court the sitemap is for.
  let jurisdiction = defaultJurisdiction;
  if (!jurisdiction) {
    const prefix = title.split(' - ')[0]?.trim();
    jurisdiction = prefix && prefix.length > 1 && prefix.length < 60 ? prefix : 'National (EDAL)';
  }

  const raw = {
    item_type: 'case' as const,
    title,
    jurisdiction,
    year: deriveYear(title),
    categories: ['refugee', 'asylum'],
    summary: summary ? `EDAL summary. ${summary.slice(0, 260)}` : 'EDAL asylum case summary.',
    item_url: url,
    refugee_related: true,
    confidence: 0.7,
  };
  const v = validateLLMOutput(raw, JusticeMatrixDiscoveryItemSchema);
  return v.success ? v.data : null;
}

export async function edalApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  // 1. Collect case URLs across the court sitemaps, tagged with their court.
  const tagged: Array<{ url: string; jurisdiction: string | null }> = [];
  for (const sm of COURT_SITEMAPS) {
    if (tagged.length >= limit * 4) break;
    const xml = await fetchText(EDAL_BASE + sm.path);
    if (!xml) continue;
    for (const u of sitemapCaseUrls(xml)) tagged.push({ url: u, jurisdiction: sm.jurisdiction });
  }

  // 2. Fetch the first `limit` case pages (national-first) with bounded
  //    concurrency, mapping each page's meta tags.
  const pick = tagged.slice(0, limit);
  const items: JusticeMatrixDiscoveryItem[] = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < pick.length && items.length < limit; i += CONCURRENCY) {
    const chunk = pick.slice(i, i + CONCURRENCY);
    const mapped = await Promise.all(
      chunk.map(async ({ url, jurisdiction }) => {
        const html = await fetchText(url, 10000);
        return html ? mapCasePage(html, url, jurisdiction) : null;
      }),
    );
    for (const m of mapped) if (m) items.push(m);
  }
  return items.slice(0, limit);
}
