#!/usr/bin/env node
/**
 * Supplier Annual Report Scraper
 *
 * Extracts financial data from ACNC profiles (local DB + web) and annual reports
 * for top QLD youth justice contract suppliers.
 *
 * Strategy:
 *   1. Look up supplier in local acnc_charities + organizations tables
 *   2. Extract acnc_data JSONB fields (revenue, expenses, employees, size)
 *   3. If local data is sparse, try Jina Reader on the supplier's website
 *   4. Insert findings into cross_system_stats with domain='accountability'
 *
 * Usage:
 *   node scripts/scrape-supplier-reports.mjs              # dry-run
 *   node scripts/scrape-supplier-reports.mjs --apply       # write to DB
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

const applyMode = process.argv.includes('--apply');

// ─── Suppliers ──────────────────────────────────────────────────────────────────

const SUPPLIERS = [
  {
    name: 'Life Without Barriers',
    searchNames: ['Life Without Barriers'],
    contractValue: 337_000_000,
    indigenous: false,
    annualReportUrl: 'https://www.lwb.org.au/about-us/annual-report/',
  },
  {
    name: 'Churches of Christ in Queensland',
    searchNames: ['Churches of Christ in Queensland', 'Churches of Christ'],
    contractValue: 310_000_000,
    indigenous: false,
    annualReportUrl: 'https://cofc.com.au/about-us/annual-report/',
  },
  {
    name: 'UnitingCare Community',
    searchNames: ['UnitingCare Community', 'UnitingCare Queensland'],
    contractValue: 229_000_000,
    indigenous: false,
    annualReportUrl: 'https://www.unitingcareqld.com.au/about-us/annual-report',
  },
  {
    name: 'Act for Kids',
    searchNames: ['Act for Kids'],
    contractValue: 218_000_000,
    indigenous: false,
    annualReportUrl: 'https://www.actforkids.com.au/about-us/annual-report/',
  },
  {
    name: 'IFYS Limited',
    searchNames: ['IFYS Limited', 'IFYS'],
    contractValue: 188_000_000,
    indigenous: false,
    annualReportUrl: 'https://ifys.com.au/about/annual-report/',
  },
];

// MAX 5 Jina requests total
const MAX_JINA_REQUESTS = 5;
let jinaCount = 0;
const JINA_DELAY_MS = 1500;

// ─── Jina Reader ────────────────────────────────────────────────────────────────

async function extractWithJina(url) {
  if (jinaCount >= MAX_JINA_REQUESTS) {
    console.log(`  [jina] Quota reached (${MAX_JINA_REQUESTS}) — skipping`);
    return null;
  }
  jinaCount++;
  console.log(`  [jina ${jinaCount}/${MAX_JINA_REQUESTS}] Fetching: ${url.slice(0, 80)}...`);

  try {
    const headers = { Accept: 'text/plain' };
    if (env.JINA_API_KEY) {
      headers.Authorization = `Bearer ${env.JINA_API_KEY}`;
    }

    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers,
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.warn(`  [jina] HTTP ${response.status} for ${url.slice(0, 60)}`);
      return null;
    }

    const text = await response.text();
    // Strip Jina metadata header
    const lines = text.split('\n');
    const contentStart = lines.findIndex((l, i) => i > 0 && l.trim() === '') + 1;
    const body = contentStart > 1 ? lines.slice(contentStart).join('\n').trim() : text.trim();

    if (body.length < 100) {
      console.log(`  [jina] Content too short (${body.length} chars) — skipping`);
      return null;
    }
    console.log(`  [jina] Extracted ${body.length} chars`);
    return body;
  } catch (err) {
    console.warn(`  [jina] Error: ${err.message}`);
    return null;
  }
}

// ─── Local DB Lookups ───────────────────────────────────────────────────────────

async function lookupACNC(searchNames) {
  for (const name of searchNames) {
    const { data, error } = await supabase
      .from('acnc_charities')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(3);

    if (error) {
      console.log(`  [acnc] Error: ${error.message}`);
      continue;
    }
    if (data && data.length > 0) return data[0];
  }
  return null;
}

async function lookupOrganization(searchNames, abn) {
  // Try by ABN first
  if (abn) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn, state, is_indigenous_org, acnc_data, website')
      .eq('abn', abn)
      .limit(1);
    if (data && data.length > 0) return data[0];
  }

  // Fall back to name
  for (const name of searchNames) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn, state, is_indigenous_org, acnc_data, website')
      .ilike('name', `%${name}%`)
      .limit(3);
    if (data && data.length > 0) return data[0];
  }
  return null;
}

// ─── Financial Data Parsers ─────────────────────────────────────────────────────

/**
 * Parse dollar amounts from text. Handles formats like:
 *   $1,234,567  |  $1.2 billion  |  $234.5 million
 */
function parseDollarAmounts(text) {
  const amounts = [];

  // Match $X,XXX,XXX or $X,XXX,XXX.XX patterns
  const exactPattern = /\$\s?([\d,]+(?:\.\d{1,2})?)/g;
  let match;
  while ((match = exactPattern.exec(text)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ''));
    if (num > 0) amounts.push(num);
  }

  // Match "$X.X billion" / "$X.X million" patterns
  const scalePattern = /\$\s?([\d.]+)\s*(billion|million|m|b)\b/gi;
  while ((match = scalePattern.exec(text)) !== null) {
    const num = parseFloat(match[1]);
    const scale = match[2].toLowerCase();
    const multiplier = (scale === 'billion' || scale === 'b') ? 1e9 : 1e6;
    if (num > 0) amounts.push(num * multiplier);
  }

  return amounts;
}

/**
 * Extract structured financial metrics from web-scraped annual report text.
 */
function parseAnnualReportText(text) {
  const result = {
    totalRevenue: null,
    totalExpenses: null,
    employeeCount: null,
    charitySize: null,
    govGrantsPct: null,
    financialYear: null,
  };

  const normalized = text.replace(/\s+/g, ' ');

  // --- Total Revenue ---
  const revenuePatterns = [
    /total\s+(?:gross\s+)?(?:revenue|income)\s*[\s:$]*\$?\s?([\d,]+(?:\.\d{1,2})?)/i,
    /(?:revenue|income)\s*[\s:$]*\$?\s?([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const pat of revenuePatterns) {
    const m = normalized.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 100_000) {
        result.totalRevenue = val;
        break;
      }
    }
  }

  // --- Total Expenses ---
  const expensePatterns = [
    /total\s+(?:gross\s+)?expense[s]?\s*[\s:$]*\$?\s?([\d,]+(?:\.\d{1,2})?)/i,
    /expense[s]?\s*[\s:$]*\$?\s?([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const pat of expensePatterns) {
    const m = normalized.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 100_000) {
        result.totalExpenses = val;
        break;
      }
    }
  }

  // --- Employee Count ---
  const employeePatterns = [
    /(?:number\s+of\s+)?(?:full[- ]time\s+)?employee[s]?\s*[\s:]*(\d[\d,]*)/i,
    /(\d[\d,]*)\s+(?:full[- ]time\s+)?employee[s]?/i,
    /staff\s*[\s:]*(\d[\d,]*)/i,
    /(\d[\d,]*)\s+staff/i,
  ];
  for (const pat of employeePatterns) {
    const m = normalized.match(pat);
    if (m) {
      const val = parseInt(m[1].replace(/,/g, ''), 10);
      if (val >= 5 && val < 100_000) {
        result.employeeCount = val;
        break;
      }
    }
  }

  // --- Charity Size ---
  const sizeMatch = normalized.match(/(?:charity\s+)?size\s*[\s:]*\s*(extra[_ ]?large|large|medium|small)/i);
  if (sizeMatch) {
    result.charitySize = sizeMatch[1].toLowerCase().replace(/[_ ]/g, '_');
  }

  // --- Government Grants Percentage ---
  const govPctPatterns = [
    /government\s+(?:grants?|funding)\s*[\s:]*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:from\s+)?government/i,
  ];
  for (const pat of govPctPatterns) {
    const m = normalized.match(pat);
    if (m) {
      const pct = parseFloat(m[1]);
      if (pct > 0 && pct <= 100) {
        result.govGrantsPct = pct;
        break;
      }
    }
  }

  // --- Financial Year ---
  const fyMatch = normalized.match(/(?:financial\s+year|FY|fy)\s*[\s:]*\s*(\d{4}(?:[-\/]\d{2,4})?)/i)
    || normalized.match(/(\d{4})\s*[-\u2013]\s*(\d{2,4})/);
  if (fyMatch) {
    let fy = fyMatch[0].replace(/financial\s+year\s*/i, '').trim();
    const yearMatch = fy.match(/(\d{4})\s*[-\u2013\/]\s*(\d{2,4})/);
    if (yearMatch) {
      const startYear = yearMatch[1];
      let endYear = yearMatch[2];
      if (endYear.length === 4) endYear = endYear.slice(2);
      result.financialYear = `${startYear}-${endYear}`;
    }
  }

  // --- Fallback: large dollar amounts ---
  if (!result.totalRevenue && !result.totalExpenses) {
    const allAmounts = parseDollarAmounts(text).filter(a => a > 1_000_000);
    allAmounts.sort((a, b) => b - a);
    if (allAmounts.length >= 2) {
      result.totalRevenue = allAmounts[0];
      result.totalExpenses = allAmounts[1];
    } else if (allAmounts.length === 1) {
      result.totalRevenue = allAmounts[0];
    }
  }

  return result;
}

/**
 * Extract data from the acnc_data JSONB field on organizations.
 */
function parseACNCData(acncData) {
  if (!acncData || typeof acncData !== 'object') return null;

  const result = {
    totalRevenue: null,
    totalExpenses: null,
    employeeCount: null,
    charitySize: null,
    govGrantsPct: null,
    financialYear: null,
    responsiblePersons: null,
    beneficiaries: null,
  };

  const d = acncData;

  // Revenue (not typically in our acnc_data, but check anyway)
  if (d.total_revenue) result.totalRevenue = parseFloat(d.total_revenue);
  else if (d.revenue) result.totalRevenue = parseFloat(d.revenue);

  // Expenses
  if (d.total_expenses) result.totalExpenses = parseFloat(d.total_expenses);

  // Employees
  if (d.employees) result.employeeCount = parseInt(d.employees, 10);
  else if (d.employee_count) result.employeeCount = parseInt(d.employee_count, 10);

  // Size
  if (d.charity_size) result.charitySize = d.charity_size.toLowerCase().replace(/\s+/g, '_');

  // Responsible persons (board members)
  if (d.responsible_persons) result.responsiblePersons = parseInt(d.responsible_persons, 10);

  // Beneficiaries
  if (d.beneficiaries && Array.isArray(d.beneficiaries)) {
    result.beneficiaries = d.beneficiaries;
  }

  // Financial year
  if (d.financial_year) result.financialYear = d.financial_year;

  const hasData = Object.values(result).some(v => v !== null);
  return hasData ? result : null;
}

/**
 * Extract data from the acnc_charities table row.
 */
function parseACNCCharityRow(row) {
  if (!row) return null;

  const result = {
    charitySize: null,
    responsiblePersons: null,
    operatesInQLD: false,
    beneficiaries: [],
    purposes: [],
  };

  if (row.charity_size) {
    result.charitySize = row.charity_size.toLowerCase().replace(/\s+/g, '_');
  }

  if (row.number_of_responsible_persons) {
    result.responsiblePersons = parseInt(row.number_of_responsible_persons, 10);
  }

  result.operatesInQLD = row.operates_in_qld === true || row.operates_in_qld === 'Y';

  // Collect beneficiaries
  const benFields = Object.keys(row).filter(k => k.startsWith('ben_'));
  for (const field of benFields) {
    if (row[field] === true || row[field] === 'Y') {
      result.beneficiaries.push(field.replace('ben_', ''));
    }
  }

  // Collect purposes
  const purposeFields = Object.keys(row).filter(k => k.startsWith('purpose_'));
  for (const field of purposeFields) {
    if (row[field] === true || row[field] === 'Y') {
      result.purposes.push(field.replace('purpose_', ''));
    }
  }

  return result;
}

// ─── Process a Single Supplier ────────────────────────────────────────────────

async function processSupplier(supplier) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Processing: ${supplier.name} ($${(supplier.contractValue / 1e6).toFixed(0)}M in QLD contracts)`);
  console.log('='.repeat(70));

  const findings = [];
  const baseFields = {
    domain: 'accountability',
    state: 'QLD',
    indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
    financial_year: '2024-25',
  };

  // Step 1: Look up in local ACNC charities table (full row with all boolean fields)
  console.log('\n  [1] Looking up ACNC charities table...');
  const acnc = await lookupACNC(supplier.searchNames);
  let abn = null;
  let charityRow = null;

  if (acnc) {
    console.log(`  [acnc] Found: ${acnc.name}`);
    console.log(`  [acnc] ABN: ${acnc.abn || 'N/A'} | Size: ${acnc.charity_size || 'N/A'} | State: ${acnc.state || 'N/A'}`);
    abn = acnc.abn;
    charityRow = parseACNCCharityRow(acnc);
    if (charityRow) {
      console.log(`  [acnc] Size: ${charityRow.charitySize || 'N/A'} | Board: ${charityRow.responsiblePersons || 'N/A'} | QLD ops: ${charityRow.operatesInQLD}`);
      console.log(`  [acnc] Beneficiaries: ${charityRow.beneficiaries.join(', ') || 'none'}`);
      console.log(`  [acnc] Purposes: ${charityRow.purposes.join(', ') || 'none'}`);
    }
  } else {
    console.log('  [acnc] Not found in ACNC charities table');
  }

  // Step 2: Look up in organizations table (has acnc_data JSONB)
  console.log('\n  [2] Looking up organizations table...');
  const org = await lookupOrganization(supplier.searchNames, abn);
  let acncData = null;

  if (org) {
    console.log(`  [org] Found: ${org.name} (ABN: ${org.abn || 'N/A'})`);
    console.log(`  [org] Website: ${org.website || 'N/A'}`);

    if (org.acnc_data) {
      acncData = parseACNCData(org.acnc_data);
      if (acncData) {
        console.log(`  [org] acnc_data parsed — size: ${acncData.charitySize || 'N/A'}, board: ${acncData.responsiblePersons || 'N/A'}`);
        if (acncData.beneficiaries) {
          console.log(`  [org] acnc_data beneficiaries: ${acncData.beneficiaries.join(', ')}`);
        }
      }
    }
  } else {
    console.log('  [org] Not found in organizations table');
  }

  // Merge data from both sources (acnc_data JSONB + acnc_charities row)
  const charitySize = acncData?.charitySize || charityRow?.charitySize || null;
  const responsiblePersons = acncData?.responsiblePersons || charityRow?.responsiblePersons || null;
  const totalRevenue = acncData?.totalRevenue || null;
  const totalExpenses = acncData?.totalExpenses || null;
  const employeeCount = acncData?.employeeCount || null;
  const beneficiaries = acncData?.beneficiaries || charityRow?.beneficiaries || [];
  const servesYouth = beneficiaries.some(b => /youth|children|early_childhood/i.test(b));
  const servesIndigenous = beneficiaries.some(b => /aboriginal|indigenous|tsi/i.test(b));
  const servesJustice = beneficiaries.some(b => /pre_post_release|victims_of_crime/i.test(b));

  const sourceUrl = abn ? `https://www.acnc.gov.au/charity/${abn}` : null;
  const sourceName = 'ACNC Register + Organizations DB';

  // Step 3: Try Jina on annual report URL (only if we have no revenue/expenses)
  let jinaSource = null;
  if (!totalRevenue && !totalExpenses && !employeeCount && supplier.annualReportUrl && jinaCount < MAX_JINA_REQUESTS) {
    console.log(`\n  [3] Fetching annual report via Jina...`);
    const content = await extractWithJina(supplier.annualReportUrl);
    if (content) {
      const webData = parseAnnualReportText(content);
      jinaSource = { name: 'Annual Report (web)', url: supplier.annualReportUrl };
      if (webData.totalRevenue || webData.totalExpenses || webData.employeeCount) {
        console.log(`  [jina] Parsed — revenue: ${webData.totalRevenue ? '$' + (webData.totalRevenue/1e6).toFixed(1) + 'M' : 'N/A'}, employees: ${webData.employeeCount || 'N/A'}`);
      }
      // Add Jina-sourced findings directly
      if (webData.totalRevenue) {
        findings.push({ ...baseFields, metric: 'supplier_total_revenue', value: webData.totalRevenue, unit: 'dollars',
          source_name: jinaSource.name, source_url: jinaSource.url,
          notes: `${supplier.name} — total revenue from annual report. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M` });
      }
      if (webData.totalExpenses) {
        findings.push({ ...baseFields, metric: 'supplier_total_expenses', value: webData.totalExpenses, unit: 'dollars',
          source_name: jinaSource.name, source_url: jinaSource.url,
          notes: `${supplier.name} — total expenses from annual report` });
      }
      if (webData.employeeCount) {
        findings.push({ ...baseFields, metric: 'supplier_employee_count', value: webData.employeeCount, unit: 'count',
          source_name: jinaSource.name, source_url: jinaSource.url,
          notes: `${supplier.name} — employee headcount from annual report` });
      }
    }
  }

  // Build findings from local DB data
  if (!charitySize && !responsiblePersons && !totalRevenue && !totalExpenses && findings.length === 0) {
    console.log('\n  [result] No usable data found for this supplier');
    return findings;
  }

  console.log('\n  [result] Building findings:');

  if (charitySize) {
    const sizeMap = { small: 1, medium: 2, large: 3, extra_large: 4 };
    findings.push({
      ...baseFields,
      metric: 'supplier_charity_size',
      value: sizeMap[charitySize] || 0,
      unit: 'categorical',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — charity size: ${charitySize}. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
    console.log(`    charity_size: ${charitySize} (${sizeMap[charitySize]})`);
  }

  if (responsiblePersons) {
    findings.push({
      ...baseFields,
      metric: 'supplier_board_size',
      value: responsiblePersons,
      unit: 'count',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — number of responsible persons (board/governance). QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
    console.log(`    board_size: ${responsiblePersons}`);
  }

  if (totalRevenue) {
    findings.push({
      ...baseFields,
      metric: 'supplier_total_revenue',
      value: totalRevenue,
      unit: 'dollars',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — total revenue. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
    console.log(`    revenue: $${(totalRevenue / 1e6).toFixed(1)}M`);
  }

  if (totalExpenses) {
    findings.push({
      ...baseFields,
      metric: 'supplier_total_expenses',
      value: totalExpenses,
      unit: 'dollars',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — total expenses`,
    });
    console.log(`    expenses: $${(totalExpenses / 1e6).toFixed(1)}M`);
  }

  if (employeeCount) {
    findings.push({
      ...baseFields,
      metric: 'supplier_employee_count',
      value: employeeCount,
      unit: 'count',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — employee headcount`,
    });
    console.log(`    employees: ${employeeCount}`);
  }

  // Beneficiary coverage flags (useful for accountability analysis)
  if (servesYouth || servesIndigenous || servesJustice) {
    const tags = [];
    if (servesYouth) tags.push('youth');
    if (servesIndigenous) tags.push('indigenous');
    if (servesJustice) tags.push('justice');
    findings.push({
      ...baseFields,
      metric: 'supplier_beneficiary_alignment',
      value: tags.length,
      unit: 'count',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: `${supplier.name} — ACNC beneficiary alignment: ${tags.join(', ')}. Serves youth=${servesYouth}, indigenous=${servesIndigenous}, justice=${servesJustice}`,
    });
    console.log(`    beneficiary_alignment: ${tags.join(', ')} (${tags.length}/3)`);
  }

  // QLD contract value as a metric (so we can query it alongside other supplier data)
  findings.push({
    ...baseFields,
    metric: 'supplier_qld_yj_contract_value',
    value: supplier.contractValue,
    unit: 'dollars',
    source_name: 'QLD Contract Disclosures',
    source_url: 'https://data.qld.gov.au',
    notes: `${supplier.name} — total QLD youth justice contract value`,
  });
  console.log(`    contract_value: $${(supplier.contractValue / 1e6).toFixed(0)}M`);

  return findings;
}

// ─── Dedup Check ────────────────────────────────────────────────────────────────

async function getExistingMetrics() {
  const { data, error } = await supabase
    .from('cross_system_stats')
    .select('metric, notes, source_url')
    .eq('domain', 'accountability')
    .in('metric', [
      'supplier_total_revenue',
      'supplier_total_expenses',
      'supplier_employee_count',
      'supplier_charity_size',
      'supplier_govt_grants_pct',
      'supplier_board_size',
      'supplier_beneficiary_alignment',
      'supplier_qld_yj_contract_value',
    ]);

  if (error) {
    console.warn('[dedup] Error checking existing records:', error.message);
    return new Set();
  }

  // Dedup key: metric + first word of notes (supplier name)
  const keys = new Set();
  for (const row of data || []) {
    // Extract supplier name from notes (format: "Supplier Name — ...")
    const supplierFromNotes = (row.notes || '').split(' \u2014 ')[0].trim();
    keys.add(`${row.metric}|${supplierFromNotes}`);
  }
  return keys;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== QLD Youth Justice Supplier Annual Report Scraper ===');
  console.log(`Mode: ${applyMode ? 'APPLY (will write to DB)' : 'DRY-RUN'}`);
  console.log(`Suppliers: ${SUPPLIERS.length}`);
  console.log(`Max Jina requests: ${MAX_JINA_REQUESTS}`);
  console.log('');

  // Check DB connection
  const { count, error: dbErr } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true })
    .eq('domain', 'accountability');

  if (dbErr) {
    console.error('[db] Error connecting:', dbErr.message);
    process.exit(1);
  }
  console.log(`[db] Existing accountability records: ${count || 0}`);

  // Get existing records for dedup
  const existingKeys = await getExistingMetrics();
  console.log(`[dedup] Found ${existingKeys.size} existing supplier financial records`);

  // Process all suppliers
  const allFindings = [];
  for (const supplier of SUPPLIERS) {
    const findings = await processSupplier(supplier);
    allFindings.push(...findings);

    // Rate-limit Jina requests
    if (jinaCount > 0 && jinaCount < MAX_JINA_REQUESTS) {
      await new Promise((r) => setTimeout(r, JINA_DELAY_MS));
    }
  }

  // Dedup against existing DB records
  const newFindings = allFindings.filter((f) => {
    const supplierFromNotes = (f.notes || '').split(' \u2014 ')[0].trim();
    const key = `${f.metric}|${supplierFromNotes}`;
    return !existingKeys.has(key);
  });

  const dupeCount = allFindings.length - newFindings.length;

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total findings: ${allFindings.length}`);
  console.log(`New (after dedup): ${newFindings.length}`);
  console.log(`Duplicates skipped: ${dupeCount}`);
  console.log(`Jina requests used: ${jinaCount}/${MAX_JINA_REQUESTS}`);

  const metrics = {};
  for (const f of newFindings) {
    metrics[f.metric] = (metrics[f.metric] || 0) + 1;
  }
  if (Object.keys(metrics).length > 0) {
    console.log('\nNew findings by metric:');
    for (const [metric, cnt] of Object.entries(metrics).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${metric}: ${cnt}`);
    }
  }

  // Write to DB
  if (applyMode && newFindings.length > 0) {
    console.log(`\n[db] Writing ${newFindings.length} new findings to cross_system_stats...`);

    let inserted = 0;
    for (let i = 0; i < newFindings.length; i += 20) {
      const batch = newFindings.slice(i, i + 20);
      const { data, error } = await supabase
        .from('cross_system_stats')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`[db] Batch insert error: ${error.message}`);
        for (const row of batch) {
          const { error: rowErr } = await supabase
            .from('cross_system_stats')
            .insert(row);
          if (rowErr) {
            console.error(`[db] Row error: ${rowErr.message} — ${row.notes?.slice(0, 60)}`);
          } else {
            inserted++;
          }
        }
      } else {
        inserted += (data?.length || batch.length);
      }
    }
    console.log(`[db] Inserted ${inserted}/${newFindings.length} records`);
  } else if (applyMode && newFindings.length === 0) {
    console.log('\n[db] No new records to insert (all duplicates or no data found)');
  } else {
    console.log('\n[dry-run] Would insert these records:');
    for (const f of newFindings) {
      const valueStr = f.unit === 'dollars'
        ? `$${(f.value / 1e6).toFixed(1)}M`
        : `${f.value} ${f.unit}`;
      console.log(`  ${f.metric}: ${valueStr} — ${(f.notes || '').slice(0, 80)}`);
    }
    if (newFindings.length > 0) {
      console.log(`\nRun with --apply to write ${newFindings.length} records to DB`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
