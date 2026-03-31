#!/usr/bin/env node
/**
 * scrape-senate-inquiry.mjs
 *
 * Scrapes the Senate Legal and Constitutional Affairs Committee inquiry
 * into Youth Justice 2025 — transcripts and submissions.
 *
 * Data sources:
 *   - Public_Hearings page: transcript links (Hansard Display)
 *   - Submissions page: written submission PDFs
 *
 * Targets:
 *   - civic_hansard: testimony from public hearings
 *   - alma_research_findings: submission content
 *
 * Usage:
 *   node scripts/scrape-senate-inquiry.mjs --dry-run
 *   node scripts/scrape-senate-inquiry.mjs --mode=transcripts
 *   node scripts/scrape-senate-inquiry.mjs --mode=submissions
 *   node scripts/scrape-senate-inquiry.mjs --mode=all
 *   node scripts/scrape-senate-inquiry.mjs --test
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config & env
// ---------------------------------------------------------------------------

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    const p = join(__dirname, '..', f);
    if (existsSync(p)) {
      readFileSync(p, 'utf8').split('\n').forEach(line => {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)$/);
        if (m) { const [, key, val] = m; if (!env[key]) env[key] = val; }
      });
    }
  }
  return env;
}

const INQUIRY_BASE = 'https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Legal_and_Constitutional_Affairs/YouthJustice2025';
const HEARINGS_URL = `${INQUIRY_BASE}/Public_Hearings`;
const SUBMISSIONS_URL = `${INQUIRY_BASE}/Submissions`;

const RATE_LIMIT_MS = 2000;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RUN_TESTS = args.includes('--test');
const modeArg = args.find(a => a.startsWith('--mode='));
const MODE = modeArg ? modeArg.split('=')[1] : 'all'; // transcripts | submissions | all

// ---------------------------------------------------------------------------
// Direct HTML fetching (no Firecrawl dependency)
// ---------------------------------------------------------------------------

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function fetchPdfBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
      'Accept': 'application/pdf,*/*',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

let getDocumentFn;
async function extractPdfText(buffer) {
  if (!getDocumentFn) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.mjs');
    getDocumentFn = mod.getDocument;
  }
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = getDocumentFn({ data: uint8Array, useSystemFonts: true });
  const doc = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText.trim();
}

// ---------------------------------------------------------------------------
// HTML / text parsing utilities
// ---------------------------------------------------------------------------

export function stripHtml(html) {
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

/**
 * Extract transcript links from the Public Hearings markdown page.
 * APH committee hearing pages link to Hansard Display pages like:
 *   https://parlinfo.aph.gov.au/parlInfo/search/display/display.w3p;...
 * or direct committee Hansard links.
 *
 * Also extracts hearing dates from the page context.
 */
export function extractTranscriptLinks(markdown) {
  const links = [];

  // Pattern 1: Markdown links to parlinfo Hansard Display
  // [Transcript text](https://parlinfo.aph.gov.au/...)
  const parlInfoRegex = /\[([^\]]*(?:transcript|hansard|proof)[^\]]*)\]\((https?:\/\/parlinfo\.aph\.gov\.au[^)]+)\)/gi;
  for (const match of markdown.matchAll(parlInfoRegex)) {
    links.push({ label: match[1].trim(), url: match[2].trim() });
  }

  // Pattern 2: Direct Hansard links on aph.gov.au
  const aphHansardRegex = /\[([^\]]*(?:transcript|hansard|proof)[^\]]*)\]\((https?:\/\/www\.aph\.gov\.au[^)]*[Hh]ansard[^)]*)\)/gi;
  for (const match of markdown.matchAll(aphHansardRegex)) {
    links.push({ label: match[1].trim(), url: match[2].trim() });
  }

  // Pattern 3: Generic markdown links containing "Hansard" or "Transcript" in URL
  const genericRegex = /\[([^\]]+)\]\((https?:\/\/[^)]*(?:hansard|transcript)[^)]*)\)/gi;
  for (const match of markdown.matchAll(genericRegex)) {
    const url = match[2].trim();
    // Avoid duplicates
    if (!links.some(l => l.url === url)) {
      links.push({ label: match[1].trim(), url });
    }
  }

  // Pattern 4: Bare parlinfo URLs (not in markdown links)
  const bareUrlRegex = /(https?:\/\/parlinfo\.aph\.gov\.au\/parlInfo\/search\/display\/display\.w3p[^\s)]*)/gi;
  for (const match of markdown.matchAll(bareUrlRegex)) {
    const url = match[1].trim();
    if (!links.some(l => l.url === url)) {
      links.push({ label: 'Transcript', url });
    }
  }

  return links;
}

/**
 * Extract hearing date from a transcript link label or surrounding context.
 * Labels often contain dates like "14 March 2025" or "2025-03-14".
 */
export function extractDateFromText(text) {
  // Pattern: "14 March 2025" or "3 February 2026"
  const longDateRegex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i;
  const longMatch = text.match(longDateRegex);
  if (longMatch) {
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const day = longMatch[1].padStart(2, '0');
    const month = months[longMatch[2].toLowerCase()];
    const year = longMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern: "2025-03-14" ISO date
  const isoRegex = /(\d{4}-\d{2}-\d{2})/;
  const isoMatch = text.match(isoRegex);
  if (isoMatch) return isoMatch[1];

  // Pattern: "14/03/2025" AU date format
  const auRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const auMatch = text.match(auRegex);
  if (auMatch) {
    return `${auMatch[3]}-${auMatch[2].padStart(2, '0')}-${auMatch[1].padStart(2, '0')}`;
  }

  return null;
}

/**
 * Parse a committee transcript (markdown) into individual testimony segments.
 *
 * Committee transcripts follow a pattern:
 * - Witness headers: bold name + organization
 * - Testimony blocks under each witness
 * - CHAIR / Senator X interjections
 *
 * Returns array of { speaker_name, organization, testimony, hearing_date }
 */
export function parseTranscriptSegments(markdown, hearingDate) {
  const segments = [];
  if (!markdown) return segments;

  // Split into lines for processing
  const lines = markdown.split('\n');

  let currentSpeaker = null;
  let currentOrg = null;
  let currentText = [];

  // Patterns for speaker identification in committee transcripts
  // "**Mr John Smith**, Chief Executive, Some Organisation"
  // "**Senator SMITH**:"
  // "CHAIR (Senator Jones):"
  // "Mr Smith:" or "Ms Jones:" at start of line
  const witnessHeaderRegex = /^\*{0,2}((?:Mr|Ms|Mrs|Dr|Prof|Professor|Senator|The Hon|Hon)\s+[A-Z][a-zA-Z\s'-]+?)\*{0,2}(?:\s*,\s*(.+?))?(?:\s*,\s*(?:gave evidence|was examined|appeared))?$/;
  const speakerLineRegex = /^(?:\*{0,2})((?:CHAIR|(?:Senator|Mr|Ms|Mrs|Dr|Prof)\s+[A-Z][A-Za-z'-]+?))\*{0,2}\s*(?:\([^)]*\))?\s*[:\u2014-]/;

  // Also detect witness introduction blocks:
  // "SMITH, Mr John, Chief Executive, Organisation Name"
  const witnessIntroRegex = /^([A-Z][A-Z'-]+),\s+((?:Mr|Ms|Mrs|Dr|Prof|Professor)\s+[\w\s]+?)(?:\s*,\s*(.+))?$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for witness introduction format (SURNAME, Title Firstname, Role, Org)
    const introMatch = trimmed.match(witnessIntroRegex);
    if (introMatch) {
      // Flush previous segment
      if (currentSpeaker && currentText.length > 0) {
        segments.push({
          speaker_name: currentSpeaker,
          organization: currentOrg,
          testimony: currentText.join('\n').trim(),
          hearing_date: hearingDate,
        });
      }
      currentSpeaker = `${introMatch[2]} ${introMatch[1].charAt(0)}${introMatch[1].slice(1).toLowerCase()}`;
      currentOrg = introMatch[3] || null;
      currentText = [];
      continue;
    }

    // Check for speaker change (Senator X: or Mr Smith:)
    const speakerMatch = trimmed.match(speakerLineRegex);
    if (speakerMatch) {
      // Flush previous segment
      if (currentSpeaker && currentText.length > 0) {
        segments.push({
          speaker_name: currentSpeaker,
          organization: currentOrg,
          testimony: currentText.join('\n').trim(),
          hearing_date: hearingDate,
        });
      }
      currentSpeaker = speakerMatch[1].replace(/\*+/g, '').trim();
      // Senators and CHAIR don't have orgs — they're committee members
      if (currentSpeaker.startsWith('Senator') || currentSpeaker === 'CHAIR') {
        currentOrg = 'Senate Committee';
      } else {
        currentOrg = null;
      }
      // The rest of the line after the colon is testimony
      const afterColon = trimmed.replace(speakerLineRegex, '').trim();
      currentText = afterColon ? [afterColon] : [];
      continue;
    }

    // Check for witness header (bold name with org)
    const headerMatch = trimmed.match(witnessHeaderRegex);
    if (headerMatch) {
      if (currentSpeaker && currentText.length > 0) {
        segments.push({
          speaker_name: currentSpeaker,
          organization: currentOrg,
          testimony: currentText.join('\n').trim(),
          hearing_date: hearingDate,
        });
      }
      currentSpeaker = headerMatch[1].replace(/\*+/g, '').trim();
      currentOrg = headerMatch[2] || null;
      currentText = [];
      continue;
    }

    // Accumulate text for current speaker
    if (currentSpeaker) {
      currentText.push(trimmed);
    }
  }

  // Flush final segment
  if (currentSpeaker && currentText.length > 0) {
    segments.push({
      speaker_name: currentSpeaker,
      organization: currentOrg,
      testimony: currentText.join('\n').trim(),
      hearing_date: hearingDate,
    });
  }

  return segments;
}

/**
 * Extract submission links from APH submissions page HTML.
 * Each row: <td>number</td><td><strong>Name</strong>&nbsp;<a href="/DocumentStore.ashx?...">PDF</a></td>
 */
export function extractSubmissionLinks(html) {
  const submissions = [];

  // Parse table rows with submission number, name, and PDF link
  // Pattern: <td>NUMBER</td><td><strong>NAME</strong>&nbsp;<a ... href="URL">
  const rowRegex = /<td>(\d{1,3})<\/td>\s*<td>\s*<strong>([^<]+)<\/strong>[^]*?<a[^>]*href="([^"]*DocumentStore[^"]*)"[^>]*>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const number = match[1].trim();
    const name = match[2].trim();
    const pdfPath = match[3].trim();
    const pdfUrl = pdfPath.startsWith('http') ? pdfPath : `https://www.aph.gov.au${pdfPath}`;

    // Avoid duplicate entries (same URL)
    if (!submissions.some(s => s.url === pdfUrl)) {
      submissions.push({
        label: `Submission ${number} - ${name}`,
        url: pdfUrl,
        number: parseInt(number, 10),
        submitter: name,
      });
    }
  }

  return submissions;
}

/**
 * Extract ASP.NET __doPostBack parameters for pagination.
 * Returns { viewState, viewStateGenerator, eventValidation } needed for POST.
 */
function extractAspNetState(html) {
  const vs = html.match(/id="__VIEWSTATE"[^>]*value="([^"]*)"/);
  const vsg = html.match(/id="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/);
  const ev = html.match(/id="__EVENTVALIDATION"[^>]*value="([^"]*)"/);
  return {
    viewState: vs ? vs[1] : '',
    viewStateGenerator: vsg ? vsg[1] : '',
    eventValidation: ev ? ev[1] : '',
  };
}

/**
 * Fetch all pages of submissions from APH using ASP.NET postback pagination.
 * Page 1 is a GET, pages 2+ require POST with ViewState.
 */
async function fetchAllSubmissionPages() {
  const allSubmissions = [];
  const seenUrls = new Set();

  console.log('  Fetching page 1...');
  let html = await fetchHtml(SUBMISSIONS_URL);
  let pageSubs = extractSubmissionLinks(html);
  console.log(`    Page 1: ${pageSubs.length} submissions`);
  for (const s of pageSubs) {
    if (!seenUrls.has(s.url)) { seenUrls.add(s.url); allSubmissions.push(s); }
  }

  // Extract pagination info - how many pages?
  // APH uses: "items in <strong>7</strong> pages" inside rgInfoPart div
  const pageCountMatch = html.match(/items?\s+in\s+<strong>(\d+)<\/strong>\s*pages?/i)
    || html.match(/(\d+)\s*items?\s+in\s+(\d+)\s*pages?/i);
  const totalPages = pageCountMatch ? parseInt(pageCountMatch[1], 10) : 1;
  console.log(`  Total pages: ${totalPages}`);

  // Fetch remaining pages via ASP.NET __doPostBack
  for (let page = 2; page <= totalPages; page++) {
    await sleep(RATE_LIMIT_MS);
    console.log(`  Fetching page ${page}...`);

    const aspState = extractAspNetState(html);

    // The event target for page N pager button
    // Pattern: main_0$content_1$RadGrid1$ctl00$ctl02$ctl00$ctl{NN}
    // Page 2 = ctl07, Page 3 = ctl09, Page 4 = ctl11, etc.
    const ctlNum = String(5 + (page - 1) * 2).padStart(2, '0');
    const eventTarget = `main_0$content_1$RadGrid1$ctl00$ctl02$ctl00$ctl${ctlNum}`;

    const formData = new URLSearchParams({
      '__EVENTTARGET': eventTarget,
      '__EVENTARGUMENT': '',
      '__VIEWSTATE': aspState.viewState,
      '__VIEWSTATEGENERATOR': aspState.viewStateGenerator,
      '__EVENTVALIDATION': aspState.eventValidation,
      'main_0$content_1$rbGroupBy': 'Number',
    });

    try {
      const response = await fetch(SUBMISSIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; civic-research)',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        console.error(`    Page ${page} failed: HTTP ${response.status}`);
        continue;
      }

      html = await response.text();
      pageSubs = extractSubmissionLinks(html);
      console.log(`    Page ${page}: ${pageSubs.length} submissions`);
      for (const s of pageSubs) {
        if (!seenUrls.has(s.url)) { seenUrls.add(s.url); allSubmissions.push(s); }
      }
    } catch (err) {
      console.error(`    Page ${page} error: ${err.message}`);
    }
  }

  return allSubmissions;
}

/**
 * Extract the submitter name from a submission label.
 * "Submission 1 - Australian Human Rights Commission" -> "Australian Human Rights Commission"
 * "001 - Youth Advocacy Centre" -> "Youth Advocacy Centre"
 */
export function extractSubmitterName(label) {
  // "Submission X - Name" or "Sub X - Name"
  const subMatch = label.match(/(?:submission|sub)\s*\d*\s*[-\u2013]\s*(.+)/i);
  if (subMatch) return subMatch[1].trim();

  // "X - Name" (numbered)
  const numMatch = label.match(/^\d{1,3}\s*[-\u2013]\s*(.+)/);
  if (numMatch) return numMatch[1].trim();

  return label;
}

// ---------------------------------------------------------------------------
// Self-tests (--test flag)
// ---------------------------------------------------------------------------

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  PASS: ${name}`);
      passed++;
    } else {
      console.error(`  FAIL: ${name}`);
      failed++;
    }
  }

  console.log('\n=== Running self-tests ===\n');

  // stripHtml
  assert(stripHtml('<p>Hello</p>') === 'Hello', 'stripHtml removes tags');
  assert(stripHtml('foo &amp; bar') === 'foo & bar', 'stripHtml decodes entities');
  assert(stripHtml('') === '', 'stripHtml handles empty');
  assert(stripHtml(null) === '', 'stripHtml handles null');

  // extractDateFromText
  assert(extractDateFromText('Hearing on 14 March 2025') === '2025-03-14', 'extractDate: long format');
  assert(extractDateFromText('Date: 3 February 2026') === '2026-02-03', 'extractDate: single digit day');
  assert(extractDateFromText('2025-03-14 hearing') === '2025-03-14', 'extractDate: ISO format');
  assert(extractDateFromText('14/03/2025') === '2025-03-14', 'extractDate: AU format');
  assert(extractDateFromText('no date here') === null, 'extractDate: no date returns null');

  // extractTranscriptLinks
  const mdHearings = `
## Public Hearings

- [Proof Transcript - 14 March 2025](https://parlinfo.aph.gov.au/parlInfo/search/display/display.w3p;query=Id:committees/commsen/27908/0000)
- [Hansard Transcript](https://www.aph.gov.au/some/Hansard/path)
- [Some other link](https://example.com)
  `;
  const tLinks = extractTranscriptLinks(mdHearings);
  assert(tLinks.length >= 2, `extractTranscriptLinks: found ${tLinks.length} links (expected >= 2)`);
  assert(tLinks.some(l => l.url.includes('parlinfo')), 'extractTranscriptLinks: parlinfo link found');

  // extractSubmissionLinks
  const mdSubs = `
## Submissions

- [Submission 1 - Australian Human Rights Commission](https://www.aph.gov.au/DocumentStore.ashx?id=abc123&subId=456)
- [Submission 2 - Youth Advocacy Centre](https://www.aph.gov.au/DocumentStore.ashx?id=def456.pdf)
- [3 - Legal Aid NSW](https://www.aph.gov.au/some/path/file.pdf)
  `;
  const sLinks = extractSubmissionLinks(mdSubs);
  assert(sLinks.length >= 2, `extractSubmissionLinks: found ${sLinks.length} links (expected >= 2)`);

  // extractSubmitterName
  assert(extractSubmitterName('Submission 1 - AHRC') === 'AHRC', 'extractSubmitterName: standard format');
  assert(extractSubmitterName('001 - Youth Centre') === 'Youth Centre', 'extractSubmitterName: numbered');
  assert(extractSubmitterName('Some Label') === 'Some Label', 'extractSubmitterName: fallback');

  // parseTranscriptSegments
  const transcript = `
SMITH, Mr John, Chief Executive, Youth Advocacy Centre

Senator JONES: Can you tell us about your experience?

Mr Smith: Yes, we have seen significant issues with youth detention in Queensland.
The conditions are often poor and recidivism rates remain high.

Senator JONES: What would you recommend?

Mr Smith: We recommend investing in community-based alternatives.
  `;
  const segments = parseTranscriptSegments(transcript, '2025-03-14');
  assert(segments.length >= 2, `parseTranscriptSegments: found ${segments.length} segments (expected >= 2)`);
  const smithSegments = segments.filter(s => s.speaker_name && s.speaker_name.includes('Smith'));
  assert(smithSegments.length >= 1, 'parseTranscriptSegments: found Mr Smith segments');
  const jonesSegments = segments.filter(s => s.speaker_name && s.speaker_name.includes('JONES'));
  assert(jonesSegments.length >= 1, 'parseTranscriptSegments: found Senator Jones segments');
  if (jonesSegments.length > 0) {
    assert(jonesSegments[0].organization === 'Senate Committee', 'parseTranscriptSegments: senator org is Senate Committee');
  }

  console.log(`\n=== Tests complete: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

if (RUN_TESTS) {
  runTests();
}

// ---------------------------------------------------------------------------
// Main scraping logic
// ---------------------------------------------------------------------------

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getExistingHansardUrls(supabase) {
  const { data } = await supabase
    .from('civic_hansard')
    .select('source_url')
    .eq('speech_type', 'senate_committee');
  return new Set((data || []).map(r => r.source_url));
}

async function getExistingFindingSources(supabase) {
  const { data } = await supabase
    .from('alma_research_findings')
    .select('sources')
    .eq('finding_type', 'parliamentary');
  const urls = new Set();
  for (const row of data || []) {
    if (Array.isArray(row.sources)) {
      row.sources.forEach(u => urls.add(u));
    }
  }
  return urls;
}

async function scrapeTranscripts(env, supabase, stats) {
  console.log('\n--- Scraping Transcripts (Direct HTML) ---');
  console.log(`Fetching hearings page: ${HEARINGS_URL}`);

  let hearingsHtml;
  try {
    hearingsHtml = await fetchHtml(HEARINGS_URL);
  } catch (err) {
    console.error(`Failed to fetch hearings page: ${err.message}`);
    stats.errors++;
    return;
  }

  if (!hearingsHtml) {
    console.log('No content returned from hearings page');
    return;
  }

  // Convert HTML to pseudo-markdown for the existing extractTranscriptLinks parser
  const hearingsMarkdown = stripHtml(hearingsHtml);

  // Also extract links directly from HTML href attributes
  const htmlLinks = [];
  const linkRegex = /<a[^>]*href="([^"]*(?:parlinfo|[Hh]ansard)[^"]*)"[^>]*>([^<]*(?:transcript|hansard|proof)[^<]*)<\/a>/gi;
  let m;
  while ((m = linkRegex.exec(hearingsHtml)) !== null) {
    const url = m[1].startsWith('http') ? m[1] : `https://www.aph.gov.au${m[1]}`;
    htmlLinks.push({ label: stripHtml(m[2]), url });
  }

  const transcriptLinks = [...htmlLinks, ...extractTranscriptLinks(hearingsMarkdown)];
  // Deduplicate by URL
  const seen = new Set();
  const uniqueLinks = transcriptLinks.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  console.log(`Found ${uniqueLinks.length} transcript links`);

  if (uniqueLinks.length === 0) {
    console.log('No transcript links found. The page structure may have changed.');
    return;
  }

  const existingUrls = await getExistingHansardUrls(supabase);
  console.log(`Existing senate_committee records: ${existingUrls.size}`);

  for (const link of uniqueLinks) {
    console.log(`\nProcessing: ${link.label}`);
    console.log(`  URL: ${link.url}`);

    const hearingDate = extractDateFromText(link.label) || extractDateFromText(link.url);
    console.log(`  Date: ${hearingDate || 'unknown'}`);

    await sleep(RATE_LIMIT_MS);

    let transcriptHtml;
    try {
      transcriptHtml = await fetchHtml(link.url);
    } catch (err) {
      console.error(`  Failed to fetch transcript: ${err.message}`);
      stats.errors++;
      continue;
    }

    if (!transcriptHtml) {
      console.log('  No content in transcript');
      continue;
    }

    // Convert HTML to text for segment parsing
    const transcriptText = stripHtml(transcriptHtml);
    console.log(`  Transcript: ${transcriptText.length} chars`);
    stats.transcripts_fetched++;

    const effectiveDate = hearingDate || extractDateFromText(transcriptText.slice(0, 500));

    const segments = parseTranscriptSegments(transcriptText, effectiveDate);
    console.log(`  Parsed ${segments.length} testimony segments`);

    for (const seg of segments) {
      const segUrl = `${link.url}#${encodeURIComponent(seg.speaker_name || 'unknown')}`;

      if (existingUrls.has(segUrl) || existingUrls.has(link.url)) {
        stats.skipped++;
        continue;
      }

      const record = {
        subject: `Senate Inquiry - Youth Justice - ${seg.organization || seg.speaker_name || 'Unknown'}`,
        body_text: seg.testimony,
        speaker_name: seg.speaker_name,
        speech_type: 'senate_committee',
        sitting_date: seg.hearing_date || null,
        source_url: segUrl,
        jurisdiction: 'Federal',
        scraped_at: new Date().toISOString(),
      };

      if (DRY_RUN) {
        console.log(`  [DRY] ${record.sitting_date || '?'} | ${record.speaker_name || '?'} | ${(record.subject || '').slice(0, 80)}`);
        stats.would_insert++;
      } else {
        const { error } = await supabase.from('civic_hansard').insert(record);
        if (error) {
          console.error(`  Insert error: ${error.message}`);
          stats.errors++;
        } else {
          stats.inserted++;
          existingUrls.add(segUrl);
        }
      }
    }
  }
}

// Priority submitters to scrape first
const PRIORITY_SUBMITTERS = [
  'Australian Human Rights Commission',
  'Law Council of Australia',
  'National Legal Aid',
  'National Justice Project',
  'SACOSS',
  'Anti Slavery Australia',
  'Anti-Slavery Australia',
  'Change the Record',
  'Aboriginal Legal Service',
  'Aboriginal Legal',
  'Victorian Aboriginal Legal Service',
  'North Australian Aboriginal Justice Agency',
  'Legal Aid',
  'National Aboriginal',
  'National Association of Community Legal',
  'Jesuit Social Services',
  'Queensland Family and Child Commission',
];

function isPriority(submitter) {
  const lower = (submitter || '').toLowerCase();
  return PRIORITY_SUBMITTERS.some(p => lower.includes(p.toLowerCase()));
}

async function scrapeSubmissions(env, supabase, stats) {
  console.log('\n--- Scraping Submissions (Direct HTML + PDF parsing) ---');

  let allSubmissions;
  try {
    allSubmissions = await fetchAllSubmissionPages();
  } catch (err) {
    console.error(`Failed to fetch submissions pages: ${err.message}`);
    stats.errors++;
    return;
  }

  console.log(`\nTotal submissions found: ${allSubmissions.length}`);

  if (allSubmissions.length === 0) {
    console.log('No submission links found. The page structure may have changed.');
    return;
  }

  const existingSources = await getExistingFindingSources(supabase);
  console.log(`Existing parliamentary finding sources: ${existingSources.size}`);

  // Sort: priority submitters first
  allSubmissions.sort((a, b) => {
    const ap = isPriority(a.submitter) ? 0 : 1;
    const bp = isPriority(b.submitter) ? 0 : 1;
    return ap - bp || (a.number || 0) - (b.number || 0);
  });

  const priorityCount = allSubmissions.filter(s => isPriority(s.submitter)).length;
  console.log(`Priority submitters: ${priorityCount}`);

  for (const sub of allSubmissions) {
    const priority = isPriority(sub.submitter) ? ' [PRIORITY]' : '';
    console.log(`\nProcessing: ${sub.label}${priority}`);
    console.log(`  URL: ${sub.url}`);

    if (existingSources.has(sub.url)) {
      console.log('  Already exists, skipping');
      stats.skipped++;
      continue;
    }

    await sleep(RATE_LIMIT_MS);

    let pdfText;
    try {
      const buffer = await fetchPdfBuffer(sub.url);
      pdfText = await extractPdfText(buffer);
    } catch (err) {
      console.error(`  Failed to extract PDF: ${err.message}`);
      stats.errors++;
      continue;
    }

    if (!pdfText || pdfText.length < 50) {
      console.log(`  Insufficient content (${pdfText?.length || 0} chars)`);
      continue;
    }

    // Truncate very large PDFs to 100K chars
    const text = pdfText.length > 100000 ? pdfText.slice(0, 100000) : pdfText;
    console.log(`  Extracted: ${pdfText.length} chars${pdfText.length > 100000 ? ' (truncated to 100K)' : ''}`);
    stats.submissions_fetched++;

    const submitter = sub.submitter || extractSubmitterName(sub.label);

    const record = {
      finding_type: 'parliamentary',
      content: {
        text,
        submitter,
        inquiry: 'Senate Legal and Constitutional Affairs Committee - Youth Justice 2025',
        source_label: sub.label,
        submission_number: sub.number || null,
      },
      sources: [sub.url],
      confidence: 0.9, // High confidence — official parliamentary submission
    };

    if (DRY_RUN) {
      console.log(`  [DRY] ${submitter} | ${text.length} chars`);
      stats.would_insert++;
    } else {
      const { error } = await supabase.from('alma_research_findings').insert(record);
      if (error) {
        console.error(`  Insert error: ${error.message}`);
        stats.errors++;
      } else {
        stats.inserted++;
        existingSources.add(sub.url);
      }
    }
  }
}

async function main() {
  const env = loadEnv();

  console.log('=== Senate Inquiry Scraper (Youth Justice 2025) ===');
  console.log(`Mode: ${MODE} | ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('Using direct HTML + pdf-parse (no Firecrawl dependency)\n');

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase credentials not set');
    process.exit(1);
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const stats = {
    transcripts_fetched: 0,
    submissions_fetched: 0,
    inserted: 0,
    would_insert: 0,
    skipped: 0,
    errors: 0,
  };

  if (MODE === 'transcripts' || MODE === 'all') {
    await scrapeTranscripts(env, supabase, stats);
  }

  if (MODE === 'submissions' || MODE === 'all') {
    await scrapeSubmissions(env, supabase, stats);
  }

  console.log('\n=== Complete ===');
  console.log(`  Transcripts fetched: ${stats.transcripts_fetched}`);
  console.log(`  Submissions fetched: ${stats.submissions_fetched}`);
  if (DRY_RUN) {
    console.log(`  Would insert: ${stats.would_insert}`);
  } else {
    console.log(`  Inserted: ${stats.inserted}`);
  }
  console.log(`  Skipped (existing): ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
}

if (!RUN_TESTS) {
  main().catch(err => { console.error('Fatal:', err); process.exit(1); });
}
