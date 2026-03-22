#!/usr/bin/env node
/**
 * AIHW & Cross-System Data Importer
 *
 * Imports youth justice, child protection, and disability crossover statistics
 * from AIHW, Productivity Commission, and BOCSAR research.
 *
 * Usage:
 *   node scripts/scrape-aihw-crossover.mjs                    # dry-run
 *   node scripts/scrape-aihw-crossover.mjs --apply            # write to DB
 *   node scripts/scrape-aihw-crossover.mjs --apply --migrate  # create table + write
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

console.log(`\n=== AIHW & Cross-System Data Importer ===`);
console.log(`Mode: ${applyMode ? 'APPLY' : 'DRY-RUN'}${migrateMode ? ' + MIGRATE' : ''}\n`);

// ─── Migration ─────────────────────────────────────────────────────────────────

const CREATE_TABLE_SQL = `
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
  console.log('[migrate] Creating cross_system_stats table...');
  if (!applyMode) {
    console.log('[migrate] DRY-RUN: would execute CREATE TABLE SQL');
    return;
  }
  const { error } = await supabase.rpc('exec_sql', { query: CREATE_TABLE_SQL }).maybeSingle();
  if (error) {
    // Try direct SQL via postgrest if rpc not available
    console.log('[migrate] rpc failed, trying raw SQL via supabase-js...');
    // Use the REST API to run SQL
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: CREATE_TABLE_SQL }),
    });
    if (!res.ok) {
      console.error('[migrate] Failed to create table. You may need to run this SQL manually:');
      console.error(CREATE_TABLE_SQL);
      console.error('[migrate] Continuing with data preparation...');
    } else {
      console.log('[migrate] Table created successfully.');
    }
  } else {
    console.log('[migrate] Table created successfully.');
  }
}

// ─── Verified Statistics ───────────────────────────────────────────────────────

const VERIFIED_STATS = [
  // Youth Justice (AIHW 2023-24, QLD)
  {
    domain: 'youth_justice',
    metric: 'under_supervision',
    value: 1598,
    unit: 'count',
    state: 'QLD',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'AIHW Youth Justice 2023-24',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    notes: 'Total young people under youth justice supervision in QLD',
  },
  {
    domain: 'youth_justice',
    metric: 'detention_rate_indigenous',
    value: 22,
    unit: 'ratio',
    state: 'National',
    indigenous_status: 'indigenous',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'AIHW Youth Justice 2023-24',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    notes: 'Indigenous young people 22x over-represented in detention nationally',
  },
  {
    domain: 'youth_justice',
    metric: 'detention_increase',
    value: 50,
    unit: 'percentage',
    state: 'QLD',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'AIHW Youth Justice 2023-24',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    notes: '50% increase in QLD youth detention',
  },
  {
    domain: 'youth_justice',
    metric: 'cost_per_day_detention',
    value: 3320,
    unit: 'dollars',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'ROGS 2025',
    source_url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice',
    notes: 'Average cost per day of youth detention nationally',
  },
  {
    domain: 'youth_justice',
    metric: 'cost_per_day_community',
    value: 200,
    unit: 'dollars',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'ROGS 2025 (estimated)',
    source_url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice',
    notes: 'Estimated cost per day of community-based supervision',
  },
  {
    domain: 'youth_justice',
    metric: 'total_expenditure',
    value: 1500000000,
    unit: 'dollars',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'ROGS 2025',
    source_url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice',
    notes: 'Total national expenditure on youth justice',
  },

  // Child Protection Crossover (AIHW 2022-23, QLD)
  {
    domain: 'child_protection',
    metric: 'crossover_rate',
    value: 72.9,
    unit: 'percentage',
    state: 'QLD',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2022-23',
    source_name: 'AIHW Child Protection 2022-23',
    source_url: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia',
    notes: 'QLD has highest crossover rate nationally — 72.9% of youth justice-involved had child protection history',
  },
  {
    domain: 'child_protection',
    metric: 'crossover_count',
    value: 1863,
    unit: 'count',
    state: 'QLD',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2022-23',
    source_name: 'AIHW Child Protection 2022-23',
    source_url: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia',
    notes: 'Number of QLD young people with both youth justice and child protection involvement',
  },
  {
    domain: 'child_protection',
    metric: 'crossover_rate_indigenous_female',
    value: 89.6,
    unit: 'percentage',
    state: 'QLD',
    indigenous_status: 'indigenous',
    age_group: 'all',
    gender: 'female',
    financial_year: '2022-23',
    source_name: 'AIHW Child Protection 2022-23',
    source_url: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia',
    notes: 'Indigenous females in QLD youth justice with child protection history',
  },
  {
    domain: 'child_protection',
    metric: 'crossover_rate',
    value: 65,
    unit: 'percentage',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2022-23',
    source_name: 'AIHW Child Protection 2022-23',
    source_url: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia',
    notes: 'National crossover rate — youth justice-involved with child protection history',
  },
  {
    domain: 'child_protection',
    metric: 'oohc_total',
    value: 44900,
    unit: 'count',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023-24',
    source_name: 'AIHW Child Protection 2023-24',
    source_url: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia',
    notes: 'Total children in out-of-home care nationally',
  },

  // Disability-Justice Crossover
  {
    domain: 'disability',
    metric: 'overrepresentation_ratio',
    value: 5,
    unit: 'ratio',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023',
    source_name: 'BOCSAR/DSS Research',
    source_url: 'https://www.bocsar.nsw.gov.au',
    notes: 'Young people with disability 5x over-represented in youth justice',
  },
  {
    domain: 'disability',
    metric: 'population_prevalence',
    value: 3.5,
    unit: 'percentage',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023',
    source_name: 'BOCSAR/DSS Research',
    source_url: 'https://www.bocsar.nsw.gov.au',
    notes: 'Percentage of youth population with cognitive/psychosocial disability',
  },
  {
    domain: 'disability',
    metric: 'detention_prevalence',
    value: 17.4,
    unit: 'percentage',
    state: 'National',
    indigenous_status: 'all',
    age_group: 'all',
    gender: 'all',
    financial_year: '2023',
    source_name: 'BOCSAR/DSS Research',
    source_url: 'https://www.bocsar.nsw.gov.au',
    notes: 'Percentage of youth in detention with cognitive/psychosocial disability',
  },
];

// ─── Closing the Gap CSV ───────────────────────────────────────────────────────

const CTG_URL =
  'https://www.pc.gov.au/closing-the-gap-data/annual-data-report/data-downloads/ctg-202407-ctg11-youth-justice-dataset.csv';

function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Find header row (may have BOM or leading empty rows)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes(',') && lines[i].trim().length > 10) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIdx]);
  const rows = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    if (values.length < headers.length / 2) continue; // skip malformed
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim().replace(/^\uFEFF/, '')] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function fetchClosingTheGapData() {
  console.log('[ctg] Fetching Closing the Gap youth justice CSV...');
  console.log(`[ctg] URL: ${CTG_URL}`);

  try {
    const res = await fetch(CTG_URL, {
      headers: { 'User-Agent': 'JusticeHub-Research/1.0' },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.log(`[ctg] HTTP ${res.status} — skipping CSV download`);
      return [];
    }

    const text = await res.text();
    console.log(`[ctg] Downloaded ${(text.length / 1024).toFixed(1)} KB`);

    const rows = parseCSV(text);
    console.log(`[ctg] Parsed ${rows.length} rows`);

    if (rows.length === 0) {
      console.log('[ctg] No rows parsed. First 500 chars of response:');
      console.log(text.slice(0, 500));
      return [];
    }

    // Log headers for debugging
    const headers = Object.keys(rows[0]);
    console.log(`[ctg] Headers: ${headers.join(', ')}`);

    // Try to extract relevant data
    // The CTG dataset typically has columns like: State, Indigenous_status, Measure, Year, Value
    const stats = [];
    const stateMap = {
      Queensland: 'QLD',
      'New South Wales': 'NSW',
      Victoria: 'VIC',
      'South Australia': 'SA',
      'Western Australia': 'WA',
      Tasmania: 'TAS',
      'Northern Territory': 'NT',
      'Australian Capital Territory': 'ACT',
      Australia: 'National',
    };

    for (const row of rows) {
      // Dynamically find the right columns
      const stateCol = headers.find(
        (h) => /state|jurisdiction|geography/i.test(h)
      );
      const valueCol = headers.find((h) => /value|rate|number/i.test(h));
      const yearCol = headers.find((h) => /year|period|time/i.test(h));
      const indigenousCol = headers.find(
        (h) => /indigenous|aboriginal|atsi/i.test(h)
      );
      const measureCol = headers.find(
        (h) => /measure|indicator|metric|variable/i.test(h)
      );
      const unitCol = headers.find((h) => /unit|measure_type/i.test(h));

      if (!valueCol) continue;

      const rawState = stateCol ? row[stateCol] : '';
      const state = stateMap[rawState] || rawState || 'National';
      const value = parseFloat(row[valueCol]);
      if (isNaN(value)) continue;

      const year = yearCol ? row[yearCol] : '';
      const indigenous = indigenousCol ? row[indigenousCol] : 'all';
      const measure = measureCol ? row[measureCol] : 'supervision_rate';
      const unit = unitCol ? row[unitCol] : 'rate_per_10000';

      // Map indigenous status
      let indigenousStatus = 'all';
      if (/indigenous|aboriginal|first nations/i.test(indigenous) && !/non/i.test(indigenous)) {
        indigenousStatus = 'indigenous';
      } else if (/non.?indigenous/i.test(indigenous)) {
        indigenousStatus = 'non_indigenous';
      }

      // Normalize financial year
      let financialYear = year;
      if (/^\d{4}$/.test(year)) {
        financialYear = `${year}-${(parseInt(year) + 1).toString().slice(2)}`;
      }

      stats.push({
        domain: 'youth_justice',
        metric: measure
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
        value,
        unit,
        state,
        indigenous_status: indigenousStatus,
        age_group: 'all',
        gender: 'all',
        financial_year: financialYear,
        source_name: 'Productivity Commission CTG',
        source_url: CTG_URL,
        notes: `Closing the Gap outcome 11 - Youth Justice. Measure: ${measure}`,
      });
    }

    console.log(`[ctg] Extracted ${stats.length} statistics from CSV`);
    return stats;
  } catch (err) {
    console.log(`[ctg] Error fetching CSV: ${err.message}`);
    return [];
  }
}

// ─── Insert ────────────────────────────────────────────────────────────────────

async function insertStats(stats) {
  if (stats.length === 0) {
    console.log('[insert] No stats to insert.');
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Batch insert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < stats.length; i += chunkSize) {
    const chunk = stats.slice(i, i + chunkSize);

    if (!applyMode) {
      console.log(`[insert] DRY-RUN: would insert ${chunk.length} rows (batch ${Math.floor(i / chunkSize) + 1})`);
      inserted += chunk.length;
      continue;
    }

    const { data, error } = await supabase.from('cross_system_stats').insert(chunk).select('id');

    if (error) {
      console.error(`[insert] Error on batch ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
      // Fall back to one-by-one
      for (const row of chunk) {
        const { error: rowErr } = await supabase.from('cross_system_stats').insert(row);
        if (rowErr) {
          console.error(`[insert]   Failed: ${row.metric}/${row.state} — ${rowErr.message}`);
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

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Migration
  await runMigration();

  // Step 2: Check if table exists by attempting a count
  console.log('\n[check] Verifying cross_system_stats table exists...');
  const { count, error: countErr } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error(`[check] Table not found or error: ${countErr.message}`);
    if (!migrateMode) {
      console.log('[check] Run with --migrate to create the table first.');
      console.log('[check] Or create it manually with this SQL:\n');
      console.log(CREATE_TABLE_SQL);
    }
    process.exit(1);
  }

  console.log(`[check] Table exists with ${count ?? 0} existing rows.`);

  // Step 3: Check for existing verified stats to avoid duplicates
  if (count > 0) {
    const { data: existing } = await supabase
      .from('cross_system_stats')
      .select('metric, state, financial_year, source_name')
      .limit(500);

    const existingKeys = new Set(
      (existing || []).map((r) => `${r.metric}|${r.state}|${r.financial_year}|${r.source_name}`)
    );

    const newVerified = VERIFIED_STATS.filter(
      (s) => !existingKeys.has(`${s.metric}|${s.state}|${s.financial_year}|${s.source_name}`)
    );
    const skippedCount = VERIFIED_STATS.length - newVerified.length;
    if (skippedCount > 0) {
      console.log(`[dedup] Skipping ${skippedCount} already-imported verified stats`);
    }
    VERIFIED_STATS.length = 0;
    VERIFIED_STATS.push(...newVerified);
  }

  // Step 4: Insert verified statistics
  console.log(`\n[verified] Inserting ${VERIFIED_STATS.length} verified statistics...`);
  for (const s of VERIFIED_STATS) {
    console.log(`  ${s.domain} / ${s.metric} / ${s.state} / ${s.indigenous_status} = ${s.value} ${s.unit}`);
  }
  const verifiedResult = await insertStats(VERIFIED_STATS);

  // Step 5: Fetch and parse Closing the Gap CSV
  console.log('\n');
  const ctgStats = await fetchClosingTheGapData();

  // Dedup CTG against existing
  let ctgToInsert = ctgStats;
  if (count > 0 && ctgStats.length > 0) {
    const { data: existing } = await supabase
      .from('cross_system_stats')
      .select('metric, state, financial_year, source_name')
      .eq('source_name', 'Productivity Commission CTG')
      .limit(5000);

    const existingKeys = new Set(
      (existing || []).map((r) => `${r.metric}|${r.state}|${r.financial_year}`)
    );

    ctgToInsert = ctgStats.filter(
      (s) => !existingKeys.has(`${s.metric}|${s.state}|${s.financial_year}`)
    );
    const ctgSkipped = ctgStats.length - ctgToInsert.length;
    if (ctgSkipped > 0) {
      console.log(`[dedup] Skipping ${ctgSkipped} already-imported CTG rows`);
    }
  }

  console.log(`\n[ctg] Inserting ${ctgToInsert.length} CTG statistics...`);
  const ctgResult = await insertStats(ctgToInsert);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Verified stats: ${verifiedResult.inserted} inserted, ${verifiedResult.errors} errors`);
  console.log(`CTG CSV stats:  ${ctgResult.inserted} inserted, ${ctgResult.errors} errors`);
  console.log(`Total:          ${verifiedResult.inserted + ctgResult.inserted} rows`);

  if (!applyMode) {
    console.log('\nDRY-RUN complete. Use --apply to write to DB.');
    console.log('Use --apply --migrate to also create the table.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
