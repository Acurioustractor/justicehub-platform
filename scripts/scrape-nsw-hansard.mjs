#!/usr/bin/env node
/**
 * scrape-nsw-hansard.mjs — Scrapes NSW Parliament Hansard speeches about youth
 * justice and stores them in civic_hansard (jurisdiction='NSW').
 * NSW Parliament API requires no authentication.
 *
 * Usage:
 *   node scripts/scrape-nsw-hansard.mjs [--dry-run] [--limit=50]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      readFileSync(envPath, 'utf8').split('\n')
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
const API_BASE = 'https://api.parliament.nsw.gov.au/api/hansard/search';

const KEYWORDS = [
  'youth justice', 'youth detention', 'juvenile justice', 'young offender',
  'raising the age', 'age of criminal responsibility', 'Don Dale',
  'Banksia Hill', 'youth crime', 'youth diversion',
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const MAX_PER_KW = limitArg ? parseInt(limitArg.split('=')[1], 10) : 200;
const PAGE_SIZE = 20;

function stripHtml(h) {
  if (!h) return '';
  return h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

let workingPattern = null; // Cache first working endpoint pattern

async function fetchNswHansard(keyword, page = 1) {
  const skip = (page - 1) * PAGE_SIZE, kw = encodeURIComponent(keyword);
  if (workingPattern) {
    const url = workingPattern.replace('__KW__', kw).replace('__SKIP__', skip).replace('__PAGE__', page);
    try { const r = await fetch(url, { headers: { Accept: 'application/json' } }); if (r.ok) return await r.json(); } catch {}
  }
  const endpoints = [
    { url: `${API_BASE}/daily/searchResult?searchTerm=${kw}&take=${PAGE_SIZE}&skip=${skip}`,
      tpl: `${API_BASE}/daily/searchResult?searchTerm=__KW__&take=${PAGE_SIZE}&skip=__SKIP__` },
    { url: `${API_BASE}?searchTerm=${kw}&pageSize=${PAGE_SIZE}&page=${page}`,
      tpl: `${API_BASE}?searchTerm=__KW__&pageSize=${PAGE_SIZE}&page=__PAGE__` },
    { url: `${API_BASE}/daily/fragment?searchTerm=${kw}&take=${PAGE_SIZE}&skip=${skip}`,
      tpl: `${API_BASE}/daily/fragment?searchTerm=__KW__&take=${PAGE_SIZE}&skip=__SKIP__` },
  ];
  for (const { url, tpl } of endpoints) {
    try {
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!resp.ok || !(resp.headers.get('content-type') || '').includes('json')) continue;
      const data = await resp.json();
      if (data && (Array.isArray(data) || data.Results || data.results || data.SearchResults)) { workingPattern = tpl; return data; }
    } catch { /* try next */ }
  }
  return null;
}

function extractResults(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.Results || data.results || data.SearchResults || data.searchResults || [];
}

function buildSourceUrl(fragment) {
  if (!fragment) return null;
  if (String(fragment).startsWith('http')) return fragment;
  return `https://www.parliament.nsw.gov.au/Hansard/Pages/HansardResult.aspx#/docid/${fragment}`;
}

function parseNswRow(row) {
  const id = row.FragmentId || row.fragmentId || row.Id || row.id || null;
  const sourceUrl = buildSourceUrl(row.Url || row.url || row.DocumentUrl || row.documentUrl || id);
  if (!sourceUrl) return null;

  const bodyRaw = row.Body || row.body || row.Content || row.content ||
    row.Fragment || row.fragment || row.Text || row.text || '';
  const bodyText = stripHtml(bodyRaw);
  if (!bodyText) return null;

  const chamber = (row.House || row.house || row.Chamber || row.chamber || '').toLowerCase();
  return {
    subject: row.Subject || row.subject || row.Title || row.title ||
      row.DebateHeading || row.debateHeading || 'Unknown',
    body_text: bodyText,
    speaker_name: row.SpeakerName || row.speakerName || row.Speaker || row.speaker || null,
    party: row.Party || row.party || null,
    sitting_date: row.Date || row.date || row.SittingDate || row.sittingDate || null,
    house: chamber.includes('council') ? 'legislative_council' : 'legislative_assembly',
    source_url: sourceUrl,
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

async function main() {
  console.log('=== NSW Hansard Scraper ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Limit: ${MAX_PER_KW}/keyword | Keywords: ${KEYWORDS.length}\n`);

  const existingUrls = await getExistingUrls();
  console.log(`Existing NSW Hansard records: ${existingUrls.size}\n`);

  const stats = { fetched: 0, new: 0, skipped: 0, inserted: 0, errors: 0 };
  const toInsert = [];
  const seenUrls = new Set();

  for (const keyword of KEYWORDS) {
    console.log(`Searching: "${keyword}"`);
    let page = 1, totalFetched = 0;

    while (totalFetched < MAX_PER_KW) {
      const data = await fetchNswHansard(keyword, page);
      if (!data) {
        if (page === 1) console.log('  -> No results (endpoint may need updating)');
        break;
      }
      const rows = extractResults(data);
      if (rows.length === 0) break;

      for (const row of rows) {
        stats.fetched++; totalFetched++;
        const parsed = parseNswRow(row);
        if (!parsed || !parsed.source_url || !parsed.body_text) { stats.skipped++; continue; }
        if (existingUrls.has(parsed.source_url) || seenUrls.has(parsed.source_url)) { stats.skipped++; continue; }
        seenUrls.add(parsed.source_url);
        toInsert.push(parsed);
        stats.new++;
      }
      if (rows.length < PAGE_SIZE) break;
      page++;
      await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`  -> ${totalFetched} fetched, ${stats.new} new so far`);
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records:');
    for (const rec of toInsert.slice(0, 5)) {
      console.log(`  ${rec.sitting_date} | ${rec.speaker_name} | ${rec.house} | ${rec.subject?.slice(0, 60)}`);
      console.log(`    ${rec.body_text.slice(0, 120)}...`);
    }
  } else if (toInsert.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase
        .from('civic_hansard')
        .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });
      if (error) { console.error(`  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message); stats.errors += batch.length; }
      else { stats.inserted += batch.length; }
    }
  }

  console.log(`\n=== Complete === Fetched: ${stats.fetched} | New: ${stats.new} | Skipped: ${stats.skipped} | Inserted: ${stats.inserted} | Errors: ${stats.errors}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
