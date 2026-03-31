#!/usr/bin/env node
/**
 * scrape-nsw-hansard.mjs — Scrapes NSW Parliament Hansard speeches about youth
 * justice and stores them in civic_hansard (jurisdiction='NSW').
 *
 * Uses the NSW Parliament API (no auth required):
 *   - GET /api/hansard/search/year/{year} — sitting dates with TocDocId
 *   - GET /api/hansard/search/daily/tableofcontents/{TocDocId} — XML topic list
 *   - GET /api/hansard/search/daily/fragment/{fragmentId} — XML with full speech
 *
 * Usage:
 *   node scripts/scrape-nsw-hansard.mjs [--dry-run] [--days=90]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
const API_BASE = 'https://api.parliament.nsw.gov.au/api/hansard/search';

const YJ_KEYWORDS_RE = /youth justice|juvenile|detention|bail|raising the age|child protection|custody|remand|incarceration|first nations|aboriginal|indigenous|young people|young offender/i;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const daysArg = args.find((a) => a.startsWith('--days='));
const DAYS_BACK = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;

function stripHtml(h) {
  if (!h) return '';
  return h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '\u2014').replace(/&#8211;/g, '\u2013')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch sitting dates for a given year.
 * Returns array of objects with TocDocId, PdfDocId, Date, etc.
 */
async function fetchSittingDates(year) {
  const url = `${API_BASE}/year/${year}`;
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      console.error(`  Failed to fetch sitting dates for ${year}: ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`  Error fetching sitting dates for ${year}:`, err.message);
    return [];
  }
}

/**
 * Fetch the table of contents XML for a sitting day.
 * Returns raw XML string.
 */
async function fetchToc(tocDocId) {
  const url = `${API_BASE}/daily/tableofcontents/${tocDocId}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

/**
 * Fetch a single speech fragment by its ID.
 * Returns raw XML string.
 */
async function fetchFragment(fragmentId) {
  const url = `${API_BASE}/daily/fragment/${fragmentId}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

/**
 * Parse the TOC XML to extract items with their fragment IDs and titles.
 * Looks for items whose title matches youth justice keywords.
 */
function parseTocForYjTopics(xml) {
  if (!xml) return [];
  const results = [];

  // Match items/fragments in the TOC XML
  // NSW Parliament TOC XML has <Item> or <Fragment> elements with Id and Title
  const itemPattern = /<(Item|Fragment|TocItem)[^>]*>[\s\S]*?<\/\1>/gi;
  const items = xml.match(itemPattern) || [];

  for (const item of items) {
    // Extract title/heading
    const titleMatch = item.match(/<(Title|Heading|Subject|Name)>([\s\S]*?)<\/\1>/i);
    const title = titleMatch ? stripHtml(titleMatch[2]) : '';

    // Extract fragment ID / UID
    const idMatch = item.match(/<(FragmentId|Id|Uid|FragId)>([\s\S]*?)<\/\1>/i)
      || item.match(/(?:FragmentId|Id|Uid)=["']([^"']+)["']/i);
    const fragmentId = idMatch ? (idMatch[2] || idMatch[1]) : null;

    if (!fragmentId || !title) continue;

    if (YJ_KEYWORDS_RE.test(title)) {
      results.push({ fragmentId, title });
    }
  }

  // Also try a more general regex approach for varying XML structures
  // Look for any element with an id-like attribute and nearby text matching keywords
  if (results.length === 0) {
    // Try matching fragment IDs from the raw XML alongside nearby text
    const genericPattern = /<[^>]*(?:id|uid|fragmentid)=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = genericPattern.exec(xml)) !== null) {
      const id = match[1];
      // Get surrounding text (200 chars after the tag)
      const surroundingText = xml.slice(match.index, match.index + 500);
      const textContent = stripHtml(surroundingText);
      if (YJ_KEYWORDS_RE.test(textContent)) {
        results.push({ fragmentId: id, title: textContent.slice(0, 200) });
      }
    }
  }

  return results;
}

/**
 * Parse a fragment XML to extract speaker and body text.
 */
function parseFragment(xml, tocTitle, sittingDate) {
  if (!xml) return null;

  // Extract speaker
  const speakerMatch = xml.match(/<(Speaker|SpeakerName|Member)>([\s\S]*?)<\/\1>/i)
    || xml.match(/<[^>]*speaker=["']([^"']+)["']/i);
  const speakerName = speakerMatch
    ? stripHtml(speakerMatch[2] || speakerMatch[1])
    : null;

  // Extract body/text content
  const bodyMatch = xml.match(/<(Body|Content|Text|Html|HtmlBody)>([\s\S]*?)<\/\1>/i);
  const bodyHtml = bodyMatch ? bodyMatch[2] : '';
  const bodyText = stripHtml(bodyHtml);

  // If body is too short, try extracting all text content from the XML
  const finalBody = bodyText.length > 50
    ? bodyText
    : stripHtml(xml.replace(/<\?xml[^>]*>/g, ''));

  if (!finalBody || finalBody.length < 50) return null;

  // Double-check the content matches our keywords
  if (!YJ_KEYWORDS_RE.test(finalBody) && !YJ_KEYWORDS_RE.test(tocTitle)) return null;

  // Extract chamber/house
  const houseMatch = xml.match(/<(House|Chamber)>([\s\S]*?)<\/\1>/i);
  const houseRaw = houseMatch ? houseMatch[2].toLowerCase() : '';
  const house = houseRaw.includes('council') ? 'legislative_council' : 'legislative_assembly';

  return {
    subject: tocTitle,
    body_text: finalBody.slice(0, 50000), // Cap at 50K chars
    speaker_name: speakerName,
    party: null, // NSW API doesn't provide party in fragments
    sitting_date: sittingDate,
    house,
    source_url: null, // Will be set by caller
    jurisdiction: 'NSW',
    scraped_at: new Date().toISOString(),
  };
}

async function getExistingUrls() {
  const { data, error } = await supabase
    .from('civic_hansard').select('source_url').eq('jurisdiction', 'NSW');
  if (error) { console.error('Error fetching existing URLs:', error.message); return new Set(); }
  return new Set((data || []).map((r) => r.source_url));
}

function buildSourceUrl(tocDocId, fragmentId) {
  return `https://www.parliament.nsw.gov.au/Hansard/Pages/HansardResult.aspx#/docid/${tocDocId}/fragment/${fragmentId}`;
}

async function main() {
  console.log('=== NSW Hansard Scraper (Parliament API) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Looking back: ${DAYS_BACK} days\n`);

  const existingUrls = await getExistingUrls();
  console.log(`Existing NSW Hansard records: ${existingUrls.size}\n`);

  const stats = { dates_checked: 0, tocs_fetched: 0, topics_matched: 0, fragments_fetched: 0, new: 0, inserted: 0, errors: 0 };
  const toInsert = [];
  const seenUrls = new Set();

  // Calculate date cutoff
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_BACK);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Fetch sitting dates for current year (and previous year if within lookback)
  const currentYear = new Date().getFullYear();
  const years = [currentYear];
  if (cutoffDate.getFullYear() < currentYear) {
    years.push(cutoffDate.getFullYear());
  }

  let allSittings = [];
  for (const year of years) {
    console.log(`Fetching sitting dates for ${year}...`);
    const sittings = await fetchSittingDates(year);
    console.log(`  Found ${sittings.length} sitting dates`);
    allSittings.push(...sittings);
    await sleep(500);
  }

  // Filter to only recent sittings within our lookback window
  allSittings = allSittings.filter((s) => {
    const dateStr = s.Date || s.date || s.SittingDate || '';
    // Parse date - might be in various formats
    const parsed = dateStr.split('T')[0];
    return parsed >= cutoffStr;
  });

  console.log(`\nProcessing ${allSittings.length} sittings within last ${DAYS_BACK} days\n`);

  for (const sitting of allSittings) {
    const tocDocId = sitting.TocDocId || sitting.tocDocId;
    const sittingDate = (sitting.Date || sitting.date || sitting.SittingDate || '').split('T')[0];

    if (!tocDocId) {
      console.log(`  Skipping sitting ${sittingDate} — no TocDocId`);
      continue;
    }

    stats.dates_checked++;
    console.log(`\nProcessing ${sittingDate} (TocDocId: ${tocDocId})`);

    // Fetch TOC
    await sleep(500);
    const tocXml = await fetchToc(tocDocId);
    if (!tocXml) {
      console.log('  -> Failed to fetch TOC');
      continue;
    }
    stats.tocs_fetched++;

    // Parse TOC for youth justice topics
    const yjTopics = parseTocForYjTopics(tocXml);
    if (yjTopics.length === 0) {
      console.log('  -> No YJ topics found');
      continue;
    }

    console.log(`  -> Found ${yjTopics.length} YJ topics`);
    stats.topics_matched += yjTopics.length;

    // Fetch each matching fragment
    for (const topic of yjTopics) {
      const sourceUrl = buildSourceUrl(tocDocId, topic.fragmentId);

      if (existingUrls.has(sourceUrl) || seenUrls.has(sourceUrl)) {
        continue;
      }

      await sleep(500);
      const fragmentXml = await fetchFragment(topic.fragmentId);
      stats.fragments_fetched++;

      if (!fragmentXml) {
        console.log(`    -> Failed to fetch fragment ${topic.fragmentId}`);
        continue;
      }

      const record = parseFragment(fragmentXml, topic.title, sittingDate);
      if (!record) {
        console.log(`    -> Fragment ${topic.fragmentId} didn't match or was too short`);
        continue;
      }

      record.source_url = sourceUrl;
      seenUrls.add(sourceUrl);
      toInsert.push(record);
      stats.new++;
      console.log(`    + ${record.speaker_name || '?'} | ${topic.title.slice(0, 80)}`);
    }
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records:');
    for (const rec of toInsert.slice(0, 5)) {
      console.log(`  ${rec.sitting_date} | ${rec.speaker_name || '?'} | ${rec.house} | ${rec.subject?.slice(0, 60)}`);
      console.log(`    ${rec.body_text.slice(0, 120)}...`);
    }
  } else if (toInsert.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase
        .from('civic_hansard')
        .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });
      if (error) {
        console.error(`  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
        stats.errors += batch.length;
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Dates checked: ${stats.dates_checked}`);
  console.log(`  TOCs fetched: ${stats.tocs_fetched}`);
  console.log(`  YJ topics matched: ${stats.topics_matched}`);
  console.log(`  Fragments fetched: ${stats.fragments_fetched}`);
  console.log(`  New: ${stats.new}`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
