#!/usr/bin/env node
/**
 * QLD Contract Disclosure Scraper
 *
 * Downloads and imports QLD government contract disclosure CSVs from data.qld.gov.au
 * into the state_tenders table. Sources include youth justice departments (across
 * 4 name changes), child safety, and corrective services.
 *
 * Usage:
 *   node scripts/scrape-qld-contracts.mjs                         # dry-run all
 *   node scripts/scrape-qld-contracts.mjs --apply                 # write to DB
 *   node scripts/scrape-qld-contracts.mjs --apply --dataset dyjvs # one dataset only
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

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
const datasetFilter = args.find((_, i) => args[i - 1] === '--dataset')?.toLowerCase();

// ─── Dataset definitions ───────────────────────────────────────────────────────

const DATASETS = [
  {
    key: 'dyjvs',
    source: 'qld_dyjvs_disclosure',
    label: 'DYJVS (Youth Justice & Victim Services, May 2025+)',
    department: 'Department of Youth Justice and Victim Services',
    ckanId: 'dyjvs-contract-disclosure-report',
    isYouthJustice: true,
  },
  {
    key: 'dyj',
    source: 'qld_dyj_disclosure',
    label: 'DYJ (Youth Justice, Apr 2024-Apr 2025)',
    department: 'Department of Youth Justice',
    ckanId: 'dyj-contract-disclosure-report',
    isYouthJustice: true,
  },
  {
    key: 'dcyjma',
    source: 'qld_dcyjma_disclosure',
    label: 'DCYJMA (Children, Youth Justice & Multicultural Affairs, Dec 2020-May 2023)',
    department: 'Department of Children, Youth Justice and Multicultural Affairs',
    ckanId: 'dcyjma-contract-disclosure-report',
    isYouthJustice: true,
  },
  {
    key: 'dcsyw',
    source: 'qld_dcsyw_disclosure',
    label: 'DCSYW (Child Safety, Youth & Women, pre-Dec 2020)',
    department: 'Department of Child Safety, Youth and Women',
    ckanId: 'dcsyw-contract-disclosure-report',
    isYouthJustice: true,
  },
  {
    key: 'dcssds',
    source: 'qld_dcssds_disclosure',
    label: 'DCSSDS (Child Safety, Seniors & Disability Services)',
    department: 'Department of Child Safety, Seniors and Disability Services',
    ckanId: 'dcssds-contract-disclosure-report',
    isYouthJustice: false,
  },
  {
    key: 'corrective',
    source: 'qld_corrective_disclosure',
    label: 'QLD Corrective Services',
    department: 'Queensland Corrective Services',
    ckanId: 'contract-disclosure-for-queensland-corrective-services',
    isYouthJustice: false,
  },
];

// ─── Justice keyword matching ──────────────────────────────────────────────────

const JUSTICE_KEYWORDS = [
  'youth justice', 'juvenile justice', 'youth detention', 'corrections',
  'justice services', 'court services', 'legal aid', 'community corrections',
  'probation', 'parole', 'diversion program', 'rehabilitation',
  'offender management', 'victim support', 'restorative justice',
  'bail support', 'reintegration', 'crime prevention', 'family violence',
  'domestic violence', 'child protection', 'out of home care',
  'Indigenous justice', 'Aboriginal justice', 'child safety',
  'foster care', 'detention', 'young people', 'young offend',
];

function classifyJusticeRelevance(text) {
  const lower = (text || '').toLowerCase();
  const matched = JUSTICE_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  return { isJusticeRelated: matched.length > 0, keywords: matched };
}

// ─── CSV parser ────────────────────────────────────────────────────────────────

// Known header fields that indicate a real header row
const HEADER_MARKERS = [
  'contract description', 'contract value', 'supplier name', 'supplier abn',
  'award contract date', 'contract title', 'procurement method', 'agency',
];

function isHeaderRow(fields) {
  const text = fields.map((f) => f.toLowerCase().trim()).join(' ');
  return HEADER_MARKERS.filter((m) => text.includes(m)).length >= 2;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseCSVLine(line));
  }

  if (rows.length < 2) return [];

  // Find the actual header row (skip preamble rows like "CONTRACT DISCLOSURE PUBLISHING TEMPLATE")
  let headerIdx = 0;
  if (!isHeaderRow(rows[0])) {
    for (let i = 1; i < Math.min(rows.length, 10); i++) {
      if (isHeaderRow(rows[i])) {
        headerIdx = i;
        break;
      }
    }
  }

  const headers = rows[headerIdx].map((h) => h.trim());
  // If headers have fewer than 3 meaningful columns, likely not a real CSV
  if (headers.filter((h) => h.length > 0).length < 3) return [];

  const records = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const fields = rows[i];
    if (fields.length === 0 || (fields.length === 1 && !fields[0].trim())) continue;
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = (fields[j] || '').trim();
    }
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ─── Field mapping ─────────────────────────────────────────────────────────────

function parseDollarValue(val) {
  if (!val) return null;
  // Strip $, commas, spaces, handle parentheses for negatives
  let cleaned = val.replace(/[$,\s]/g, '');
  if (/^\(.*\)$/.test(cleaned)) {
    cleaned = '-' + cleaned.replace(/[()]/g, '');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val) {
  if (!val) return null;
  // Try common AU date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  let match;
  if ((match = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) {
    const [, d, m, y] = match;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  if ((match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    const date = new Date(`${val}T00:00:00Z`);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  // Try native parsing as last resort
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

function generateSourceId(source, record, index) {
  // Look for a contract/reference number field
  const refFields = [
    'Contract Reference', 'Contract No', 'Contract Number', 'Contract ID',
    'Reference', 'Ref No', 'QTMS Number', 'Standing Offer Number',
    'Reference Number', 'Contract Ref',
  ];
  for (const f of refFields) {
    if (record[f] && record[f].trim()) {
      return `${source}_${record[f].trim()}`;
    }
  }
  // Fallback: hash all non-empty fields for uniqueness
  const allVals = Object.values(record).filter((v) => v && v.trim()).join('|');
  const hash = createHash('md5').update(allVals).digest('hex').slice(0, 16);
  return `${source}_${hash}`;
}

function findField(record, candidates) {
  for (const c of candidates) {
    // Exact match first
    if (record[c] !== undefined && record[c] !== '') return record[c];
  }
  // Case-insensitive fallback
  const keys = Object.keys(record);
  for (const c of candidates) {
    const lower = c.toLowerCase();
    const key = keys.find((k) => k.toLowerCase() === lower);
    if (key && record[key] !== '') return record[key];
  }
  // Partial match
  for (const c of candidates) {
    const lower = c.toLowerCase();
    const key = keys.find((k) => k.toLowerCase().includes(lower));
    if (key && record[key] !== '') return record[key];
  }
  return null;
}

function mapRecord(record, dataset, resourceUrl) {
  const title = findField(record, [
    'Contract Title', 'Contract Description', 'Description', 'Title',
    'Contract Name', 'Standing Offer Arrangement Title',
  ]);
  if (!title) return null; // skip empty rows

  const supplierName = findField(record, [
    'Supplier', 'Supplier Name', 'Vendor Name', 'Contractor',
    'Supplier/Contractor', 'Awarded To', 'Contractor Name',
  ]);
  const supplierAbn = findField(record, [
    'Supplier ABN', 'ABN', 'Vendor ABN', 'Contractor ABN',
  ]);
  const contractValue = parseDollarValue(findField(record, [
    'Contract Value', 'Total Value', 'Value', 'Estimated Value',
    'Contract Amount', 'Amount', 'Total Contract Value',
    'Approved Contract Value', 'Original Contract Value',
  ]));
  const awardDate = parseDate(findField(record, [
    'Award Date', 'Awarded Date', 'Contract Start Date', 'Start Date',
    'Date Awarded', 'Execution Date', 'Contract Award Date',
    'Contract Commencement Date', 'Commencement Date',
  ]));
  const publishDate = parseDate(findField(record, [
    'Published Date', 'Date Published', 'Publish Date',
  ]));
  const category = findField(record, [
    'Category', 'UNSPSC Description', 'Category Description',
    'Procurement Method', 'Procurement Category',
  ]);
  const procurementMethod = findField(record, [
    'Procurement Method', 'Method', 'Sourcing Method',
    'Procurement Type', 'Method of Procurement',
  ]);

  const description = findField(record, [
    'Description', 'Contract Description', 'Scope', 'Details',
    'Additional Description',
  ]);

  // Build a text blob for justice classification
  const textBlob = [title, description, category].filter(Boolean).join(' ');
  const { isJusticeRelated, keywords } = dataset.isYouthJustice
    ? { isJusticeRelated: true, keywords: ['youth justice'] }
    : classifyJusticeRelevance(textBlob);

  const sourceId = generateSourceId(dataset.source, record, 0);

  return {
    source: dataset.source,
    source_id: sourceId,
    title: title.slice(0, 1000),
    description: description ? description.slice(0, 2000) : (procurementMethod ? `Procurement method: ${procurementMethod}` : null),
    contract_value: contractValue,
    status: 'awarded',
    state: 'QLD',
    buyer_name: dataset.department,
    buyer_department: dataset.department,
    supplier_name: supplierName || null,
    supplier_abn: supplierAbn ? supplierAbn.replace(/\s/g, '') : null,
    published_date: publishDate || awardDate,
    awarded_date: awardDate,
    is_justice_related: isJusticeRelated,
    justice_keywords: keywords.length > 0 ? keywords : null,
    source_url: resourceUrl,
  };
}

// ─── Main pipeline ─────────────────────────────────────────────────────────────

async function fetchCKANResources(ckanId) {
  const url = `https://www.data.qld.gov.au/api/3/action/package_show?id=${ckanId}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!resp.ok) throw new Error(`CKAN ${resp.status}: ${url}`);
  const data = await resp.json();
  if (!data.success) throw new Error(`CKAN returned success=false for ${ckanId}`);
  return data.result.resources || [];
}

async function downloadCSV(url) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  const buffer = await resp.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Detect XLSX/ZIP (PK header) or other binary files
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4B) {
    throw new Error('File is XLSX/ZIP, not CSV');
  }
  // Detect XLS (MS Office compound document)
  if (bytes.length >= 8 && bytes[0] === 0xD0 && bytes[1] === 0xCF) {
    throw new Error('File is XLS binary, not CSV');
  }
  const text = new TextDecoder('utf-8').decode(bytes);
  // Sanity check: if text has too many null bytes, it's binary
  if ((text.match(/\0/g) || []).length > 10) {
    throw new Error('File appears to be binary, not CSV');
  }
  // Cap at ~50K lines to avoid processing corrupted files with junk data
  const lines = text.split(/\r?\n/);
  if (lines.length > 50000) {
    return lines.slice(0, 50000).join('\n');
  }
  return text;
}

async function processDataset(dataset) {
  console.log(`\n📂 ${dataset.label}`);
  console.log(`   CKAN: ${dataset.ckanId}`);

  let resources;
  try {
    resources = await fetchCKANResources(dataset.ckanId);
  } catch (err) {
    console.log(`   ❌ Failed to fetch CKAN metadata: ${err.message}`);
    return { dataset: dataset.key, records: 0, resources: 0, errors: 1 };
  }

  const csvResources = resources.filter(
    (r) => (r.format || '').toUpperCase() === 'CSV' || (r.url || '').toLowerCase().endsWith('.csv')
  );
  console.log(`   📄 ${csvResources.length} CSV resources found (of ${resources.length} total)`);

  if (csvResources.length === 0) {
    return { dataset: dataset.key, records: 0, resources: 0, errors: 0 };
  }

  let totalRecords = 0;
  let totalErrors = 0;

  for (const resource of csvResources) {
    const resourceName = resource.name || resource.url.split('/').pop();
    let csvText;
    try {
      csvText = await downloadCSV(resource.url);
    } catch (err) {
      console.log(`   ⚠️  Failed to download ${resourceName}: ${err.message}`);
      totalErrors++;
      continue;
    }

    const records = parseCSV(csvText);
    if (records.length === 0) {
      console.log(`   ⚠️  Empty CSV: ${resourceName}`);
      continue;
    }

    // Log headers from first CSV for debugging
    if (totalRecords === 0) {
      console.log(`   📋 Headers: ${Object.keys(records[0]).join(', ')}`);
    }

    const rawMapped = records
      .map((r) => mapRecord(r, dataset, resource.url))
      .filter(Boolean);

    // Deduplicate by source_id (keep last occurrence, which is the most recent)
    const seenIds = new Map();
    for (const rec of rawMapped) {
      seenIds.set(rec.source_id, rec);
    }
    const mapped = [...seenIds.values()];

    const dupes = rawMapped.length - mapped.length;
    console.log(`   ✅ ${resourceName}: ${records.length} rows -> ${mapped.length} mapped${dupes > 0 ? ` (${dupes} dupes removed)` : ''}`);
    totalRecords += mapped.length;

    if (applyMode && mapped.length > 0) {
      // Batch upsert
      const batchSize = 50;
      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        const { error } = await supabase
          .from('state_tenders')
          .upsert(batch, { onConflict: 'source,source_id' });
        if (error) {
          console.log(`   ❌ DB error (batch ${Math.floor(i / batchSize) + 1}): ${error.message}`);
          totalErrors++;
        }
      }
    }
  }

  return { dataset: dataset.key, records: totalRecords, resources: csvResources.length, errors: totalErrors };
}

async function main() {
  console.log('🏛️  QLD Contract Disclosure Scraper');
  console.log(`   Mode: ${applyMode ? '🟢 APPLY (writing to DB)' : '🔵 DRY RUN (preview only)'}`);
  if (datasetFilter) console.log(`   Filter: ${datasetFilter}`);
  console.log('');

  const datasets = datasetFilter
    ? DATASETS.filter((d) => d.key === datasetFilter)
    : DATASETS;

  if (datasets.length === 0) {
    console.log(`❌ Unknown dataset: ${datasetFilter}`);
    console.log(`   Available: ${DATASETS.map((d) => d.key).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const dataset of datasets) {
    const result = await processDataset(dataset);
    results.push(result);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  let totalAll = 0;
  for (const r of results) {
    console.log(`   ${r.dataset.padEnd(12)} ${String(r.records).padStart(6)} records  ${String(r.resources).padStart(3)} CSVs  ${r.errors > 0 ? `❌ ${r.errors} errors` : '✅'}`);
    totalAll += r.records;
  }
  console.log(`${'─'.repeat(60)}`);
  console.log(`   TOTAL${String(totalAll).padStart(15)} records`);
  if (!applyMode) {
    console.log('\n   💡 Run with --apply to write to database');
  }
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
