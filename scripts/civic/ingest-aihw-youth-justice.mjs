#!/usr/bin/env node
/**
 * AIHW Youth justice in Australia — annual supplementary tables ingestion.
 *
 * Source family: https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-<year>/
 * AIHW publishes a main PDF + an XLSX of supplementary tables (S1..S100+) on
 * a `/data` subpath. The XLSX is the high-yield artefact — sheets are tidy
 * enough to coerce into long-form rows after a multi-row header flatten.
 *
 * Per docs/civic-connectors/build-specs.md section 1.
 *
 * Sheets whitelisted in v1:
 *   - S18: remand vs sentenced detention
 *   - S20: detention population
 *   - S37: Indigenous status splits
 *   - S54: age splits
 * Anything else is skipped — the rest can be added without schema change.
 *
 * Idempotent upsert on (report_year, state, metric_key, indigenous_status,
 * age_group, legal_status). Re-run any year safely.
 *
 * Behaviour:
 *   - Default: dry-run. Prints sample parsed rows.
 *   - --apply: writes to aihw_youth_justice_stats.
 *   - --year=YYYY-YY: target a specific report year (defaults to latest known).
 *   - --xlsx-url=...: override discovery with a direct URL.
 *   - --pdf-fallback: force the PDF parser path (smoke-tests the fallback).
 *
 * If no XLSX is discoverable, the script falls back to pdf-parse on the main
 * report PDF and emits the headline national figure (placeholder until a
 * proper PDF parser is built).
 *
 * Dependencies:
 *   - xlsx (SheetJS) — NOT yet in package.json. Install with:
 *       npm install xlsx
 *     The script logs a clear message and exits if missing.
 *   - pdf-parse, zod — already in package.json.
 *
 * Usage:
 *   node scripts/civic/ingest-aihw-youth-justice.mjs                   # dry-run, latest
 *   node scripts/civic/ingest-aihw-youth-justice.mjs --year=2023-24    # specific year
 *   node scripts/civic/ingest-aihw-youth-justice.mjs --xlsx-url=https://... --apply
 *   node scripts/civic/ingest-aihw-youth-justice.mjs --pdf-fallback    # force PDF path
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

// ─── env loading (mirrors seed-detention-centres.mjs) ──────────────────
function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();

// ─── flags ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const debug = argv.includes('--debug');
const forcePdfFallback = argv.includes('--pdf-fallback');
const yearArg = argv.find((a) => a.startsWith('--year='))?.split('=')[1];
const xlsxUrlArg = argv.find((a) => a.startsWith('--xlsx-url='))?.split('=')[1];

// Latest known year. The 2024-25 report releases in early 2026; if a newer
// year is published the script will still parse it via --year override.
const DEFAULT_YEAR = '2024-25';
const REPORT_YEAR = yearArg || DEFAULT_YEAR;

// Hardcoded 2023-24 main-report PDF — known-good fallback per build spec
// when XLSX discovery fails. Used as PDF fallback default.
const PDF_FALLBACK_2023_24 =
  'https://www.aihw.gov.au/getmedia/52c8911b-7258-4553-9e3c-fcdb021187f6/Youth-justice-in-Australia-2023-24.pdf';

const LANDING_BASE = 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-';
const REPORT_LANDING = `${LANDING_BASE}${REPORT_YEAR}`;
const USER_AGENT = 'Mozilla/5.0 (compatible; JusticeHub/1.0)';

// ─── Supabase (tolerant in dry-run, strict in --apply) ─────────────────
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (apply) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: --apply requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

function log(...args) { console.log(...args); }
function dbg(...args) { if (debug) console.log('  [dbg]', ...args); }

// ─── Zod schema ─────────────────────────────────────────────────────────
const StateEnum = z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT', 'NAT']);
const IndigEnum = z.enum(['indigenous', 'non_indigenous', 'all', 'unknown']);
const LegalEnum = z.enum(['remand', 'sentenced', 'community', 'all']);

const RowSchema = z.object({
  report_year: z.string().regex(/^\d{4}-\d{2}$/),
  state: StateEnum,
  metric_key: z.string().min(1),
  metric_value: z.union([z.number(), z.null()]),
  unit: z.string().nullable().optional(),
  indigenous_status: IndigEnum.default('all'),
  age_group: z.string().default('all'),
  legal_status: LegalEnum.default('all'),
  source_table: z.string().nullable().optional(),
  source_sheet_label: z.string().nullable().optional(),
  source_url: z.string().url(),
  source_format: z.enum(['xlsx', 'pdf']).default('xlsx'),
  published_at: z.string().nullable().optional(),
});

// ─── cell value coercion ────────────────────────────────────────────────
// AIHW uses 'np' (not published, ≤ 5 suppression), 'na' (not applicable),
// and '..' / '...' / '—' / blanks for missing data. All → NULL, never 0.
const NULL_TOKENS = new Set(['np', 'na', 'n.a.', 'n/a', '..', '...', '—', '-', '', '.']);
function coerceNumeric(cell) {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null;
  const s = String(cell).trim().toLowerCase().replace(/,/g, '');
  if (NULL_TOKENS.has(s)) return null;
  // Strip percentage / currency / footnote markers.
  const stripped = s.replace(/[%$\s]/g, '').replace(/\([^)]*\)/g, '').replace(/[a-z]+$/, '');
  const num = parseFloat(stripped);
  return Number.isFinite(num) ? num : null;
}

// ─── jurisdiction header normalisation ──────────────────────────────────
// AIHW supplementary tables sometimes use abbreviated jurisdiction columns
// (NSW, Vic, Qld...) and sometimes spelled-out (New South Wales...).
const JURIS_ALIASES = new Map([
  ['nsw', 'NSW'], ['new south wales', 'NSW'],
  ['vic', 'VIC'], ['vic.', 'VIC'], ['victoria', 'VIC'],
  ['qld', 'QLD'], ['queensland', 'QLD'],
  ['sa', 'SA'], ['south australia', 'SA'],
  ['wa', 'WA'], ['western australia', 'WA'],
  ['tas', 'TAS'], ['tas.', 'TAS'], ['tasmania', 'TAS'],
  ['act', 'ACT'], ['australian capital territory', 'ACT'],
  ['nt', 'NT'], ['northern territory', 'NT'],
  ['aust', 'NAT'], ['aust.', 'NAT'], ['australia', 'NAT'], ['total', 'NAT'], ['national', 'NAT'],
]);
function normaliseJurisdiction(label) {
  if (label === null || label === undefined) return null;
  const k = String(label).trim().toLowerCase().replace(/[()]/g, '').trim();
  return JURIS_ALIASES.get(k) || null;
}

// ─── header flattening: walk merged multi-row headers ───────────────────
// AIHW tables often have 2-3 header rows where parent cells are merged
// across child columns and child cells repeat or are blank. We walk the
// raw 2D array, forward-fill blanks left-to-right within each header row,
// then concatenate down each column to produce a flat label per column.
function flattenHeaders(rows, headerRowCount) {
  if (!rows.length || !headerRowCount) return [];
  const headerRows = rows.slice(0, headerRowCount).map((r) => Array.isArray(r) ? r : []);
  const ncols = Math.max(...headerRows.map((r) => r.length));
  // Forward-fill blanks across each header row (handles merged cells that
  // SheetJS expands as undefined in the right-hand cells).
  for (const r of headerRows) {
    let last = '';
    for (let c = 0; c < ncols; c++) {
      const v = r[c];
      if (v === undefined || v === null || String(v).trim() === '') {
        r[c] = last;
      } else {
        last = String(v).trim();
      }
    }
  }
  const flat = [];
  for (let c = 0; c < ncols; c++) {
    const parts = [];
    for (let r = 0; r < headerRowCount; r++) {
      const v = headerRows[r][c];
      if (v && !parts.includes(String(v))) parts.push(String(v).trim());
    }
    flat.push(parts.join(' | '));
  }
  return flat;
}

// ─── metric-key inference per sheet ─────────────────────────────────────
// v1 hand-curated: each whitelisted sheet maps to a stable metric_key
// prefix. The header label appended to the prefix lets us emit one row
// per (state, dimension-combination) without inventing new metric_keys.
const SHEET_PROFILES = {
  S18: {
    aliases: ['S18', 'Table S18'],
    metric_prefix: 'detention.remand_vs_sentenced',
    unit: 'count',
    description: 'Young people in detention by legal status (remand vs sentenced)',
    // Sheet typically has columns for remand, sentenced, total — and a row
    // per state. Use header tokens to set legal_status.
    legalFromHeader: (h) => {
      const s = h.toLowerCase();
      if (s.includes('remand') || s.includes('unsentenced')) return 'remand';
      if (s.includes('sentenced')) return 'sentenced';
      return 'all';
    },
    indigenousFromHeader: () => 'all',
    ageFromHeader: () => 'all',
    headerRows: 2,
  },
  S20: {
    aliases: ['S20', 'Table S20'],
    metric_prefix: 'detention.population',
    unit: 'count',
    description: 'Young people in detention on an average day',
    legalFromHeader: () => 'all',
    indigenousFromHeader: () => 'all',
    ageFromHeader: () => 'all',
    headerRows: 2,
  },
  S37: {
    aliases: ['S37', 'Table S37'],
    metric_prefix: 'supervision.by_indigenous_status',
    unit: 'count',
    description: 'Young people under supervision by Indigenous status',
    legalFromHeader: () => 'all',
    indigenousFromHeader: (h) => {
      const s = h.toLowerCase();
      if (s.includes('aboriginal') || s.includes('torres') || s.includes('indigenous') && !s.includes('non')) return 'indigenous';
      if (s.includes('non-indigenous') || s.includes('non indigenous') || s.includes('other')) return 'non_indigenous';
      if (s.includes('unknown') || s.includes('not stated')) return 'unknown';
      return 'all';
    },
    ageFromHeader: () => 'all',
    headerRows: 2,
  },
  S54: {
    aliases: ['S54', 'Table S54'],
    metric_prefix: 'supervision.by_age',
    unit: 'count',
    description: 'Young people under supervision by age group',
    legalFromHeader: () => 'all',
    indigenousFromHeader: () => 'all',
    ageFromHeader: (h) => {
      // header tokens commonly include "10-13", "14-17", "10-17", "18+"
      const m = h.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/);
      if (m) return `${m[1]}-${m[2]}`;
      if (/18\s*\+/.test(h) || /18\s*and over/.test(h)) return '18+';
      return 'all';
    },
    headerRows: 2,
  },
};

function profileForSheet(sheetName) {
  const lower = sheetName.toLowerCase().replace(/\s+/g, '');
  for (const [key, p] of Object.entries(SHEET_PROFILES)) {
    for (const a of p.aliases) {
      if (lower.startsWith(a.toLowerCase().replace(/\s+/g, ''))) return { key, ...p };
    }
  }
  return null;
}

// ─── XLSX URL discovery from landing HTML ───────────────────────────────
async function fetchText(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuffer(url, { timeoutMs = 60000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

async function discoverXlsxUrl(landingUrl) {
  // Try the landing page, then the /data subpath. AIHW links the XLSX
  // as either an absolute /getmedia/<uuid>/<name>.xlsx URL or a relative
  // path. Some report years have no XLSX at all.
  const candidates = [landingUrl, `${landingUrl}/data`];
  for (const url of candidates) {
    let html;
    try { html = await fetchText(url); } catch (e) { dbg(`fetch failed ${url}: ${e.message}`); continue; }
    const matches = [...html.matchAll(/href="([^"]+\.xlsx[^"]*)"/gi)].map((m) => m[1]);
    if (matches.length) {
      const first = matches[0].startsWith('http')
        ? matches[0]
        : `https://www.aihw.gov.au${matches[0].startsWith('/') ? '' : '/'}${matches[0]}`;
      dbg(`discovered XLSX: ${first} (via ${url})`);
      return first.replace(/&amp;/g, '&');
    }
  }
  return null;
}

async function discoverPdfUrl(landingUrl) {
  try {
    const html = await fetchText(landingUrl);
    const match = html.match(/href="(\/getmedia\/[^"]+\.pdf[^"]*)"/i);
    if (match) {
      const url = `https://www.aihw.gov.au${match[1]}`.replace(/&amp;/g, '&').replace(/[?&]inline=true/, '');
      dbg(`discovered PDF: ${url}`);
      return url;
    }
  } catch (e) {
    dbg(`PDF discovery failed: ${e.message}`);
  }
  return null;
}

// ─── XLSX parsing ───────────────────────────────────────────────────────
async function loadXlsxLib() {
  try {
    return await import('xlsx');
  } catch (e) {
    console.error('');
    console.error('xlsx package is not installed.');
    console.error('Run:  npm install xlsx');
    console.error('Then retry this script.');
    console.error('');
    console.error(`(import error: ${e.message})`);
    return null;
  }
}

function parseSheet(sheet, sheetName, xlsxLib, ctx) {
  const profile = profileForSheet(sheetName);
  if (!profile) {
    dbg(`skip sheet (not whitelisted): ${sheetName}`);
    return [];
  }

  // Read as 2D array. defval:'' keeps merged-cell blanks rather than
  // dropping them — header flatten relies on that.
  const aoa = xlsxLib.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (!aoa.length) return [];

  // Skip AIHW preamble: the first 4-6 rows are title, footnotes, blank
  // separators. Detect the header by scanning for the first row that
  // contains a jurisdiction token.
  let headerStartRow = -1;
  for (let r = 0; r < Math.min(aoa.length, 12); r++) {
    const row = aoa[r] || [];
    const hits = row.filter((c) => normaliseJurisdiction(c)).length;
    if (hits >= 3) { headerStartRow = r; break; }
  }
  if (headerStartRow === -1) {
    dbg(`${sheetName}: no jurisdiction header detected, skipping`);
    return [];
  }

  // Header may span multiple rows above & at headerStartRow. Walk
  // upward to capture any merged parent labels (up to 2 rows above).
  const headerRowCount = Math.min(profile.headerRows, headerStartRow + 1);
  const headerStart = Math.max(0, headerStartRow - (headerRowCount - 1));
  const headerSlice = aoa.slice(headerStart, headerStart + headerRowCount);
  const flatHeaders = flattenHeaders(headerSlice, headerRowCount);
  dbg(`${sheetName}: header rows ${headerStart}..${headerStart + headerRowCount - 1}, flat=`, flatHeaders);

  // Identify jurisdiction columns. Each column maps to a state code or null.
  const columnStates = flatHeaders.map((h) => {
    // Prefer the last segment of the flattened header (closest to data row).
    const parts = h.split('|').map((s) => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const j = normaliseJurisdiction(parts[i]);
      if (j) return j;
    }
    return null;
  });
  if (!columnStates.some(Boolean)) {
    dbg(`${sheetName}: no jurisdiction columns identified`);
    return [];
  }

  // Walk data rows (anything below the header). The first column is
  // typically a row label / dimension that we surface as the metric
  // suffix. Stop at empty rows or footnote rows starting with "(a)",
  // "Source", etc.
  const out = [];
  for (let r = headerStart + headerRowCount; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const rowLabel = String(row[0] ?? '').trim();
    if (!rowLabel) continue;
    const lower = rowLabel.toLowerCase();
    if (lower.startsWith('source') || lower.startsWith('note') || lower.startsWith('(') ||
        lower.startsWith('np ') || lower === 'np' || lower.startsWith('total')) {
      if (lower.startsWith('total')) {
        // Some sheets put 'Total' as a real data row — keep it under 'all'.
      } else {
        continue;
      }
    }

    for (let c = 0; c < columnStates.length; c++) {
      const state = columnStates[c];
      if (!state) continue;
      const value = coerceNumeric(row[c]);
      const headerLabel = flatHeaders[c] || '';
      const indigenous_status = profile.indigenousFromHeader(headerLabel) || profile.indigenousFromHeader(rowLabel) || 'all';
      const legal_status = profile.legalFromHeader(headerLabel) || profile.legalFromHeader(rowLabel) || 'all';
      const age_group = profile.ageFromHeader(headerLabel) || profile.ageFromHeader(rowLabel) || 'all';
      // Compose metric_key: prefix + slugified row label (so each row
      // becomes its own metric). Empty/Total row labels collapse to the
      // prefix itself.
      const slug = rowLabel.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 80);
      const metric_key = slug && slug !== 'total'
        ? `${profile.metric_prefix}.${slug}`
        : profile.metric_prefix;

      out.push({
        report_year: ctx.report_year,
        state,
        metric_key,
        metric_value: value,
        unit: profile.unit,
        indigenous_status,
        age_group,
        legal_status,
        source_table: profile.key,
        source_sheet_label: sheetName,
        source_url: ctx.source_url,
        source_format: 'xlsx',
        published_at: ctx.published_at || null,
      });
    }
  }
  return out;
}

async function ingestXlsx(xlsxUrl) {
  const xlsxLib = await loadXlsxLib();
  if (!xlsxLib) return { rows: [], aborted: 'missing_xlsx_pkg' };

  log(`Downloading XLSX: ${xlsxUrl}`);
  let buf;
  try { buf = await fetchBuffer(xlsxUrl); }
  catch (e) {
    log(`  ! XLSX download failed: ${e.message}`);
    return { rows: [], aborted: 'download_failed' };
  }
  log(`  ${(buf.length / 1024).toFixed(1)} KB downloaded`);

  const wb = xlsxLib.read(buf, { type: 'buffer' });
  log(`Workbook sheets: ${wb.SheetNames.length}`);

  const ctx = {
    report_year: REPORT_YEAR,
    source_url: xlsxUrl,
    published_at: null,
  };

  const allRows = [];
  for (const name of wb.SheetNames) {
    const profile = profileForSheet(name);
    if (!profile) continue;
    log(`  parsing ${name} (${profile.metric_prefix})...`);
    const parsed = parseSheet(wb.Sheets[name], name, xlsxLib, ctx);
    log(`    -> ${parsed.length} rows`);
    allRows.push(...parsed);
  }
  return { rows: allRows };
}

// ─── PDF fallback (placeholder, headline only) ──────────────────────────
async function ingestPdfFallback(pdfUrl) {
  log(`Falling back to PDF parse: ${pdfUrl}`);
  let PDFParse;
  try { ({ PDFParse } = await import('pdf-parse')); }
  catch (e) {
    log(`  ! pdf-parse import failed: ${e.message}`);
    return { rows: [] };
  }
  let buf;
  try { buf = await fetchBuffer(pdfUrl); }
  catch (e) {
    log(`  ! PDF download failed: ${e.message}`);
    return { rows: [] };
  }
  log(`  ${(buf.length / 1024 / 1024).toFixed(2)} MB downloaded`);
  let text = '';
  try {
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    text = result?.text || '';
  } catch (e) {
    log(`  ! PDF parse failed: ${e.message}`);
    return { rows: [] };
  }
  log(`  ${text.length} chars extracted`);

  const rows = [];

  // Helper — builds a row with sensible defaults.
  const mkRow = (overrides) => ({
    report_year: REPORT_YEAR,
    state: 'NAT',
    metric_key: 'unknown',
    metric_value: null,
    unit: 'count',
    indigenous_status: 'all',
    age_group: 'all',
    legal_status: 'all',
    source_table: 'PDF_HEADLINE',
    source_sheet_label: 'main report PDF',
    source_url: pdfUrl,
    source_format: 'pdf',
    published_at: null,
    ...overrides,
  });

  // 1. Headline national supervision figure.
  const headline = text.match(/(\d[\d,]{2,})\s+young people\s+(?:were\s+)?under youth justice supervision/i);
  if (headline) {
    rows.push(mkRow({
      metric_key: 'supervision.avg_daily.national',
      metric_value: parseFloat(headline[1].replace(/,/g, '')),
    }));
  }

  // 2. National detention count — "X,XXX in detention on an average day".
  const detention = text.match(/(\d[\d,]{2,})\s+(?:young people\s+)?(?:were\s+)?in detention\s+on an average day/i);
  if (detention) {
    rows.push(mkRow({
      metric_key: 'detention.avg_daily.national',
      metric_value: parseFloat(detention[1].replace(/,/g, '')),
      legal_status: 'all',
    }));
  }

  // 3. Indigenous overrep ratios — separate for supervision / community / detention.
  // Anchor on "non-Indigenous counterparts" to avoid the "very remote areas"
  // geographic ratio sentence and any other unrelated multipliers.
  const overrepPatterns = [
    { key: 'supervision.indigenous_overrep_ratio', re: /(\d{1,3}(?:\.\d+)?)\s+times\s+as\s+likely\s+as\s+their\s+non-Indigenous\s+counterparts\s+to\s+be\s+under\s+supervision/i },
    { key: 'community.indigenous_overrep_ratio',   re: /(\d{1,3}(?:\.\d+)?)\s+times\s+as\s+likely\s+as\s+their\s+non-Indigenous\s+counterparts\s+to\s+be\s+under\s+community-based\s*\n?\s*supervision/i },
    { key: 'detention.indigenous_overrep_ratio',   re: /(\d{1,3}(?:\.\d+)?)\s+times\s+as\s+likely\s+as\s+their\s+non-Indigenous\s+counterparts\s+to\s+be\s+in\s+detention/i },
  ];
  for (const { key, re } of overrepPatterns) {
    const m = text.match(re);
    if (m) {
      rows.push(mkRow({
        metric_key: key,
        metric_value: parseFloat(m[1]),
        unit: 'ratio',
        indigenous_status: 'indigenous',
      }));
    }
  }

  // 4. Per-state supervision counts. AIHW renders this as a bar-chart
  // alt-text sentence: "1,557 in Queensland 1,035 in New South Wales ...".
  // We extract every "<number> in <state-name>" pair anchored to the same
  // sentence as "supervision on an average day".
  const STATES = {
    'New South Wales': 'NSW',
    Victoria: 'VIC',
    Queensland: 'QLD',
    'South Australia': 'SA',
    'Western Australia': 'WA',
    Tasmania: 'TAS',
    'Australian Capital Territory': 'ACT',
    'Northern Territory': 'NT',
  };
  // Find the bar-chart sentence (it always contains "by state and territory").
  const barChartIdx = text.search(/supervision on an average day by state and territory/i);
  if (barChartIdx >= 0) {
    const window = text.slice(barChartIdx, barChartIdx + 800);
    for (const [long, short] of Object.entries(STATES)) {
      // "1,557 in Queensland" — number must precede the state, allow optional "the ".
      const re = new RegExp(`(\\d[\\d,]{1,5})\\s+in\\s+(?:the\\s+)?${long.replace(/\s+/g, '\\s+')}`, 'i');
      const m = window.match(re);
      if (m) {
        rows.push(mkRow({
          state: short,
          metric_key: 'supervision.avg_daily',
          metric_value: parseFloat(m[1].replace(/,/g, '')),
          unit: 'count',
        }));
      }
    }
  }

  // 5. Per-10k supervision rate range — extract the from/to anchors.
  // "<X> per 10,000 in Victoria to <Y> per 10,000 in Tasmania"
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s+per\s+10[, ]?000\s+in\s+(\w[\w\s]*?)\s+to\s+(\d+(?:\.\d+)?)\s+per\s+10[, ]?000\s+in\s+(\w[\w\s]*)/i);
  if (rangeMatch) {
    const [, lowVal, lowState, highVal, highState] = rangeMatch;
    const lowKey = normaliseJurisdiction(lowState.trim());
    const highKey = normaliseJurisdiction(highState.trim());
    if (lowKey) {
      rows.push(mkRow({
        state: lowKey,
        metric_key: 'supervision.rate_per_10k',
        metric_value: parseFloat(lowVal),
        unit: 'rate_per_10k',
      }));
    }
    if (highKey) {
      rows.push(mkRow({
        state: highKey,
        metric_key: 'supervision.rate_per_10k',
        metric_value: parseFloat(highVal),
        unit: 'rate_per_10k',
      }));
    }
  }

  log(`  PDF fallback extracted ${rows.length} headline rows.`);
  return { rows };
}

// ─── DB upsert ──────────────────────────────────────────────────────────
async function upsertRows(rows) {
  if (!rows.length) return { inserted: 0, errors: 0 };
  if (!supabase) {
    log('  (no supabase client — would have written rows; pass --apply with creds set)');
    return { inserted: 0, errors: 0 };
  }
  const onConflict = 'report_year,state,metric_key,indigenous_status,age_group,legal_status';
  let inserted = 0;
  let errors = 0;
  // Batch in chunks of 500.
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from('aihw_youth_justice_stats')
      .upsert(chunk, { onConflict });
    if (error) {
      console.error(`  upsert error (batch ${i}-${i + chunk.length}): ${error.message}`);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, errors };
}

// ─── main ───────────────────────────────────────────────────────────────
async function main() {
  log('=== AIHW Youth Justice in Australia — ingest ===');
  log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  log(`Report year: ${REPORT_YEAR}`);
  log(`Landing: ${REPORT_LANDING}`);
  log('');

  let result = { rows: [] };

  if (!forcePdfFallback) {
    // 1. Resolve XLSX URL — flag override > discovery from landing.
    let xlsxUrl = xlsxUrlArg || null;
    if (!xlsxUrl) {
      log('Discovering XLSX from landing...');
      try { xlsxUrl = await discoverXlsxUrl(REPORT_LANDING); }
      catch (e) { log(`  discovery error: ${e.message}`); }
    }

    if (xlsxUrl) {
      result = await ingestXlsx(xlsxUrl);
      if (result.aborted === 'missing_xlsx_pkg') {
        log('Aborting — xlsx package missing. See instructions above.');
        process.exit(2);
      }
    } else {
      log('  No XLSX discovered from landing page.');
    }
  }

  // 2. PDF fallback when XLSX path produces no rows.
  if (!result.rows.length) {
    let pdfUrl = null;
    try { pdfUrl = await discoverPdfUrl(REPORT_LANDING); }
    catch (e) { dbg(`pdf discovery err: ${e.message}`); }
    if (!pdfUrl) {
      log(`  PDF discovery from landing failed — using hardcoded 2023-24 fallback.`);
      pdfUrl = PDF_FALLBACK_2023_24;
    }
    result = await ingestPdfFallback(pdfUrl);
  }

  // 3. Validate.
  log('');
  log(`Parsed ${result.rows.length} raw rows. Validating...`);
  const valid = [];
  const invalid = [];
  for (const r of result.rows) {
    const parse = RowSchema.safeParse(r);
    if (parse.success) valid.push(parse.data);
    else invalid.push({ row: r, error: parse.error.issues[0]?.message });
  }
  log(`  ${valid.length} valid, ${invalid.length} invalid`);
  if (invalid.length && debug) {
    invalid.slice(0, 5).forEach((i, idx) => {
      console.log(`    [invalid ${idx}] ${i.error}`);
      console.log(`    row=`, i.row);
    });
  }

  // 4. Show sample.
  log('');
  log(`Sample (first ${Math.min(10, valid.length)} rows):`);
  for (const r of valid.slice(0, 10)) {
    const v = r.metric_value === null ? 'NULL' : r.metric_value;
    log(`  ${r.source_table}/${r.state.padEnd(3)} ${r.metric_key.padEnd(50)} = ${String(v).padEnd(10)} [indig=${r.indigenous_status}, age=${r.age_group}, legal=${r.legal_status}]`);
  }

  if (!apply) {
    log('');
    log('Dry-run complete. Re-run with --apply to write to aihw_youth_justice_stats.');
    return;
  }

  // 5. Apply.
  log('');
  log(`Writing ${valid.length} rows to aihw_youth_justice_stats...`);
  const { inserted, errors } = await upsertRows(valid);
  log(`  inserted/updated: ${inserted}, errors: ${errors}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
