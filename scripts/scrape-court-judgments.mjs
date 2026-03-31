#!/usr/bin/env node
/**
 * scrape-court-judgments.mjs
 *
 * Scrapes youth justice court judgments from RSS feeds and stores them
 * in alma_research_findings with finding_type = 'court_judgment'.
 *
 * Feeds:
 *   - Federal Court of Australia (FCA)
 *   - QLD Supreme Court Library (SCLQLD)
 *
 * Usage:
 *   node scripts/scrape-court-judgments.mjs
 *   node scripts/scrape-court-judgments.mjs --dry-run
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
// No jsdom needed — use regex XML parsing

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENV + SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

const DRY_RUN = process.argv.includes('--dry-run');

const YJ_KEYWORDS = ['youth', 'juvenile', 'child', 'young offender', 'detention', 'sentencing'];
const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

const FEEDS = [
  {
    url: 'https://www.judgments.fedcourt.gov.au/rss/fca-judgments',
    court: 'Federal Court of Australia',
    jurisdiction: 'federal',
  },
  {
    url: 'https://www.sclqld.org.au/collections/caselaw/caselaw-alerts-rss-feeds',
    court: 'QLD Supreme Court',
    jurisdiction: 'QLD',
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RSS PARSING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

function parseRssItems(xml) {
  const entries = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    entries.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
    });
  }
  return entries;
}

function isYouthJustice(entry) {
  const text = `${entry.title} ${entry.description}`;
  return YJ_PATTERN.test(text);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log('=== Court Judgment Scraper ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Load existing URLs for dedup
  const { data: existing } = await supabase
    .from('alma_research_findings')
    .select('validation_source')
    .eq('finding_type', 'court_judgment');
  const existingKeys = new Set((existing || []).map((r) => r.validation_source));

  const stats = { fetched: 0, matched: 0, skipped: 0, inserted: 0, errors: 0 };
  const toInsert = [];

  for (const feed of FEEDS) {
    console.log(`Fetching: ${feed.court} (${feed.url})`);
    let xml;
    try {
      const resp = await fetch(feed.url, {
        headers: { 'User-Agent': 'JusticeHub/1.0 (research)' },
      });
      if (!resp.ok) { console.error(`  HTTP ${resp.status}`); continue; }
      xml = await resp.text();
    } catch (err) {
      console.error(`  Fetch error: ${err.message}`);
      stats.errors++;
      continue;
    }

    const items = parseRssItems(xml);
    console.log(`  ${items.length} items in feed`);
    stats.fetched += items.length;

    for (const item of items) {
      if (!isYouthJustice(item)) continue;
      stats.matched++;

      const dedupKey = `court_judgment:${item.link}`;
      if (existingKeys.has(dedupKey)) { stats.skipped++; continue; }
      existingKeys.add(dedupKey);

      const matchedKeywords = YJ_KEYWORDS.filter((kw) =>
        `${item.title} ${item.description}`.toLowerCase().includes(kw)
      );

      toInsert.push({
        finding_type: 'court_judgment',
        content: {
          title: item.title,
          date: item.pubDate || null,
          court: feed.court,
          jurisdiction: feed.jurisdiction,
          summary: item.description,
          matched_keywords: matchedKeywords,
        },
        confidence: matchedKeywords.length >= 3 ? 0.9 : matchedKeywords.length >= 2 ? 0.8 : 0.7,
        validation_source: dedupKey,
        sources: item.link ? [item.link] : [],
      });
    }

    console.log(`  -> ${stats.matched} YJ matches so far`);
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would insert:');
    for (const rec of toInsert.slice(0, 5)) {
      const c = rec.content;
      console.log(`  ${c.date || 'no-date'} | ${c.court} | ${c.title.slice(0, 80)}`);
      console.log(`    Keywords: ${c.matched_keywords.join(', ')}`);
      console.log(`    URL: ${rec.sources[0] || 'none'}`);
    }
    if (toInsert.length > 5) console.log(`  ... and ${toInsert.length - 5} more`);
  } else if (toInsert.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase.from('alma_research_findings').insert(batch);
      if (error) {
        console.error(`  Batch error: ${error.message}`);
        stats.errors += batch.length;
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  console.log('\n=== Complete ===');
  console.log(`  Fetched:  ${stats.fetched}`);
  console.log(`  Matched:  ${stats.matched}`);
  console.log(`  Skipped:  ${stats.skipped} (duplicates)`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Errors:   ${stats.errors}`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
