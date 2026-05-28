#!/usr/bin/env npx tsx
/**
 * Justice Matrix Scanner
 *
 * Implements the middle of the Justice Matrix pipeline that was specced in
 * .claude/skills/local/justice-matrix-research/SKILL.md but never built:
 *
 *   active sources -> fetch (Playwright) -> LLM extract -> dedupe -> stage
 *   into justice_matrix_discovered (status='pending') for human review.
 *
 * It does NOT publish to the live matrix. Discoveries land in the review queue
 * at /admin/justice-matrix/discoveries and an admin approves them into
 * justice_matrix_cases / justice_matrix_campaigns.
 *
 * Usage:
 *   npx tsx scripts/scan-justice-matrix.ts --source "APRRN" --limit 5            (dry run)
 *   npx tsx scripts/scan-justice-matrix.ts --source "APRRN" --limit 5 --apply    (stage rows)
 *   npx tsx scripts/scan-justice-matrix.ts --max-sources 3 --apply               (top 3 by priority)
 *
 * Flags:
 *   --source <substr>   only sources whose name ILIKEs this substring
 *   --max-sources <n>   how many sources to scan this run (default 1)
 *   --limit <n>         max items to stage per source (default 5)
 *   --apply             write to DB + update source health (default: dry run)
 */

import { chromium, type Browser } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  JusticeMatrixDiscoveryItemSchema,
  JusticeMatrixDiscoveryResponseSchema,
  validateLLMOutput,
  type JusticeMatrixDiscoveryItem,
} from '../src/lib/ai/llm-schemas';
import { parseJSON } from '../src/lib/ai/parse-json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce<Record<string, string>>((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

// ---- args ----
const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const SOURCE = arg('source');
const TYPE = arg('type');
const URL_OVERRIDE = arg('url'); // test a candidate URL for a single --source without mutating the DB
const MAX_SOURCES = parseInt(arg('max-sources', '1')!, 10);
const LIMIT = parseInt(arg('limit', '5')!, 10);
const APPLY = argv.includes('--apply');

type Source = {
  id: string;
  name: string;
  url: string;
  region: string | null;
  source_type: string;
  data_format: string | null;
  scrape_priority: number | null;
  total_items_found: number | null;
};

async function loadSources(): Promise<Source[]> {
  let q = supabase
    .from('justice_matrix_sources')
    .select('id,name,url,region,source_type,data_format,scrape_priority,total_items_found')
    .eq('is_active', true)
    .order('scrape_priority', { ascending: true })
    .order('last_scraped_at', { ascending: true, nullsFirst: true });
  if (SOURCE) q = q.ilike('name', `%${SOURCE}%`);
  if (TYPE) q = q.eq('source_type', TYPE);
  const { data, error } = await q.limit(MAX_SOURCES);
  if (error) throw new Error(`loadSources: ${error.message}`);
  return (data ?? []) as Source[];
}

async function fetchPage(browser: Browser, url: string) {
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  try {
    // domcontentloaded + settle: portal sites (AustLII, court search apps) hold
    // connections open and never reach networkidle, which hangs the goto.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const grab = () =>
      page.evaluate(() => {
        document
          .querySelectorAll('script,style,nav,header,footer,.menu,.sidebar,#cookie-banner')
          .forEach((el) => el.remove());
        const main =
          document.querySelector('main,.content,.content-main,article,.page-content') ||
          document.body;
        return (main as HTMLElement).innerText;
      });
    try {
      return await grab();
    } catch (e: any) {
      // Sites that client-side redirect (e.g. BAILII) destroy the execution
      // context mid-settle. Let the redirect land, then grab once more.
      if (/context was destroyed|navigation/i.test(e?.message ?? '')) {
        await page.waitForTimeout(2500);
        return await grab();
      }
      throw e;
    }
  } finally {
    await ctx.close();
  }
}

async function extract(content: string, source: Source): Promise<JusticeMatrixDiscoveryItem[]> {
  if (content.length < 200) return [];
  const prompt = `You are scanning content from "${source.name}" (${source.url}), a ${source.source_type} source for a global strategic-litigation and advocacy clearing house focused on refugee and asylum protection.

Extract distinct STRATEGIC LITIGATION CASES (item_type "case") and ADVOCACY CAMPAIGNS (item_type "campaign") that appear in the content. Prioritise refugee / asylum / migrant-protection matters, but include other human-rights items if clearly present. Do not invent items; only extract what is actually on the page. If nothing concrete is present, return an empty list.

Return ONLY valid JSON (no markdown) of the form:
{"items":[{"item_type":"case|campaign","title":"...","jurisdiction":"... or null","year":2024,"categories":["..."],"summary":"one or two sentences","country_code":"ISO-2 or null","item_url":"specific URL or null","refugee_related":true,"confidence":0.0-1.0}]}

Content:
${content.substring(0, 28000)}`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  let raw: unknown;
  try {
    raw = parseJSON(text);
  } catch {
    console.log('   ⚠️  could not parse LLM JSON');
    return [];
  }
  const validated = validateLLMOutput(raw, JusticeMatrixDiscoveryResponseSchema);
  if (!validated.success) {
    console.log(`   ⚠️  schema validation failed: ${validated.errors.slice(0, 3).join('; ')}`);
    return [];
  }
  return validated.data.items;
}

/**
 * CJEU adapter. Curia is an Angular SPA but its search is backed by a clean JSON
 * API (the InfoCuria elastic-connector). We call it directly and map the
 * structured hits to discovery items — no browser, no LLM. Subject matter comes
 * from the matCode highlight labels (e.g. "Borders, asylum and immigration").
 */
const CURIA_API = 'https://infocuriaws.curia.europa.eu/elastic-connector/search';
const CURIA_SEARCH_TERM = 'asylum refugee non-refoulement';

async function curiaApiItems(limit: number): Promise<JusticeMatrixDiscoveryItem[]> {
  const body = {
    searchTerm: CURIA_SEARCH_TERM,
    multiSearchTerms: [],
    sortTermList: [{ sortDirection: 'DESC', sortTerm: 'AFF_NUM', sortSourceTab: 'affair' }],
    pagination: { pageNumber: 0, pageSize: Math.max(limit * 2, 12), from: 1, to: Math.max(limit * 2, 12) },
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
  const res = await fetch(CURIA_API, {
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
  const json: any = await res.json();
  const items: JusticeMatrixDiscoveryItem[] = [];
  for (const hit of json.searchHits ?? []) {
    const c = hit.content ?? {};
    const publishedId: string = c.publishedId ?? c.id ?? '';
    const nameEntry = (c.usualNameML ?? []).find((x: any) => x.en) ?? (c.usualNameML ?? [])[0];
    const name = nameEntry ? Object.values(nameEntry)[0] : publishedId;
    // Subject-matter labels from the highlight; only keep clearly asylum/migration cases.
    const labels: string[] = Object.values(hit.highlightFields ?? {})
      .flat()
      .map((s: any) => String(s).replace(/<[^>]+>/g, ''));
    const subject = labels.filter((l) => /asylum|border|immigration|migrat|refugee/i.test(l));
    if (!subject.length) continue; // skip cases that only incidentally mention the terms
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
    if (v.success) items.push(v.data);
    if (items.length >= limit) break;
  }
  return items;
}

function isCuriaApiSource(source: Source, url: string): boolean {
  return source.data_format === 'json' && /curia\.europa\.eu/.test(url);
}

/** Skip items that already exist as cases/campaigns or are already queued. */
async function isDuplicate(item: JusticeMatrixDiscoveryItem): Promise<boolean> {
  const title = item.title.trim();
  if (item.item_type === 'case') {
    const { data } = await supabase
      .from('justice_matrix_cases')
      .select('id')
      .ilike('case_citation', `%${title.slice(0, 40)}%`)
      .limit(1);
    if (data?.length) return true;
  } else {
    const { data } = await supabase
      .from('justice_matrix_campaigns')
      .select('id')
      .ilike('campaign_name', `%${title.slice(0, 40)}%`)
      .limit(1);
    if (data?.length) return true;
  }
  const { data: pending } = await supabase
    .from('justice_matrix_discovered')
    .select('id')
    .ilike('extracted_title', `%${title.slice(0, 40)}%`)
    .limit(1);
  return !!pending?.length;
}

async function run() {
  console.log(
    `\n🔎 Justice Matrix scan  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}  |  max-sources=${MAX_SOURCES} limit=${LIMIT}${SOURCE ? ` source~"${SOURCE}"` : ''}`
  );
  const sources = await loadSources();
  if (!sources.length) {
    console.log('No matching active sources.');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  let totalStaged = 0;
  try {
    for (const source of sources) {
      const targetUrl = URL_OVERRIDE && sources.length === 1 ? URL_OVERRIDE : source.url;
      console.log(
        `\n📥 ${source.name}  (priority ${source.scrape_priority})\n   ${targetUrl}${targetUrl !== source.url ? '  [url override]' : ''}`
      );
      let content = '';
      let fetchError: string | null = null;
      let items: JusticeMatrixDiscoveryItem[] = [];

      if (isCuriaApiSource(source, targetUrl)) {
        // JSON-API adapter: no browser, no LLM — structured map.
        try {
          items = await curiaApiItems(LIMIT);
          content = 'json-api';
          console.log(`   ✅ CJEU API: ${items.length} asylum case(s)`);
        } catch (e: any) {
          fetchError = e.message?.slice(0, 300) ?? String(e);
          console.log(`   ❌ API failed: ${fetchError}`);
        }
      } else {
        try {
          content = await fetchPage(browser, targetUrl);
          console.log(`   ✅ fetched ${content.length} chars`);
        } catch (e: any) {
          fetchError = e.message?.slice(0, 300) ?? String(e);
          console.log(`   ❌ fetch failed: ${fetchError}`);
        }
      }

      if (content && content !== 'json-api') {
        try {
          items = await extract(content, source);
        } catch (e: any) {
          fetchError = `extract: ${e.message?.slice(0, 200)}`;
          console.log(`   ❌ ${fetchError}`);
        }
      }
      console.log(`   🧪 extracted ${items.length} candidate item(s)`);

      let staged = 0;
      for (const item of items) {
        if (staged >= LIMIT) break;
        if (await isDuplicate(item)) {
          console.log(`   ⏭️  dup, skip: ${item.item_type} — ${item.title.slice(0, 70)}`);
          continue;
        }
        console.log(
          `   ${APPLY ? '➕ stage' : '👀 would stage'}: [${item.item_type}] ${item.title.slice(0, 80)} (conf ${item.confidence})`
        );
        if (APPLY) {
          const { error } = await supabase.from('justice_matrix_discovered').insert({
            source_id: source.id,
            source_url: item.item_url || targetUrl,
            item_type: item.item_type,
            raw_data: {
              extracted: item,
              scanner: 'scan-justice-matrix.ts',
              model: MODEL,
              scanned_at: new Date().toISOString(),
            },
            extracted_title: item.title,
            extracted_jurisdiction: item.jurisdiction ?? null,
            extracted_year: item.year ?? null,
            extracted_categories: item.categories ?? [],
            extracted_summary: item.summary ?? null,
            extracted_country_code: item.country_code ?? null,
            extraction_confidence: item.confidence,
            status: 'pending',
          });
          if (error) {
            console.log(`      ❌ insert failed: ${error.message}`);
            continue;
          }
        }
        staged++;
        totalStaged++;
      }

      if (APPLY) {
        await supabase
          .from('justice_matrix_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            ...(fetchError
              ? { last_error: fetchError }
              : { last_success_at: new Date().toISOString(), last_error: null }),
            total_items_found: (source.total_items_found ?? 0) + staged,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      }
      console.log(`   📦 ${APPLY ? 'staged' : 'would stage'} ${staged}`);
    }
  } finally {
    await browser.close();
  }

  console.log(
    `\n${APPLY ? '✅ done' : '✅ dry run done'} — ${totalStaged} item(s) ${APPLY ? 'staged to justice_matrix_discovered (status=pending)' : 'would be staged'}.`
  );
  if (APPLY && totalStaged) console.log('   Review at /admin/justice-matrix/discoveries');
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
