#!/usr/bin/env node
/**
 * ASIC Directors Import Script
 *
 * Downloads ASIC company data from data.gov.au and imports director/officer
 * information for organizations in JusticeHub's database.
 *
 * All data MUST link to existing `organizations` records via ABN. No orphan data.
 *
 * Usage:
 *   node scripts/import-asic-directors.mjs --dry-run    # Preview
 *   node scripts/import-asic-directors.mjs --apply       # Write to DB
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, createWriteStream, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Env & Supabase setup ───────────────────────────────────

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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const dryRun = !applyMode; // --dry-run is default

// ── Import pure utility functions ──────────────────────────

// We inline a JS version of the TS utils here since the script runs as plain ESM.
// The canonical logic lives in src/lib/asic/asic-import-utils.ts and is tested there.

function normalizeABN(raw) {
  if (raw == null || raw === '') return null;
  const str = String(raw).replace(/\s+/g, '').trim();
  if (str.length === 0) return null;
  if (!/^\d{11}$/.test(str)) return null;
  return str;
}

function getField(row, ...candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key];
  }
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const match = rowKeys.find((k) => k.toLowerCase() === lower);
    if (match && row[match] !== undefined) return row[match];
  }
  return '';
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeName(raw) {
  if (!raw) return '';
  if (raw.includes(',')) {
    const [surname, ...rest] = raw.split(',');
    const first = rest.join(',').trim();
    if (first && surname) {
      return `${first} ${titleCase(surname.trim())}`;
    }
  }
  return raw;
}

function parseDate(raw) {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

function parseCompanyRow(row) {
  const rawABN = getField(row, 'ABN', 'abn');
  const abn = normalizeABN(rawABN);
  if (!abn) return null;
  return {
    abn,
    name: getField(row, 'Company Name', 'company_name').trim(),
    status: getField(row, 'Company Status', 'company_status').trim(),
    type: getField(row, 'Company Type', 'company_type').trim(),
  };
}

function parseOfficerRow(row) {
  const rawABN = getField(row, 'ABN', 'abn');
  const abn = normalizeABN(rawABN);
  if (!abn) return null;
  const rawName = getField(row, 'Officer Name', 'officer_name', 'Name').trim();
  if (!rawName) return null;
  const name = normalizeName(rawName);
  if (!name) return null;
  const role = getField(row, 'Officer Role', 'officer_role', 'Role').trim() || 'Director';
  const rawDate = getField(row, 'Date Appointed', 'date_appointed', 'Appointment Date');
  const appointed = parseDate(rawDate);
  return { abn, name, role, appointed };
}

function shouldSkipImport(acncData) {
  if (!acncData || typeof acncData !== 'object') return false;
  if (!acncData.asic_directors || typeof acncData.asic_directors !== 'object') return false;
  if (!acncData.asic_directors.updated_at) return false;
  const updatedAt = new Date(acncData.asic_directors.updated_at);
  if (isNaN(updatedAt.getTime())) return false;
  const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 7;
}

// ── CKAN API + CSV streaming ───────────────────────────────

const CKAN_API = 'https://data.gov.au/data/api/3/action/package_show?id=asic-companies';
const USER_AGENT = 'JusticeHub/1.0 (benjamin@act.place)';
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

async function discoverCSVResources() {
  console.log('  Querying CKAN API for ASIC dataset...');
  const res = await fetch(CKAN_API, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`CKAN API returned HTTP ${res.status}`);

  const data = await res.json();
  const resources = data.result?.resources || [];

  // Find CSV resources - we want company registration and officer data
  const csvResources = resources.filter(
    (r) => r.format?.toLowerCase() === 'csv' || r.url?.endsWith('.csv')
  );

  console.log(`  Found ${csvResources.length} CSV resources:`);
  for (const r of csvResources) {
    console.log(`    - ${r.name || r.description || 'unnamed'} (${r.format}) ${formatBytes(r.size || 0)}`);
  }

  return csvResources;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '?? MB';
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

/**
 * Stream a CSV from URL, calling onRow for each parsed row.
 * Filters in-flight so we never hold the full file in memory.
 */
async function streamCSV(url, onRow, label) {
  console.log(`  Downloading: ${label}...`);

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(5 * 60 * 1000), // 5 min timeout for large files
  });

  if (!res.ok) {
    console.log(`  [SKIP] ${label} - HTTP ${res.status}`);
    return 0;
  }

  let rowCount = 0;

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
      cast: false,
    });

    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        rowCount++;
        onRow(record, rowCount);

        // Progress log every 100K rows
        if (rowCount % 100000 === 0) {
          console.log(`    ... processed ${(rowCount / 1000).toFixed(0)}K rows`);
        }
      }
    });

    parser.on('error', (err) => {
      console.log(`  [WARN] CSV parse error in ${label}: ${err.message}`);
      // Don't reject - partial data is acceptable
      resolve(rowCount);
    });

    parser.on('end', () => resolve(rowCount));

    // Pipe the response body into the CSV parser
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) {
          parser.end();
          return;
        }
        parser.write(decoder.decode(value, { stream: true }));
        pump();
      }).catch((err) => {
        console.log(`  [WARN] Stream error: ${err.message}`);
        parser.end();
      });
    }
    pump();
  });
}

// ── Main logic ─────────────────────────────────────────────

async function main() {
  console.log(`\nASIC Directors Import`);
  console.log(`  Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY-RUN (preview only)'}\n`);

  // Step 1: Load all ABNs from organizations table
  console.log('Step 1: Loading organization ABNs from database...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, abn, acnc_data')
    .not('abn', 'is', null);

  if (orgError) {
    console.error(`  Failed to load organizations: ${orgError.message}`);
    process.exit(1);
  }

  // Build ABN -> org lookup
  const abnToOrg = new Map();
  let skippedRecent = 0;

  for (const org of orgs) {
    const abn = normalizeABN(org.abn);
    if (!abn) continue;

    // Check if recently imported (< 7 days)
    if (shouldSkipImport(org.acnc_data)) {
      skippedRecent++;
      continue;
    }

    abnToOrg.set(abn, { id: org.id, name: org.name, acnc_data: org.acnc_data || {} });
  }

  console.log(`  ${orgs.length} orgs loaded, ${abnToOrg.size} with valid ABNs (${skippedRecent} skipped - recent import)`);

  if (abnToOrg.size === 0) {
    console.log('  No organizations to match against. Exiting.');
    process.exit(0);
  }

  // Step 2: Discover ASIC CSV resources from CKAN
  console.log('\nStep 2: Discovering ASIC data files...');
  let csvResources;
  try {
    csvResources = await discoverCSVResources();
  } catch (err) {
    console.error(`  Failed to query CKAN API: ${err.message}`);
    process.exit(1);
  }

  if (csvResources.length === 0) {
    console.log('  No CSV resources found in ASIC dataset. Exiting.');
    process.exit(1);
  }

  // Step 3: Stream CSVs, collecting matched companies and officers
  console.log('\nStep 3: Streaming ASIC CSVs (filtering by ABN match)...');

  const matchedCompanies = new Map(); // abn -> ParsedCompany
  const matchedOfficers = new Map(); // abn -> ParsedOfficer[]
  let totalRows = 0;
  let totalBytes = 0;
  let filesProcessed = 0;

  for (const resource of csvResources) {
    const url = resource.url;
    const label = resource.name || resource.description || `Resource ${filesProcessed + 1}`;

    try {
      const rowCount = await streamCSV(url, (row) => {
        // Try to parse as company row
        const company = parseCompanyRow(row);
        if (company && abnToOrg.has(company.abn)) {
          matchedCompanies.set(company.abn, company);
        }

        // Try to parse as officer row
        const officer = parseOfficerRow(row);
        if (officer && abnToOrg.has(officer.abn)) {
          if (!matchedOfficers.has(officer.abn)) {
            matchedOfficers.set(officer.abn, []);
          }
          matchedOfficers.get(officer.abn).push(officer);
        }
      }, label);

      totalRows += rowCount;
      totalBytes += resource.size || 0;
      filesProcessed++;
      console.log(`  Completed: ${label} (${rowCount.toLocaleString()} rows)`);
    } catch (err) {
      console.log(`  [ERROR] Failed to process ${label}: ${err.message}`);
    }

    // Brief pause between files
    if (csvResources.indexOf(resource) < csvResources.length - 1) {
      await SLEEP(1000);
    }
  }

  // Merge companies and officers by ABN
  const allMatchedABNs = new Set([...matchedCompanies.keys(), ...matchedOfficers.keys()]);
  console.log(`\n  Processed ${filesProcessed} CSV files (${formatBytes(totalBytes)} total, ${totalRows.toLocaleString()} rows)`);
  console.log(`  Matched ${allMatchedABNs.size} companies to JH orgs by ABN`);

  let totalOfficerRecords = 0;
  for (const officers of matchedOfficers.values()) {
    totalOfficerRecords += officers.length;
  }
  console.log(`  Found ${totalOfficerRecords.toLocaleString()} director/officer records`);

  // Step 4: Build payloads and write to DB
  console.log('\nStep 4: Building payloads and updating organizations...');

  let updatedOrgs = 0;
  let failedOrgs = 0;

  // Collect data for overlap detection
  const orgDirectors = new Map(); // orgId -> { orgName, officers }

  for (const abn of allMatchedABNs) {
    const org = abnToOrg.get(abn);
    if (!org) continue;

    const company = matchedCompanies.get(abn) || { abn, name: org.name, status: 'Unknown', type: 'Unknown' };
    const officers = matchedOfficers.get(abn) || [];

    // Build the JSONB payload
    const seen = new Set();
    const uniqueOfficers = [];
    for (const officer of officers) {
      const key = `${officer.name.toLowerCase()}|${officer.role.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueOfficers.push({ name: officer.name, role: officer.role, appointed: officer.appointed });
    }

    const payload = {
      asic_directors: {
        officers: uniqueOfficers,
        company_status: company.status,
        company_type: company.type,
        updated_at: new Date().toISOString().split('T')[0],
      },
    };

    // Store for overlap detection
    orgDirectors.set(org.id, {
      orgName: org.name,
      officers: uniqueOfficers.map((o) => ({ name: o.name, role: o.role })),
    });

    if (dryRun) {
      if (updatedOrgs < 5) {
        console.log(`  [DRY-RUN] ${org.name} (ABN: ${abn}): ${uniqueOfficers.length} officers`);
        for (const o of uniqueOfficers.slice(0, 3)) {
          console.log(`    - ${o.name} (${o.role})`);
        }
        if (uniqueOfficers.length > 3) console.log(`    ... and ${uniqueOfficers.length - 3} more`);
      }
      updatedOrgs++;
    } else {
      // Merge with existing acnc_data
      const mergedData = { ...org.acnc_data, ...payload };

      const { error } = await supabase
        .from('organizations')
        .update({ acnc_data: mergedData })
        .eq('id', org.id);

      if (error) {
        console.log(`  [ERROR] Failed to update ${org.name}: ${error.message}`);
        failedOrgs++;
      } else {
        updatedOrgs++;
      }
    }
  }

  console.log(`  ${dryRun ? 'Would update' : 'Updated'} ${updatedOrgs} organizations${failedOrgs ? ` (${failedOrgs} failed)` : ''}`);

  // Step 5: Board overlap detection
  console.log('\nStep 5: Detecting board overlaps...');

  const personOrgs = new Map(); // normalizedName -> entries[]
  for (const [orgId, { orgName, officers }] of orgDirectors) {
    for (const officer of officers) {
      const key = officer.name.toLowerCase().trim();
      if (!key) continue;
      if (!personOrgs.has(key)) personOrgs.set(key, []);
      personOrgs.get(key).push({ orgId, orgName, role: officer.role, originalName: officer.name });
    }
  }

  const overlaps = [];
  for (const [, entries] of personOrgs) {
    const uniqueOrgs = new Map();
    for (const entry of entries) {
      if (!uniqueOrgs.has(entry.orgId)) {
        uniqueOrgs.set(entry.orgId, { name: entry.orgName, role: entry.role });
      }
    }
    if (uniqueOrgs.size >= 2) {
      overlaps.push({
        person: entries[0].originalName,
        orgs: Array.from(uniqueOrgs.values()),
        overlap_type: 'board_interlock',
        orgCount: uniqueOrgs.size,
      });
    }
  }

  const notableInterlocks = overlaps.filter((o) => o.orgCount >= 3);
  console.log(`  Found ${overlaps.length} board overlaps (person in 2+ orgs)`);
  console.log(`  -> ${notableInterlocks.length} notable interlocks (person in 3+ justice orgs)`);

  // Step 6: Store overlaps in alma_research_findings
  if (overlaps.length > 0 && applyMode) {
    console.log('\nStep 6: Storing board overlaps in alma_research_findings...');

    let insertedOverlaps = 0;
    for (const overlap of overlaps) {
      // Dedup: check if this overlap already exists by content
      const { count } = await supabase
        .from('alma_research_findings')
        .select('*', { count: 'exact', head: true })
        .eq('finding_type', 'evidence_link')
        .eq('content->>person', overlap.person)
        .eq('content->>overlap_type', 'board_interlock');

      if (count > 0) continue;

      const { error } = await supabase.from('alma_research_findings').insert({
        content: {
          person: overlap.person,
          orgs: overlap.orgs,
          overlap_type: 'board_interlock',
        },
        finding_type: 'evidence_link',
        confidence: overlap.orgCount >= 3 ? 0.95 : 0.8,
        validated: true,
        validation_source: 'asic_directors_import',
        sources: ['https://data.gov.au/data/dataset/asic-companies'],
      });

      if (error && error.code !== '23505') {
        console.log(`  [WARN] Failed to insert overlap for ${overlap.person}: ${error.message}`);
      } else {
        insertedOverlaps++;
      }
    }
    console.log(`  Inserted ${insertedOverlaps} new board overlap findings`);
  } else if (overlaps.length > 0 && dryRun) {
    console.log('\n  [DRY-RUN] Sample overlaps:');
    for (const overlap of overlaps.slice(0, 5)) {
      const orgNames = overlap.orgs.map((o) => `${o.name} (${o.role})`).join(', ');
      console.log(`    ${overlap.person}: ${orgNames}`);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log(`ASIC Import: Downloaded ${filesProcessed} CSV files (${formatBytes(totalBytes)} total)`);
  console.log(`  Matched ${allMatchedABNs.size} companies to JH orgs by ABN`);
  console.log(`  Imported ${totalOfficerRecords.toLocaleString()} director records`);
  console.log(`  Found ${overlaps.length} board overlaps (person in 2+ orgs)`);
  console.log(`  -> ${notableInterlocks.length} notable interlocks (person in 3+ justice orgs)`);
  if (dryRun) console.log('\n  (DRY-RUN mode - no database writes performed)');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
