#!/usr/bin/env node
/**
 * scrape-data-gaps.mjs
 *
 * Comprehensive scraper for JusticeHub data gaps. Fetches structured data
 * from Australian government open data portals and inserts into
 * alma_research_findings table.
 *
 * Usage:
 *   node scripts/scrape-data-gaps.mjs recidivism      # AIHW youth justice recidivism data
 *   node scripts/scrape-data-gaps.mjs federal-budget   # Federal PBS youth justice allocations
 *   node scripts/scrape-data-gaps.mjs child-protection # AIHW child protection crossover
 *   node scripts/scrape-data-gaps.mjs ndis-crossover   # NDIS + justice overlap data
 *   node scripts/scrape-data-gaps.mjs all              # Run all scrapers
 *   node scripts/scrape-data-gaps.mjs --dry-run all    # Preview without DB writes
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENV + SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      readFileSync(envPath, 'utf8')
        .split('\n')
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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const subcommand = args.filter((a) => !a.startsWith('--'))[0] || 'all';

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'JusticeHub-Research/1.0 (youth justice data aggregation)';

// Stats tracker
const stats = { inserted: 0, skipped: 0, errors: 0, sources_checked: 0 };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Generate a content hash for idempotent upserts */
function contentHash(title, sourceUrl) {
  return createHash('sha256')
    .update(`${title}||${sourceUrl || ''}`)
    .digest('hex')
    .substring(0, 16);
}

/** Fetch a URL with timeout and user-agent */
async function safeFetch(url, label, timeoutMs = 30000) {
  stats.sources_checked++;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.log(`  [SKIP] ${label} -- HTTP ${res.status}`);
      return null;
    }
    return res;
  } catch (e) {
    console.log(`  [ERROR] ${label}: ${e.message}`);
    stats.errors++;
    return null;
  }
}

/** Parse CSV text into array of objects. Handles quoted fields and multiline headers. */
function parseCSV(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parse header — handle quoted headers with commas/newlines
  const parseRow = (line) => {
    const fields = [];
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
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseRow(lines[0]).map((h) =>
    h.replace(/\r/g, '').replace(/\n/g, ' ').trim()
  );
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i]);
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = (vals[j] || '').replace(/\r/g, '').trim();
    }
    rows.push(obj);
  }

  return rows;
}

/** Fetch and parse CSV from a URL */
async function fetchCSV(url, label) {
  const res = await safeFetch(url, label);
  if (!res) return [];
  try {
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.log(`  [ERROR] Parse ${label}: ${e.message}`);
    stats.errors++;
    return [];
  }
}

/** Fetch JSON from a URL */
async function fetchJSON(url, label) {
  const res = await safeFetch(url, label);
  if (!res) return null;
  try {
    return await res.json();
  } catch (e) {
    console.log(`  [ERROR] Parse JSON ${label}: ${e.message}`);
    stats.errors++;
    return null;
  }
}

/** Insert a research finding with content-hash dedup */
async function insertFinding(title, data, sourceUrls, findingType = 'external_source') {
  const hash = contentHash(title, Array.isArray(sourceUrls) ? sourceUrls[0] : sourceUrls);
  const sources = Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls].filter(Boolean);

  const contentObj = {
    title: title.substring(0, 500),
    data: data,
    content_hash: hash,
    scraped_at: new Date().toISOString(),
  };

  if (dryRun) {
    console.log(`  [DRY] Would insert: ${title.substring(0, 80)}`);
    stats.skipped++;
    return true;
  }

  // Check for existing by content hash in title
  const { count } = await supabase
    .from('alma_research_findings')
    .select('*', { count: 'exact', head: true })
    .eq('content->>content_hash', hash);

  if (count > 0) {
    stats.skipped++;
    return false;
  }

  const { error } = await supabase.from('alma_research_findings').insert({
    finding_type: findingType,
    content: contentObj,
    sources: sources,
    confidence: 0.9,
    validated: true,
  });

  if (error) {
    if (error.code === '23505') {
      stats.skipped++;
      return false;
    }
    console.log(`  [WARN] Insert failed: ${error.message}`);
    stats.errors++;
    return false;
  }

  stats.inserted++;
  return true;
}

/** Search data.gov.au CKAN API */
async function searchCKAN(query, rows = 20) {
  const url = `https://data.gov.au/data/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=${rows}`;
  const data = await fetchJSON(url, `CKAN: "${query}"`);
  return data?.result?.results || [];
}

/** Process CKAN dataset — extract CSV resources and insert findings */
async function processCKANDataset(pkg, category) {
  const csvResources = (pkg.resources || []).filter(
    (r) => r.format?.toUpperCase() === 'CSV' && r.url
  );
  const xlsResources = (pkg.resources || []).filter(
    (r) => ['XLS', 'XLSX'].includes(r.format?.toUpperCase()) && r.url
  );

  // Always store dataset metadata
  const metaOk = await insertFinding(
    `${category}: ${pkg.title}`,
    {
      description: pkg.notes?.substring(0, 2000),
      organization: pkg.organization?.title,
      csv_resources: csvResources.map((r) => ({ name: r.name, url: r.url, size: r.size })),
      xls_resources: xlsResources.map((r) => ({ name: r.name, url: r.url, size: r.size })),
      tags: (pkg.tags || []).map((t) => t.name),
      metadata_created: pkg.metadata_created,
      metadata_modified: pkg.metadata_modified,
    },
    [`https://data.gov.au/dataset/${pkg.name}`],
    'external_source'
  );

  let dataInserted = 0;

  // Fetch each CSV resource
  for (const r of csvResources.slice(0, 5)) {
    const rows = await fetchCSV(r.url, `${category}: ${r.name || pkg.title}`);
    if (!rows.length) continue;

    const ok = await insertFinding(
      `${category} Data: ${r.name || pkg.title} (${rows.length} rows)`,
      {
        sample: rows.slice(0, 30),
        total_rows: rows.length,
        columns: Object.keys(rows[0]),
        resource_name: r.name,
        resource_url: r.url,
      },
      [r.url],
      'external_source'
    );
    if (ok) dataInserted++;
    await SLEEP(500);
  }

  return dataInserted + (metaOk ? 1 : 0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCRAPER: RECIDIVISM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeRecidivism() {
  console.log('\n========== RECIDIVISM DATA ==========');
  let total = 0;

  // 1. AIHW Youth Justice in Australia — data tables
  // AIHW publishes Excel/CSV data supplements alongside their reports
  console.log('\n  -- AIHW Youth Justice Data Tables --');

  const aihwDataUrls = [
    {
      url: 'https://www.aihw.gov.au/getmedia/b53e1a0a-b824-4c27-80d2-09082c94ea14/aihw-juv-140-data-tables.xlsx',
      label: 'AIHW Youth Justice 2023-24 data tables',
      source: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia/data',
    },
    {
      url: 'https://www.aihw.gov.au/getmedia/4b55e30a-39e8-45de-bf8e-58f4fccc62e2/aihw-juv-138-data-tables.xlsx',
      label: 'AIHW Youth Justice 2022-23 data tables',
      source: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia/data',
    },
  ];

  for (const ds of aihwDataUrls) {
    // XLSX files can't be parsed without a library — store metadata reference
    const res = await safeFetch(ds.url, ds.label, 10000);
    if (res) {
      const ok = await insertFinding(
        `AIHW Youth Justice Recidivism: ${ds.label}`,
        {
          description: 'AIHW Youth Justice in Australia annual data tables. Contains recidivism rates by state, Indigenous status, age, sex, and supervision type. XLSX format requires manual download.',
          download_url: ds.url,
          format: 'XLSX',
          coverage: 'National, all states and territories',
          key_metrics: [
            'Return to sentenced youth justice supervision within 12 months',
            'Return to sentenced supervision by Indigenous status',
            'Young people under supervision by state/territory',
            'Detention rates per 10,000 population',
            'Community-based supervision rates',
          ],
        },
        [ds.source, ds.url],
        'external_source'
      );
      if (ok) total++;
    }
    await SLEEP(500);
  }

  // 2. data.gov.au — search for recidivism/reoffending datasets
  console.log('\n  -- data.gov.au: Recidivism/Reoffending --');

  const recidivismQueries = [
    'youth justice recidivism',
    'juvenile reoffending rates',
    'youth detention return',
    'young offender supervision',
    'youth justice supervision',
  ];

  for (const query of recidivismQueries) {
    const datasets = await searchCKAN(query, 10);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      const count = await processCKANDataset(pkg, 'Recidivism');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 3. Productivity Commission ROGS — Youth Justice chapter
  console.log('\n  -- Productivity Commission ROGS --');

  const rogsUrls = [
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/rogs-2025-partf-section17-youth-justice-dataset.csv',
      label: 'ROGS 2025 Youth Justice Dataset',
    },
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice/rogs-2024-partf-section17-youth-justice-dataset.csv',
      label: 'ROGS 2024 Youth Justice Dataset',
    },
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/rogs-2025-partf-section17-youth-justice-data-tables.xlsx',
      label: 'ROGS 2025 Youth Justice Data Tables (XLSX)',
    },
  ];

  for (const ds of rogsUrls) {
    if (ds.url.endsWith('.csv')) {
      const rows = await fetchCSV(ds.url, ds.label);
      if (rows.length > 0) {
        // Look for recidivism-related rows
        const recidivismRows = rows.filter((r) => {
          const text = Object.values(r).join(' ').toLowerCase();
          return text.includes('return') || text.includes('recidiv') || text.includes('reoffend');
        });

        const ok = await insertFinding(
          `ROGS: ${ds.label} (${rows.length} rows, ${recidivismRows.length} recidivism-related)`,
          {
            total_rows: rows.length,
            columns: Object.keys(rows[0]),
            recidivism_rows: recidivismRows.slice(0, 50),
            all_sample: rows.slice(0, 20),
          },
          [ds.url],
          'external_source'
        );
        if (ok) total++;
        console.log(`  ${ds.label}: ${rows.length} rows (${recidivismRows.length} recidivism)`);
      }
    } else {
      // XLSX — store reference
      const res = await safeFetch(ds.url, ds.label, 10000);
      if (res) {
        const ok = await insertFinding(
          `ROGS: ${ds.label}`,
          {
            download_url: ds.url,
            format: 'XLSX',
            description: 'Productivity Commission Report on Government Services youth justice data tables. Contains recidivism rates, expenditure, and performance indicators.',
          },
          [ds.url],
          'external_source'
        );
        if (ok) total++;
      }
    }
    await SLEEP(500);
  }

  // 4. Closing the Gap — Target 11 (youth justice)
  console.log('\n  -- Closing the Gap Target 11 --');

  const ctgUrl = 'https://www.pc.gov.au/closing-the-gap-data/annual-data-report/data-downloads/adcr-2025-ctg11-youth-justice-dataset.csv';
  const ctgRows = await fetchCSV(ctgUrl, 'Closing the Gap Target 11');
  if (ctgRows.length > 0) {
    const ok = await insertFinding(
      `Closing the Gap Target 11: Youth Justice (${ctgRows.length} rows)`,
      {
        total_rows: ctgRows.length,
        columns: Object.keys(ctgRows[0]),
        sample: ctgRows.slice(0, 30),
        description: 'Closing the Gap Target 11: By 2031, reduce the rate of Aboriginal and Torres Strait Islander young people in detention by at least 30%. Data includes detention rates by Indigenous status and jurisdiction.',
      },
      [ctgUrl, 'https://www.pc.gov.au/closing-the-gap-data/annual-data-report'],
      'external_source'
    );
    if (ok) total++;
    console.log(`  Closing the Gap T11: ${ctgRows.length} rows`);
  }

  // 5. State-specific recidivism data
  console.log('\n  -- State Recidivism Data --');

  const stateRecidivism = [
    // NSW Bureau of Crime Statistics
    { url: 'https://www.bocsar.nsw.gov.au/Pages/bocsar_datasets/Datasets-.aspx', label: 'NSW BOCSAR Reoffending', storeAsRef: true },
    // QLD — Childrens Court annual reports have recidivism
    { url: 'https://www.data.qld.gov.au/api/3/action/package_search?q=youth+justice+recidivism&rows=5', label: 'QLD Recidivism', isCKAN: true },
    // VIC Sentencing Advisory Council
    { url: 'https://discover.data.vic.gov.au/api/3/action/package_search?q=youth+reoffending&rows=5', label: 'VIC Reoffending', isCKAN: true },
  ];

  for (const ds of stateRecidivism) {
    if (ds.isCKAN) {
      const data = await fetchJSON(ds.url, ds.label);
      const results = data?.result?.results || [];
      console.log(`  ${ds.label}: ${results.length} datasets`);
      for (const pkg of results) {
        const count = await processCKANDataset(pkg, 'State Recidivism');
        total += count;
        await SLEEP(500);
      }
    } else if (ds.storeAsRef) {
      const ok = await insertFinding(
        `Reference: ${ds.label}`,
        {
          description: `Reference to ${ds.label} data portal. Contains reoffending statistics for juveniles. Manual download required.`,
          portal_url: ds.url,
        },
        [ds.url],
        'external_source'
      );
      if (ok) total++;
    }
    await SLEEP(500);
  }

  console.log(`\n  Recidivism total: ${total} findings`);
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCRAPER: FEDERAL BUDGET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeFederalBudget() {
  console.log('\n========== FEDERAL BUDGET / PBS DATA ==========');
  let total = 0;

  // 1. data.gov.au — federal budget datasets
  console.log('\n  -- data.gov.au: Federal Budget --');

  const budgetQueries = [
    'youth justice funding federal',
    'attorney general youth',
    'juvenile justice appropriation',
    'indigenous justice federal budget',
    'social services youth',
    'closing the gap justice funding',
    'national indigenous australians agency justice',
  ];

  for (const query of budgetQueries) {
    const datasets = await searchCKAN(query, 10);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      // Filter for budget/funding related
      const text = `${pkg.title} ${pkg.notes || ''}`.toLowerCase();
      const relevant =
        text.includes('budget') ||
        text.includes('funding') ||
        text.includes('appropriation') ||
        text.includes('expenditure') ||
        text.includes('grant') ||
        text.includes('justice');

      if (!relevant) continue;

      const count = await processCKANDataset(pkg, 'Federal Budget');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 2. Known federal budget data URLs
  console.log('\n  -- Known Federal Budget Sources --');

  const federalSources = [
    {
      url: 'https://data.gov.au/data/api/3/action/package_show?id=budget-2024-25-tables-and-data',
      label: 'Federal Budget 2024-25 Tables',
      isCKANShow: true,
    },
    {
      url: 'https://data.gov.au/data/api/3/action/package_show?id=budget-2023-24-tables-and-data',
      label: 'Federal Budget 2023-24 Tables',
      isCKANShow: true,
    },
  ];

  for (const ds of federalSources) {
    if (ds.isCKANShow) {
      const data = await fetchJSON(ds.url, ds.label);
      if (data?.result) {
        const pkg = data.result;
        // Look for justice-related resources
        const justiceResources = (pkg.resources || []).filter((r) => {
          const name = (r.name || '').toLowerCase();
          return (
            name.includes('justice') ||
            name.includes('attorney') ||
            name.includes('indigenous') ||
            name.includes('social services') ||
            name.includes('community') ||
            name.includes('pmc')
          );
        });

        if (justiceResources.length > 0) {
          const ok = await insertFinding(
            `Federal Budget: ${pkg.title} (${justiceResources.length} justice-related resources)`,
            {
              description: pkg.notes?.substring(0, 2000),
              justice_resources: justiceResources.map((r) => ({
                name: r.name,
                url: r.url,
                format: r.format,
                size: r.size,
              })),
            },
            [`https://data.gov.au/dataset/${pkg.name}`],
            'external_source'
          );
          if (ok) total++;

          // Try to fetch CSV resources
          for (const r of justiceResources.filter((r) => r.format?.toUpperCase() === 'CSV').slice(0, 3)) {
            const rows = await fetchCSV(r.url, `Budget: ${r.name}`);
            if (rows.length > 0) {
              const ok2 = await insertFinding(
                `Federal Budget Data: ${r.name} (${rows.length} rows)`,
                { sample: rows.slice(0, 30), total_rows: rows.length, columns: Object.keys(rows[0]) },
                [r.url],
                'external_source'
              );
              if (ok2) total++;
            }
            await SLEEP(500);
          }
        }
        console.log(`  ${ds.label}: ${justiceResources.length} justice resources`);
      }
    }
    await SLEEP(500);
  }

  // 3. NIAA (National Indigenous Australians Agency) funding data
  console.log('\n  -- NIAA Funding --');

  const niaaQueries = ['national indigenous australians agency grants', 'indigenous advancement strategy'];
  for (const query of niaaQueries) {
    const datasets = await searchCKAN(query, 10);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      const count = await processCKANDataset(pkg, 'NIAA Funding');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 4. Known PBS/portfolio budget statement references
  console.log('\n  -- PBS References --');

  const pbsRefs = [
    {
      title: 'Attorney-General PBS 2024-25',
      url: 'https://www.ag.gov.au/about-us/publications/budget',
      description: 'Attorney-General Department Portfolio Budget Statements. Contains appropriations for justice programs including Legal Aid, family law, and criminal justice.',
    },
    {
      title: 'PM&C PBS 2024-25 (Indigenous Affairs)',
      url: 'https://www.niaa.gov.au/resource-centre/budget',
      description: 'NIAA Portfolio Budget Statements. Contains Indigenous Advancement Strategy funding including justice-related programs, Closing the Gap, and community safety.',
    },
    {
      title: 'Social Services PBS 2024-25',
      url: 'https://www.dss.gov.au/about-the-department/publications-articles-corporate-publications/budget-and-additional-estimates-statements',
      description: 'Department of Social Services Portfolio Budget Statements. Contains funding for family safety, community services, and youth programs.',
    },
  ];

  for (const ref of pbsRefs) {
    const ok = await insertFinding(
      `PBS Reference: ${ref.title}`,
      { description: ref.description, portal_url: ref.url, format: 'PDF (manual extraction required)' },
      [ref.url],
      'external_source'
    );
    if (ok) total++;
    await SLEEP(300);
  }

  console.log(`\n  Federal Budget total: ${total} findings`);
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCRAPER: CHILD PROTECTION CROSSOVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeChildProtection() {
  console.log('\n========== CHILD PROTECTION CROSSOVER ==========');
  let total = 0;

  // 1. AIHW Child Protection data
  console.log('\n  -- AIHW Child Protection --');

  const aihwCPUrls = [
    {
      url: 'https://www.aihw.gov.au/getmedia/ba3c5fee-4e41-4f3f-89ad-1fb0ab8dea8d/aihw-cws-78-data-tables.xlsx',
      label: 'AIHW Child Protection 2022-23 data tables',
      source: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia/data',
    },
    {
      url: 'https://www.aihw.gov.au/getmedia/d7ef52a8-4f59-4cf0-8ecd-867d82221a20/aihw-cws-82-data-tables.xlsx',
      label: 'AIHW Child Protection 2023-24 data tables',
      source: 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia/data',
    },
  ];

  for (const ds of aihwCPUrls) {
    const res = await safeFetch(ds.url, ds.label, 10000);
    if (res) {
      const ok = await insertFinding(
        `AIHW Child Protection: ${ds.label}`,
        {
          description: 'AIHW Child Protection Australia annual data tables. Contains notifications, investigations, substantiations, out-of-home care, and crossover with youth justice. XLSX format.',
          download_url: ds.url,
          format: 'XLSX',
          key_metrics: [
            'Children in out-of-home care by state',
            'Children subject to care and protection orders',
            'Substantiated abuse/neglect by type',
            'Aboriginal and Torres Strait Islander children in OOHC',
            'Crossover between child protection and youth justice',
            'Re-substantiation rates',
            'Children in residential care',
          ],
        },
        [ds.source, ds.url],
        'external_source'
      );
      if (ok) total++;
    }
    await SLEEP(500);
  }

  // 2. data.gov.au — child protection datasets
  console.log('\n  -- data.gov.au: Child Protection --');

  const cpQueries = [
    'child protection youth justice crossover',
    'out of home care youth justice',
    'child protection substantiation',
    'children care protection orders',
    'child safety youth justice',
  ];

  for (const query of cpQueries) {
    const datasets = await searchCKAN(query, 10);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      const count = await processCKANDataset(pkg, 'Child Protection');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 3. QLD crossover data (data.qld.gov.au)
  console.log('\n  -- QLD Crossover Children --');

  const qldCrossoverUrls = [
    'https://www.data.qld.gov.au/api/3/action/package_show?id=children-subject-to-supervised-youth-justice-orders-and-child-protection-orders',
    'https://www.data.qld.gov.au/api/3/action/package_search?q=child+protection+youth+justice&rows=10',
  ];

  for (const url of qldCrossoverUrls) {
    const data = await fetchJSON(url, 'QLD Crossover');
    if (!data?.result) continue;

    // package_show returns single result, package_search returns array
    const packages = data.result.results || [data.result];

    for (const pkg of packages) {
      if (!pkg.title) continue;
      const csvResources = (pkg.resources || []).filter(
        (r) => r.format?.toUpperCase() === 'CSV' && r.url
      );

      for (const r of csvResources) {
        const rows = await fetchCSV(r.url, `QLD: ${r.name || pkg.title}`);
        if (!rows.length) continue;

        const ok = await insertFinding(
          `QLD Crossover: ${r.name || pkg.title} (${rows.length} rows)`,
          {
            sample: rows.slice(0, 30),
            total_rows: rows.length,
            columns: Object.keys(rows[0]),
            dataset: pkg.title,
          },
          [r.url, `https://www.data.qld.gov.au/dataset/${pkg.name}`],
          'external_source'
        );
        if (ok) total++;
        console.log(`  QLD: ${r.name || pkg.title}: ${rows.length} rows`);
        await SLEEP(500);
      }
    }
  }

  // 4. State CKAN portals — child protection
  console.log('\n  -- State Portals: Child Protection --');

  const statePortals = [
    { state: 'NSW', url: 'https://data.nsw.gov.au/data/api/3/action/package_search?q=child+protection+youth+justice&rows=10' },
    { state: 'VIC', url: 'https://discover.data.vic.gov.au/api/3/action/package_search?q=child+protection+youth+justice&rows=10' },
    { state: 'SA', url: 'https://data.sa.gov.au/data/api/3/action/package_search?q=child+protection&rows=10' },
    { state: 'WA', url: 'https://catalogue.data.wa.gov.au/api/3/action/package_search?q=child+protection&rows=10' },
  ];

  for (const { state, url } of statePortals) {
    const data = await fetchJSON(url, `${state} Child Protection`);
    const results = data?.result?.results || [];
    console.log(`  [${state}]: ${results.length} datasets`);

    for (const pkg of results) {
      const count = await processCKANDataset(pkg, `${state} Child Protection`);
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 5. ROGS Child Protection data
  console.log('\n  -- ROGS Child Protection --');

  const rogsCPUrls = [
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/child-protection/rogs-2025-partf-section16-child-protection-dataset.csv',
      label: 'ROGS 2025 Child Protection Dataset',
    },
  ];

  for (const ds of rogsCPUrls) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (rows.length > 0) {
      // Find crossover-related rows
      const crossoverRows = rows.filter((r) => {
        const text = Object.values(r).join(' ').toLowerCase();
        return text.includes('justice') || text.includes('crossover') || text.includes('dual');
      });

      const ok = await insertFinding(
        `ROGS Child Protection: ${ds.label} (${rows.length} rows, ${crossoverRows.length} crossover-related)`,
        {
          total_rows: rows.length,
          columns: Object.keys(rows[0]),
          crossover_rows: crossoverRows.slice(0, 50),
          sample: rows.slice(0, 20),
        },
        [ds.url],
        'external_source'
      );
      if (ok) total++;
      console.log(`  ${ds.label}: ${rows.length} rows (${crossoverRows.length} crossover)`);
    }
    await SLEEP(500);
  }

  // 6. AIHW Crossover specific report
  console.log('\n  -- AIHW Crossover Report --');

  const crossoverReportUrl = 'https://www.aihw.gov.au/reports/child-protection/young-people-in-child-protection-youth-justice/data';
  const ok = await insertFinding(
    'AIHW: Young people in child protection and under youth justice supervision',
    {
      description: 'AIHW report on crossover between child protection and youth justice systems. Examines the proportion of young people under youth justice supervision who also had child protection involvement. Key finding: approximately 50% of young people in detention have had child protection involvement.',
      report_url: crossoverReportUrl,
      key_findings: [
        'Around 50% of young people in detention have child protection history',
        'Aboriginal and Torres Strait Islander children are disproportionately represented in both systems',
        'Children in residential care have highest rates of crossover to youth justice',
        'Early intervention in child protection reduces youth justice involvement',
      ],
    },
    [crossoverReportUrl],
    'external_source'
  );
  if (ok) total++;

  console.log(`\n  Child Protection total: ${total} findings`);
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCRAPER: NDIS CROSSOVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeNDISCrossover() {
  console.log('\n========== NDIS + JUSTICE CROSSOVER ==========');
  let total = 0;

  // 1. NDIS data at data.gov.au
  console.log('\n  -- data.gov.au: NDIS --');

  const ndisQueries = [
    'NDIS participants age',
    'NDIS disability justice',
    'NDIS young people',
    'national disability insurance scheme quarterly report',
  ];

  for (const query of ndisQueries) {
    const datasets = await searchCKAN(query, 10);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      const count = await processCKANDataset(pkg, 'NDIS');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  // 2. NDIS quarterly report CSVs (published by NDIA)
  console.log('\n  -- NDIA Quarterly Reports --');

  // NDIA publishes participant data broken down by age, disability, state
  const ndiaUrls = [
    {
      url: 'https://data.ndis.gov.au/data-downloads',
      label: 'NDIS Data Downloads Portal',
      storeAsRef: true,
    },
  ];

  // Try direct data.ndis.gov.au API
  const ndisDataUrl = 'https://data.ndis.gov.au/api/3/action/package_search?q=participants&rows=20';
  const ndisData = await fetchJSON(ndisDataUrl, 'NDIS Data Portal');
  if (ndisData?.result?.results) {
    for (const pkg of ndisData.result.results) {
      const count = await processCKANDataset(pkg, 'NDIS Participants');
      total += count;
      await SLEEP(500);
    }
  } else {
    // Portal might not have CKAN API — store reference
    const ok = await insertFinding(
      'NDIS Data Downloads Portal',
      {
        description: 'NDIA publishes quarterly participant data at data.ndis.gov.au. Includes breakdowns by age group (0-6, 7-14, 15-18, 19-24), disability type, state/territory, and plan utilisation. Youth (0-18) participants can be cross-referenced with youth justice data.',
        portal_url: 'https://data.ndis.gov.au/data-downloads',
        key_datasets: [
          'Participants by age group and state',
          'Participants by primary disability',
          'Participants by Indigenous status',
          'Plan utilisation rates',
          'Participant outcomes framework',
        ],
      },
      ['https://data.ndis.gov.au/data-downloads'],
      'external_source'
    );
    if (ok) total++;
  }

  // 3. NDIS-Justice crossover research
  console.log('\n  -- NDIS-Justice Research --');

  const crossoverFindings = [
    {
      title: 'NDIS-Justice Crossover: Cognitive Disability in Youth Detention',
      data: {
        description: 'Research indicates high rates of cognitive disability among young people in detention, many of whom are eligible for NDIS. Studies from multiple jurisdictions show 40-90% of young people in detention have a cognitive impairment or disability.',
        key_statistics: [
          '40-90% of youth in detention have cognitive impairment (varies by study/jurisdiction)',
          'Fetal Alcohol Spectrum Disorder (FASD) prevalence in youth detention: 36% (Banksia Hill study, WA)',
          'Intellectual disability prevalence in youth detention: 10-20x general population rate',
          'Speech/language disorder prevalence: up to 50% in youth detention',
          'Only a fraction of eligible youth in detention are NDIS participants',
        ],
        sources_cited: [
          'Bower et al. (2018) - FASD prevalence in Banksia Hill Detention Centre',
          'Frize et al. (2008) - Intellectual disability in youth detention',
          'Snow & Powell (2011) - Oral language competence in young offenders',
          'AIHW Youth Justice in Australia series',
        ],
      },
      sources: [
        'https://www.aihw.gov.au/reports/disability/people-with-disability-in-australia',
        'https://www.ndis.gov.au/about-us/publications/quarterly-reports',
      ],
    },
    {
      title: 'NDIS Justice Liaison Officers and Diversion',
      data: {
        description: 'Several states have implemented NDIS justice liaison programs to identify NDIS-eligible people in the justice system. These programs aim to divert people with disability away from custodial settings and into appropriate support.',
        programs: [
          { name: 'Justice Liaison Officer Program (NSW)', status: 'Active', target: 'Adults and young people with disability in contact with justice system' },
          { name: 'NDIS Justice Connect (VIC)', status: 'Active', target: 'People with disability in custodial settings' },
          { name: 'Disability Justice Strategy (QLD)', status: 'In development', target: 'People with disability across the justice continuum' },
        ],
      },
      sources: [
        'https://www.ndis.gov.au/understanding/ndis-and-other-government-services/justice',
      ],
    },
  ];

  for (const finding of crossoverFindings) {
    const ok = await insertFinding(
      finding.title,
      finding.data,
      finding.sources,
      'external_source'
    );
    if (ok) total++;
    await SLEEP(300);
  }

  // 4. AIHW Disability data
  console.log('\n  -- AIHW Disability --');

  const aihwDisabilityUrl = 'https://www.aihw.gov.au/reports/disability/people-with-disability-in-australia/data';
  const ok = await insertFinding(
    'AIHW: People with Disability in Australia - Justice Chapter',
    {
      description: 'AIHW report on people with disability, including a chapter on involvement with the justice system. Contains data on disability prevalence in prison/detention populations, victimisation rates, and access to justice.',
      report_url: aihwDisabilityUrl,
      key_metrics: [
        'Disability prevalence in prison population vs general population',
        'Young people with disability in youth detention',
        'Victimisation rates for people with disability',
        'Access to legal services for people with disability',
      ],
    },
    [aihwDisabilityUrl],
    'external_source'
  );
  if (ok) total++;

  // 5. FASD and justice data
  console.log('\n  -- FASD Research --');

  const fasdQueries = ['fetal alcohol spectrum disorder justice', 'FASD youth detention'];
  for (const query of fasdQueries) {
    const datasets = await searchCKAN(query, 5);
    console.log(`  "${query}": ${datasets.length} datasets`);

    for (const pkg of datasets) {
      const count = await processCKANDataset(pkg, 'FASD-Justice');
      total += count;
      await SLEEP(500);
    }
    await SLEEP(1000);
  }

  console.log(`\n  NDIS Crossover total: ${total} findings`);
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log('\n==================================================');
  console.log('  JusticeHub Data Gap Scraper');
  console.log('==================================================');
  console.log(`  Subcommand: ${subcommand}`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no DB writes)' : 'LIVE (writing to DB)'}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('==================================================');

  const results = {};

  const scrapers = {
    recidivism: scrapeRecidivism,
    'federal-budget': scrapeFederalBudget,
    'child-protection': scrapeChildProtection,
    'ndis-crossover': scrapeNDISCrossover,
  };

  if (subcommand === 'all') {
    for (const [name, fn] of Object.entries(scrapers)) {
      try {
        results[name] = await fn();
      } catch (e) {
        console.log(`\n  [FATAL] ${name}: ${e.message}`);
        results[name] = 0;
        stats.errors++;
      }
    }
  } else if (scrapers[subcommand]) {
    try {
      results[subcommand] = await scrapers[subcommand]();
    } catch (e) {
      console.log(`\n  [FATAL] ${subcommand}: ${e.message}`);
      results[subcommand] = 0;
      stats.errors++;
    }
  } else {
    console.log(`\n  Unknown subcommand: "${subcommand}"`);
    console.log('  Available: recidivism, federal-budget, child-protection, ndis-crossover, all');
    process.exit(1);
  }

  // Summary
  console.log('\n==================================================');
  console.log('  RESULTS SUMMARY');
  console.log('==================================================');
  for (const [name, count] of Object.entries(results)) {
    console.log(`  ${name.padEnd(25)} ${String(count).padStart(5)} findings`);
  }
  const totalFindings = Object.values(results).reduce((a, b) => a + b, 0);
  console.log('--------------------------------------------------');
  console.log(`  TOTAL                     ${String(totalFindings).padStart(5)} findings`);
  console.log(`  Sources checked:          ${String(stats.sources_checked).padStart(5)}`);
  console.log(`  Inserted:                 ${String(stats.inserted).padStart(5)}`);
  console.log(`  Skipped (dedup):          ${String(stats.skipped).padStart(5)}`);
  console.log(`  Errors:                   ${String(stats.errors).padStart(5)}`);
  console.log('==================================================');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
