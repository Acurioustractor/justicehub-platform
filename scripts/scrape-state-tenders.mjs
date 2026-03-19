#!/usr/bin/env node
/**
 * State Procurement Tender Scraper
 *
 * Scrapes justice-related tenders from state government procurement portals:
 * - QLD QTenders (qld.gov.au)
 * - NSW eTendering (tenders.nsw.gov.au)
 * - VIC Buying for Victoria (buying.vic.gov.au)
 *
 * Usage:
 *   node scripts/scrape-state-tenders.mjs                    # dry-run all states
 *   node scripts/scrape-state-tenders.mjs --apply            # write to DB
 *   node scripts/scrape-state-tenders.mjs --apply --state qld
 *   node scripts/scrape-state-tenders.mjs --apply --state nsw
 *   node scripts/scrape-state-tenders.mjs --apply --state vic
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const stateFilter = args.find((_, i) => args[i - 1] === '--state')?.toUpperCase();

// Justice-related search terms
const JUSTICE_KEYWORDS = [
  'youth justice',
  'juvenile justice',
  'youth detention',
  'corrections',
  'justice services',
  'court services',
  'legal aid',
  'community corrections',
  'probation',
  'parole',
  'diversion program',
  'rehabilitation',
  'offender management',
  'victim support',
  'restorative justice',
  'bail support',
  'reintegration',
  'crime prevention',
  'family violence',
  'domestic violence',
  'child protection',
  'out of home care',
  'Indigenous justice',
  'Aboriginal justice',
];

// State portal configurations
const STATE_PORTALS = {
  QLD: {
    source: 'qld_qtenders',
    state: 'QLD',
    searchUrls: [
      'https://qtenders.epw.qld.gov.au/qtenders/searchTerms.do?keyword=youth+justice&status=open',
      'https://qtenders.epw.qld.gov.au/qtenders/searchTerms.do?keyword=corrections&status=open',
      'https://qtenders.epw.qld.gov.au/qtenders/searchTerms.do?keyword=juvenile+justice&status=open',
    ],
    // Fallback: search via Jina for recent tenders
    jinaQueries: [
      'site:qtenders.epw.qld.gov.au youth justice',
      'site:qld.gov.au tender "youth justice" OR "juvenile justice" 2025 2026',
      'site:qld.gov.au procurement contract "corrections" OR "detention" services awarded',
    ],
  },
  NSW: {
    source: 'nsw_etender',
    state: 'NSW',
    searchUrls: [
      'https://www.tenders.nsw.gov.au/?event=public.advancedsearch.keyword&keyword=youth+justice',
      'https://www.tenders.nsw.gov.au/?event=public.advancedsearch.keyword&keyword=corrections',
    ],
    jinaQueries: [
      'site:buy.nsw.gov.au youth justice',
      'site:nsw.gov.au tender "youth justice" OR "juvenile justice" contract 2025 2026',
      'site:nsw.gov.au procurement "corrections" OR "community corrections" awarded contract',
    ],
  },
  VIC: {
    source: 'vic_buying',
    state: 'VIC',
    searchUrls: [
      'https://www.buying.vic.gov.au/search?search_api_fulltext=youth+justice',
      'https://www.buying.vic.gov.au/search?search_api_fulltext=corrections',
    ],
    jinaQueries: [
      'site:buying.vic.gov.au youth justice',
      'site:vic.gov.au tender "youth justice" OR "juvenile justice" contract 2025 2026',
      'site:vic.gov.au procurement "corrections" OR "community corrections" awarded contract',
    ],
  },
};

let callLLM, parseJSON, searchWeb;

async function loadModules() {
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  const webSearchModule = await import('../src/lib/scraping/web-search.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
  searchWeb = webSearchModule.searchWeb;
}

async function scrapeViaJina(url) {
  try {
    const apiKey = process.env.JINA_API_KEY;
    const headers = { Accept: 'text/plain' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function searchJina(query) {
  try {
    const apiKey = process.env.JINA_API_KEY;
    const headers = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).slice(0, 10).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch {
    return [];
  }
}

function classifyJusticeRelevance(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const matched = JUSTICE_KEYWORDS.filter((kw) => text.includes(kw.toLowerCase()));
  return {
    isJusticeRelated: matched.length > 0,
    keywords: matched,
  };
}

function buildExtractionPrompt(content, state) {
  return `You are an Australian government procurement analyst. Extract tender/contract information from this ${state} government page content.

For each tender or contract found, extract:
- source_id: The tender/contract reference number (e.g., "QT-12345")
- title: Full title of the tender
- description: Brief description (1-2 sentences)
- contract_value: Dollar value if shown (number only, no currency symbol)
- status: "open", "closed", or "awarded"
- buyer_name: Government agency name
- buyer_department: Department name if different from agency
- supplier_name: Winning supplier if awarded (null otherwise)
- supplier_abn: Supplier ABN if shown (null otherwise)
- published_date: Date published (ISO format, null if unknown)
- closing_date: Closing date (ISO format, null if unknown)
- source_url: URL to the specific tender page

PAGE CONTENT:
${content.substring(0, 8000)}

Return JSON:
{
  "tenders": [
    {
      "source_id": "...",
      "title": "...",
      "description": "...",
      "contract_value": null,
      "status": "open",
      "buyer_name": "...",
      "buyer_department": null,
      "supplier_name": null,
      "supplier_abn": null,
      "published_date": null,
      "closing_date": null,
      "source_url": "..."
    }
  ]
}

Only include actual tenders/contracts. Skip navigation, headers, and non-tender content. If no tenders found, return {"tenders": []}.`;
}

async function scrapeState(config) {
  console.log(`\n📋 Scraping ${config.state} tenders...`);
  console.log('─'.repeat(50));

  const allTenders = [];

  // Strategy 1: Direct portal scraping via Jina Reader
  for (const url of config.searchUrls) {
    console.log(`  Scraping: ${url.substring(0, 80)}...`);
    const content = await scrapeViaJina(url);
    if (!content || content.length < 200) {
      console.log('    → No content or too short, skipping');
      continue;
    }

    try {
      const prompt = buildExtractionPrompt(content, config.state);
      const raw = await callLLM(prompt, { maxTokens: 3000 });
      const parsed = parseJSON(raw);
      if (parsed?.tenders?.length) {
        console.log(`    → Found ${parsed.tenders.length} tenders`);
        allTenders.push(...parsed.tenders);
      } else {
        console.log('    → No tenders extracted');
      }
    } catch (err) {
      console.log(`    → LLM error: ${err.message}`);
    }
  }

  // Strategy 2: Multi-provider web search (Serper → Brave → Jina)
  for (const query of config.jinaQueries) {
    console.log(`  Searching: "${query}"`);
    const results = await searchWeb(query, 10);
    if (results.length === 0) {
      console.log('    → No search results');
      continue;
    }

    // Filter for likely tender pages
    const tenderResults = results.filter((r) => {
      const text = `${r.title} ${r.description}`.toLowerCase();
      return (
        text.includes('tender') ||
        text.includes('contract') ||
        text.includes('procurement') ||
        text.includes('rfq') ||
        text.includes('rft') ||
        text.includes('expression of interest')
      );
    });

    for (const result of tenderResults.slice(0, 3)) {
      // Check if we already have this URL
      if (allTenders.some((t) => t.source_url === result.url)) continue;

      const { isJusticeRelated, keywords } = classifyJusticeRelevance(result.title, result.description);
      if (isJusticeRelated) {
        allTenders.push({
          source_id: null,
          title: result.title,
          description: result.description,
          contract_value: null,
          status: 'unknown',
          buyer_name: `${config.state} Government`,
          buyer_department: null,
          supplier_name: null,
          supplier_abn: null,
          published_date: null,
          closing_date: null,
          source_url: result.url,
          _keywords: keywords,
        });
      }
    }

    console.log(`    → ${tenderResults.length} tender-related results`);
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = [];
  for (const t of allTenders) {
    const key = (t.title || '').toLowerCase().substring(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(t);
    }
  }

  console.log(`\n  Total unique tenders: ${unique.length}`);
  return unique;
}

async function main() {
  console.log('\n🏛️  State Procurement Tender Scraper');
  console.log('═'.repeat(60));
  console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
  if (stateFilter) console.log(`State filter: ${stateFilter}`);
  console.log();

  await loadModules();

  const states = stateFilter
    ? [STATE_PORTALS[stateFilter]].filter(Boolean)
    : Object.values(STATE_PORTALS);

  if (states.length === 0) {
    console.log('❌ Invalid state. Use: qld, nsw, vic');
    process.exit(1);
  }

  // Load existing URLs to avoid duplicates
  const { data: existingRows } = await supabase.from('state_tenders').select('source_url');
  const existingUrls = new Set((existingRows || []).map((r) => r.source_url).filter(Boolean));

  // Aggregator pages to skip (not actual tenders)
  const AGGREGATOR_DOMAINS = ['australiantenders.com.au', 'tenderhub.com.au', 'govmarket.com.au'];

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const config of states) {
    const tenders = await scrapeState(config);

    for (const tender of tenders) {
      // Skip aggregator listing pages
      if (tender.source_url && AGGREGATOR_DOMAINS.some((d) => tender.source_url.includes(d))) {
        console.log(`  ⊘ Skipping aggregator: ${tender.title?.substring(0, 50)}`);
        totalSkipped++;
        continue;
      }

      // Skip existing URLs
      if (tender.source_url && existingUrls.has(tender.source_url)) {
        continue;
      }

      const { isJusticeRelated, keywords } = classifyJusticeRelevance(
        tender.title || '',
        tender.description || ''
      );

      const record = {
        source: config.source,
        source_id: tender.source_id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: tender.title,
        description: tender.description,
        contract_value: tender.contract_value ? Number(tender.contract_value) : null,
        status: tender.status || 'unknown',
        state: config.state,
        buyer_name: tender.buyer_name,
        buyer_department: tender.buyer_department,
        supplier_name: tender.supplier_name,
        supplier_abn: tender.supplier_abn,
        published_date: tender.published_date,
        closing_date: tender.closing_date,
        is_justice_related: isJusticeRelated || (tender._keywords?.length > 0),
        justice_keywords: [...new Set([...(keywords || []), ...(tender._keywords || [])])],
        source_url: tender.source_url,
      };

      if (!applyMode) {
        const justiceTag = record.is_justice_related ? '⚖️' : '  ';
        const value = record.contract_value
          ? `$${(record.contract_value / 1000000).toFixed(1)}M`
          : 'N/A';
        console.log(`  ${justiceTag} [${record.state}] ${record.title?.substring(0, 60)} (${value})`);
        continue;
      }

      const { error } = await supabase.from('state_tenders').upsert(record, {
        onConflict: 'source,source_id',
      });

      if (error) {
        console.log(`  ⚠️ ${tender.title?.substring(0, 40)}: ${error.message}`);
        totalSkipped++;
      } else {
        totalInserted++;
        if (record.source_url) existingUrls.add(record.source_url);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Summary:`);
  if (applyMode) {
    console.log(`   Inserted/updated: ${totalInserted}`);
    console.log(`   Skipped/errors: ${totalSkipped}`);
  } else {
    console.log('   DRY RUN — no changes written. Use --apply to insert.');
  }
}

main().catch(console.error);
