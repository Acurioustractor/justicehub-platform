#!/usr/bin/env node
/**
 * NQ Media Scraper
 *
 * Searches for North Queensland youth justice media articles
 * using Serper API + Jina Reader for full-text extraction.
 *
 * Usage:
 *   node scripts/scrape-nq-media.mjs              # dry-run (search only)
 *   node scripts/scrape-nq-media.mjs --apply       # write to DB
 *   node scripts/scrape-nq-media.mjs --apply --max 20  # limit articles
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────────

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

// ─── Config ─────────────────────────────────────────────────────────────────────

const DRY_RUN = !process.argv.includes('--apply');
const MAX_ARTICLES = (() => {
  const idx = process.argv.indexOf('--max');
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || 50 : 50;
})();
const MAX_SEARCHES = 5; // Conserve Serper quota (2,500/month)
const JINA_DELAY_MS = 1000; // Rate limit between Jina requests

const SEARCH_QUERIES = [
  'Townsville youth justice site:townsvillebulletin.com.au',
  'Townsville youth crime detention',
  'Mount Isa youth justice young people',
  'Cairns youth detention crime',
  'Palm Island youth justice community',
  'North Queensland youth crime 2024 2025',
  'Cleveland Youth Detention Centre Townsville',
  'Townsville youth crime wave',
  'Mount Isa youth crime community',
  '"North Queensland" "youth justice" OR "young offenders"',
  'Townsville watch house children',
  'QLD youth detention Indigenous overrepresentation north',
];

const NQ_LOCATION_TAGS = [
  { tag: 'townsville', patterns: ['townsville', 'cleveland youth detention'] },
  { tag: 'mount_isa', patterns: ['mount isa', 'mt isa'] },
  { tag: 'cairns', patterns: ['cairns', 'far north queensland'] },
  { tag: 'palm_island', patterns: ['palm island'] },
  { tag: 'north_queensland', patterns: ['north queensland', 'nq ', 'fnq'] },
];

// ─── Supabase ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Serper Search ──────────────────────────────────────────────────────────────

async function searchSerper(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn('[Serper] No API key — skipping');
    return [];
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'au', num: 10 }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[Serper] HTTP ${response.status} for query: ${query.slice(0, 50)}`);
      return [];
    }

    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) {
      const n = parseInt(remaining, 10);
      if (n < 100) console.warn(`[Serper] Only ${n} searches remaining this month`);
    }

    const data = await response.json();
    return (data.organic || []).map((r) => ({
      title: r.title || '',
      url: r.link || '',
      snippet: r.snippet || '',
      date: r.date || null,
    }));
  } catch (err) {
    console.warn(`[Serper] Error: ${err.message}`);
    return [];
  }
}

// ─── Jina Reader ────────────────────────────────────────────────────────────────

async function extractWithJina(url) {
  try {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.warn(`[Jina] HTTP ${response.status} for ${url.slice(0, 60)}`);
      return null;
    }

    const text = await response.text();
    // Jina returns markdown — strip the metadata header if present
    const lines = text.split('\n');
    const contentStart = lines.findIndex((l, i) => i > 0 && l.trim() === '') + 1;
    const body = contentStart > 1 ? lines.slice(contentStart).join('\n').trim() : text.trim();

    return body.length > 100 ? body : null; // Skip very short extractions
  } catch (err) {
    console.warn(`[Jina] Error for ${url.slice(0, 60)}: ${err.message}`);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    // Map known domains to readable names
    const domainMap = {
      'townsvillebulletin.com.au': 'Townsville Bulletin',
      'cairnspost.com.au': 'Cairns Post',
      'abc.net.au': 'ABC News',
      'sbs.com.au': 'SBS News',
      'theguardian.com': 'The Guardian',
      'news.com.au': 'news.com.au',
      'smh.com.au': 'Sydney Morning Herald',
      'theaustralian.com.au': 'The Australian',
      'ntnews.com.au': 'NT News',
      'couriermail.com.au': 'Courier Mail',
      'brisbanetimes.com.au': 'Brisbane Times',
      'indaily.com.au': 'InDaily',
      'crikey.com.au': 'Crikey',
      'nit.com.au': 'National Indigenous Times',
      'koorimail.com': 'Koori Mail',
      'nitv.com.au': 'NITV',
      'indigenousx.com.au': 'IndigenousX',
    };
    return domainMap[hostname] || hostname;
  } catch {
    return 'Unknown';
  }
}

function detectLocationTags(text) {
  const lower = (text || '').toLowerCase();
  const tags = ['youth_justice', 'nq_media'];

  for (const { tag, patterns } of NQ_LOCATION_TAGS) {
    if (patterns.some((p) => lower.includes(p))) {
      tags.push(tag);
    }
  }

  // Ensure at least north_queensland tag if no specific location found
  if (!tags.includes('north_queensland') && !tags.includes('townsville') &&
      !tags.includes('mount_isa') && !tags.includes('cairns') && !tags.includes('palm_island')) {
    tags.push('north_queensland');
  }

  return [...new Set(tags)];
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== NQ Media Scraper ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Max articles: ${MAX_ARTICLES}`);
  console.log(`Max searches: ${MAX_SEARCHES}\n`);

  // Step 1: Fetch existing URLs to deduplicate
  console.log('[1/4] Fetching existing article URLs...');
  const { data: existing, error: fetchErr } = await supabase
    .from('alma_media_articles')
    .select('url');

  if (fetchErr) {
    console.error('Failed to fetch existing articles:', fetchErr.message);
    process.exit(1);
  }

  const existingUrls = new Set((existing || []).map((r) => r.url));
  console.log(`  Found ${existingUrls.size} existing articles in DB`);

  // Step 2: Search for articles
  console.log('\n[2/4] Searching for NQ youth justice articles...');
  const allResults = [];
  const seenUrls = new Set();

  // Shuffle queries and take MAX_SEARCHES
  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
  const queries = shuffled.slice(0, MAX_SEARCHES);

  for (const query of queries) {
    console.log(`  Searching: "${query.slice(0, 60)}..."`);
    const results = await searchSerper(query);
    console.log(`    Found ${results.length} results`);

    for (const r of results) {
      if (!r.url || seenUrls.has(r.url) || existingUrls.has(r.url)) continue;
      seenUrls.add(r.url);
      allResults.push(r);
    }
  }

  console.log(`\n  Total new unique results: ${allResults.length}`);
  const toProcess = allResults.slice(0, MAX_ARTICLES);
  console.log(`  Processing: ${toProcess.length} articles`);

  if (toProcess.length === 0) {
    console.log('\nNo new articles to process. Done.');
    return;
  }

  // Step 3: Extract full text via Jina Reader
  console.log('\n[3/4] Extracting article text via Jina Reader...');
  const articles = [];

  for (let i = 0; i < toProcess.length; i++) {
    const result = toProcess[i];
    console.log(`  [${i + 1}/${toProcess.length}] ${result.url.slice(0, 70)}...`);

    const articleText = await extractWithJina(result.url);

    if (!articleText) {
      console.log(`    Skipped (extraction failed or too short)`);
      continue;
    }

    const combinedText = `${result.title} ${result.snippet} ${articleText}`;
    const tags = detectLocationTags(combinedText);

    articles.push({
      headline: result.title.slice(0, 500),
      url: result.url,
      source_name: extractDomain(result.url),
      published_date: parseDate(result.date),
      full_text: articleText.slice(0, 50000), // Cap at 50K chars
      topics: tags,
    });

    console.log(`    OK (${articleText.length} chars, tags: ${tags.join(', ')})`);

    if (i < toProcess.length - 1) {
      await sleep(JINA_DELAY_MS);
    }
  }

  console.log(`\n  Extracted ${articles.length} articles successfully`);

  // Step 4: Insert into DB
  console.log(`\n[4/4] ${DRY_RUN ? 'Would insert' : 'Inserting'} ${articles.length} articles...`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN PREVIEW ---');
    for (const a of articles) {
      console.log(`  "${a.headline.slice(0, 80)}..."`);
      console.log(`    URL: ${a.url}`);
      console.log(`    Publication: ${a.source_name}`);
      console.log(`    Date: ${a.published_date || 'unknown'}`);
      console.log(`    Text: ${a.full_text.length} chars`);
      console.log(`    Topics: ${a.topics.join(', ')}`);
      console.log();
    }
    console.log('Run with --apply to write to database.');
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const article of articles) {
    // Double-check for duplicates (race condition protection)
    const { data: dup } = await supabase
      .from('alma_media_articles')
      .select('id')
      .eq('url', article.url)
      .limit(1);

    if (dup && dup.length > 0) {
      console.log(`  Skipped (already exists): ${article.headline.slice(0, 60)}`);
      skipped++;
      continue;
    }

    const { error: insertErr } = await supabase
      .from('alma_media_articles')
      .insert(article);

    if (insertErr) {
      console.error(`  Failed to insert "${article.headline.slice(0, 60)}": ${insertErr.message}`);
      skipped++;
    } else {
      console.log(`  Inserted: "${article.headline.slice(0, 60)}..."`);
      inserted++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total searched: ${allResults.length} unique results`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
