#!/usr/bin/env node
/**
 * scrape-federal-hansard.mjs
 *
 * Scrapes Federal Hansard (Senate + House of Reps) via OpenAustralia API.
 * Uses getDebates endpoint (getHansard is "not yet functional").
 * Iterates through sitting dates, filters for youth justice keywords.
 *
 * Usage:
 *   node scripts/scrape-federal-hansard.mjs --dry-run
 *   node scripts/scrape-federal-hansard.mjs
 *   node scripts/scrape-federal-hansard.mjs --days=90
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const API_KEY = env.OPENAUSTRALIA_API_KEY;
const API_BASE = 'https://www.openaustralia.org.au/api';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const daysArg = args.find(a => a.startsWith('--days='));
const DAYS_BACK = daysArg ? parseInt(daysArg.split('=')[1]) : 180;

const YJ_KEYWORDS = [
  'youth justice', 'youth detention', 'juvenile justice', 'young offender',
  'raising the age', 'age of criminal responsibility', 'Don Dale', 'Banksia Hill',
  'youth crime', 'youth diversion', 'child detention', 'youth bail',
  'children in custody', 'juvenile detention',
];

const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '—').replace(/&#8211;/g, '–')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function getSittingDates(daysBack) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    // Parliament typically sits Mon-Thu
    if (dow >= 1 && dow <= 4) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

async function fetchDebates(type, date) {
  const url = `${API_BASE}/getDebates?key=${API_KEY}&type=${type}&date=${date}&output=js`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    if (data.error) return [];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function extractSpeeches(debates, date, house) {
  const speeches = [];
  for (const debate of debates) {
    const heading = debate.entry?.body || '';
    const subs = debate.subs || [];
    for (const sub of subs) {
      const text = stripHtml(sub.excerpt || sub.body || '');
      if (!text || text.length < 50) continue;
      if (!YJ_PATTERN.test(text) && !YJ_PATTERN.test(heading)) continue;

      const gid = sub.gid || sub.epobject_id;
      const sourceUrl = sub.listurl
        ? `https://www.openaustralia.org.au${sub.listurl}`
        : `https://www.openaustralia.org.au/${house === 'senate' ? 'senate' : 'debates'}/?id=${gid}`;

      speeches.push({
        subject: stripHtml(heading) || stripHtml(sub.body?.match(/<strong>(.*?)<\/strong>/)?.[1] || ''),
        body_text: text,
        speaker_name: sub.speaker?.full_name || sub.speaker?.name || null,
        party: sub.speaker?.party || null,
        sitting_date: sub.hdate || date,
        house,
        source_url: sourceUrl,
        jurisdiction: 'federal',
        scraped_at: new Date().toISOString(),
      });
    }
  }
  return speeches;
}

async function getExistingUrls() {
  const { data } = await supabase
    .from('civic_hansard')
    .select('source_url')
    .eq('jurisdiction', 'federal');
  return new Set((data || []).map(r => r.source_url));
}

async function main() {
  console.log('=== Federal Hansard Scraper (getDebates) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Looking back: ${DAYS_BACK} days`);
  if (!API_KEY) { console.error('OPENAUSTRALIA_API_KEY not set'); process.exit(1); }

  const existingUrls = await getExistingUrls();
  console.log(`Existing federal records: ${existingUrls.size}\n`);

  const dates = getSittingDates(DAYS_BACK);
  console.log(`Checking ${dates.length} potential sitting dates\n`);

  const stats = { dates_checked: 0, fetched: 0, matched: 0, new: 0, inserted: 0, errors: 0 };
  const toInsert = [];
  const seenUrls = new Set();

  for (const date of dates) {
    stats.dates_checked++;
    const allSpeeches = [];

    for (const type of ['senate', 'representatives']) {
      const debates = await fetchDebates(type, date);
      if (debates.length === 0) continue;
      stats.fetched += debates.length;

      const house = type === 'senate' ? 'senate' : 'reps';
      const speeches = extractSpeeches(debates, date, house);
      allSpeeches.push(...speeches);
      stats.matched += speeches.length;

      await new Promise(r => setTimeout(r, 500)); // Rate limit
    }

    for (const speech of allSpeeches) {
      if (!speech.source_url || existingUrls.has(speech.source_url) || seenUrls.has(speech.source_url)) {
        continue;
      }
      seenUrls.add(speech.source_url);
      toInsert.push(speech);
      stats.new++;
    }

    if (stats.dates_checked % 20 === 0) {
      console.log(`  ${stats.dates_checked}/${dates.length} dates | ${stats.matched} YJ matches | ${stats.new} new`);
    }
  }

  console.log(`\nTotal to insert: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records:');
    for (const r of toInsert.slice(0, 5)) {
      console.log(`  ${r.sitting_date} | ${r.house} | ${r.speaker_name || '?'} | ${r.subject?.slice(0, 80)}`);
    }
  } else if (toInsert.length > 0) {
    // Batch insert
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { error } = await supabase
        .from('civic_hansard')
        .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });
      if (error) {
        console.error(`  Batch error:`, error.message);
        stats.errors += batch.length;
      } else {
        stats.inserted += batch.length;
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Dates checked: ${stats.dates_checked}`);
  console.log(`  Debates fetched: ${stats.fetched}`);
  console.log(`  YJ matches: ${stats.matched}`);
  console.log(`  New: ${stats.new}`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
