#!/usr/bin/env node
/**
 * Propose SA Budget 2025-26 youth justice funding rows.
 *
 * Dry-run by default. Uses the official SA Budget Paper 4 Volume 3 Youth
 * Justice program table as the source of truth, checks whether production
 * already contains the source_statement_id, and writes a local review artifact.
 *
 * Usage:
 *   node scripts/civic/propose-sa-budget-yj-candidates.mjs
 *   node scripts/civic/propose-sa-budget-yj-candidates.mjs --apply --yes-production
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');

const OFFICIAL_BUDGET_URL = 'https://www.treasury.sa.gov.au/__data/assets/pdf_file/0007/1159378/2025-26-Agency-Statements-Volume-3.pdf';
const OFFICIAL_BUDGET_PAGE = 'Budget Paper 4: Agency Statements, Volume 3, Department of Human Services, Program 3: Youth Justice';

const SOURCE_REVIEW = [
  {
    check: '2025-26 agency statement source',
    status: 'verified',
    evidence: 'SA Treasury current-budget page lists Budget Paper 4 Agency Statements Volume 3 for the 2025-26 Budget.',
    source_locator: 'SA Treasury current budget page; Budget Paper 4: Agency Statements; Volume 3 PDF.',
  },
  {
    check: 'Youth Justice program scope',
    status: 'verified',
    evidence: 'Program 3 is the Youth Justice program and covers community-based mandates plus custody at Kurlana Tapa Youth Justice Centre.',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 description, p.119 / PDF page 125.',
  },
  {
    check: 'Recommended budget amount',
    status: 'verified',
    evidence: 'The 2025-26 budget column reports $49.668M as the net cost of providing services for Program 3: Youth Justice.',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126.',
  },
  {
    check: 'Double-counting guard',
    status: 'verified',
    evidence: 'The same table reports $50.342M total expenses, so this importer treats total expenses as reference-only and inserts only the net-cost aggregate.',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126.',
  },
];

const RECOMMENDED_INSERT_ROWS = [
  {
    source: 'sa-budget-2025-26',
    source_url: OFFICIAL_BUDGET_URL,
    source_statement_id: 'sa-budget-2025-26-dhs-youth-justice-net-cost',
    recipient_name: 'Department of Human Services',
    recipient_abn: null,
    program_name: 'Program 3: Youth Justice',
    program_round: '2025-26 Budget',
    amount_dollars: 49668000,
    state: 'SA',
    location: 'South Australia',
    funding_type: 'budget_program_net_cost',
    sector: 'youth_justice',
    project_description: 'SA Budget Paper 4 Volume 3 reports a 2025-26 net cost of services of $49.668M for Program 3: Youth Justice, covering community-based mandates and Kurlana Tapa Youth Justice Centre.',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126; net cost of providing services row.',
    announcement_date: '2025-06-05',
    financial_year: '2025-26',
    topics: ['youth_justice', 'budget', 'south_australia', 'adelaide_launch'],
    is_aggregate: true,
  },
];

const REFERENCE_LINES = [
  {
    label: 'Total expenses',
    value: 50342000,
    unit: 'AUD',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126; total expenses row.',
    import_note: 'Reference only. Do not import alongside net cost unless the public aggregate method changes, because it would double count.',
  },
  {
    label: 'Net cost of services',
    value: 49668000,
    unit: 'AUD',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126; net cost of providing services row.',
    import_note: 'Recommended aggregate justice_funding row.',
  },
  {
    label: 'Full-time equivalents',
    value: 318.6,
    unit: 'FTE',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 summary, p.120 / PDF page 126; FTEs as at 30 June row.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
  {
    label: 'Youth justice clients with supervised orders',
    value: 600,
    unit: 'clients',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 activity indicators, p.120 / PDF page 126.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
  {
    label: 'Youth justice clients with community-based orders',
    value: 470,
    unit: 'clients',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 activity indicators, p.120 / PDF page 126.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
  {
    label: 'Youth justice clients with secure-centre admissions',
    value: 440,
    unit: 'clients',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 activity indicators, p.120 / PDF page 126.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
  {
    label: 'Aboriginal young people with community-based orders',
    value: 250,
    unit: 'clients',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 activity indicators, p.120 / PDF page 126.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
  {
    label: 'Aboriginal young people with secure-centre admissions',
    value: 240,
    unit: 'clients',
    source_locator: '2025-26 Agency Statements Volume 3, Human Services, Program 3 activity indicators, p.120 / PDF page 126.',
    import_note: 'Reference metric only; not a justice_funding row.',
  },
];

function parseArgs() {
  return {
    apply: process.argv.includes('--apply'),
    yesProduction: process.argv.includes('--yes-production'),
    outputDir: path.resolve(PROJECT_ROOT, valueAfter('--output-dir') || OUTPUT_DIR),
  };
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  try {
    const content = await fs.readFile(envPath, 'utf8');
    for (const line of content.split('\n')) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const eq = line.indexOf('=');
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!env[key]) env[key] = value;
    }
  } catch {
    // Environment may already be present.
  }
  return env;
}

function money(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

async function fetchExistingRows(supabase) {
  const ids = RECOMMENDED_INSERT_ROWS.map((row) => row.source_statement_id);
  const { data, error } = await supabase
    .from('justice_funding')
    .select('id,source,source_statement_id,amount_dollars,financial_year')
    .in('source_statement_id', ids);
  if (error) throw new Error(`justice_funding existing check: ${error.message}`);
  return data || [];
}

async function applyRows(supabase, rows) {
  if (rows.length === 0) return [];
  const insertRows = rows.map(({ source_locator: _sourceLocator, exists_in_production: _exists, ...row }) => row);
  const { data, error } = await supabase
    .from('justice_funding')
    .insert(insertRows)
    .select('id,source_statement_id');
  if (error) throw new Error(`justice_funding insert: ${error.message}`);
  return data || [];
}

function buildPayload({ existingRows, insertedRows, mode }) {
  const existingIds = new Set(existingRows.map((row) => row.source_statement_id));
  const candidates = RECOMMENDED_INSERT_ROWS.map((row) => ({
    ...row,
    exists_in_production: existingIds.has(row.source_statement_id),
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode,
    official_source: {
      title: OFFICIAL_BUDGET_PAGE,
      url: OFFICIAL_BUDGET_URL,
    },
    source_review: SOURCE_REVIEW,
    summary: {
      recommended_insert_rows: candidates.length,
      already_present: candidates.filter((row) => row.exists_in_production).length,
      missing_rows: candidates.filter((row) => !row.exists_in_production).length,
      inserted_rows: insertedRows.length,
      recommended_amount_dollars: candidates.reduce((total, row) => total + Number(row.amount_dollars || 0), 0),
    },
    recommended_rows: candidates,
    reference_lines: REFERENCE_LINES,
    inserted_rows: insertedRows,
  };
}

function renderMarkdown(payload) {
  const lines = [
    '# SA Budget 2025-26 Youth Justice Candidates',
    '',
    `Generated: ${payload.generatedAt}`,
    `Mode: ${payload.mode}`,
    '',
    `Official source: [${payload.official_source.title}](${payload.official_source.url})`,
    '',
    'This artifact is designed to close the Adelaide launch budget gap without silently double-counting. Import only the recommended net-cost aggregate row unless the public funding methodology changes.',
    '',
    '## Summary',
    '',
    `- Recommended justice_funding rows: ${payload.summary.recommended_insert_rows}`,
    `- Already present in production: ${payload.summary.already_present}`,
    `- Missing from production: ${payload.summary.missing_rows}`,
    `- Inserted in this run: ${payload.summary.inserted_rows}`,
    `- Recommended aggregate amount: ${money(payload.summary.recommended_amount_dollars)}`,
    '',
    '## Recommended Insert Rows',
    '',
    '| Exists | Source statement ID | Program | Amount | Funding type | Import note |',
    '| --- | --- | --- | ---: | --- | --- |',
  ];

  for (const row of payload.recommended_rows) {
    lines.push(`| ${row.exists_in_production ? 'yes' : 'no'} | ${tableEscape(row.source_statement_id)} | ${tableEscape(row.program_name)} | ${money(row.amount_dollars)} | ${tableEscape(row.funding_type)} | ${tableEscape(row.project_description)} |`);
  }

  lines.push('', '## Source Review', '');
  lines.push('| Check | Status | Evidence | Locator |');
  lines.push('| --- | --- | --- | --- |');
  for (const row of payload.source_review) {
    lines.push(`| ${tableEscape(row.check)} | ${tableEscape(row.status)} | ${tableEscape(row.evidence)} | ${tableEscape(row.source_locator)} |`);
  }

  lines.push('', '## Reference Lines', '');
  lines.push('| Line | Value | Unit | Locator | Import treatment |');
  lines.push('| --- | ---: | --- | --- | --- |');
  for (const row of payload.reference_lines) {
    const value = row.unit === 'AUD' ? money(row.value) : String(row.value);
    lines.push(`| ${tableEscape(row.label)} | ${value} | ${tableEscape(row.unit)} | ${tableEscape(row.source_locator)} | ${tableEscape(row.import_note)} |`);
  }

  lines.push('', '## Apply Command', '');
  lines.push('Production write requires explicit approval:');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/civic/propose-sa-budget-yj-candidates.mjs --apply --yes-production');
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'sa-budget-yj-candidates.json');
  const mdPath = path.join(outputDir, 'sa-budget-yj-candidates.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs();
  if (args.apply && !args.yesProduction) {
    throw new Error('Refusing production write without --yes-production.');
  }

  const env = await loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existingRows = await fetchExistingRows(supabase);
  const existingIds = new Set(existingRows.map((row) => row.source_statement_id));
  const missingRows = RECOMMENDED_INSERT_ROWS.filter((row) => !existingIds.has(row.source_statement_id));
  const insertedRows = args.apply ? await applyRows(supabase, missingRows) : [];
  const payload = buildPayload({
    existingRows: [...existingRows, ...insertedRows],
    insertedRows,
    mode: args.apply ? 'apply' : 'dry-run',
  });
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('SA Budget 2025-26 youth justice candidates');
  console.log(`- Mode: ${payload.mode}`);
  console.log(`- Recommended rows: ${payload.summary.recommended_insert_rows}`);
  console.log(`- Already present: ${payload.summary.already_present}`);
  console.log(`- Missing rows: ${payload.summary.missing_rows}`);
  console.log(`- Inserted rows: ${payload.summary.inserted_rows}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
