#!/usr/bin/env node
/**
 * scrape-federal-hansard.mjs
 *
 * Scrapes Federal Hansard speeches about youth justice from the OpenAustralia API
 * and stores them in the civic_hansard table.
 *
 * Usage:
 *   node scripts/scrape-federal-hansard.mjs
 *   node scripts/scrape-federal-hansard.mjs --dry-run
 *   node scripts/scrape-federal-hansard.mjs --limit=50
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENV + SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch { /* ignore */ }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const API_BASE = 'https://www.openaustralia.org.au/api';
const API_KEY = env.OPENAUSTRALIA_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAUSTRALIA_API_KEY in environment');
  process.exit(1);
}

const KEYWORDS = [
  'youth justice',
  'youth detention',
  'juvenile justice',
  'young offender',
  'raising the age',
  'age of criminal responsibility',
  'Don Dale',
  'Banksia Hill',
  'youth crime',
  'youth diversion',
];

const RESULTS_PER_PAGE = 20;
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const MAX_RESULTS_PER_KEYWORD = limitArg ? parseInt(limitArg.split('=')[1], 10) : 200;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTML STRIPPING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FETCHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchHansard(keyword, page = 1) {
  const params = new URLSearchParams({
    search: keyword,
    num: String(RESULTS_PER_PAGE),
    page: String(page),
    order: 'd',
    key: API_KEY,
    output: 'js',
  });

  const url = `${API_BASE}/getHansard?${params}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(`  API error ${resp.status} for "${keyword}" page ${page}`);
    return null;
  }

  const data = await resp.json();
  return data;
}

function buildSourceUrl(gid) {
  // OpenAustralia GIDs look like: uk.org.publicwhip/debate/2024-02-05.123.0
  // or senate: uk.org.publicwhip/lords/2024-02-05.123.0
  if (!gid) return null;
  const isLords = gid.includes('/lords/');
  const match = gid.match(/\/(?:debate|lords)\/(.+)/);
  if (!match) return `https://www.openaustralia.org.au/debates/?id=${encodeURIComponent(gid)}`;

  const fragment = match[1];
  if (isLords) {
    return `https://www.openaustralia.org.au/senate/?id=${fragment}`;
  }
  return `https://www.openaustralia.org.au/debates/?id=${fragment}`;
}

function determineHouse(gid) {
  if (!gid) return 'reps';
  return gid.includes('/lords/') ? 'senate' : 'reps';
}

function parseRow(row) {
  const gid = row.gid || row.id || null;
  const sourceUrl = buildSourceUrl(gid);
  if (!sourceUrl) return null;

  return {
    subject: row.body?.match(/<h2>(.*?)<\/h2>/i)?.[1] || row.major_heading || row.minor_heading || 'Unknown',
    body_text: stripHtml(row.body || ''),
    speaker_name: row.speaker?.full_name || row.speaker_name || null,
    party: row.speaker?.party || null,
    sitting_date: row.hdate || null,
    house: determineHouse(gid),
    source_url: sourceUrl,
    jurisdiction: 'federal',
    scraped_at: new Date().toISOString(),
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEDUPLICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getExistingUrls() {
  const { data, error } = await supabase
    .from('civic_hansard')
    .select('source_url')
    .eq('jurisdiction', 'federal');

  if (error) {
    console.error('Error fetching existing URLs:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.source_url));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log('=== Federal Hansard Scraper ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Max results per keyword: ${MAX_RESULTS_PER_KEYWORD}`);
  console.log(`Keywords: ${KEYWORDS.length}\n`);

  const existingUrls = await getExistingUrls();
  console.log(`Existing federal Hansard records: ${existingUrls.size}\n`);

  const stats = { fetched: 0, new: 0, skipped: 0, inserted: 0, errors: 0 };
  const toInsert = [];
  const seenUrls = new Set();

  for (const keyword of KEYWORDS) {
    console.log(`Searching: "${keyword}"`);
    let page = 1;
    let totalFetched = 0;

    while (totalFetched < MAX_RESULTS_PER_KEYWORD) {
      const data = await fetchHansard(keyword, page);
      if (!data) break;

      const rows = data.rows || data.matches || [];
      if (rows.length === 0) break;

      for (const row of rows) {
        stats.fetched++;
        totalFetched++;

        const parsed = parseRow(row);
        if (!parsed || !parsed.source_url || !parsed.body_text) {
          stats.skipped++;
          continue;
        }

        // Deduplicate against existing DB records and within this run
        if (existingUrls.has(parsed.source_url) || seenUrls.has(parsed.source_url)) {
          stats.skipped++;
          continue;
        }

        seenUrls.add(parsed.source_url);
        toInsert.push(parsed);
        stats.new++;
      }

      // If fewer results than page size, no more pages
      if (rows.length < RESULTS_PER_PAGE) break;
      page++;

      // Rate limiting: 500ms between API calls
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`  -> ${totalFetched} results fetched, ${stats.new} new so far`);
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records:');
    for (const rec of toInsert.slice(0, 3)) {
      console.log(`  ${rec.sitting_date} | ${rec.speaker_name} | ${rec.house} | ${rec.subject.slice(0, 60)}`);
      console.log(`    ${rec.body_text.slice(0, 120)}...`);
      console.log(`    ${rec.source_url}`);
    }
  } else if (toInsert.length > 0) {
    // Insert in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('civic_hansard')
        .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });

      if (error) {
        console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
        stats.errors += batch.length;
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  console.log('\n=== Hansard Scrape Complete ===');
  console.log(`  Fetched:  ${stats.fetched}`);
  console.log(`  New:      ${stats.new}`);
  console.log(`  Skipped:  ${stats.skipped} (duplicates or empty)`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Errors:   ${stats.errors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
