#!/usr/bin/env node
/**
 * scrape-qld-hansard.mjs — Scrapes QLD Parliament Hansard speeches about youth
 * justice and stores them in civic_hansard (jurisdiction='QLD').
 *
 * Uses Firecrawl API to scrape QLD Parliament's internal search endpoint
 * (no public API exists) and individual speech pages.
 *
 * Search endpoint:
 *   https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query={keywords}
 *
 * Requires: FIRECRAWL_API_KEY env var
 *
 * Usage:
 *   node scripts/scrape-qld-hansard.mjs [--dry-run] [--limit=N]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Env loading ────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f);
    if (existsSync(p)) {
      try {
        readFileSync(p, 'utf8').split('\n')
          .filter((l) => l && !l.startsWith('#') && l.includes('='))
          .forEach((l) => {
            const eqIdx = l.indexOf('=');
            const key = l.slice(0, eqIdx).trim();
            const val = l.slice(eqIdx + 1).trim();
            if (!env[key]) env[key] = val;
          });
      } catch { /* ignore */ }
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const FIRECRAWL_API_KEY = env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

// ── CLI args ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

// ── Constants ──────────────────────────────────────────────────────

const SEARCH_KEYWORDS = [
  'youth justice',
  'youth detention',
  'raising the age',
  'juvenile justice',
  'watch house',
  'youth crime',
];

const YJ_KEYWORDS = [
  'youth justice', 'youth detention', 'juvenile justice', 'young offender',
  'raising the age', 'age of criminal responsibility',
  'youth crime', 'youth diversion', 'child detention', 'youth bail',
  'children in custody', 'juvenile detention', 'watch house',
];
const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

const MONTHS = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
};

const RATE_LIMIT_MS = 2000;

// ── Utility functions ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '\u2014').replace(/&#8211;/g, '\u2013')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function parseDateString(dateStr) {
  if (!dateStr) return null;
  // Try "18 November 2025" format
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = MONTHS[match[2].toLowerCase()];
    if (month) return `${match[3]}-${month}-${day}`;
  }
  // Try ISO format
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return null;
}

// ── Firecrawl API ──────────────────────────────────────────────────

async function firecrawlScrape(url) {
  const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`  Firecrawl error ${response.status} for ${url}: ${errText.slice(0, 200)}`);
    return null;
  }

  const data = await response.json();
  return data?.data || null;
}

// ── Search result parsing ──────────────────────────────────────────

/**
 * Parse firecrawl markdown output from search results page.
 * The markdown contains links and snippets from the QLD Parliament search.
 */
function parseSearchMarkdown(markdown) {
  if (!markdown) return [];
  const results = [];

  // Look for links that point to hansard pages with surrounding context
  // QLD Parliament search results typically contain links like:
  //   [Title](/work-of-the-assembly/hansard/...)
  // or links with full URLs
  const linkPattern = /\[([^\]]+)\]\(((?:https?:\/\/www\.parliament\.qld\.gov\.au)?\/[^\)]*hansard[^\)]*)\)/gi;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const title = match[1].trim();
    let url = match[2].trim();
    if (!url.startsWith('http')) {
      url = `https://www.parliament.qld.gov.au${url}`;
    }

    // Get surrounding context (500 chars after the link)
    const afterLink = markdown.slice(match.index + match[0].length, match.index + match[0].length + 500);
    // Get context before the link too (200 chars)
    const beforeLink = markdown.slice(Math.max(0, match.index - 200), match.index);

    // Try to extract date from nearby text
    const dateMatch = (beforeLink + afterLink).match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Try to extract speaker from nearby text
    const speakerMatch = (beforeLink + afterLink).match(/(?:by|speaker[:\s]+|Hon\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+MP)?)/i);
    const speaker = speakerMatch ? speakerMatch[1] : '';

    // Get snippet - text after the link up to next link or section
    const snippetText = afterLink.split(/\[|\n\n/)[0].trim().slice(0, 500);

    results.push({ title, url, date, speaker, snippet: snippetText });
  }

  return results;
}

/**
 * Parse firecrawl HTML output from search results page.
 * Falls back to HTML parsing if markdown parsing yields no results.
 */
function parseSearchHtml(html) {
  if (!html) return [];
  const results = [];

  // Match search result blocks — try several common patterns
  const patterns = [
    // Pattern 1: div.search-result with h3/a and meta/snippet
    /<div[^>]*class="[^"]*search-result[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Pattern 2: li with links inside results container
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1];

      // Extract link and title
      const linkMatch = block.match(/<a\s+href="([^"]*(?:hansard|Hansard|speech)[^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;

      const relativeUrl = linkMatch[1];
      const title = stripHtml(linkMatch[2]);
      if (!title) continue;

      const url = relativeUrl.startsWith('http')
        ? relativeUrl
        : `https://www.parliament.qld.gov.au${relativeUrl}`;

      // Extract date
      const dateMatch = block.match(/(\d{1,2}\s+\w+\s+\d{4})/);
      const date = dateMatch ? dateMatch[1] : '';

      // Extract speaker
      const speakerMatch = block.match(/(?:by|speaker|member)[:\s]+([^<\n]+)/i);
      const speaker = speakerMatch ? stripHtml(speakerMatch[1]) : '';

      // Extract snippet
      const snippetMatch = block.match(/<p[^>]*class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
        || block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : '';

      results.push({ title, url, date, speaker, snippet });
    }

    if (results.length > 0) break; // Use first pattern that works
  }

  return results;
}

// ── Speech page parsing ────────────────────────────────────────────

/**
 * Parse a full speech page from firecrawl markdown.
 * Extracts the main speech content, speaker info, and date.
 */
function parseSpeechPage(markdown, fallbackTitle, fallbackDate) {
  if (!markdown) return null;

  // The markdown will contain the full speech text
  // Remove navigation/header/footer cruft — take the main content
  const lines = markdown.split('\n');
  const contentLines = [];
  let inContent = false;

  for (const line of lines) {
    // Skip navigation-like lines
    if (line.match(/^(Home|About|Members|Work of the Assembly|Search|Menu|Navigation)/i)) continue;
    if (line.match(/^\s*\|/)) continue; // table formatting
    if (line.match(/^#{1,2}\s/) && !inContent) {
      inContent = true;
    }
    if (inContent) {
      contentLines.push(line);
    }
  }

  const bodyText = contentLines.join('\n').trim() || markdown.trim();
  if (bodyText.length < 100) return null;

  // Extract speaker from content
  const speakerMatch = bodyText.match(/\*\*([^*]+(?:MP|Minister|Premier|Speaker|Member))\*\*/i)
    || bodyText.match(/^(?:#{1,4}\s+)?(?:Hon\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+MP)?)/m);
  const speakerName = speakerMatch ? speakerMatch[1].trim() : null;

  // Extract date from content
  const dateMatch = bodyText.match(/(\d{1,2}\s+\w+\s+\d{4})/);
  const date = dateMatch ? dateMatch[1] : fallbackDate;

  // Extract party
  const partyMatch = bodyText.match(/\(([A-Z]{2,4})\)/);
  const party = partyMatch ? partyMatch[1] : null;

  return {
    bodyText: bodyText.slice(0, 10000), // Cap at 10K chars
    speakerName: speakerName,
    speakerParty: party,
    date: date,
  };
}

// ── Record shaping ─────────────────────────────────────────────────

function shapeRecord(parsed) {
  const partyMatch = (parsed.speaker || '').match(/\(([^)]+)\)/);
  const speakerParty = parsed.speakerParty || (partyMatch ? partyMatch[1] : null);
  const speakerName = (parsed.speaker || '').replace(/\s*\([^)]*\)\s*/, '').trim() || parsed.speakerName || null;
  const sittingDate = parseDateString(parsed.date);

  return {
    subject: parsed.title || null,
    body_text: parsed.bodyText || parsed.snippet || '',
    speaker_name: speakerName,
    speaker_party: speakerParty,
    speech_type: 'speech',
    sitting_date: sittingDate,
    source_url: parsed.url,
    jurisdiction: 'QLD',
    scraped_at: new Date().toISOString(),
  };
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('=== QLD Hansard Scraper (Firecrawl) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT === Infinity ? 'none' : LIMIT}`);

  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not set. Set it in .env.local');
    process.exit(1);
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase credentials not set');
    process.exit(1);
  }

  // Load existing URLs for dedup
  const { data: existing } = await supabase
    .from('civic_hansard')
    .select('source_url')
    .eq('jurisdiction', 'QLD');
  const existingUrls = new Set((existing || []).map((r) => r.source_url));
  console.log(`Existing QLD records: ${existingUrls.size}\n`);

  const stats = {
    keywords_searched: 0,
    search_results_found: 0,
    yj_relevant: 0,
    pages_fetched: 0,
    new_records: 0,
    inserted: 0,
    skipped_existing: 0,
    errors: 0,
  };

  const toInsert = [];
  const seenUrls = new Set();

  for (const keyword of SEARCH_KEYWORDS) {
    if (toInsert.length >= LIMIT) break;

    const searchUrl = `https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query=${encodeURIComponent(keyword)}`;
    console.log(`\nSearching: "${keyword}"`);
    console.log(`  URL: ${searchUrl}`);
    stats.keywords_searched++;

    // Scrape search results page
    const searchData = await firecrawlScrape(searchUrl);
    if (!searchData) {
      console.error(`  Failed to scrape search results for "${keyword}"`);
      stats.errors++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    // Parse results — try markdown first, fall back to HTML
    let results = parseSearchMarkdown(searchData.markdown);
    if (results.length === 0 && searchData.html) {
      results = parseSearchHtml(searchData.html);
    }

    console.log(`  Found ${results.length} search results`);
    stats.search_results_found += results.length;

    // Filter for YJ relevance
    const relevant = results.filter(
      (r) => YJ_PATTERN.test(r.title) || YJ_PATTERN.test(r.snippet)
    );
    console.log(`  YJ-relevant: ${relevant.length}`);
    stats.yj_relevant += relevant.length;

    for (const result of relevant) {
      if (toInsert.length >= LIMIT) break;

      // Dedup check
      if (existingUrls.has(result.url) || seenUrls.has(result.url)) {
        stats.skipped_existing++;
        continue;
      }
      seenUrls.add(result.url);

      // Fetch full speech page
      console.log(`  Fetching: ${result.title.slice(0, 60)}...`);
      await sleep(RATE_LIMIT_MS);

      const speechData = await firecrawlScrape(result.url);
      stats.pages_fetched++;

      let bodyText = result.snippet;
      let speakerName = result.speaker;
      let speakerParty = null;

      if (speechData?.markdown) {
        const parsed = parseSpeechPage(speechData.markdown, result.title, result.date);
        if (parsed) {
          bodyText = parsed.bodyText;
          speakerName = parsed.speakerName || speakerName;
          speakerParty = parsed.speakerParty;
          if (parsed.date && !result.date) {
            result.date = parsed.date;
          }
        }
      }

      const record = shapeRecord({
        title: result.title,
        url: result.url,
        date: result.date,
        speaker: speakerName,
        speakerName,
        speakerParty,
        snippet: result.snippet,
        bodyText,
      });

      // Skip if body is too short
      if (!record.body_text || record.body_text.length < 50) {
        console.log(`    Skipped (body too short: ${(record.body_text || '').length} chars)`);
        continue;
      }

      toInsert.push(record);
      stats.new_records++;
      console.log(`    Queued: ${record.subject?.slice(0, 50)} (${(record.body_text || '').length} chars)`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  // ── Insert records ─────────────────────────────────────────────

  console.log(`\n=== Inserting ${toInsert.length} records ===`);

  if (DRY_RUN) {
    console.log('DRY RUN — not inserting. Sample records:');
    for (const r of toInsert.slice(0, 5)) {
      console.log(`  ${r.sitting_date} | ${r.speaker_name} | ${r.subject?.slice(0, 60)}`);
    }
  } else if (toInsert.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { error } = await supabase
        .from('civic_hansard')
        .insert(batch);

      if (error) {
        // Handle duplicate key errors gracefully
        if (error.message?.includes('duplicate') || error.code === '23505') {
          console.log(`  Batch ${i / 50 + 1}: some duplicates skipped`);
          // Try inserting one by one
          for (const record of batch) {
            const { error: singleErr } = await supabase
              .from('civic_hansard')
              .insert(record);
            if (singleErr) {
              if (singleErr.message?.includes('duplicate') || singleErr.code === '23505') {
                stats.skipped_existing++;
              } else {
                console.error(`    Insert error: ${singleErr.message}`);
                stats.errors++;
              }
            } else {
              stats.inserted++;
            }
          }
        } else {
          console.error(`  Batch insert error: ${error.message}`);
          stats.errors += batch.length;
        }
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────

  console.log('\n=== Summary ===');
  console.log(`Keywords searched: ${stats.keywords_searched}`);
  console.log(`Search results found: ${stats.search_results_found}`);
  console.log(`YJ-relevant: ${stats.yj_relevant}`);
  console.log(`Pages fetched: ${stats.pages_fetched}`);
  console.log(`New records: ${stats.new_records}`);
  console.log(`Inserted: ${stats.inserted}`);
  console.log(`Skipped (existing): ${stats.skipped_existing}`);
  console.log(`Errors: ${stats.errors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
