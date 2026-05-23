#!/usr/bin/env node
/**
 * SCAG (Standing Council of Attorneys-General) communique ingestion.
 *
 * Source: https://www.ag.gov.au/about-us/publications/standing-council-attorneys-general-communiques
 *
 * The AG.gov.au site organises communiques by year on sibling pages
 * (-2024, -2025, -2026). The 2026 page is the no-suffix landing page;
 * earlier years are at /publications/standing-council-attorneys-general-communiques-YYYY.
 *
 * Each year page lists communique PDFs at /sites/default/files/YYYY-MM/...pdf
 * (with a parallel DOCX). We dedupe on the PDF URL, parse the meeting
 * date out of the filename, and hash the URL for diff detection.
 *
 * v1 caveat: full content_text extraction from the PDFs is deferred —
 * the file format requires a PDF parser we don't want as a dep in this
 * script. We hash the URL + filename so weekly polls can still detect
 * new communiques cheaply; a later enrichment pass can backfill content
 * and YJ-relevant decision extraction.
 *
 * Per docs/civic-connectors/build-specs.md section 7.B.
 *
 * Usage:
 *   node scripts/civic/ingest-scag-communiques.mjs           # DRY-RUN (default)
 *   node scripts/civic/ingest-scag-communiques.mjs --apply   # write
 *   node scripts/civic/ingest-scag-communiques.mjs --debug   # verbose
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const apply = process.argv.includes('--apply');
const debug = process.argv.includes('--debug');

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// In dry-run mode, we tolerate missing Supabase creds — useful for testing
// the scrape pipeline without DB access. Apply mode requires them.
let supabase = null;
if (apply) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: --apply requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Note: ag.gov.au's WAF appears to block UA strings that include a
// "+https://..." referrer suffix. Keep the UA simple.
const USER_AGENT = 'Mozilla/5.0 (compatible; JusticeHub/1.0)';
const INDEX_URL = 'https://www.ag.gov.au/about-us/publications/standing-council-attorneys-general-communiques';
// Year pages we know about. The 2026 page is at the no-suffix URL; prior
// years use the -YYYY suffix. We don't probe further back than 2024 in v1.
const YEAR_PAGES = [
  INDEX_URL,                                 // 2026
  `${INDEX_URL}-2025`,
  `${INDEX_URL}-2024`,
];

function log(...args) {
  console.log(...args);
}
function dbg(...args) {
  if (debug) console.log('  [debug]', ...args);
}

async function fetchText(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) {
      log(`  ! ${url} → HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    log(`  ! ${url} → ${e.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : e.message}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Extract communique file URLs from a year-page HTML.
 *
 * The AG.gov.au pages publish each communique twice — once as PDF, once
 * as DOCX — sharing the same stem. We prefer the PDF, drop the DOCX.
 *
 * Pattern: href="https://www.ag.gov.au/sites/default/files/YYYY-MM/<slug>.pdf"
 * (lowercase or uppercase extension, with or without other params).
 */
function extractCommuniqueUrls(html) {
  if (!html) return [];
  // Match all href values pointing at sites/default/files
  const hrefRe = /href="(https:\/\/www\.ag\.gov\.au\/sites\/default\/files\/[^"]+)"/g;
  const all = new Set();
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const url = m[1];
    // Skip CSS / images / non-document assets
    if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)(\?|$)/i.test(url)) continue;
    // Communique signal: filename must include "communique" — the
    // ag.gov.au file naming convention puts it in every official
    // communique filename. Skip attachments (agreements, working-group
    // reports, response documents) that hang off the same year page.
    const lower = url.toLowerCase();
    if (!/communique/.test(lower)) continue;
    if (/responses-|working-group-final-report|agreement-to-deliver/i.test(lower)) {
      continue;
    }
    all.add(url);
  }

  // Dedupe PDF vs DOCX pairs. We can't rely on filename stem alone
  // because the publisher occasionally truncates one variant (e.g.
  // SCAG-Communique-27-February-.PDF vs SCAG-Communique-27-February-2026.DOCX
  // — same meeting, different filename length). Key on
  // (directory YYYY-MM, simplified-slug) where simplified-slug strips
  // extension, trailing year-suffix, and trailing punctuation.
  const byKey = new Map();
  for (const url of all) {
    const dirMatch = url.match(/\/(\d{4}-\d{2})\//);
    const dir = dirMatch ? dirMatch[1] : '';
    const filename = url.split('/').pop()?.toLowerCase() || '';
    const slug = filename
      .replace(/\.(pdf|docx)$/i, '')
      .replace(/[-_]?\d{4}$/, '')     // strip trailing -YYYY / _YYYY if present
      .replace(/[-_.]+$/, '');        // strip trailing punctuation
    const key = `${dir}|${slug}`;
    const isPdf = /\.pdf$/i.test(url);
    const existing = byKey.get(key);
    if (!existing || (isPdf && !/\.pdf$/i.test(existing))) {
      byKey.set(key, url);
    }
  }
  return [...byKey.values()].sort();
}

/**
 * Parse a meeting date from a communique URL / filename.
 *
 * Patterns seen so far:
 *   .../scag-communique-27-february-2026.pdf     → 2026-02-27
 *   .../scag-communique-5-july-2024.pdf          → 2024-07-05
 *   .../scag-communique-february-2024.pdf        → 2024-02-01 (month-only)
 *   .../extraordinary-joint-pmc-and-scag-communique-9-january-2026.pdf → 2026-01-09
 *   .../joint-police-ministers-council-and-scag-communique_september-2024.pdf → 2024-09-01
 *
 * Fallback: extract YYYY-MM from the directory path (2026-02 → 2026-02-01).
 */
const MONTHS = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sept: '09', sep: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};
// Used in regexes — longest tokens first so the matcher prefers full month
// names over their abbreviated prefixes ("september" before "sep").
const MONTH_PATTERN =
  'january|february|march|april|may|june|july|august|september|october|november|december' +
  '|sept|sep|oct|nov|dec|jan|feb|mar|apr|jun|jul|aug';

function parseMeetingDate(url) {
  const filename = url.split('/').pop()?.toLowerCase() || '';
  // Directory date e.g. /2026-02/ — used as a fallback for both year and
  // year-month when the filename is incomplete.
  const dirMatch = url.match(/\/(\d{4})-(\d{2})\//);
  const dirYear = dirMatch?.[1];
  const dirMonth = dirMatch?.[2];

  // Try: "DD-month-YYYY"
  const dmyRe = new RegExp(`(\\d{1,2})[-_\\s]+(${MONTH_PATTERN})[-_\\s]+(\\d{4})`);
  const dayMonthYear = filename.match(dmyRe);
  if (dayMonthYear) {
    const day = String(dayMonthYear[1]).padStart(2, '0');
    const month = MONTHS[dayMonthYear[2]];
    const year = dayMonthYear[3];
    return `${year}-${month}-${day}`;
  }

  // Try: "DD-month-" without year — fall back to directory year.
  // Real-world example: SCAG-Communique-27-February-.PDF in /2026-02/.
  const dmRe = new RegExp(`(\\d{1,2})[-_\\s]+(${MONTH_PATTERN})(?![a-z])`);
  const dayMonth = filename.match(dmRe);
  if (dayMonth && dirYear) {
    const day = String(dayMonth[1]).padStart(2, '0');
    const month = MONTHS[dayMonth[2]];
    return `${dirYear}-${month}-${day}`;
  }

  // Try: "month-YYYY" (no day)
  const myRe = new RegExp(`(${MONTH_PATTERN})[-_\\s]+(\\d{4})`);
  const monthYear = filename.match(myRe);
  if (monthYear) {
    const month = MONTHS[monthYear[1]];
    const year = monthYear[2];
    return `${year}-${month}-01`;
  }

  // Final fallback: directory YYYY-MM only.
  if (dirYear && dirMonth) {
    return `${dirYear}-${dirMonth}-01`;
  }

  return null;
}

/**
 * Strip HTML to plain text (very rough — drops tags, decodes a few
 * entities, collapses whitespace). Good enough for content hashing.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

async function scrapeYearPage(url) {
  log(`Fetching ${url}`);
  const html = await fetchText(url);
  if (!html) return [];

  const urls = extractCommuniqueUrls(html);
  dbg(`  → ${urls.length} communique URLs found on ${url}`);
  return urls;
}

async function buildEntry(communiqueUrl) {
  const meetingDate = parseMeetingDate(communiqueUrl);
  if (!meetingDate) {
    log(`  ! could not parse date from ${communiqueUrl} — skipping`);
    return null;
  }

  // For PDFs we don't have an HTML body to strip. We hash on the URL
  // itself + filename so weekly polls can detect new entries cheaply.
  // A later enrichment pass can backfill content_text with PDF parsing.
  const filename = communiqueUrl.split('/').pop() || '';
  const placeholderText = `SCAG communique • ${filename}`;
  const contentHash = sha256(`${communiqueUrl}|${filename}`);

  return {
    meeting_date: meetingDate,
    host_jurisdiction: null,            // not knowable from filename alone
    communique_url: communiqueUrl,
    yj_decisions_jsonb: [],
    raise_age_position: null,
    member_states: null,
    agenda_items_jsonb: [],
    content_text: placeholderText,
    content_hash: contentHash,
    scraped_at: new Date().toISOString(),
  };
}

async function upsertEntry(entry) {
  if (!apply) {
    return { action: 'would_upsert' };
  }

  // Idempotent upsert on meeting_date (the table's UNIQUE column).
  const { error } = await supabase
    .from('scag_communiques')
    .upsert(
      { ...entry, updated_at: new Date().toISOString() },
      { onConflict: 'meeting_date' }
    );
  if (error) throw new Error(`upsert failed: ${error.message}`);
  return { action: 'upserted' };
}

async function main() {
  log(`SCAG communique ingestion · ${apply ? 'APPLY' : 'DRY-RUN'}`);
  log(`Source: ${INDEX_URL}`);
  log('');

  // 1. Scrape every known year page, collect unique communique URLs.
  const allUrls = new Set();
  let yearPagesReached = 0;
  for (const yearPage of YEAR_PAGES) {
    const urls = await scrapeYearPage(yearPage);
    if (urls.length > 0) yearPagesReached++;
    for (const u of urls) allUrls.add(u);
  }

  if (allUrls.size === 0) {
    // Total failure to find anything: dump the index page for inspection
    // and exit with a clear error per the fallback contract in the task spec.
    log('');
    log('No communique URLs extracted from any year page.');
    log('Dumping raw HTML of index page to /tmp/scag-debug.html for inspection.');
    const html = await fetchText(INDEX_URL);
    if (html) writeFileSync('/tmp/scag-debug.html', html);
    process.exit(2);
  }

  log('');
  log(`Discovered ${allUrls.size} unique communique URLs across ${yearPagesReached} year pages.`);
  log('');

  // 2. Build entries (date parse + hash) and upsert.
  let parsed = 0;
  let skipped = 0;
  let upserted = 0;
  let errors = 0;
  const seenDates = new Set();

  for (const url of [...allUrls].sort()) {
    const entry = await buildEntry(url);
    if (!entry) {
      skipped++;
      continue;
    }
    // Two different URLs parsing to the same meeting_date would collide
    // on the table's UNIQUE constraint. The first one wins (sorted order
    // tends to put more-specific URLs first). Warn and skip duplicates.
    if (seenDates.has(entry.meeting_date)) {
      skipped++;
      log(`  ~ ${entry.meeting_date} · duplicate date — skip · ${url.split('/').pop()}`);
      continue;
    }
    seenDates.add(entry.meeting_date);
    parsed++;

    try {
      const res = await upsertEntry(entry);
      upserted++;
      const tag = res.action === 'upserted' ? 'upserted' : 'would-write';
      log(`  ${entry.meeting_date} · ${tag} · ${url.split('/').pop()}`);
    } catch (e) {
      errors++;
      log(`  ! ${entry.meeting_date} · ${e.message}`);
    }
  }

  log('');
  log(`Summary: parsed=${parsed} skipped=${skipped} ${apply ? 'upserted' : 'would-write'}=${upserted} errors=${errors}`);

  if (!apply) {
    log('');
    log('(Dry-run. Re-run with --apply to write.)');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
