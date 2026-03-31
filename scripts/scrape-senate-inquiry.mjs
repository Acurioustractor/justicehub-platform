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
// Firecrawl client
// ---------------------------------------------------------------------------

async function firecrawlScrape(url, apiKey, formats = ['markdown']) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl error ${response.status}: ${text}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Firecrawl scrape failed: ${JSON.stringify(result)}`);
  }
  return result.data;
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
 * Extract submission links from the Submissions markdown page.
 * APH submissions are hosted as PDFs in DocumentStore or similar.
 */
export function extractSubmissionLinks(markdown) {
  const submissions = [];

  // Pattern: markdown links to PDFs or DocumentStore
  // [Submission 1 - Organisation Name](https://www.aph.gov.au/.../DocumentStore/...)
  const submissionRegex = /\[([^\]]*(?:submission|sub)[^\]]*)\]\((https?:\/\/[^)]+)\)/gi;
  for (const match of markdown.matchAll(submissionRegex)) {
    const label = match[1].trim();
    const url = match[2].trim();
    submissions.push({ label, url });
  }

  // Also look for numbered submission patterns without "submission" keyword
  // [1 - Organisation Name](url)  or  [001 - Organisation Name](url)
  const numberedRegex = /\[(\d{1,3})\s*[-\u2013]\s*([^\]]+)\]\((https?:\/\/[^)]+\.pdf[^)]*)\)/gi;
  for (const match of markdown.matchAll(numberedRegex)) {
    const url = match[3].trim();
    if (!submissions.some(s => s.url === url)) {
      submissions.push({
        label: `Submission ${match[1]} - ${match[2].trim()}`,
        url,
      });
    }
  }

  // Generic PDF links from aph.gov.au
  const aphPdfRegex = /\[([^\]]+)\]\((https?:\/\/www\.aph\.gov\.au[^)]+\.pdf[^)]*)\)/gi;
  for (const match of markdown.matchAll(aphPdfRegex)) {
    const url = match[2].trim();
    if (!submissions.some(s => s.url === url)) {
      submissions.push({ label: match[1].trim(), url });
    }
  }

  return submissions;
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
  console.log('\n--- Scraping Transcripts ---');
  console.log(`Fetching hearings page: ${HEARINGS_URL}`);

  let hearingsMarkdown;
  try {
    const data = await firecrawlScrape(HEARINGS_URL, env.FIRECRAWL_API_KEY);
    hearingsMarkdown = data.markdown;
  } catch (err) {
    console.error(`Failed to fetch hearings page: ${err.message}`);
    stats.errors++;
    return;
  }

  if (!hearingsMarkdown) {
    console.log('No content returned from hearings page');
    return;
  }

  console.log(`Hearings page: ${hearingsMarkdown.length} chars`);

  const transcriptLinks = extractTranscriptLinks(hearingsMarkdown);
  console.log(`Found ${transcriptLinks.length} transcript links`);

  if (transcriptLinks.length === 0) {
    console.log('No transcript links found. The page structure may have changed.');
    console.log('First 500 chars of markdown:');
    console.log(hearingsMarkdown.slice(0, 500));
    return;
  }

  const existingUrls = await getExistingHansardUrls(supabase);
  console.log(`Existing senate_committee records: ${existingUrls.size}`);

  for (const link of transcriptLinks) {
    console.log(`\nProcessing: ${link.label}`);
    console.log(`  URL: ${link.url}`);

    const hearingDate = extractDateFromText(link.label) || extractDateFromText(link.url);
    console.log(`  Date: ${hearingDate || 'unknown'}`);

    await sleep(RATE_LIMIT_MS);

    let transcriptMarkdown;
    try {
      const data = await firecrawlScrape(link.url, env.FIRECRAWL_API_KEY);
      transcriptMarkdown = data.markdown;
    } catch (err) {
      console.error(`  Failed to fetch transcript: ${err.message}`);
      stats.errors++;
      continue;
    }

    if (!transcriptMarkdown) {
      console.log('  No content in transcript');
      continue;
    }

    console.log(`  Transcript: ${transcriptMarkdown.length} chars`);
    stats.transcripts_fetched++;

    // Also try to extract date from transcript content itself
    const effectiveDate = hearingDate || extractDateFromText(transcriptMarkdown.slice(0, 500));

    const segments = parseTranscriptSegments(transcriptMarkdown, effectiveDate);
    console.log(`  Parsed ${segments.length} testimony segments`);

    for (const seg of segments) {
      // Build a unique-ish source URL per segment
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

async function scrapeSubmissions(env, supabase, stats) {
  console.log('\n--- Scraping Submissions ---');
  console.log(`Fetching submissions page: ${SUBMISSIONS_URL}`);

  let submissionsMarkdown;
  try {
    const data = await firecrawlScrape(SUBMISSIONS_URL, env.FIRECRAWL_API_KEY);
    submissionsMarkdown = data.markdown;
  } catch (err) {
    console.error(`Failed to fetch submissions page: ${err.message}`);
    stats.errors++;
    return;
  }

  if (!submissionsMarkdown) {
    console.log('No content returned from submissions page');
    return;
  }

  console.log(`Submissions page: ${submissionsMarkdown.length} chars`);

  const submissionLinks = extractSubmissionLinks(submissionsMarkdown);
  console.log(`Found ${submissionLinks.length} submission links`);

  if (submissionLinks.length === 0) {
    console.log('No submission links found. The page structure may have changed.');
    console.log('First 500 chars of markdown:');
    console.log(submissionsMarkdown.slice(0, 500));
    return;
  }

  const existingSources = await getExistingFindingSources(supabase);
  console.log(`Existing parliamentary finding sources: ${existingSources.size}`);

  for (const sub of submissionLinks) {
    console.log(`\nProcessing: ${sub.label}`);
    console.log(`  URL: ${sub.url}`);

    if (existingSources.has(sub.url)) {
      console.log('  Already exists, skipping');
      stats.skipped++;
      continue;
    }

    await sleep(RATE_LIMIT_MS);

    let pdfText;
    try {
      const data = await firecrawlScrape(sub.url, env.FIRECRAWL_API_KEY);
      pdfText = data.markdown;
    } catch (err) {
      console.error(`  Failed to extract PDF: ${err.message}`);
      stats.errors++;
      continue;
    }

    if (!pdfText || pdfText.length < 50) {
      console.log(`  Insufficient content (${pdfText?.length || 0} chars)`);
      continue;
    }

    console.log(`  Extracted: ${pdfText.length} chars`);
    stats.submissions_fetched++;

    const submitter = extractSubmitterName(sub.label);

    const record = {
      finding_type: 'parliamentary',
      content: {
        text: pdfText,
        submitter: submitter,
        inquiry: 'Senate Legal and Constitutional Affairs Committee - Youth Justice 2025',
        source_label: sub.label,
      },
      sources: [sub.url],
      confidence: 0.9, // High confidence — official parliamentary submission
    };

    if (DRY_RUN) {
      console.log(`  [DRY] ${submitter} | ${pdfText.length} chars`);
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

  if (!env.FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not set');
    process.exit(1);
  }
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
