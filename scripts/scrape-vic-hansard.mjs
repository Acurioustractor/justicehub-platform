#!/usr/bin/env node
/**
 * scrape-vic-hansard.mjs — Scrapes Victorian Parliament Hansard speeches about
 * youth justice and stores them in civic_hansard (jurisdiction='VIC').
 *
 * VIC Parliament uses ISYS Perceptive Search at hansard.parliament.vic.gov.au.
 * No official API — we search via GET /search with ISYS query parameters,
 * then fetch individual documents at /isysquery/{sessionId}/{docNum}/doc/.
 *
 * VIC is critical because they RAISED the age of criminal responsibility to 14 —
 * their parliamentary debates are the positive case study.
 *
 * Usage:
 *   node scripts/scrape-vic-hansard.mjs [--dry-run] [--max=50] [--year=2024]
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

const HANSARD_BASE = 'https://hansard.parliament.vic.gov.au';

// Youth justice search phrases — each generates a separate ISYS query
const SEARCH_PHRASES = [
  'youth justice',
  'raising the age',
  'criminal responsibility',
  'juvenile detention',
  'youth detention',
  'children criminal age',
  'child protection youth',
];

// Keywords to verify relevance in body text
const YJ_KEYWORDS_RE = /youth justice|juvenile|detention|bail|raising the age|criminal responsibility|child protection|custody|remand|incarceration|first nations|aboriginal|indigenous|young people|young offender|age of criminal|youth offend/i;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const maxArg = args.find((a) => a.startsWith('--max='));
const MAX_RESULTS = maxArg ? parseInt(maxArg.split('=')[1], 10) : 100;
const yearArg = args.find((a) => a.startsWith('--year='));
const FILTER_YEAR = yearArg ? yearArg.split('=')[1] : null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(h) {
  if (!h) return '';
  return h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '\u2014').replace(/&#8211;/g, '\u2013')
    .replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Perform an ISYS search and extract the session ID and total hit count.
 * Returns { sessionId, totalHits, totalDocs }
 */
async function searchHansard(phrase) {
  const params = new URLSearchParams({
    'IW_DATABASE': '*',
    'IW_FIELD_ADVANCE_PHRASE': phrase,
  });

  const url = `${HANSARD_BASE}/search?${params.toString()}`;
  console.log(`  Searching: "${phrase}"`);

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
      'Accept': 'text/html',
    },
  });

  if (!resp.ok) {
    console.error(`  Search failed: HTTP ${resp.status}`);
    return null;
  }

  const html = await resp.text();

  // Extract session ID from result URLs: /isysquery/{sessionId}/...
  const sessionMatch = html.match(/isysquery\/([a-f0-9-]{36})\//i);
  if (!sessionMatch) {
    console.log('  No session ID found — likely 0 results');
    return null;
  }

  const sessionId = sessionMatch[1];

  // Extract hit count: <strong>22,328</strong> search results <strong>4,576</strong> documents
  const hitsMatch = html.match(/<strong>([\d,]+)<\/strong>\s*search results\s*<strong>([\d,]+)<\/strong>\s*documents/i);
  const totalHits = hitsMatch ? parseInt(hitsMatch[1].replace(/,/g, ''), 10) : 0;
  const totalDocs = hitsMatch ? parseInt(hitsMatch[2].replace(/,/g, ''), 10) : 0;

  console.log(`  Found: ${totalHits.toLocaleString()} hits in ${totalDocs.toLocaleString()} documents (session: ${sessionId.slice(0, 8)}...)`);

  return { sessionId, totalHits, totalDocs };
}

/**
 * Fetch search result list page to extract document metadata.
 * ISYS uses /isysquery/{sessionId}/{start}-{end}/list/ for paginated results.
 * Returns array of { docNum, title, speaker, party, date, house }
 */
async function fetchResultList(sessionId, start, end) {
  const url = `${HANSARD_BASE}/isysquery/${sessionId}/${start}-${end}/list/`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
      'Accept': 'text/html',
    },
  });

  if (!resp.ok) {
    console.error(`  Failed to fetch result list ${start}-${end}: HTTP ${resp.status}`);
    return [];
  }

  const html = await resp.text();
  const results = [];

  // Parse result entries from the HTML
  // Each result has a link like /isysquery/{sessionId}/{docNum}/doc/
  // and metadata including title, member, party, date, house
  const docLinkRegex = /isysquery\/[^/]+\/(\d+)\/doc\//g;
  const docNums = new Set();
  let m;
  while ((m = docLinkRegex.exec(html)) !== null) {
    docNums.add(parseInt(m[1], 10));
  }

  // For each doc number, try to extract surrounding metadata
  // The results page typically has structured data near each link
  for (const docNum of docNums) {
    results.push({ docNum });
  }

  return results;
}

/**
 * Fetch an individual Hansard document and extract its content.
 * Document URL: /isysquery/{sessionId}/{docNum}/doc/
 *
 * VIC Hansard pages embed metadata as <meta> tags inside the speech-content div:
 *   <meta name="MemberName" content="Enver Erdogan" />
 *   <meta name="MemberParty" content="ALP" />
 *   <meta name="SittingDate" content="19 March 2026" />
 *   <meta name="HouseName" content="COUNCIL" />
 *   <meta name="SpeechTitle" content="JUSTICE LEGISLATION..." />
 *   <meta name="ActivityType" content="Second reading" />
 * The speech body is in <p> tags after the meta tags.
 *
 * Returns { title, speaker, party, date, house, bodyText, activityType }
 */
async function fetchDocument(sessionId, docNum) {
  const url = `${HANSARD_BASE}/isysquery/${sessionId}/${docNum}/doc/`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
      'Accept': 'text/html',
    },
  });

  if (!resp.ok) {
    return null;
  }

  const html = await resp.text();

  // Extract metadata from <meta> tags inside speech-content
  function getMeta(name) {
    const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i');
    const m = html.match(re);
    return m ? m[1].trim() : null;
  }

  const title = getMeta('SpeechTitle') || '';
  const speaker = getMeta('MemberName') || null;
  const party = getMeta('MemberParty') || null;
  const activityType = getMeta('ActivityType') || null;
  const sittingDateRaw = getMeta('SittingDate') || null;
  const houseRaw = getMeta('HouseName') || null;

  // Parse house
  let house = null;
  if (houseRaw) {
    house = houseRaw.toLowerCase().includes('council') ? 'legislative_council' : 'legislative_assembly';
  }

  // Parse sitting date from "19 March 2026" format
  let sittingDate = null;
  if (sittingDateRaw) {
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const dateMatch = sittingDateRaw.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
    if (dateMatch) {
      const month = months[dateMatch[2].toLowerCase()] || '01';
      sittingDate = `${dateMatch[3]}-${month}-${dateMatch[1].padStart(2, '0')}`;
    }
  }

  // Extract body text from <p> tags within the speech-content div
  const speechContentMatch = html.match(/<div[^>]*class="speech-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/td>/i);
  let bodyText = '';
  if (speechContentMatch) {
    // Extract text from <p> tags within the speech content
    const pTags = speechContentMatch[1].match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    bodyText = pTags.map(p => stripHtml(p)).join('\n\n');
  }

  // Fallback: try extracting all <p> content after the metadata meta tags
  if (!bodyText || bodyText.length < 100) {
    const afterMeta = html.split(/SpeechTitle/i).pop() || '';
    const pTags = afterMeta.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    bodyText = pTags.map(p => stripHtml(p)).join('\n\n');
  }

  // Cap at 50K chars
  bodyText = bodyText.slice(0, 50000);

  if (!bodyText || bodyText.length < 100) return null;

  return {
    title: title || activityType || 'Unknown',
    speaker,
    party,
    house,
    sittingDate,
    activityType,
    bodyText,
    sourceUrl: url,
  };
}

async function getExistingUrls() {
  const { data, error } = await supabase
    .from('civic_hansard').select('source_url').eq('jurisdiction', 'VIC');
  if (error) { console.error('Error fetching existing URLs:', error.message); return new Set(); }
  return new Set((data || []).map((r) => r.source_url));
}

async function main() {
  console.log('=== VIC Hansard Scraper (ISYS Search) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Max results per phrase: ${MAX_RESULTS}${FILTER_YEAR ? ` | Year: ${FILTER_YEAR}` : ''}\n`);

  const existingUrls = await getExistingUrls();
  console.log(`Existing VIC Hansard records: ${existingUrls.size}\n`);

  const stats = {
    phrases_searched: 0,
    docs_found: 0,
    docs_fetched: 0,
    yj_relevant: 0,
    new: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
  };

  const toInsert = [];
  const seenUrls = new Set();

  for (const phrase of SEARCH_PHRASES) {
    stats.phrases_searched++;
    await sleep(1500);

    const searchResult = await searchHansard(phrase);
    if (!searchResult) continue;

    const { sessionId, totalDocs } = searchResult;

    // If filtering by year, apply metafilter
    let effectiveSessionId = sessionId;
    if (FILTER_YEAR) {
      // The metafilter URL changes the result set
      const filterUrl = `${HANSARD_BASE}/isysquery/${sessionId}/1-10/metafilter/SittingYear/${FILTER_YEAR}/`;
      try {
        const resp = await fetch(filterUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0)' },
        });
        if (resp.ok) {
          const filterHtml = await resp.text();
          const newSession = filterHtml.match(/isysquery\/([a-f0-9-]{36})\//i);
          if (newSession) {
            effectiveSessionId = newSession[1];
            console.log(`  Filtered to year ${FILTER_YEAR} (new session: ${effectiveSessionId.slice(0, 8)}...)`);
          }
        }
      } catch {
        console.log(`  Could not apply year filter`);
      }
      await sleep(1000);
    }

    // Fetch result lists in batches of 10
    const docsToFetch = Math.min(totalDocs, MAX_RESULTS);
    const batchSize = 10;

    for (let start = 1; start <= docsToFetch; start += batchSize) {
      const end = Math.min(start + batchSize - 1, docsToFetch);
      await sleep(1000);

      const resultList = await fetchResultList(effectiveSessionId, start, end);
      stats.docs_found += resultList.length;

      for (const result of resultList) {
        const docUrl = `${HANSARD_BASE}/isysquery/${effectiveSessionId}/${result.docNum}/doc/`;

        if (existingUrls.has(docUrl) || seenUrls.has(docUrl)) {
          stats.skipped++;
          continue;
        }

        await sleep(800);

        const doc = await fetchDocument(effectiveSessionId, result.docNum);
        stats.docs_fetched++;

        if (!doc) {
          continue;
        }

        // Check YJ relevance
        if (!YJ_KEYWORDS_RE.test(doc.bodyText) && !YJ_KEYWORDS_RE.test(doc.title || '')) {
          continue;
        }

        stats.yj_relevant++;

        // Validate sitting date
        let validDate = doc.sittingDate;
        if (validDate && !/^\d{4}-\d{2}-\d{2}$/.test(validDate)) {
          validDate = null;
        }

        const record = {
          subject: doc.title || doc.activityType || 'VIC Parliamentary Debate',
          body_text: doc.bodyText,
          speaker_name: doc.speaker || null,
          speaker_party: doc.party || null,
          speech_type: doc.house || 'legislative_assembly',
          sitting_date: validDate || new Date().toISOString().split('T')[0],
          source_url: doc.sourceUrl,
          jurisdiction: 'VIC',
          scraped_at: new Date().toISOString(),
        };

        seenUrls.add(doc.sourceUrl);
        toInsert.push(record);
        stats.new++;
        console.log(`    + ${validDate || '?'} | ${doc.speaker || '?'} (${doc.party || '?'}) | ${(doc.title || '').slice(0, 60)}`);
      }
    }
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records:');
    for (const rec of toInsert.slice(0, 10)) {
      console.log(`  ${rec.sitting_date} | ${rec.speaker_name || '?'} | ${rec.speech_type} | ${rec.subject?.slice(0, 60)}`);
      console.log(`    ${rec.body_text.slice(0, 120)}...`);
    }
  } else if (toInsert.length > 0) {
    // Insert one by one to handle dedup constraint gracefully
    for (const record of toInsert) {
      const { error } = await supabase
        .from('civic_hansard')
        .insert(record);
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          stats.skipped++;
        } else {
          console.error(`  Insert error: ${error.message}`);
          stats.errors++;
        }
      } else {
        stats.inserted++;
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Phrases searched: ${stats.phrases_searched}`);
  console.log(`  Documents found: ${stats.docs_found}`);
  console.log(`  Documents fetched: ${stats.docs_fetched}`);
  console.log(`  YJ-relevant: ${stats.yj_relevant}`);
  console.log(`  New: ${stats.new}`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Skipped (existing): ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
