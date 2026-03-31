#!/usr/bin/env node
/**
 * scrape-qld-hansard.mjs — Scrapes QLD Parliament Hansard PDFs for youth
 * justice speeches and stores them in civic_hansard (jurisdiction='QLD').
 *
 * Uses predictable PDF URLs at:
 *   https://documents.parliament.qld.gov.au/events/han/{YYYY}/{YYYY_MM_DD}_DAILY.pdf
 *
 * Requires: FIRECRAWL_API_KEY env var (for PDF text extraction)
 *
 * Usage:
 *   node scripts/scrape-qld-hansard.mjs [--dry-run] [--days=90] [--limit=N]
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const daysArg = args.find((a) => a.startsWith('--days='));
const DAYS_BACK = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const YJ_KEYWORDS_RE = /youth justice|juvenile|detention|bail|raising the age|child protection|custody|remand|incarceration|first nations|aboriginal|indigenous|young people|young offender|watch house|youth crime|don dale/i;

const PDF_BASE = 'https://documents.parliament.qld.gov.au/events/han';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Generate list of potential sitting dates (weekdays only) within lookback window.
 */
function generateDateCandidates(daysBack) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    if (day >= 1 && day <= 5) { // weekdays
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        pdfKey: `${yyyy}_${mm}_${dd}`,
        year: yyyy,
      });
    }
  }
  return dates;
}

/**
 * Check if a PDF exists at the given URL (HEAD request).
 */
async function pdfExists(url) {
  try {
    const resp = await fetch(url, { method: 'HEAD' });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Extract text from a PDF using Firecrawl API.
 */
async function extractPdfText(url) {
  const apiKey = env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY required for PDF extraction');

  const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Firecrawl ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.data?.markdown || data.data?.content || '';
}

/**
 * Split a full Hansard day into individual speeches/sections.
 * Looks for speaker patterns and topic headings.
 */
function splitIntoSpeeches(text, sittingDate) {
  const speeches = [];

  // Split on speaker patterns: "Mr/Mrs/Ms/Dr LASTNAME (Electorate—Party) (Role):"
  // or "Hon. FIRSTNAME LASTNAME:"
  const speakerPattern = /\n((?:(?:Mr|Mrs|Ms|Dr|Hon\.)[\s.]+)?[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)*)\s*(?:\(([^)]+)\))?\s*(?:\(([^)]+)\))?\s*:/g;

  let lastIndex = 0;
  let lastSpeaker = null;
  let lastElectorate = null;
  let lastParty = null;
  let match;

  // Find section headings for subjects
  const sectionPattern = /\n#{1,3}\s+(.+)/g;
  const sections = [];
  let sMatch;
  while ((sMatch = sectionPattern.exec(text)) !== null) {
    sections.push({ index: sMatch.index, title: sMatch[1].trim() });
  }

  function getCurrentSection(idx) {
    let current = 'General Debate';
    for (const s of sections) {
      if (s.index <= idx) current = s.title;
      else break;
    }
    return current;
  }

  while ((match = speakerPattern.exec(text)) !== null) {
    if (lastSpeaker && match.index - lastIndex > 100) {
      const bodyText = text.slice(lastIndex, match.index).trim();
      if (bodyText.length > 50 && YJ_KEYWORDS_RE.test(bodyText)) {
        speeches.push({
          subject: getCurrentSection(lastIndex),
          body_text: bodyText.slice(0, 50000),
          speaker_name: lastSpeaker,
          speaker_party: lastParty,
          speaker_electorate: lastElectorate,
          speech_type: 'legislative_assembly',
          sitting_date: sittingDate,
          jurisdiction: 'QLD',
          scraped_at: new Date().toISOString(),
        });
      }
    }

    lastSpeaker = match[1].trim();
    // Parse electorate and party from parenthetical groups
    const group1 = match[2] || '';
    const group2 = match[3] || '';
    if (group1.includes('—')) {
      const parts = group1.split('—');
      lastElectorate = parts[0].trim();
      lastParty = parts[1]?.trim() || null;
    } else {
      lastElectorate = group1 || null;
      lastParty = group2 || null;
    }
    lastIndex = match.index + match[0].length;
  }

  // Capture last speech
  if (lastSpeaker && text.length - lastIndex > 100) {
    const bodyText = text.slice(lastIndex).trim();
    if (bodyText.length > 50 && YJ_KEYWORDS_RE.test(bodyText)) {
      speeches.push({
        subject: getCurrentSection(lastIndex),
        body_text: bodyText.slice(0, 50000),
        speaker_name: lastSpeaker,
        speaker_party: lastParty,
        speaker_electorate: lastElectorate,
        speech_type: 'legislative_assembly',
        sitting_date: sittingDate,
        jurisdiction: 'QLD',
        scraped_at: new Date().toISOString(),
      });
    }
  }

  // If no speaker splits found, try treating the whole doc as one entry
  if (speeches.length === 0 && YJ_KEYWORDS_RE.test(text)) {
    // Extract YJ-relevant paragraphs
    const paragraphs = text.split(/\n{2,}/);
    const yjParagraphs = paragraphs.filter((p) => YJ_KEYWORDS_RE.test(p) && p.length > 100);
    if (yjParagraphs.length > 0) {
      speeches.push({
        subject: 'QLD Parliament — Youth Justice Debate',
        body_text: yjParagraphs.join('\n\n').slice(0, 50000),
        speaker_name: null,
        speaker_party: null,
        speaker_electorate: null,
        speech_type: 'legislative_assembly',
        sitting_date: sittingDate,
        jurisdiction: 'QLD',
        scraped_at: new Date().toISOString(),
      });
    }
  }

  return speeches;
}

async function getExistingDates() {
  const { data, error } = await supabase
    .from('civic_hansard')
    .select('sitting_date')
    .eq('jurisdiction', 'QLD');
  if (error) { console.error('Error:', error.message); return new Set(); }
  return new Set((data || []).map((r) => r.sitting_date));
}

async function main() {
  console.log('=== QLD Hansard Scraper (PDF extraction) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Days: ${DAYS_BACK} | Limit: ${LIMIT}\n`);

  if (!env.FIRECRAWL_API_KEY) {
    console.error('Error: FIRECRAWL_API_KEY required');
    process.exit(1);
  }

  const existingDates = await getExistingDates();
  console.log(`Existing QLD Hansard dates: ${existingDates.size}\n`);

  const candidates = generateDateCandidates(DAYS_BACK);
  const stats = { checked: 0, pdfs_found: 0, speeches: 0, inserted: 0, errors: 0 };
  const allSpeeches = [];

  for (const { dateStr, pdfKey, year } of candidates) {
    if (allSpeeches.length >= LIMIT) break;

    // Check both DAILY and WEEKLY variants
    for (const suffix of ['DAILY', 'WEEKLY']) {
      const url = `${PDF_BASE}/${year}/${pdfKey}_${suffix}.pdf`;
      stats.checked++;

      const exists = await pdfExists(url);
      if (!exists) continue;

      stats.pdfs_found++;
      console.log(`Found: ${pdfKey}_${suffix}.pdf`);

      // Skip if we already have speeches from this date
      if (existingDates.has(dateStr)) {
        console.log(`  -> Already scraped ${dateStr}, skipping`);
        continue;
      }

      try {
        console.log(`  -> Extracting text...`);
        await sleep(2000);
        const text = await extractPdfText(url);
        console.log(`  -> Got ${text.length} chars`);

        if (text.length < 100) {
          console.log(`  -> Too short, skipping`);
          continue;
        }

        const speeches = splitIntoSpeeches(text, dateStr);
        console.log(`  -> ${speeches.length} YJ speeches found`);

        for (const speech of speeches) {
          speech.source_url = url;
          allSpeeches.push(speech);
          stats.speeches++;
          console.log(`    + ${speech.speaker_name || '?'} | ${speech.subject?.slice(0, 60)}`);
        }
      } catch (err) {
        console.error(`  -> Error: ${err.message}`);
        stats.errors++;
      }

      break; // Don't scrape both DAILY and WEEKLY for same date
    }
  }

  console.log(`\nTotal speeches to insert: ${allSpeeches.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample:');
    for (const s of allSpeeches.slice(0, 5)) {
      console.log(`  ${s.sitting_date} | ${s.speaker_name || '?'} | ${s.subject?.slice(0, 60)}`);
    }
  } else if (allSpeeches.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < allSpeeches.length; i += BATCH) {
      const batch = allSpeeches.slice(i, i + BATCH);
      const { error } = await supabase.from('civic_hansard').insert(batch);
      if (error) {
        console.error(`  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
        stats.errors += batch.length;
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Dates checked: ${stats.checked}`);
  console.log(`  PDFs found: ${stats.pdfs_found}`);
  console.log(`  YJ speeches: ${stats.speeches}`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
