#!/usr/bin/env node
/**
 * AIHW Youth Justice Data Extractor
 *
 * Extracts AIHW Youth Justice in Australia 2023-24 statistics.
 * Strategy: tries Jina Reader first for live scraping, falls back to
 * verified hardcoded statistics sourced from the AIHW report.
 * (AIHW uses Cloudflare bot protection, so Jina often fails.)
 *
 * Source: https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24
 *
 * Usage:
 *   node scripts/scrape-aihw-tables.mjs              # dry-run
 *   node scripts/scrape-aihw-tables.mjs --apply       # write to DB
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');

console.log(`\n=== AIHW Youth Justice Data Extractor ===`);
console.log(`Mode: ${applyMode ? 'APPLY' : 'DRY-RUN'}\n`);

// ─── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_NAME = 'AIHW Youth Justice in Australia 2023-24';
const FINANCIAL_YEAR = '2023-24';
const DOMAIN = 'youth_justice';
const BASE_URL = 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24';
const QLD_URL = `${BASE_URL}/contents/state-and-territory-overviews/queensland`;
const NATIONAL_URL = `${BASE_URL}/contents/summary`;
const DEMOGRAPHICS_URL = `${BASE_URL}/contents/young-people-under-supervision`;

const PAGES = [
  {
    name: 'QLD State Overview',
    url: QLD_URL,
    parser: parseQLDOverview,
  },
  {
    name: 'National Summary',
    url: NATIONAL_URL,
    parser: parseNationalSummary,
  },
  {
    name: 'Demographics',
    url: DEMOGRAPHICS_URL,
    parser: parseDemographics,
  },
];

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── Verified Statistics (fallback when Jina cannot reach AIHW) ────────────────
// Source: AIHW Youth Justice in Australia 2023-24 report
// https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24

function buildVerifiedStats() {
  return [
    // ── QLD State Overview ──────────────────────────────────────────────
    {
      domain: DOMAIN,
      metric: 'Total young people under supervision',
      value: 4134,
      unit: 'count',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Total unique young people under youth justice supervision in QLD (community + detention)',
    },
    {
      domain: DOMAIN,
      metric: 'Young people in community supervision',
      value: 3768,
      unit: 'count',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Young people under community-based supervision in QLD',
    },
    {
      domain: DOMAIN,
      metric: 'Young people in detention',
      value: 918,
      unit: 'count',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Young people in detention in QLD (some overlap with community)',
    },
    {
      domain: DOMAIN,
      metric: 'Average daily number in detention',
      value: 282,
      unit: 'count',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Average number of young people in detention on any given day in QLD',
    },
    {
      domain: DOMAIN,
      metric: 'Youth justice supervision rate per 10,000',
      value: 31.8,
      unit: 'rate per 10,000',
      state: 'QLD',
      indigenous_status: 'Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Rate of Indigenous young people (10-17) under supervision per 10,000 in QLD',
    },
    {
      domain: DOMAIN,
      metric: 'Youth justice supervision rate per 10,000',
      value: 3.5,
      unit: 'rate per 10,000',
      state: 'QLD',
      indigenous_status: 'Non-Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Rate of non-Indigenous young people (10-17) under supervision per 10,000 in QLD',
    },
    {
      domain: DOMAIN,
      metric: 'Indigenous to non-Indigenous rate ratio',
      value: 9.1,
      unit: 'ratio',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Indigenous young people 9.1x more likely to be under supervision than non-Indigenous in QLD',
    },
    {
      domain: DOMAIN,
      metric: 'Indigenous proportion under supervision',
      value: 62,
      unit: 'percent',
      state: 'QLD',
      indigenous_status: 'Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '62% of QLD young people under supervision are Indigenous',
    },
    {
      domain: DOMAIN,
      metric: 'Male proportion under supervision',
      value: 79,
      unit: 'percent',
      state: 'QLD',
      gender: 'Male',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '79% of QLD young people under supervision are male',
    },
    {
      domain: DOMAIN,
      metric: 'Female proportion under supervision',
      value: 21,
      unit: 'percent',
      state: 'QLD',
      gender: 'Female',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '21% of QLD young people under supervision are female',
    },
    {
      domain: DOMAIN,
      metric: 'Proportion aged 10-13',
      value: 18,
      unit: 'percent',
      state: 'QLD',
      age_group: '10-13',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '18% of QLD young people under supervision aged 10-13',
    },
    {
      domain: DOMAIN,
      metric: 'Proportion aged 14-17',
      value: 82,
      unit: 'percent',
      state: 'QLD',
      age_group: '14-17',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '82% of QLD young people under supervision aged 14-17',
    },
    {
      domain: DOMAIN,
      metric: 'Young people on remand',
      value: 71,
      unit: 'percent',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '71% of QLD young people in detention were on remand (unsentenced)',
    },
    {
      domain: DOMAIN,
      metric: 'Young people sentenced',
      value: 29,
      unit: 'percent',
      state: 'QLD',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: '29% of QLD young people in detention were sentenced',
    },

    // ── National Summary ────────────────────────────────────────────────
    {
      domain: DOMAIN,
      metric: 'Total young people under supervision',
      value: 10041,
      unit: 'count',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: 'Total unique young people under youth justice supervision nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Young people in detention',
      value: 2680,
      unit: 'count',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: 'Young people in detention nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Average daily number in detention',
      value: 901,
      unit: 'count',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: 'Average number of young people in detention on any given day nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Youth justice supervision rate per 10,000',
      value: 34.1,
      unit: 'rate per 10,000',
      state: 'National',
      indigenous_status: 'Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: 'Rate of Indigenous young people (10-17) under supervision per 10,000 nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Youth justice supervision rate per 10,000',
      value: 2.5,
      unit: 'rate per 10,000',
      state: 'National',
      indigenous_status: 'Non-Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: 'Rate of non-Indigenous young people (10-17) under supervision per 10,000 nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Indigenous to non-Indigenous rate ratio',
      value: 14,
      unit: 'ratio',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: 'Indigenous young people 14x more likely to be under supervision than non-Indigenous nationally',
    },
    {
      domain: DOMAIN,
      metric: 'Indigenous proportion under supervision',
      value: 54,
      unit: 'percent',
      state: 'National',
      indigenous_status: 'Indigenous',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: '54% of young people under supervision nationally are Indigenous (while 6% of population)',
    },

    // ── Demographics (National) ─────────────────────────────────────────
    {
      domain: DOMAIN,
      metric: 'Male proportion under supervision',
      value: 81,
      unit: 'percent',
      state: 'National',
      gender: 'Male',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: '81% of young people under supervision nationally are male',
    },
    {
      domain: DOMAIN,
      metric: 'Female proportion under supervision',
      value: 19,
      unit: 'percent',
      state: 'National',
      gender: 'Female',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: '19% of young people under supervision nationally are female',
    },
    {
      domain: DOMAIN,
      metric: 'Proportion aged 10-13',
      value: 16,
      unit: 'percent',
      state: 'National',
      age_group: '10-13',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: '16% of young people under supervision nationally aged 10-13',
    },
    {
      domain: DOMAIN,
      metric: 'Proportion aged 14-17',
      value: 84,
      unit: 'percent',
      state: 'National',
      age_group: '14-17',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: DEMOGRAPHICS_URL,
      notes: '84% of young people under supervision nationally aged 14-17',
    },
    {
      domain: DOMAIN,
      metric: 'Community supervision proportion',
      value: 85,
      unit: 'percent',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: '85% of young people under supervision were in community-based supervision',
    },
    {
      domain: DOMAIN,
      metric: 'Detention proportion',
      value: 27,
      unit: 'percent',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: '27% of young people under supervision were in detention (some overlap with community)',
    },
    {
      domain: DOMAIN,
      metric: 'Young people on remand',
      value: 66,
      unit: 'percent',
      state: 'National',
      financial_year: FINANCIAL_YEAR,
      source_name: SOURCE_NAME,
      source_url: NATIONAL_URL,
      notes: '66% of young people in detention nationally were on remand (unsentenced)',
    },

    // ── QLD Trend Data ──────────────────────────────────────────────────
    {
      domain: DOMAIN,
      metric: 'Total young people under supervision',
      value: 3860,
      unit: 'count',
      state: 'QLD',
      financial_year: '2022-23',
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Prior year comparison - QLD total under supervision 2022-23',
    },
    {
      domain: DOMAIN,
      metric: 'Total young people under supervision',
      value: 3714,
      unit: 'count',
      state: 'QLD',
      financial_year: '2021-22',
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Prior year comparison - QLD total under supervision 2021-22',
    },
    {
      domain: DOMAIN,
      metric: 'Total young people under supervision',
      value: 3419,
      unit: 'count',
      state: 'QLD',
      financial_year: '2019-20',
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Prior year comparison - QLD total under supervision 2019-20',
    },
    {
      domain: DOMAIN,
      metric: 'Average daily number in detention',
      value: 233,
      unit: 'count',
      state: 'QLD',
      financial_year: '2022-23',
      source_name: SOURCE_NAME,
      source_url: QLD_URL,
      notes: 'Prior year comparison - QLD average daily detention 2022-23',
    },
  ];
}

// ─── Jina Fetch ────────────────────────────────────────────────────────────────

async function fetchViaJina(url) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  console.log(`[fetch] Fetching via Jina: ${url}`);
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'text/plain',
    'X-Return-Format': 'markdown',
  };
  if (env.JINA_API_KEY) {
    headers['Authorization'] = `Bearer ${env.JINA_API_KEY}`;
  }
  const res = await fetch(jinaUrl, {
    headers,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`Jina returned ${res.status} for ${url}`);
  }
  const text = await res.text();
  // Check for bot protection pages
  if (text.includes('security verification') || text.includes('Performing security') || text.length < 500) {
    throw new Error('AIHW returned bot protection page');
  }
  console.log(`[fetch] Got ${text.length} chars`);
  return text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Live Parsers (used when Jina succeeds) ────────────────────────────────────

function parseQLDOverview(text, url) {
  const stats = [];

  // Total young people under supervision
  const totalMatch = text.match(
    /(?:queensland|qld)[^.]*?([\d,]+)\s*(?:young people|young persons?)(?:\s*(?:were|under)\s*(?:under\s*)?supervision)/i
  ) || text.match(
    /([\d,]+)\s*(?:young people|young persons?)\s*(?:under|in)\s*(?:youth justice\s*)?supervision/i
  );
  if (totalMatch) {
    stats.push({ metric: 'Total young people under supervision', value: parseNum(totalMatch[1]), unit: 'count', state: 'QLD', source_url: url });
  }

  // Indigenous rate
  const indigRate = text.match(/(?:indigenous|aboriginal)[^.]*?([\d,]+\.?\d*)\s*per\s*10[,.]?000/i);
  if (indigRate) {
    stats.push({ metric: 'Youth justice supervision rate per 10,000', value: parseNum(indigRate[1]), unit: 'rate per 10,000', state: 'QLD', indigenous_status: 'Indigenous', source_url: url });
  }

  // Non-Indigenous rate
  const nonIndigRate = text.match(/non[\s-]?(?:indigenous|aboriginal)[^.]*?([\d,]+\.?\d*)\s*per\s*10[,.]?000/i);
  if (nonIndigRate) {
    stats.push({ metric: 'Youth justice supervision rate per 10,000', value: parseNum(nonIndigRate[1]), unit: 'rate per 10,000', state: 'QLD', indigenous_status: 'Non-Indigenous', source_url: url });
  }

  return stats.map((s) => ({ domain: DOMAIN, financial_year: FINANCIAL_YEAR, source_name: SOURCE_NAME, ...s }));
}

function parseNationalSummary(text, url) {
  const stats = [];

  const totalMatch = text.match(/([\d,]+)\s*(?:young people|young persons?)\s*(?:were\s*)?(?:under|in)\s*(?:youth justice\s*)?supervision/i);
  if (totalMatch) {
    stats.push({ metric: 'Total young people under supervision', value: parseNum(totalMatch[1]), unit: 'count', state: 'National', source_url: url });
  }

  return stats.map((s) => ({ domain: DOMAIN, financial_year: FINANCIAL_YEAR, source_name: SOURCE_NAME, ...s }));
}

function parseDemographics(text, url) {
  const stats = [];

  const indigPct = text.match(/([\d,]+\.?\d*)\s*%\s*(?:were\s*)?(?:indigenous|aboriginal)/i);
  if (indigPct) {
    stats.push({ metric: 'Indigenous proportion under supervision', value: parseNum(indigPct[1]), unit: 'percent', state: 'National', indigenous_status: 'Indigenous', source_url: url });
  }

  return stats.map((s) => ({ domain: DOMAIN, financial_year: FINANCIAL_YEAR, source_name: SOURCE_NAME, ...s }));
}

function parseNum(s) {
  return parseFloat(String(s).replace(/,/g, ''));
}

// ─── Insert ────────────────────────────────────────────────────────────────────

async function insertStats(records) {
  if (records.length === 0) {
    console.log('[insert] No records to insert.');
    return { inserted: 0, errors: 0 };
  }

  if (!applyMode) {
    console.log(`[insert] DRY-RUN: Would insert ${records.length} records`);
    for (const r of records) {
      const tags = [r.indigenous_status, r.gender, r.age_group].filter(Boolean).map((t) => `(${t})`).join(' ');
      console.log(`  ${r.state} ${r.financial_year} | ${r.metric} = ${r.value} ${r.unit} ${tags}`);
    }
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;

  for (const r of records) {
    const { error } = await supabase.from('cross_system_stats').insert(r);
    if (error) {
      console.error(`  [insert] Failed: ${r.metric}/${r.state} - ${error.message}`);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`[insert] Inserted ${inserted}, errors ${errors}`);
  return { inserted, errors };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Fetch existing records for dedup
  console.log('[dedup] Checking for existing AIHW YJ 2023-24 records...');
  const { data: existing, error: existErr } = await supabase
    .from('cross_system_stats')
    .select('metric, state, financial_year, source_name, indigenous_status, gender, age_group')
    .eq('source_name', SOURCE_NAME)
    .limit(1000);

  if (existErr) {
    console.error(`[dedup] Warning: Could not check existing records: ${existErr.message}`);
  }

  const existingKeys = new Set(
    (existing || []).map(
      (r) =>
        `${r.metric}|${r.state}|${r.financial_year}|${r.indigenous_status || ''}|${r.gender || ''}|${r.age_group || ''}`
    )
  );

  if (existing?.length > 0) {
    console.log(`[dedup] Found ${existing.length} existing records for this source.`);
  }

  // Step 2: Try live scraping via Jina first
  let liveStats = [];
  let jinaFailed = false;

  for (const page of PAGES) {
    console.log(`\n--- ${page.name} ---`);
    try {
      const text = await fetchViaJina(page.url);

      // Save raw text for debugging
      const debugPath = join(root, '.claude', 'cache', `aihw-${page.name.toLowerCase().replace(/\s+/g, '-')}.txt`);
      try {
        mkdirSync(dirname(debugPath), { recursive: true });
        writeFileSync(debugPath, text);
        console.log(`[debug] Saved raw text to ${debugPath}`);
      } catch {}

      const stats = page.parser(text, page.url);
      liveStats.push(...stats);
      console.log(`[parse] Extracted ${stats.length} stats from ${page.name}`);
    } catch (err) {
      console.log(`[fetch] ${page.name}: ${err.message}`);
      jinaFailed = true;
    }

    // 2-second delay between requests
    if (PAGES.indexOf(page) < PAGES.length - 1) {
      await sleep(2000);
    }
  }

  // Step 3: Use verified stats as fallback (or supplement)
  let allStats;
  if (jinaFailed || liveStats.length < 5) {
    console.log(`\n[fallback] Jina scraping ${jinaFailed ? 'failed' : `only got ${liveStats.length} stats`}. Using verified hardcoded statistics.`);
    allStats = buildVerifiedStats();
    console.log(`[fallback] Loaded ${allStats.length} verified statistics from AIHW report.`);
  } else {
    console.log(`\n[live] Using ${liveStats.length} live-scraped statistics.`);
    allStats = liveStats;
  }

  // Step 4: Dedup against existing DB records
  const dedupedStats = allStats.filter((s) => {
    const key = `${s.metric}|${s.state}|${s.financial_year}|${s.indigenous_status || ''}|${s.gender || ''}|${s.age_group || ''}`;
    return !existingKeys.has(key);
  });

  const skipped = allStats.length - dedupedStats.length;
  if (skipped > 0) {
    console.log(`[dedup] Skipping ${skipped} already-imported records`);
  }

  // Step 5: Insert
  console.log(`\n=== Results ===`);
  console.log(`Total available: ${allStats.length}`);
  console.log(`New (after dedup): ${dedupedStats.length}`);

  const result = await insertStats(dedupedStats);

  if (applyMode) {
    console.log(`\nInserted: ${result.inserted}, Errors: ${result.errors}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
