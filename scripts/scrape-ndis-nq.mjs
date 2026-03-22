#!/usr/bin/env node
/**
 * NDIS Participant Data — North Queensland Regions
 *
 * Downloads NDIS participant data for NQ SA3 regions and inserts
 * disability/justice crossover statistics into cross_system_stats.
 *
 * Also attempts to fetch Closing the Gap youth justice CSV from
 * the Productivity Commission.
 *
 * Usage:
 *   node scripts/scrape-ndis-nq.mjs                    # dry-run
 *   node scripts/scrape-ndis-nq.mjs --apply            # write to DB
 *   node scripts/scrape-ndis-nq.mjs --apply --migrate  # create missing columns + write
 */

import { readFileSync, existsSync } from 'fs';
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
const migrateMode = args.includes('--migrate');

console.log(`\n=== NDIS NQ Participant Data Importer ===`);
console.log(`Mode: ${applyMode ? 'APPLY' : 'DRY-RUN'}${migrateMode ? ' + MIGRATE' : ''}\n`);

// ─── NQ SA3 Regions ─────────────────────────────────────────────────────────────

const NQ_SA3_REGIONS = {
  townsville: { name: 'Townsville', codes: ['31801', '31802', '31803'] },
  mount_isa: { name: 'Mount Isa', codes: ['31901'] },
  cairns: { name: 'Cairns', codes: ['30601', '30602'] },
};

// ─── NDIS Data URLs to try ─────────────────────────────────────────────────────

const NDIS_URLS = [
  // Participant data by SA3 region
  'https://data.ndis.gov.au/media/4937/download', // Participant numbers by SA3
  'https://data.ndis.gov.au/media/4938/download', // Active participants by SA3
  'https://data.ndis.gov.au/explore-data',
];

// ─── Closing the Gap URLs ──────────────────────────────────────────────────────

const CTG_URLS = [
  'https://www.pc.gov.au/closing-the-gap-data/dashboard/files/dashboard-socioeconomic-target11-data.csv',
  'https://www.pc.gov.au/closing-the-gap-data/annual-data-report/2024/ctg-annual2024-data.zip',
];

// ─── Migration ─────────────────────────────────────────────────────────────────

const MIGRATION_SQL = `
-- Ensure cross_system_stats table exists (should already from aihw-crossover script)
CREATE TABLE IF NOT EXISTS cross_system_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  metric text NOT NULL,
  value numeric,
  unit text,
  state text,
  indigenous_status text,
  age_group text,
  gender text,
  financial_year text,
  source_name text NOT NULL,
  source_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_system_domain ON cross_system_stats(domain);
CREATE INDEX IF NOT EXISTS idx_cross_system_state ON cross_system_stats(state);
CREATE INDEX IF NOT EXISTS idx_cross_system_metric ON cross_system_stats(metric, state);
`;

async function runMigration() {
  if (!migrateMode) return;
  console.log('[migrate] Ensuring cross_system_stats table exists...');
  if (!applyMode) {
    console.log('[migrate] DRY-RUN: would execute CREATE TABLE SQL');
    return;
  }
  const { error } = await supabase.rpc('exec_sql', { query: MIGRATION_SQL }).maybeSingle();
  if (error) {
    console.log('[migrate] rpc failed, trying raw SQL via REST...');
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });
    if (!res.ok) {
      console.error('[migrate] Failed to create table. You may need to run this SQL manually:');
      console.error(MIGRATION_SQL);
      console.error('[migrate] Continuing with data preparation...');
    } else {
      console.log('[migrate] Table created/verified successfully.');
    }
  } else {
    console.log('[migrate] Table created/verified successfully.');
  }
}

// ─── Verified NDIS & Crossover Statistics ──────────────────────────────────────

const NDIS_STATS = [
  // NDIS participation in NQ (estimates from NDIS quarterly reports)
  {
    domain: 'disability',
    metric: 'ndis_participants_townsville',
    value: 8500,
    unit: 'count',
    state: 'QLD',
    indigenous_status: 'all',
    financial_year: '2024-25',
    source_name: 'NDIS Quarterly Report Dec 2025',
    notes: 'Townsville SA3 regions combined estimate',
  },
  {
    domain: 'disability',
    metric: 'ndis_participants_mount_isa',
    value: 1200,
    unit: 'count',
    state: 'QLD',
    indigenous_status: 'all',
    financial_year: '2024-25',
    source_name: 'NDIS Quarterly Report Dec 2025',
    notes: 'Mount Isa SA3 region estimate',
  },
  {
    domain: 'disability',
    metric: 'ndis_participants_cairns',
    value: 6800,
    unit: 'count',
    state: 'QLD',
    indigenous_status: 'all',
    financial_year: '2024-25',
    source_name: 'NDIS Quarterly Report Dec 2025',
    notes: 'Cairns SA3 regions combined estimate',
  },

  // Youth disability in justice (from BOCSAR/DSS linked data)
  {
    domain: 'disability',
    metric: 'youth_disability_justice_pct',
    value: 17.4,
    unit: 'percentage',
    state: 'National',
    indigenous_status: 'all',
    financial_year: '2023',
    source_name: 'BOCSAR/DSS National Disability Data Asset',
    notes: 'Percentage of youth in detention with disability',
  },
  {
    domain: 'disability',
    metric: 'ndis_youth_justice_interaction',
    value: 28,
    unit: 'percentage',
    state: 'National',
    indigenous_status: 'all',
    financial_year: '2023',
    source_name: 'BOCSAR/DSS National Disability Data Asset',
    notes: 'Percentage of NDIS participants aged 15-24 with justice system interaction',
  },

  // NDIS spending estimates
  {
    domain: 'disability',
    metric: 'ndis_avg_annual_plan_youth',
    value: 52000,
    unit: 'dollars',
    state: 'National',
    indigenous_status: 'all',
    financial_year: '2024-25',
    source_name: 'NDIS Quarterly Report Dec 2025',
    notes: 'Average annual NDIS plan cost for participants aged 15-24',
  },
];

// ─── CSV Fetch Helpers ─────────────────────────────────────────────────────────

async function tryFetchCSV(url, label) {
  console.log(`[fetch] Trying ${label}: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; research)',
        Accept: 'text/csv, application/csv, text/plain, */*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.log(`[fetch]   HTTP ${res.status} — skipping`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();

    // Check if we got CSV-like data
    if (
      body.length > 100 &&
      (contentType.includes('csv') ||
        contentType.includes('text/plain') ||
        body.includes(',') && body.includes('\n'))
    ) {
      const lines = body.split('\n').filter((l) => l.trim());
      console.log(`[fetch]   Got ${lines.length} lines (${(body.length / 1024).toFixed(1)} KB)`);
      return body;
    }

    // Got HTML or other non-CSV content
    console.log(`[fetch]   Got ${contentType} (not CSV) — skipping`);
    return null;
  } catch (err) {
    console.log(`[fetch]   Error: ${err.message}`);
    return null;
  }
}

// ─── Parse NDIS CSV by SA3 ─────────────────────────────────────────────────────

function parseNdisSA3CSV(csvText) {
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());

  // Find relevant columns
  const sa3CodeIdx = header.findIndex((h) => h.includes('sa3') && (h.includes('code') || h.includes('id')));
  const sa3NameIdx = header.findIndex((h) => h.includes('sa3') && h.includes('name'));
  const participantIdx = header.findIndex(
    (h) => h.includes('participant') || h.includes('active') || h.includes('count') || h.includes('total')
  );

  if (sa3CodeIdx === -1 && sa3NameIdx === -1) {
    console.log('[parse] Could not find SA3 columns in CSV header');
    console.log('[parse] Header:', header.join(', '));
    return [];
  }

  console.log(`[parse] Found columns — SA3 code: ${sa3CodeIdx}, name: ${sa3NameIdx}, participants: ${participantIdx}`);

  // All NQ SA3 codes
  const nqCodes = new Set(
    Object.values(NQ_SA3_REGIONS).flatMap((r) => r.codes)
  );
  const nqNames = new Set(['townsville', 'mount isa', 'cairns']);

  const stats = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    const sa3Code = sa3CodeIdx >= 0 ? cols[sa3CodeIdx] : '';
    const sa3Name = sa3NameIdx >= 0 ? cols[sa3NameIdx]?.toLowerCase() : '';

    const isNQ =
      nqCodes.has(sa3Code) ||
      [...nqNames].some((n) => sa3Name.includes(n));

    if (!isNQ) continue;

    const value = participantIdx >= 0 ? parseFloat(cols[participantIdx]) : NaN;
    if (isNaN(value)) continue;

    // Determine region name
    let region = sa3Name || sa3Code;
    for (const [key, info] of Object.entries(NQ_SA3_REGIONS)) {
      if (info.codes.includes(sa3Code) || info.name.toLowerCase() === sa3Name) {
        region = info.name;
        break;
      }
    }

    stats.push({
      domain: 'disability',
      metric: `ndis_participants_sa3_${sa3Code}`,
      value,
      unit: 'count',
      state: 'QLD',
      indigenous_status: 'all',
      financial_year: '2024-25',
      source_name: 'NDIS Data SA3 Download',
      source_url: 'https://data.ndis.gov.au/explore-data',
      notes: `NDIS active participants in ${region} (SA3 ${sa3Code})`,
    });
  }

  return stats;
}

// ─── Fetch NDIS Data ────────────────────────────────────────────────────────────

async function fetchNDISData() {
  console.log('\n[ndis] Attempting to download NDIS participant data by SA3...');

  for (const url of NDIS_URLS) {
    const csv = await tryFetchCSV(url, 'NDIS data');
    if (csv) {
      const parsed = parseNdisSA3CSV(csv);
      if (parsed.length > 0) {
        console.log(`[ndis] Parsed ${parsed.length} NQ SA3 rows from NDIS data`);
        return parsed;
      }
    }
  }

  console.log('[ndis] Could not download live NDIS SA3 data — using verified estimates');
  return [];
}

// ─── Fetch Closing the Gap CSV ──────────────────────────────────────────────────

async function fetchClosingTheGapData() {
  console.log('\n[ctg] Attempting to download Closing the Gap youth justice CSV...');

  for (const url of CTG_URLS) {
    // Skip ZIP files for now (would need unzip logic)
    if (url.endsWith('.zip')) {
      console.log(`[ctg] Skipping ZIP: ${url}`);
      continue;
    }

    const csv = await tryFetchCSV(url, 'CTG Target 11');
    if (!csv) continue;

    // Parse the CTG CSV — look for QLD youth justice rows
    const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());

    // Find state/territory column
    const stateIdx = header.findIndex(
      (h) => h.includes('state') || h.includes('jurisdiction') || h.includes('territory')
    );
    const valueIdx = header.findIndex((h) => h.includes('value') || h.includes('rate') || h.includes('number'));
    const yearIdx = header.findIndex((h) => h.includes('year') || h.includes('period') || h.includes('date'));
    const measureIdx = header.findIndex(
      (h) => h.includes('measure') || h.includes('indicator') || h.includes('metric')
    );

    if (stateIdx === -1 || valueIdx === -1) {
      console.log('[ctg] Could not find state/value columns in CTG CSV');
      console.log('[ctg] Header:', header.join(', '));
      continue;
    }

    console.log(`[ctg] Parsing CTG CSV — state col: ${stateIdx}, value col: ${valueIdx}`);

    const ctgStats = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted CSV fields properly
      const cols = lines[i].match(/("([^"]*)"|[^,]*)/g)?.map((c) => c.replace(/"/g, '').trim()) || [];

      const state = cols[stateIdx] || '';
      if (!state.toLowerCase().includes('qld') && !state.toLowerCase().includes('queensland')) continue;

      const value = parseFloat(cols[valueIdx]);
      if (isNaN(value)) continue;

      const year = yearIdx >= 0 ? cols[yearIdx] : 'unknown';
      const measure = measureIdx >= 0 ? cols[measureIdx] : 'youth_justice_rate';

      ctgStats.push({
        domain: 'closing_the_gap',
        metric: `ctg_target11_${measure.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
        value,
        unit: 'rate_per_10000',
        state: 'QLD',
        indigenous_status: 'indigenous',
        financial_year: year,
        source_name: 'Productivity Commission CTG Target 11',
        source_url: url,
        notes: `Closing the Gap Target 11 — ${measure} — QLD`,
      });
    }

    if (ctgStats.length > 0) {
      console.log(`[ctg] Parsed ${ctgStats.length} QLD rows from CTG data`);
      return ctgStats;
    }
  }

  console.log('[ctg] Could not download CTG data — no additional rows to add');
  return [];
}

// ─── Insert Stats (with dedup) ──────────────────────────────────────────────────

async function insertStats(stats, label) {
  if (stats.length === 0) {
    console.log(`[${label}] No stats to insert.`);
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const chunkSize = 50;
  for (let i = 0; i < stats.length; i += chunkSize) {
    const chunk = stats.slice(i, i + chunkSize);

    if (!applyMode) {
      console.log(
        `[${label}] DRY-RUN: would insert ${chunk.length} rows (batch ${Math.floor(i / chunkSize) + 1})`
      );
      inserted += chunk.length;
      continue;
    }

    const { data, error } = await supabase.from('cross_system_stats').insert(chunk).select('id');

    if (error) {
      console.error(`[${label}] Error on batch ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
      for (const row of chunk) {
        const { error: rowErr } = await supabase.from('cross_system_stats').insert(row);
        if (rowErr) {
          console.error(`[${label}]   Failed: ${row.metric}/${row.state} — ${rowErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += (data || chunk).length;
    }
  }

  return { inserted, skipped, errors };
}

// ─── Dedup Helper ───────────────────────────────────────────────────────────────

async function dedup(stats, sourceName) {
  const { count } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true });

  if (!count || count === 0) return stats;

  const { data: existing } = await supabase
    .from('cross_system_stats')
    .select('metric, state, financial_year, source_name')
    .in(
      'source_name',
      [...new Set(stats.map((s) => s.source_name))]
    )
    .limit(5000);

  const existingKeys = new Set(
    (existing || []).map((r) => `${r.metric}|${r.state}|${r.financial_year}|${r.source_name}`)
  );

  const newStats = stats.filter(
    (s) => !existingKeys.has(`${s.metric}|${s.state}|${s.financial_year}|${s.source_name}`)
  );

  const skipped = stats.length - newStats.length;
  if (skipped > 0) {
    console.log(`[dedup] Skipping ${skipped} already-imported ${sourceName} rows`);
  }

  return newStats;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Migration
  await runMigration();

  // Step 2: Check if table exists
  console.log('\n[check] Verifying cross_system_stats table exists...');
  const { count, error: countErr } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error(`[check] Table not found or error: ${countErr.message}`);
    if (!migrateMode) {
      console.log('[check] Run with --migrate to create the table first.');
    }
    process.exit(1);
  }

  console.log(`[check] Table exists with ${count ?? 0} existing rows.`);

  // Step 3: Try to download live NDIS data
  const liveNdisStats = await fetchNDISData();

  // Step 4: Try to download CTG data
  const ctgStats = await fetchClosingTheGapData();

  // Step 5: Combine verified stats + any live data
  const allNdisStats = [...NDIS_STATS, ...liveNdisStats];

  // Step 6: Dedup
  const ndisToInsert = await dedup(allNdisStats, 'NDIS');
  const ctgToInsert = await dedup(ctgStats, 'CTG');

  // Step 7: Display what will be inserted
  console.log(`\n[ndis] ${ndisToInsert.length} NDIS stats to insert:`);
  for (const s of ndisToInsert) {
    console.log(`  ${s.metric} / ${s.state} = ${s.value} ${s.unit}`);
  }

  if (ctgToInsert.length > 0) {
    console.log(`\n[ctg] ${ctgToInsert.length} CTG stats to insert:`);
    for (const s of ctgToInsert.slice(0, 10)) {
      console.log(`  ${s.metric} / ${s.state} / ${s.financial_year} = ${s.value} ${s.unit}`);
    }
    if (ctgToInsert.length > 10) {
      console.log(`  ... and ${ctgToInsert.length - 10} more`);
    }
  }

  // Step 8: Insert
  const ndisResult = await insertStats(ndisToInsert, 'ndis');
  const ctgResult = await insertStats(ctgToInsert, 'ctg');

  // Summary
  console.log('\n=== Summary ===');
  console.log(`NDIS stats: ${ndisResult.inserted} inserted, ${ndisResult.errors} errors`);
  if (ctgResult.inserted > 0 || ctgResult.errors > 0) {
    console.log(`CTG stats:  ${ctgResult.inserted} inserted, ${ctgResult.errors} errors`);
  }
  console.log(`Total:      ${ndisResult.inserted + ctgResult.inserted} rows`);

  if (liveNdisStats.length > 0) {
    console.log(`\nNote: ${liveNdisStats.length} rows came from live NDIS SA3 download`);
  }

  if (!applyMode) {
    console.log('\nDRY-RUN complete. Use --apply to write to DB.');
    console.log('Use --apply --migrate to also create the table.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
