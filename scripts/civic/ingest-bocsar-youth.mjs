#!/usr/bin/env node
/**
 * BOCSAR (NSW Bureau of Crime Statistics) youth-justice ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md section 2.
 * Schema: supabase/migrations/20260523_bocsar_youth_offending.sql
 *
 * Discovers BOCSAR youth-related CSV / XLSX downloads from three index
 * pages, downloads each, parses, normalises into the
 * `bocsar_youth_offending` schema, and upserts. Source-file URLs and
 * their SHA-256 hashes are recorded in `bocsar_source_files` so the
 * next run can skip unchanged files cheaply.
 *
 * Dry-run by default — prints discovered URLs, sample rows, and a
 * summary. Use --apply to write. Never run --apply on first attempt
 * without a successful dry-run on the same machine.
 *
 * Usage:
 *   node scripts/civic/ingest-bocsar-youth.mjs                       # dry-run
 *   node scripts/civic/ingest-bocsar-youth.mjs --apply                # write
 *   node scripts/civic/ingest-bocsar-youth.mjs --limit 3              # cap discovered files
 *   node scripts/civic/ingest-bocsar-youth.mjs --parse-one <url>      # only parse one URL
 *   node scripts/civic/ingest-bocsar-youth.mjs --debug-html           # dump first index HTML
 *
 * Critical behaviours:
 *   - Small-cell suppression: cells marked 'np', 'n/a', '*', '<5' parse to
 *     count=NULL, suppressed=true. Never zero.
 *   - Hash-aware downloads: bocsar_source_files.sha256 is checked first; only
 *     re-download when hash changes. (In --apply mode; dry-run always fetches.)
 *   - ANZSOC and BOCSAR subcategories are stored verbatim — no internal mapping.
 *   - BOCSAR Indigenous flag is stored as-is; methodologically distinct from ABS.
 *   - LGA = NSW LGA boundary, never blended with ABS SA2 without a crosswalk.
 *
 * Fallback: if no source files discovered across all index pages (or all
 * fail to fetch), dumps the last fetched HTML to /tmp/bocsar-debug.html and
 * exits with a clear message. Never falls back to hardcoded CSV.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const debugHtml = args.includes('--debug-html');
const limitIdx = args.indexOf('--limit');
const limit =
  limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : Infinity;
const parseOneIdx = args.indexOf('--parse-one');
const parseOneUrl = parseOneIdx >= 0 ? args[parseOneIdx + 1] : null;

const UA =
  'Mozilla/5.0 (compatible; JusticeHub-BOCSAR-Ingest/1.0; +https://justicehub.com.au)';
const FETCH_TIMEOUT_MS = 30000;
const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB cap — BOCSAR LGA Excel can be large

// Per spec section 2 — only these three index pages are crawled.
const INDEX_URLS = [
  'https://bocsar.nsw.gov.au/topic-areas/young-people.html',
  'https://bocsar.nsw.gov.au/statistics-dashboards/custody.html',
  'https://bocsar.nsw.gov.au/statistics-dashboards/open-datasets/offender-data.html',
];

// Suppression markers per BOCSAR convention (case-insensitive match on trim).
// Spec callout: count<5 → 'np', 'n/a', '*', '<5'.
const SUPPRESSION_MARKERS = new Set([
  'np',
  'n/a',
  'na',
  '*',
  '<5',
  '< 5',
  '-',
  'nr',
]);

// Heuristic age-group tokens used when filename hints at a cohort.
const AGE_HINTS = [
  { pattern: /10[-_ ]?17/i, value: '10-17' },
  { pattern: /10[-_ ]?13/i, value: '10-13' },
  { pattern: /14[-_ ]?17/i, value: '14-17' },
  { pattern: /18[-_ ]?24/i, value: '18-24' },
  { pattern: /young[-_ ]?people/i, value: '10-17' },
  { pattern: /youth/i, value: '10-17' },
  { pattern: /juvenile/i, value: '10-17' },
];

// Period hints from filename (year or quarter).
function inferPeriodFromFilename(filename) {
  // Q4-2024, Q4_2024, 2024-Q4
  const qMatch =
    filename.match(/Q([1-4])[-_]?(20\d{2})/i) ||
    filename.match(/(20\d{2})[-_]?Q([1-4])/i);
  if (qMatch) {
    const q = parseInt(qMatch[1].length === 4 ? qMatch[2] : qMatch[1], 10);
    const y = parseInt(qMatch[1].length === 4 ? qMatch[1] : qMatch[2], 10);
    const startMonth = (q - 1) * 3;
    const start = new Date(Date.UTC(y, startMonth, 1));
    const end = new Date(Date.UTC(y, startMonth + 3, 0));
    return {
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      period_type: 'quarter',
    };
  }
  // Year range: 2014-2024 or 2014_2024
  const rangeMatch = filename.match(/(20\d{2})[-_](20\d{2})/);
  if (rangeMatch) {
    return {
      period_start: `${rangeMatch[1]}-01-01`,
      period_end: `${rangeMatch[2]}-12-31`,
      period_type: 'multi_year',
    };
  }
  // Single year
  const yMatch = filename.match(/(20\d{2})/);
  if (yMatch) {
    const y = parseInt(yMatch[1], 10);
    return {
      period_start: `${y}-01-01`,
      period_end: `${y}-12-31`,
      period_type: 'year',
    };
  }
  return null;
}

function inferAgeFromFilename(filename) {
  for (const h of AGE_HINTS) if (h.pattern.test(filename)) return h.value;
  return null;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// ────────────────────────────────────────────────────────────────────
// Discovery — scrape index pages, extract <a href> for .csv / .xlsx / .xls
// ────────────────────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_FILE_BYTES)
    throw new Error(`file > ${MAX_FILE_BYTES} bytes`);
  return { buffer: buf, contentType: res.headers.get('content-type') || '' };
}

function extractDataLinks(html, baseUrl) {
  const exts = ['.csv', '.xlsx', '.xls'];
  const out = [];
  const seen = new Set();
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const lower = href.toLowerCase().split('?')[0];
    if (!exts.some((e) => lower.endsWith(e))) continue;
    const full = href.startsWith('http')
      ? href
      : new URL(href, baseUrl).toString();
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ url: full, label: label || basename(full) });
  }
  return out;
}

// Extract internal sub-page links worth following one level deep. We use
// this only when an index page itself yields no .csv/.xlsx links — e.g.
// open-datasets/offender-data.html now redirects to
// /alleged-offender-dataset.html where the real file lives.
function extractSubPageLinks(html, baseUrl) {
  const out = [];
  const seen = new Set();
  const re = /<a\s+[^>]*href=["']([^"']+\.html?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const lower = `${href} ${label}`.toLowerCase();
    // Only follow links that look offender-data / dataset / youth / custody
    if (
      !/offender|dataset|young|youth|juvenile|custody|alleged|reoffending/.test(
        lower
      )
    )
      continue;
    const full = href.startsWith('http')
      ? href
      : new URL(href, baseUrl).toString();
    // Same host only — don't wander off bocsar.nsw.gov.au
    try {
      if (new URL(full).host !== new URL(baseUrl).host) continue;
    } catch {
      continue;
    }
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ url: full, label });
  }
  return out;
}

async function discoverAll() {
  console.log(`Discovering BOCSAR youth data files across ${INDEX_URLS.length} index pages...\n`);
  const all = [];
  const seen = new Set();
  let lastHtml = '';
  let lastIndexUrl = '';
  for (const indexUrl of INDEX_URLS) {
    try {
      const html = await fetchText(indexUrl);
      lastHtml = html;
      lastIndexUrl = indexUrl;
      const links = extractDataLinks(html, indexUrl);
      // Filter to youth-related links: either filename or label contains a
      // young-people / youth / juvenile cue, OR the index page itself is the
      // young-people topic page (where every download is youth-scoped).
      const isYouthIndex = indexUrl.includes('young-people');
      const filtered = links.filter((l) => {
        if (isYouthIndex) return true;
        const blob = `${l.url} ${l.label}`.toLowerCase();
        return /young|youth|juvenile|10[-_ ]?17|10[-_ ]?13|under[-_ ]?18/.test(
          blob
        );
      });
      console.log(
        `  ${indexUrl}\n    -> ${links.length} data files, ${filtered.length} youth-scoped`
      );
      for (const l of filtered) {
        if (seen.has(l.url)) continue;
        seen.add(l.url);
        all.push({ ...l, indexPage: indexUrl });
      }

      // Follow one level deeper when the index itself yields no data files,
      // OR when it's the offender-data page (which is a hub of dataset pages).
      const shouldFollow =
        links.length === 0 || /offender-data|open-datasets/.test(indexUrl);
      if (shouldFollow) {
        const subs = extractSubPageLinks(html, indexUrl).slice(0, 8);
        for (const sub of subs) {
          try {
            const subHtml = await fetchText(sub.url);
            const subLinks = extractDataLinks(subHtml, sub.url);
            const subFiltered = subLinks.filter((l) => {
              const blob = `${l.url} ${l.label} ${sub.label}`.toLowerCase();
              return /young|youth|juvenile|10[-_ ]?17|under[-_ ]?18|alleged|offender|custody/.test(
                blob
              );
            });
            if (subFiltered.length) {
              console.log(
                `      via ${sub.url}\n        -> ${subLinks.length} data files, ${subFiltered.length} youth/offender-scoped`
              );
            }
            for (const l of subFiltered) {
              if (seen.has(l.url)) continue;
              seen.add(l.url);
              all.push({ ...l, indexPage: indexUrl, viaSubPage: sub.url });
            }
          } catch (e) {
            // sub-page errors are non-fatal
          }
        }
      }
    } catch (e) {
      console.warn(`  ! ${indexUrl}: ${e.message}`);
    }
  }
  if (all.length === 0) {
    if (debugHtml || lastHtml) {
      const path = '/tmp/bocsar-debug.html';
      writeFileSync(path, lastHtml || '<empty>');
      console.error(
        `\nNo source files discovered. Dumped last fetched HTML (${lastIndexUrl}) to ${path}.`
      );
      console.error(
        'Either BOCSAR index page structure changed, or all three index URLs are unreachable.'
      );
    } else {
      console.error('\nNo source files discovered and no HTML fetched. All index URLs unreachable?');
    }
    process.exit(2);
  }
  return all;
}

// ────────────────────────────────────────────────────────────────────
// Parsing — CSV via csv-parse, XLSX via dynamic-import xlsx (SheetJS)
// ────────────────────────────────────────────────────────────────────

let _csvParse = null;
async function getCsvParser() {
  if (_csvParse) return _csvParse;
  const mod = await import('csv-parse/sync');
  _csvParse = mod.parse;
  return _csvParse;
}

let _xlsx = null;
async function getXlsx() {
  if (_xlsx) return _xlsx;
  try {
    _xlsx = await import('xlsx');
    return _xlsx;
  } catch {
    return null;
  }
}

async function parseCsvBuffer(buffer, filename) {
  const parse = await getCsvParser();
  const text = buffer.toString('utf8');
  // BOCSAR CSVs often have a multi-row preamble (title, notes) before the
  // header row. Detect the first row that looks like a header by scanning
  // for a row with >= 3 non-empty cells where the first cell isn't long
  // prose (>80 chars). Fall back to row 0.
  const rawRows = parse(text, {
    skip_empty_lines: false,
    relax_column_count: true,
    trim: true,
  });
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
    const row = rawRows[i] || [];
    const nonEmpty = row.filter((c) => c && String(c).trim()).length;
    const firstLen = (row[0] || '').toString().length;
    if (nonEmpty >= 3 && firstLen < 80) {
      headerIdx = i;
      break;
    }
  }
  const header = (rawRows[headerIdx] || []).map((c) => String(c).trim());
  const dataRows = rawRows
    .slice(headerIdx + 1)
    .filter((r) => r && r.some((c) => c && String(c).trim()));
  const objects = dataRows.map((r) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i] || `col_${i}`] = r[i];
    return obj;
  });
  return { sheetName: filename, header, rows: objects, rowCount: objects.length };
}

async function parseXlsxBuffer(buffer, filename) {
  const XLSX = await getXlsx();
  if (!XLSX) {
    return {
      sheetName: filename,
      header: [],
      rows: [],
      rowCount: 0,
      skipped: 'xlsx package not installed (run: npm install xlsx)',
    };
  }
  const wb = XLSX.read(buffer, { type: 'buffer' });
  // Pick first non-info sheet; BOCSAR conventions put 'Notes' / 'Contents'
  // first. Prefer a data-looking sheet.
  const candidates = wb.SheetNames.filter(
    (n) => !/contents|notes|cover|info/i.test(n)
  );
  const sheetName = candidates[0] || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  // sheet_to_json with header:1 gives us raw arrays so we can do the same
  // preamble-skip logic as CSV.
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
    const row = rawRows[i] || [];
    const nonEmpty = row.filter((c) => c && String(c).trim()).length;
    const firstLen = (row[0] || '').toString().length;
    if (nonEmpty >= 3 && firstLen < 80) {
      headerIdx = i;
      break;
    }
  }
  const header = (rawRows[headerIdx] || []).map((c) => String(c).trim());
  const dataRows = rawRows
    .slice(headerIdx + 1)
    .filter((r) => r && r.some((c) => c && String(c).trim()));
  const objects = dataRows.map((r) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i] || `col_${i}`] = r[i];
    return obj;
  });
  return {
    sheetName,
    header,
    rows: objects,
    rowCount: objects.length,
    workbook_sheets: wb.SheetNames,
  };
}

// ────────────────────────────────────────────────────────────────────
// Normalisation — turn parsed rows into bocsar_youth_offending shape
// ────────────────────────────────────────────────────────────────────

// Header name → canonical dimension. Lower-cased substring match.
const HEADER_MAP = [
  { match: ['lga', 'local government'], dim: 'geography_name' },
  { match: ['region'], dim: 'geography_name' },
  { match: ['year', 'period'], dim: 'period_year' },
  { match: ['quarter'], dim: 'period_quarter' },
  { match: ['month'], dim: 'period_month' },
  { match: ['age'], dim: 'age_group' },
  { match: ['indigenous', 'aboriginal', 'atsi'], dim: 'indigenous_status' },
  { match: ['sex', 'gender'], dim: 'sex' },
  { match: ['anzsoc', 'offence', 'offense'], dim: 'offence_anzsoc' },
  { match: ['subcategory', 'sub-category', 'sub category'], dim: 'offence_subcategory' },
  {
    match: ['proceeding', 'court action', 'legal action', 'action type'],
    dim: 'legal_proceeding',
  },
  {
    match: ['count', 'number', 'incidents', 'offenders', 'persons', 'rate', 'population'],
    dim: 'metric_value',
  },
];

function mapHeader(header) {
  const out = {};
  header.forEach((h, i) => {
    const lower = (h || '').toLowerCase().trim();
    if (!lower) return;
    for (const { match, dim } of HEADER_MAP) {
      if (match.some((m) => lower.includes(m))) {
        if (!out[dim]) out[dim] = i; // first wins
        break;
      }
    }
  });
  return out;
}

function normaliseSuppressedCount(raw) {
  if (raw === null || raw === undefined) return { count: null, suppressed: false };
  const s = String(raw).trim();
  if (!s) return { count: null, suppressed: false };
  if (SUPPRESSION_MARKERS.has(s.toLowerCase())) {
    return { count: null, suppressed: true };
  }
  // Numeric with comma separators
  const cleaned = s.replace(/,/g, '').replace(/\s/g, '');
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const n = parseFloat(cleaned);
    // Counts must be integer — round half-up. Rates would need a separate column.
    return { count: Math.round(n), suppressed: false };
  }
  // Unrecognised string in a count cell — preserve null but DON'T mark suppressed
  return { count: null, suppressed: false };
}

function normaliseIndigenous(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (!s) return null;
  if (/aboriginal|atsi|indigenous/.test(s) && !/non/.test(s)) return 'indigenous';
  if (/non[-_ ]?indigenous|non[-_ ]?aboriginal/.test(s)) return 'non_indigenous';
  if (/^all$|total/.test(s)) return 'all';
  if (/unknown|not stated|n\/?a/.test(s)) return 'unknown';
  return s; // store verbatim if we can't classify
}

function normaliseSex(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (s.startsWith('m')) return 'male';
  if (s.startsWith('f')) return 'female';
  if (/total|all|persons|both/.test(s)) return 'all';
  return s;
}

function normaliseProceeding(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (/court|legal action|crim/.test(s)) return 'court';
  if (/caution/.test(s)) return 'caution';
  if (/youth justice conference|yjc/.test(s)) return 'yjc';
  if (/infringement|tin/.test(s)) return 'infringement';
  if (/custody|detention|remand/.test(s)) return 'custody';
  return s;
}

function deriveMetric(headerLabel) {
  if (!headerLabel) return 'count';
  const s = headerLabel.toLowerCase();
  if (/offender/.test(s)) return 'offenders';
  if (/incident/.test(s)) return 'incidents';
  if (/custod/.test(s)) return 'custody_population';
  if (/remand/.test(s)) return 'remand';
  if (/sentence/.test(s)) return 'sentenced';
  return 'count';
}

function normaliseRows(parsed, fileMeta) {
  const { header, rows } = parsed;
  if (!rows.length) return [];
  const idx = mapHeader(header);
  const metricHeader = idx.metric_value !== undefined ? header[idx.metric_value] : null;
  const metric = deriveMetric(metricHeader);

  // Filename-derived defaults
  const periodFromName = inferPeriodFromFilename(fileMeta.filename) || {
    period_start: '2020-01-01',
    period_end: '2020-12-31',
    period_type: 'year',
  };
  const ageFromName = inferAgeFromFilename(fileMeta.filename);

  const out = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    if (!r || Object.keys(r).length === 0) continue;

    // Skip likely footer/notes rows (first cell long prose).
    const firstVal = r[header[0]] || '';
    if (firstVal && String(firstVal).length > 200) continue;
    if (/^source|^note|^prepared by/i.test(String(firstVal).trim())) continue;

    // Period
    let period = { ...periodFromName };
    const yearVal = idx.period_year !== undefined ? r[header[idx.period_year]] : null;
    if (yearVal && /^\d{4}$/.test(String(yearVal).trim())) {
      const y = parseInt(yearVal, 10);
      period = {
        period_start: `${y}-01-01`,
        period_end: `${y}-12-31`,
        period_type: 'year',
      };
    }

    // Geography
    const geoName =
      idx.geography_name !== undefined
        ? (r[header[idx.geography_name]] || '').toString().trim() || null
        : null;
    const geographyLevel = geoName ? 'lga' : 'state';

    // Cohort
    const ageGroup =
      (idx.age_group !== undefined &&
        (r[header[idx.age_group]] || '').toString().trim()) ||
      ageFromName ||
      '10-17';
    const indigenousStatus =
      idx.indigenous_status !== undefined
        ? normaliseIndigenous(r[header[idx.indigenous_status]])
        : null;
    const sex =
      idx.sex !== undefined ? normaliseSex(r[header[idx.sex]]) : null;
    const offenceAnzsoc =
      idx.offence_anzsoc !== undefined
        ? (r[header[idx.offence_anzsoc]] || '').toString().trim() || null
        : null;
    const offenceSubcategory =
      idx.offence_subcategory !== undefined
        ? (r[header[idx.offence_subcategory]] || '').toString().trim() || null
        : null;
    const legalProceeding =
      idx.legal_proceeding !== undefined
        ? normaliseProceeding(r[header[idx.legal_proceeding]])
        : null;

    // Count
    const rawCount =
      idx.metric_value !== undefined ? r[header[idx.metric_value]] : null;
    const { count, suppressed } = normaliseSuppressedCount(rawCount);

    // Skip rows where we have no metric AND nothing else useful
    if (count === null && !suppressed && !offenceAnzsoc && !geoName) continue;

    out.push({
      state: 'NSW',
      period_start: period.period_start,
      period_end: period.period_end,
      period_type: period.period_type,
      geography_level: geographyLevel,
      geography_name: geoName,
      age_group: ageGroup,
      indigenous_status: indigenousStatus,
      sex: sex,
      offence_anzsoc: offenceAnzsoc,
      offence_subcategory: offenceSubcategory,
      legal_proceeding: legalProceeding,
      metric,
      count,
      suppressed,
      source_file: fileMeta.filename,
      source_url: fileMeta.sourceUrl,
      release_date: null,
      metadata: {
        sheet_name: parsed.sheetName,
        raw_row_index: rowIdx,
        metric_header: metricHeader,
        original_indigenous_label:
          idx.indigenous_status !== undefined
            ? r[header[idx.indigenous_status]]
            : null,
      },
    });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// Source-file tracking — only re-download when sha256 changes
// ────────────────────────────────────────────────────────────────────

async function getKnownSourceFile(url) {
  const { data, error } = await supabase
    .from('bocsar_source_files')
    .select('id, sha256, last_seen_at, parse_status, rows_extracted')
    .eq('source_url', url)
    .limit(1);
  if (error) {
    // If the table doesn't exist yet (migration not applied), return null
    // and treat every file as new. This keeps dry-run useful pre-migration.
    if (error.code === '42P01' || /does not exist/i.test(error.message)) {
      return { __no_table: true };
    }
    throw new Error(`bocsar_source_files lookup: ${error.message}`);
  }
  return data && data[0] ? data[0] : null;
}

async function upsertSourceFile(record) {
  if (!apply) return { action: 'would_upsert_source' };
  const { data, error } = await supabase
    .from('bocsar_source_files')
    .upsert(record, { onConflict: 'source_url' })
    .select('id')
    .single();
  if (error) {
    if (error.code === '42P01' || /does not exist/i.test(error.message)) {
      return { action: 'skipped_no_table' };
    }
    throw new Error(`bocsar_source_files upsert: ${error.message}`);
  }
  return { action: 'upserted', id: data.id };
}

// ────────────────────────────────────────────────────────────────────
// Main pipeline
// ────────────────────────────────────────────────────────────────────

function summariseRows(rows) {
  const sample = rows.slice(0, 5);
  const suppressedCount = rows.filter((r) => r.suppressed).length;
  const indigenousBreakdown = {};
  for (const r of rows) {
    const k = r.indigenous_status || 'null';
    indigenousBreakdown[k] = (indigenousBreakdown[k] || 0) + 1;
  }
  return { sample, suppressedCount, indigenousBreakdown, total: rows.length };
}

async function processFile(file, idxInBatch) {
  const filename = basename(file.url.split('?')[0]);
  console.log(`\n[${idxInBatch + 1}] ${filename}`);
  console.log(`    URL:    ${file.url}`);
  console.log(`    Index:  ${file.indexPage}`);
  console.log(`    Label:  ${file.label}`);

  let known = null;
  try {
    known = await getKnownSourceFile(file.url);
  } catch (e) {
    console.warn(`    ! source-file lookup failed: ${e.message}`);
  }
  const tableMissing = known && known.__no_table;

  let buffer, contentType;
  try {
    const dl = await fetchBuffer(file.url);
    buffer = dl.buffer;
    contentType = dl.contentType;
  } catch (e) {
    console.warn(`    ! download failed: ${e.message}`);
    return { ok: false, error: e.message, file };
  }
  const hash = sha256(buffer);
  console.log(
    `    Size:   ${buffer.byteLength} bytes  sha256=${hash.slice(0, 16)}…  type=${contentType || '?'}`
  );

  // Hash skip — only when we have a known row AND apply mode AND parse_status='ok'
  const hashUnchanged =
    !tableMissing && known && known.sha256 === hash && known.parse_status === 'ok';
  if (hashUnchanged) {
    console.log(
      `    -> hash unchanged since last successful parse (${known.rows_extracted} rows). Skipping parse.`
    );
    // Still touch last_seen
    await upsertSourceFile({
      source_url: file.url,
      filename,
      index_page: file.indexPage,
      sha256: hash,
      byte_size: buffer.byteLength,
      content_type: contentType,
      last_seen_at: new Date().toISOString(),
    });
    return { ok: true, skipped: true, file, hash, rows: [] };
  }

  // Parse
  const lower = filename.toLowerCase();
  let parsed;
  try {
    if (lower.endsWith('.csv')) {
      parsed = await parseCsvBuffer(buffer, filename);
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      parsed = await parseXlsxBuffer(buffer, filename);
    } else {
      console.warn(`    ! unsupported extension`);
      return { ok: false, error: 'unsupported_extension', file };
    }
  } catch (e) {
    console.warn(`    ! parse failed: ${e.message}`);
    if (apply) {
      await upsertSourceFile({
        source_url: file.url,
        filename,
        index_page: file.indexPage,
        sha256: hash,
        byte_size: buffer.byteLength,
        content_type: contentType,
        last_seen_at: new Date().toISOString(),
        last_downloaded_at: new Date().toISOString(),
        parse_status: 'error',
        parse_error: e.message,
      });
    }
    return { ok: false, error: e.message, file };
  }

  if (parsed.skipped) {
    console.log(`    -> ${parsed.skipped}`);
    return { ok: false, skipped: parsed.skipped, file };
  }

  console.log(
    `    Parsed: sheet="${parsed.sheetName}"  rows=${parsed.rowCount}  cols=${parsed.header.length}`
  );
  console.log(
    `    Header: ${parsed.header.slice(0, 8).join(' | ')}${parsed.header.length > 8 ? ' ...' : ''}`
  );

  const normalised = normaliseRows(parsed, {
    filename,
    sourceUrl: file.url,
  });
  const summary = summariseRows(normalised);
  console.log(
    `    Normalised: ${summary.total} rows · suppressed=${summary.suppressedCount} · indigenous_status_breakdown=${JSON.stringify(summary.indigenousBreakdown)}`
  );
  if (summary.sample.length) {
    console.log(`    Sample rows:`);
    for (const s of summary.sample) {
      const tag = s.suppressed ? '[SUPPRESSED]' : `count=${s.count}`;
      console.log(
        `      · ${s.period_start}..${s.period_end} [${s.geography_level}${s.geography_name ? ':' + s.geography_name : ''}] age=${s.age_group} indig=${s.indigenous_status || '-'} sex=${s.sex || '-'} offence="${s.offence_anzsoc || '-'}" metric=${s.metric} ${tag}`
      );
    }
  }

  // Write
  let upsertedRows = 0;
  if (apply && normalised.length) {
    // Chunk in batches of 500 to stay under PostgREST limits.
    const BATCH = 500;
    for (let i = 0; i < normalised.length; i += BATCH) {
      const slice = normalised.slice(i, i + BATCH);
      const { error } = await supabase
        .from('bocsar_youth_offending')
        .upsert(slice, {
          onConflict:
            'period_start,geography_level,geography_name,age_group,indigenous_status,sex,offence_anzsoc,legal_proceeding,metric',
        });
      if (error) {
        console.error(`    ! upsert chunk ${i}: ${error.message}`);
        throw new Error(`upsert failed: ${error.message}`);
      }
      upsertedRows += slice.length;
    }
    console.log(`    -> upserted ${upsertedRows} rows`);
  } else if (!apply) {
    console.log(`    -> dry-run, would upsert ${normalised.length} rows`);
  }

  // Source file tracking
  await upsertSourceFile({
    source_url: file.url,
    filename,
    index_page: file.indexPage,
    sha256: hash,
    byte_size: buffer.byteLength,
    content_type: contentType,
    last_seen_at: new Date().toISOString(),
    last_downloaded_at: new Date().toISOString(),
    last_parsed_at: new Date().toISOString(),
    parse_status: 'ok',
    rows_extracted: normalised.length,
    metadata: {
      sheet: parsed.sheetName,
      header_sample: parsed.header.slice(0, 8),
    },
  });

  return { ok: true, file, hash, rows: normalised, summary };
}

async function main() {
  console.log(
    `BOCSAR youth ingest · ${apply ? 'APPLY' : 'DRY-RUN'} · today=${new Date().toISOString().slice(0, 10)}\n`
  );

  let files;
  if (parseOneUrl) {
    files = [{ url: parseOneUrl, label: basename(parseOneUrl), indexPage: '(manual)' }];
    console.log(`Single-file mode: ${parseOneUrl}\n`);
  } else {
    files = await discoverAll();
    console.log(
      `\nDiscovered ${files.length} youth-scoped data files across ${INDEX_URLS.length} index pages.`
    );
    if (files.length < 3) {
      console.warn(
        `\nWARNING: discovered fewer than 3 files. Spec stop-condition expects >=3. Continuing anyway so dry-run still shows what was found, but check /tmp/bocsar-debug.html if this persists.`
      );
      if (debugHtml || true) {
        try {
          const html = await fetchText(INDEX_URLS[0]);
          writeFileSync('/tmp/bocsar-debug.html', html);
          console.warn(`Dumped /tmp/bocsar-debug.html for inspection.`);
        } catch {}
      }
    }
  }

  if (Number.isFinite(limit)) {
    files = files.slice(0, limit);
    console.log(`Limited to first ${files.length} files (--limit ${limit}).`);
  }

  const results = [];
  // In dry-run, parse only the first file to keep the smoke-test fast. In
  // --apply, walk all of them.
  const toProcess = apply ? files : files.slice(0, 1);
  console.log(
    `\nProcessing ${toProcess.length} of ${files.length} file(s)${apply ? '' : ' (dry-run parses first file only — pass --limit N --apply or --parse-one URL for more)'}.`
  );

  for (let i = 0; i < toProcess.length; i++) {
    try {
      const r = await processFile(toProcess[i], i);
      results.push(r);
    } catch (e) {
      console.error(`  ! processFile threw: ${e.message}`);
      results.push({ ok: false, error: e.message, file: toProcess[i] });
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────
  const ok = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.ok).length;
  const totalRows = results.reduce(
    (a, r) => a + (r.rows ? r.rows.length : 0),
    0
  );
  const totalSuppressed = results.reduce(
    (a, r) => a + (r.summary ? r.summary.suppressedCount : 0),
    0
  );
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log(`Summary:`);
  console.log(`  Discovered:     ${files.length}`);
  console.log(`  Processed:      ${toProcess.length}`);
  console.log(`  Parsed OK:      ${ok}`);
  console.log(`  Hash-skipped:   ${skipped}`);
  console.log(`  Failed:         ${failed}`);
  console.log(`  Total rows:     ${totalRows}`);
  console.log(`  Suppressed:     ${totalSuppressed} cells (count=NULL, suppressed=true)`);
  console.log(`  Mode:           ${apply ? 'APPLIED' : 'DRY-RUN (no DB writes)'}`);
  if (!apply) {
    console.log(`\nRe-run with --apply to write. Re-run with --limit N or --parse-one URL to target specific files.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
