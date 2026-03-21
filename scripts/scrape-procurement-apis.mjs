#!/usr/bin/env node
/**
 * Procurement API Scraper — AusTender (Federal) + NSW eTendering
 *
 * Queries open contracting APIs for contracts matching JusticeHub organization ABNs,
 * and inserts results into justice_funding with proper org linkage.
 *
 * Usage:
 *   node scripts/scrape-procurement-apis.mjs austender          # Federal AusTender OCDS (dry-run)
 *   node scripts/scrape-procurement-apis.mjs nsw                # NSW eTendering (dry-run)
 *   node scripts/scrape-procurement-apis.mjs all                # Both sources (dry-run)
 *   node scripts/scrape-procurement-apis.mjs austender --apply   # Write to DB
 *   node scripts/scrape-procurement-apis.mjs all --apply         # Write all to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Environment ──────────────────────────────────────────────────────────────

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
    } catch { /* ignore */ }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const subcommand = (args.find(a => !a.startsWith('--')) || 'all').toLowerCase();
const applyMode = args.includes('--apply');
// --dry-run is the default; --apply overrides it

if (!['austender', 'nsw', 'all'].includes(subcommand)) {
  console.log('Usage: node scripts/scrape-procurement-apis.mjs [austender|nsw|all] [--apply]');
  console.log('  Default mode is dry-run. Use --apply to write to DB.');
  process.exit(1);
}

// ── Justice Keywords ─────────────────────────────────────────────────────────

const JUSTICE_KEYWORDS = [
  'youth justice', 'juvenile justice', 'youth detention', 'corrections',
  'justice services', 'court services', 'legal aid', 'community corrections',
  'probation', 'parole', 'diversion program', 'rehabilitation',
  'offender management', 'victim support', 'restorative justice',
  'bail support', 'reintegration', 'crime prevention', 'family violence',
  'domestic violence', 'child protection', 'out of home care',
  'Indigenous justice', 'Aboriginal justice',
];

// ── Helper Functions ─────────────────────────────────────────────────────────

function normalizeABN(abn) {
  if (!abn) return null;
  const cleaned = abn.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  if (cleaned.length !== 11) return null;
  return cleaned;
}

function deriveFinancialYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  if (month >= 6) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

function isJusticeRelated(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const matched = JUSTICE_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
  return { relevant: matched.length > 0, keywords: matched };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateDateRanges(startDate, endDate, chunkMonths) {
  const ranges = [];
  const current = new Date(startDate);
  while (current < endDate) {
    const chunkEnd = new Date(current);
    chunkEnd.setMonth(chunkEnd.getMonth() + chunkMonths);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());
    ranges.push({
      start: current.toISOString().split('T')[0],
      end: chunkEnd.toISOString().split('T')[0],
    });
    current.setTime(chunkEnd.getTime());
    current.setDate(current.getDate() + 1);
  }
  return ranges;
}

// ── Org Loading ──────────────────────────────────────────────────────────────

async function loadOrgABNMap() {
  console.log('Loading organizations with ABNs...');
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, abn, state')
    .not('abn', 'is', null)
    .neq('abn', '');

  if (error) {
    console.error('Failed to load organizations:', error.message);
    return { abnMap: new Map(), nameMap: new Map() };
  }

  const abnMap = new Map();
  const nameMap = new Map();
  for (const org of (orgs || [])) {
    const cleaned = normalizeABN(org.abn);
    if (cleaned) {
      abnMap.set(cleaned, org);
    }
    // Also build a name lookup (lowercase) for fallback matching
    if (org.name) {
      nameMap.set(org.name.toLowerCase().trim(), org);
    }
  }

  console.log(`  Loaded ${abnMap.size} orgs with valid ABNs, ${nameMap.size} with names`);
  return { abnMap, nameMap };
}

function findOrg(abnMap, nameMap, supplierABN, supplierName) {
  // 1. ABN match (primary)
  if (supplierABN) {
    const cleaned = normalizeABN(supplierABN);
    if (cleaned && abnMap.has(cleaned)) {
      return abnMap.get(cleaned);
    }
  }

  // 2. Name match (fallback) — exact case-insensitive
  if (supplierName) {
    const key = supplierName.toLowerCase().trim();
    if (nameMap.has(key)) {
      return nameMap.get(key);
    }
  }

  return null;
}

// ── OCDS Release Parsing ─────────────────────────────────────────────────────
//
// Actual AusTender OCDS structure:
//   release.parties[] — each has roles (supplier/procuringEntity), additionalIdentifiers [{id, scheme:"AU-ABN"}], address.region
//   release.awards[] — suppliers [{id, name}] reference party IDs
//   release.contracts[] — id is CN number, value.amount, description, dateSigned
//   release.tender.id — internal ocid, NOT the CN number

function parseOCDSRelease(release) {
  const results = [];

  // Build party lookup by ID
  const partyMap = new Map();
  for (const party of (release.parties || [])) {
    partyMap.set(party.id, party);
  }

  // Find buyer (procuringEntity)
  const buyerParty = (release.parties || []).find(p => p.roles?.includes('procuringEntity'));
  const buyerName = buyerParty?.name || null;

  // Get CN ID from contracts[0].id or fallback
  const contractEntries = release.contracts || [];
  const cnId = contractEntries[0]?.id || release.ocid || release.id || 'unknown';

  // Get contract value and description from contracts[]
  const contractValue = contractEntries[0]?.value?.amount
    ? parseFloat(contractEntries[0].value.amount)
    : null;
  const contractDescription = contractEntries[0]?.description || '';
  const contractDate = contractEntries[0]?.dateSigned || release.date || null;

  if (!release.awards || release.awards.length === 0) return results;

  for (const award of release.awards) {
    for (const supplierRef of (award.suppliers || [])) {
      // Look up full party details
      const party = partyMap.get(supplierRef.id);

      // Extract ABN from additionalIdentifiers
      const abnEntry = (party?.additionalIdentifiers || [])
        .find(ai => ai.scheme === 'AU-ABN');
      const abn = abnEntry?.id || null;

      results.push({
        cn_id: cnId,
        title: contractDescription || award.title || '',
        description: contractDescription,
        supplier_name: supplierRef.name || party?.name || null,
        supplier_abn: abn,
        supplier_state: party?.address?.region || null,
        amount: contractValue,
        award_date: award.date || contractDate,
        buyer_name: buyerName,
        source_url: `https://www.tenders.gov.au/?event=public.cn.view&CNUUID=${cnId}`,
      });
    }
  }

  return results;
}

// ── Funding Record Builder ───────────────────────────────────────────────────

function buildFundingRecord(source, contract, orgId) {
  return {
    source,
    source_statement_id: `${source}:${contract.cn_id}`,
    recipient_name: contract.supplier_name,
    recipient_abn: normalizeABN(contract.supplier_abn),
    amount_dollars: contract.amount,
    alma_organization_id: orgId,
    funding_type: 'contract',
    program_name: contract.title || null,
    project_description: contract.description || null,
    state: contract.supplier_state || null,
    sector: source === 'austender-direct' ? 'federal' : 'nsw',
    financial_year: deriveFinancialYear(contract.award_date),
    source_url: contract.source_url || null,
  };
}

// ── AusTender OCDS API ───────────────────────────────────────────────────────

async function fetchAusTenderUrl(url) {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.log(`    AusTender API returned ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.log(`    AusTender fetch error: ${err.message}`);
    return null;
  }
}

async function fetchAusTenderDateRange(startDate, endDate, maxPages = 10) {
  // API requires ISO 8601 UTC format: YYYY-MM-DDTHH:Mi:SSZ
  const startISO = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const endISO = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
  let url = `https://api.tenders.gov.au/ocds/findByDates/contractPublished/${startISO}/${endISO}`;

  const allReleases = [];
  let page = 0;

  while (url && page < maxPages) {
    const data = await fetchAusTenderUrl(url);
    if (!data) break;

    const releases = data.releases || [];
    allReleases.push(...releases);
    page++;

    // Follow cursor-based pagination via links.next
    const nextUrl = data.links?.next;
    if (nextUrl && releases.length >= 100) {
      url = nextUrl;
      await sleep(1000); // Rate limit
    } else {
      url = null;
    }
  }

  return allReleases;
}

async function scrapeAusTender(abnMap, nameMap) {
  console.log('\n--- AusTender (Federal OCDS API) ---');
  console.log('Querying api.tenders.gov.au for published contracts...\n');

  const allContracts = [];
  let totalFetched = 0;

  // Query last 6 months in 1-month chunks
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  const ranges = generateDateRanges(startDate, endDate, 1);

  for (const range of ranges) {
    console.log(`  Fetching ${range.start} to ${range.end}...`);
    const releases = await fetchAusTenderDateRange(range.start, range.end);

    if (releases.length === 0) {
      console.log('    No data returned');
      continue;
    }

    console.log(`    Got ${releases.length} releases`);
    totalFetched += releases.length;

    for (const release of releases) {
      const parsed = parseOCDSRelease(release);
      allContracts.push(...parsed);
    }

    await sleep(1000); // Rate limit between date ranges
  }

  // If OCDS API returned nothing, try the data.gov.au fallback
  if (totalFetched === 0) {
    console.log('\n  OCDS API returned no results. Trying data.gov.au AusTender dataset...');
    const fallbackContracts = await fetchAusTenderDataGov(abnMap);
    allContracts.push(...fallbackContracts);
  }

  console.log(`\n  Total contracts parsed: ${allContracts.length}`);
  return { contracts: allContracts, totalFetched };
}

async function fetchAusTenderDataGov(abnMap) {
  // Fallback: query the AusTender dataset on data.gov.au
  const datasetUrl = 'https://data.gov.au/data/api/3/action/package_show?id=austender-contract-notice';
  const contracts = [];

  try {
    console.log('  Querying data.gov.au for AusTender dataset metadata...');
    const response = await fetch(datasetUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.log(`    data.gov.au returned ${response.status}`);
      return contracts;
    }

    const data = await response.json();
    const resources = data?.result?.resources || [];

    // Find the most recent CSV resource
    const csvResources = resources
      .filter(r => r.format?.toLowerCase() === 'csv' || r.url?.endsWith('.csv'))
      .sort((a, b) => (b.last_modified || '').localeCompare(a.last_modified || ''));

    if (csvResources.length === 0) {
      console.log('    No CSV resources found in AusTender dataset');
      return contracts;
    }

    // Download the first (most recent) CSV — but it might be huge
    // Just try the first few KB to see the format
    const csvUrl = csvResources[0].url;
    console.log(`  Downloading CSV: ${csvUrl.substring(0, 80)}...`);

    const csvResponse = await fetch(csvUrl, {
      signal: AbortSignal.timeout(60_000),
      headers: { 'Range': 'bytes=0-1048576' }, // First 1MB only
    });

    if (!csvResponse.ok && csvResponse.status !== 206) {
      console.log(`    CSV download returned ${csvResponse.status}`);
      return contracts;
    }

    const csvText = await csvResponse.text();
    const lines = csvText.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase()) || [];

    // Find column indices
    const cnIdx = headers.findIndex(h => h.includes('cn_id') || h.includes('contract_notice'));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('description'));
    const supplierIdx = headers.findIndex(h => h.includes('supplier'));
    const abnIdx = headers.findIndex(h => h.includes('abn'));
    const valueIdx = headers.findIndex(h => h.includes('value') || h.includes('amount'));
    const dateIdx = headers.findIndex(h => h.includes('publish') || h.includes('start_date'));
    const stateIdx = headers.findIndex(h => h.includes('state') || h.includes('region'));
    const agencyIdx = headers.findIndex(h => h.includes('agency') || h.includes('buyer'));

    console.log(`    CSV has ${lines.length} lines, columns: ${headers.slice(0, 8).join(', ')}`);

    // ABN set for quick matching
    const abnSet = new Set(abnMap.keys());

    // Parse rows (skip header)
    let matchCount = 0;
    for (let i = 1; i < lines.length && i < 50000; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles basic quoting)
      const cols = parseCSVLine(line);

      const supplierABN = abnIdx >= 0 ? normalizeABN(cols[abnIdx]) : null;

      // Only keep contracts where supplier ABN matches one of our orgs
      if (supplierABN && abnSet.has(supplierABN)) {
        matchCount++;
        contracts.push({
          cn_id: cnIdx >= 0 ? (cols[cnIdx] || '').replace(/"/g, '').trim() : `datagov-${i}`,
          title: titleIdx >= 0 ? (cols[titleIdx] || '').replace(/"/g, '').trim() : '',
          description: '',
          supplier_name: supplierIdx >= 0 ? (cols[supplierIdx] || '').replace(/"/g, '').trim() : null,
          supplier_abn: supplierABN,
          supplier_state: stateIdx >= 0 ? (cols[stateIdx] || '').replace(/"/g, '').trim() : null,
          amount: valueIdx >= 0 ? parseFloat((cols[valueIdx] || '0').replace(/[^0-9.]/g, '')) || null : null,
          award_date: dateIdx >= 0 ? (cols[dateIdx] || '').replace(/"/g, '').trim() : null,
          buyer_name: agencyIdx >= 0 ? (cols[agencyIdx] || '').replace(/"/g, '').trim() : null,
          source_url: cnIdx >= 0 ? `https://www.tenders.gov.au/?event=public.cn.view&CNUUID=${(cols[cnIdx] || '').replace(/"/g, '').trim()}` : null,
        });
      }
    }

    console.log(`    Found ${matchCount} contracts matching JH org ABNs`);
  } catch (err) {
    console.log(`    data.gov.au fallback error: ${err.message}`);
  }

  return contracts;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
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

// ── NSW eTendering ───────────────────────────────────────────────────────────

async function scrapeNSW(abnMap, nameMap) {
  console.log('\n--- NSW eTendering ---');
  console.log('Querying tenders.nsw.gov.au...\n');

  const allContracts = [];
  let totalFetched = 0;

  // Try NSW eTendering API
  const apiBase = 'https://tenders.nsw.gov.au';
  const searchTerms = [
    'youth justice', 'juvenile justice', 'corrections',
    'legal aid', 'child protection', 'community corrections',
  ];

  for (const term of searchTerms) {
    console.log(`  Searching NSW for: "${term}"...`);

    // Try the API endpoint
    try {
      const url = `${apiBase}/?event=public.api.search.view&keyword=${encodeURIComponent(term)}&type=contract_notice&status=closed`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          const data = await response.json();
          const releases = data.releases || data.results || (Array.isArray(data) ? data : []);
          console.log(`    API returned ${releases.length} results`);
          totalFetched += releases.length;

          for (const release of releases) {
            const parsed = parseOCDSRelease(release);
            allContracts.push(...parsed);
          }
        } else {
          console.log(`    API returned ${contentType} (not JSON), skipping`);
        }
      } else {
        console.log(`    API returned ${response.status}`);
      }
    } catch (err) {
      console.log(`    NSW API error: ${err.message}`);
    }

    await sleep(1000);
  }

  // Fallback: try data.nsw.gov.au CKAN for contract datasets
  if (totalFetched === 0) {
    console.log('\n  NSW API returned no results. Trying data.nsw.gov.au CKAN...');
    const fallbackContracts = await fetchNSWDataPortal(abnMap);
    allContracts.push(...fallbackContracts);
  }

  console.log(`\n  Total NSW contracts parsed: ${allContracts.length}`);
  return { contracts: allContracts, totalFetched };
}

async function fetchNSWDataPortal(abnMap) {
  const contracts = [];

  // Search data.nsw.gov.au for contract/tender datasets
  const searchUrl = 'https://data.nsw.gov.au/data/api/3/action/package_search?q=contracts+tenders+justice&rows=5';

  try {
    console.log('  Searching data.nsw.gov.au for contract datasets...');
    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.log(`    data.nsw.gov.au returned ${response.status}`);
      return contracts;
    }

    const data = await response.json();
    const datasets = data?.result?.results || [];
    console.log(`    Found ${datasets.length} datasets`);

    for (const dataset of datasets) {
      console.log(`    Dataset: ${dataset.title || dataset.name}`);
      const csvResources = (dataset.resources || [])
        .filter(r => r.format?.toLowerCase() === 'csv')
        .slice(0, 1);

      for (const resource of csvResources) {
        try {
          console.log(`      Downloading: ${resource.url?.substring(0, 60)}...`);
          const csvResp = await fetch(resource.url, {
            signal: AbortSignal.timeout(30_000),
            headers: { 'Range': 'bytes=0-524288' }, // First 512KB
          });

          if (!csvResp.ok && csvResp.status !== 206) continue;

          const csvText = await csvResp.text();
          const lines = csvText.split('\n');
          if (lines.length < 2) continue;

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
          const abnIdx = headers.findIndex(h => h.includes('abn'));
          const nameIdx = headers.findIndex(h => h.includes('supplier') || h.includes('contractor') || h.includes('vendor'));
          const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('description') || h.includes('contract'));
          const valueIdx = headers.findIndex(h => h.includes('value') || h.includes('amount'));
          const dateIdx = headers.findIndex(h => h.includes('date'));

          const abnSet = new Set(abnMap.keys());
          for (let i = 1; i < lines.length && i < 10000; i++) {
            const cols = parseCSVLine(lines[i]);
            const supplierABN = abnIdx >= 0 ? normalizeABN(cols[abnIdx]) : null;

            if (supplierABN && abnSet.has(supplierABN)) {
              contracts.push({
                cn_id: `nsw-data-${dataset.name}-${i}`,
                title: titleIdx >= 0 ? (cols[titleIdx] || '').replace(/"/g, '').trim() : '',
                description: '',
                supplier_name: nameIdx >= 0 ? (cols[nameIdx] || '').replace(/"/g, '').trim() : null,
                supplier_abn: supplierABN,
                supplier_state: 'NSW',
                amount: valueIdx >= 0 ? parseFloat((cols[valueIdx] || '0').replace(/[^0-9.]/g, '')) || null : null,
                award_date: dateIdx >= 0 ? (cols[dateIdx] || '').replace(/"/g, '').trim() : null,
                buyer_name: 'NSW Government',
                source_url: `https://data.nsw.gov.au/data/dataset/${dataset.name}`,
              });
            }
          }
        } catch (err) {
          console.log(`      CSV fetch error: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.log(`    data.nsw.gov.au error: ${err.message}`);
  }

  if (contracts.length > 0) {
    console.log(`    Found ${contracts.length} contracts matching JH org ABNs`);
  }

  return contracts;
}

// ── Main Orchestrator ────────────────────────────────────────────────────────

async function processContracts(source, contracts, abnMap, nameMap) {
  const stats = {
    total: contracts.length,
    matched: 0,
    justiceRelated: 0,
    inserted: 0,
    skipped: 0,
    totalDollars: 0,
  };

  const recordsToInsert = [];

  for (const contract of contracts) {
    // Find matching org
    const org = findOrg(abnMap, nameMap, contract.supplier_abn, contract.supplier_name);
    if (org) stats.matched++;

    // Check justice relevance
    const { relevant, keywords } = isJusticeRelated(contract.title, contract.description);

    // We insert ALL contracts that match our org ABNs regardless of justice relevance
    // But we track justice-related ones separately for reporting
    if (relevant) stats.justiceRelated++;

    // CRITICAL RULE: All records MUST link to organizations via alma_organization_id
    // We still insert records with ABN but no org match — the sprint agent will link later
    const orgId = org?.id || null;

    const record = buildFundingRecord(source, contract, orgId);

    if (!applyMode) {
      const orgTag = org ? '[LINKED]' : '[unlinked]';
      const justiceTag = relevant ? ' JUSTICE' : '';
      const value = record.amount_dollars
        ? `$${(record.amount_dollars / 1000).toFixed(0)}K`
        : 'N/A';
      console.log(`  ${orgTag}${justiceTag} ${record.recipient_name || 'Unknown'} — ${record.program_name?.substring(0, 50) || 'N/A'} (${value})`);
    }

    recordsToInsert.push(record);
    if (record.amount_dollars) stats.totalDollars += record.amount_dollars;
  }

  if (applyMode && recordsToInsert.length > 0) {
    // Insert one-by-one with existence check (partial unique index doesn't support upsert)
    for (const record of recordsToInsert) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('justice_funding')
        .select('id')
        .eq('source', record.source)
        .eq('source_statement_id', record.source_statement_id)
        .maybeSingle();

      if (existing) {
        stats.skipped++;
        continue;
      }

      const { error } = await supabase
        .from('justice_funding')
        .insert(record);

      if (error) {
        console.log(`  Insert error: ${error.message}`);
        stats.skipped++;
      } else {
        stats.inserted++;
      }
    }
  }

  return stats;
}

async function main() {
  console.log('\n=== Procurement API Scraper ===');
  console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
  console.log(`Source: ${subcommand}`);
  console.log('');

  // Load org ABN map
  const { abnMap, nameMap } = await loadOrgABNMap();

  if (abnMap.size === 0) {
    console.log('No organizations with ABNs found. Nothing to match against.');
    process.exit(0);
  }

  const results = {};

  // AusTender
  if (subcommand === 'austender' || subcommand === 'all') {
    const { contracts, totalFetched } = await scrapeAusTender(abnMap, nameMap);
    const stats = await processContracts('austender-direct', contracts, abnMap, nameMap);
    results.austender = { ...stats, totalFetched };
  }

  // NSW eTendering
  if (subcommand === 'nsw' || subcommand === 'all') {
    const { contracts, totalFetched } = await scrapeNSW(abnMap, nameMap);
    const stats = await processContracts('nsw-etender', contracts, abnMap, nameMap);
    results.nsw = { ...stats, totalFetched };
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('');

  for (const [source, stats] of Object.entries(results)) {
    const label = source === 'austender' ? 'AusTender' : 'NSW eTendering';
    console.log(`${label}: Fetched ${stats.totalFetched} releases, ${stats.total} contracts parsed, ${stats.matched} match JH orgs, ${stats.justiceRelated} justice-related`);
    if (applyMode) {
      const dollars = stats.totalDollars >= 1_000_000
        ? `$${(stats.totalDollars / 1_000_000).toFixed(1)}M`
        : `$${(stats.totalDollars / 1_000).toFixed(0)}K`;
      console.log(`  -> Inserted ${stats.inserted} new funding records (${dollars} total)`);
      if (stats.skipped > 0) console.log(`  -> Skipped/errors: ${stats.skipped}`);
    }
  }

  if (!applyMode) {
    console.log('\nDRY RUN -- no changes written. Use --apply to insert.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
