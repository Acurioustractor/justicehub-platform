#!/usr/bin/env node
/**
 * Sentencing Advisory Councils — youth-justice report ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md §4
 * Schema reuse: existing `oversight_recommendations` table (no new migration).
 *
 * Scrapes each priority SAC publications index, discovers .pdf links, filters
 * by youth-keywords + date >= 2015, downloads each, runs pdf-parse v2 to
 * extract text, then calls an LLM (Gemini 2.5 Flash primary, Cerebras fallback)
 * to extract structured recommendations.
 *
 * Each extracted recommendation lands as ONE row in `oversight_recommendations`,
 * mapped to: oversight_body (slug), report_title, recommendation_text,
 * recommendation_number, status='pending' (spec says 'open' but DB uses
 * 'pending' for newly-tracked items — see §status mapping below), severity
 * (derived from recommendation language), jurisdiction (uppercase state code),
 * domain='youth_justice', report_date.
 *
 * Conflict policy: ON CONFLICT (oversight_body, report_title, recommendation_text)
 * DO NOTHING. Existing rows are treated as authoritative — human edits to
 * status/severity/status_notes are preserved.
 *
 * Skip-list:
 *   - Adult-only sentencing reviews
 *   - Statistical-only releases (SACStat updates, court bulletins)
 *   - Submissions TO inquiries
 *   - Conference papers / speeches
 *
 * Per spec §4 priority: VIC (highest yield) > TAS > NSW > NT. WA/SA/ACT
 * deferred (no SAC, very low yield — handle as one-offs later).
 *
 * Dry-run by default; --apply writes. Idempotent on conflict key.
 *
 * Usage:
 *   node scripts/civic/ingest-sentencing-councils.mjs                   # dry-run all sources
 *   node scripts/civic/ingest-sentencing-councils.mjs --apply           # write
 *   node scripts/civic/ingest-sentencing-councils.mjs --source vic      # one source
 *   node scripts/civic/ingest-sentencing-councils.mjs --limit 3         # cap PDFs processed
 *   node scripts/civic/ingest-sentencing-councils.mjs --debug-html      # dump first index HTML
 *
 * Status mapping (spec says 'open', DB has no 'open' value):
 *   - 'pending'  = recommendation extracted, government response not yet tracked
 *   - This matches existing convention for QLD audit-office recs in the table.
 *   - Human review can update to 'accepted' / 'rejected' / 'implemented' later.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const debugHtml = args.includes('--debug-html');
const limitArg = args.find((_, i) => args[i - 1] === '--limit');
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const sourceArg = (args.find((_, i) => args[i - 1] === '--source') || '').toLowerCase();

const MAX_PDF_BYTES = 20 * 1024 * 1024;   // SAC reports occasionally large (full sentencing reviews)
const FETCH_TIMEOUT_MS = 30000;
const MIN_YEAR = 2015;                     // per spec: filter date >= 2015
const POLITE_DELAY_MS = 2000;
const MIN_VIC_PDFS = 3;                    // fallback floor for stop criterion

// Source registry — hard-coded per spec §4. Each entry has the publications
// index URL plus the slug used as `oversight_body`. WA/SA/ACT intentionally
// omitted from v1 (spec: low yield, handle as one-offs).
//
// Discovery is two-stage by design — every SAC site we audited uses an
// index → landing-page → .pdf structure rather than direct .pdf links on
// the index page. We:
//   1. Scrape each index_urls[] page and collect all *landing-page* links
//      whose href/text matches a youth signal (regex `landing_pattern`).
//   2. Fetch each landing page and pull out the actual .pdf URL using
//      findPdfLinkInHtml().
const SOURCES = [
  {
    key: 'vic',
    jurisdiction: 'VIC',
    oversight_body: 'vic-sentencing-advisory-council',
    body_name: 'Sentencing Advisory Council Victoria',
    // Use the a-to-z index — it lists every publication landing page in
    // one go. publications-by-year/by-topic would also work but are
    // partial views, a-to-z is the full set.
    index_urls: [
      'https://www.sentencingcouncil.vic.gov.au/publications/publications-a-to-z',
      'https://www.sentencingcouncil.vic.gov.au/publications-by-year',
    ],
    // landing pages on VIC live at /publications/<slug>
    landing_pattern: /^\/publications\/[^/?#]+$/,
  },
  {
    key: 'tas',
    jurisdiction: 'TAS',
    oversight_body: 'tas-sentencing-advisory-council',
    body_name: 'Sentencing Advisory Council Tasmania',
    index_urls: [
      'https://www.sentencingcouncil.tas.gov.au/reports',
    ],
    // TAS structure: reports linked from /reports listing — pattern varies,
    // need to discover. Fallback: any .pdf direct link picks them up too.
    landing_pattern: /\/reports?\/[^/?#]+$/,
  },
  {
    key: 'nsw',
    jurisdiction: 'NSW',
    oversight_body: 'nsw-sentencing-council',
    body_name: 'NSW Sentencing Council',
    index_urls: [
      'https://sentencingcouncil.nsw.gov.au/content/dcj/sentencing-council/sentencing-council-home/our-work/completed-projects.html',
      'https://sentencingcouncil.nsw.gov.au/',
    ],
    // NSW's CMS exposes work pages under /our-work/completed-projects/<slug>.html
    landing_pattern: /\/our-work\/(completed-projects|current-projects)\/[^/?#]+\.html$/,
  },
  {
    key: 'nt',
    jurisdiction: 'NT',
    oversight_body: 'nt-law-reform-committee',
    body_name: 'NT Law Reform Committee',
    index_urls: [
      'https://agd.nt.gov.au/law-reform-reviews',
    ],
    landing_pattern: /\/law-reform-reviews?\/[^/?#]+$/,
  },
];

// Anchor-text + URL signals that indicate the PDF is youth-focused.
// Spec §4 calls out children / young / youth / crossover as the VIC filter
// terms; we extend slightly to catch the way actual reports are titled.
const YOUTH_SIGNALS = [
  'youth',
  'young',
  'children',
  'child',
  'juvenile',
  'crossover',
  'minors',
  'underage',
  'under 18',
  'under-18',
];

// Anchor-text patterns that indicate we should SKIP (per spec skip-list).
const SKIP_PATTERNS = [
  /\bsubmission\b/i,                       // submissions TO inquiries
  /\bsacstat\b/i,                          // statistical-only releases
  /\bcourt bulletin\b/i,
  /\bstatistical (release|update|bulletin)\b/i,
  /\bspeech\b/i,
  /\bconference (paper|address)\b/i,
  /\bopinion piece\b/i,
  /\bsentencing snapshots?\b/i,            // VIC's data-only series
];

// Statuses, severity, and domain values are constrained by what already
// exists in `oversight_recommendations`. Spec §4 says `status='open'` and
// `domain='youth_justice'`. DB has no 'open' value — closest is 'pending'.
// Domain: both 'youth-justice' and 'youth_justice' appear; spec explicitly
// says `youth_justice`, so we follow the spec (underscore).
const DEFAULT_STATUS = 'pending';
const DEFAULT_DOMAIN = 'youth_justice';

const PROVIDERS = [
  {
    name: 'gemini',
    key: env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
  {
    name: 'cerebras',
    key: env.CEREBRAS_API_KEY,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'qwen-3-235b-a22b-instruct-2507',
  },
].filter((p) => p.key);

const EXTRACTION_PROMPT = `You are extracting structured recommendations from an Australian Sentencing Advisory Council report PDF.

These reports typically review sentencing of children / young people / juveniles / "crossover kids", or related youth-justice topics. Your job is to extract:
  1. report-level metadata (title, date)
  2. each NUMBERED recommendation as a separate object

Output JSON with these top-level fields. Use null when the document doesn't contain the data — do not invent.

- report_title: string — the official title of the report exactly as printed (e.g. "Sentencing Children and Young People in Victoria"). No quotation marks.
- report_date: string in YYYY-MM-DD format — the publication date. Use YYYY-MM-01 if only month/year given. Use YYYY-01-01 if only year is given.
- report_year: integer (e.g. 2025).
- is_youth_focused: boolean — true if the report's primary subject is youth / children / juveniles / crossover kids; false if it only mentions youth incidentally inside an adult-focused review.
- is_statistical_only: boolean — true if this is a data-only release (e.g. "SACStat" updates, sentencing snapshot tables) with no policy recommendations.
- is_submission_to_inquiry: boolean — true if this document is a submission TO another inquiry rather than a council's own report.
- recommendations: array of objects, each with:
    * number: string — e.g. "1", "3.2", "12(a)". The recommendation's printed number. If unnumbered, generate "rec_<n>" in order of appearance.
    * text: string — verbatim recommendation text. Do NOT paraphrase. Trim leading "Recommendation X:" prefix if present. Max 2000 chars.
    * target_body: string|null — the body the recommendation is directed at (e.g. "Victorian Government", "Department of Justice and Community Safety", "Children's Court"). Null if not specified.
    * severity: one of "critical" | "high" | "medium" — derive from recommendation language:
        - critical = must / should be abolished / immediate / urgent / serious harm
        - high     = should / must / require legislative change / introduce new powers
        - medium   = consider / review / explore / encourage / monitor

Return ONLY JSON, no prose. If the document is not youth-focused OR is statistical-only OR a submission-to-inquiry, still set those flags but you may return an empty recommendations array.`;

async function callLLM(prompt, userContent) {
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        console.warn(`  · LLM ${provider.name} ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        return { provider: provider.name, model: provider.model, json: JSON.parse(text) };
      } catch {
        const m = text.match(/\{[\s\S]+\}/);
        if (m) return { provider: provider.name, model: provider.model, json: JSON.parse(m[0]) };
      }
    } catch (e) {
      console.warn(`  · LLM ${provider.name} failed: ${e.message}`);
    }
  }
  return null;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const html = await res.text();
    return { ok: true, html, finalUrl: res.url || url };
  } catch (e) {
    return { ok: false, reason: `fetch_failed: ${e.message}` };
  }
}

async function fetchPdf(url, { allowLandingPageCrawl = true } = {}) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
        Accept: 'application/pdf,text/html,*/*',
      },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) {
      if (!allowLandingPageCrawl) return { ok: false, reason: 'html_not_pdf' };
      const html = await res.text();
      const discovered = findPdfLinkInHtml(html, res.url || url);
      if (!discovered) return { ok: false, reason: 'html_no_pdf_links_found' };
      console.log(`  · landing page → crawled, trying ${discovered}`);
      return fetchPdf(discovered, { allowLandingPageCrawl: false });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PDF_BYTES) return { ok: false, reason: `too_large:${buf.length}` };
    if (buf.slice(0, 4).toString() !== '%PDF') return { ok: false, reason: 'not_a_pdf_file' };
    return { ok: true, buffer: buf, finalUrl: res.url || url };
  } catch (e) {
    return { ok: false, reason: `fetch_failed: ${e.message}` };
  }
}

// Stage 1: find landing-page links on an index page that pass the youth
// filter. Returns array of { url, text, year_hint } absolutised.
//
// We accept TWO shapes:
//   (a) Direct .pdf links — picked up if href ends in .pdf and youth signal matches.
//   (b) Landing-page links — href matches source.landing_pattern AND youth signal.
//
// All filters: skip-list, year>=MIN_YEAR (if year present), youth signal.
function extractCandidateLandingPages(html, baseUrl, landingPattern) {
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    // Determine link shape:
    //   isPdf = direct .pdf URL
    //   isLanding = matches source's landing-page pattern (path only)
    const isPdf = /\.pdf(\?|#|$)/i.test(rawHref);
    let path;
    try {
      path = new URL(absolute).pathname;
    } catch {
      continue;
    }
    const isLanding = landingPattern instanceof RegExp ? landingPattern.test(path) : false;
    if (!isPdf && !isLanding) continue;

    const hay = `${rawHref} ${text}`.toLowerCase();

    // Skip-list short-circuit
    if (SKIP_PATTERNS.some((re) => re.test(hay))) continue;

    // Year extraction — accept if any 4-digit 20xx mentioned and >= MIN_YEAR.
    // Many landing-page slugs don't include the year; if absent, keep the
    // candidate and let the LLM resolve date.
    const years = (hay.match(/\b20\d{2}\b/g) || []).map(Number);
    const maxYear = years.length ? Math.max(...years) : null;
    if (maxYear !== null && maxYear < MIN_YEAR) continue;

    // Youth keyword filter — must hit at least one signal in href OR text
    const hasYouthSignal = YOUTH_SIGNALS.some((s) => hay.includes(s));
    if (!hasYouthSignal) continue;

    results.push({ url: absolute, text, year_hint: maxYear, is_pdf: isPdf });
  }
  // Dedupe by URL
  const seen = new Map();
  for (const r of results) if (!seen.has(r.url)) seen.set(r.url, r);
  return [...seen.values()];
}

// Reused by fetchPdf landing-page fallback — same heuristic as
// alma-extract-annual-reports / ingest-jr-network: prefer the highest-year
// .pdf link whose context mentions sentencing/report/recommendations.
function findPdfLinkInHtml(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    const hasSignal = /report|recommendation|sentencing|review|paper/.test(hay);
    if (!hasSignal) continue;
    const yearMatch = hay.match(/20\d{2}/g);
    const year = yearMatch ? Math.max(...yearMatch.map(Number)) : 0;
    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    candidates.push({ url: absolute, year, text });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.year - a.year);
  return candidates[0].url;
}

async function extractPdfText(buffer) {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result?.text || '';
  } catch (e) {
    console.warn(`  · pdf-parse failed: ${e.message}`);
    return '';
  }
}

async function discoverForSource(source) {
  console.log(`\n· source: ${source.key.toUpperCase()} (${source.body_name})`);
  const candidates = new Map(); // url -> { url, text, year_hint, is_pdf, source_index }
  let lastHtml = '';
  let lastSourceUrl = '';

  // Stage 1: scan index page(s) for youth-filtered links (PDFs or landing pages).
  for (const indexUrl of source.index_urls) {
    console.log(`  · scanning ${indexUrl}`);
    const page = await fetchPage(indexUrl);
    if (!page.ok) {
      console.warn(`    ! ${page.reason}`);
      continue;
    }
    lastHtml = page.html;
    lastSourceUrl = indexUrl;
    const found = extractCandidateLandingPages(page.html, page.finalUrl, source.landing_pattern);
    const pdfCount = found.filter((f) => f.is_pdf).length;
    const landingCount = found.length - pdfCount;
    console.log(`    · ${found.length} youth-filtered candidates (${pdfCount} direct .pdf, ${landingCount} landing pages)`);
    for (const link of found) {
      if (!candidates.has(link.url)) candidates.set(link.url, { ...link, source_index: indexUrl });
    }
    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }

  if (debugHtml && lastHtml) {
    const path = `/tmp/sac-${source.key}-debug.html`;
    writeFileSync(path, `<!-- source: ${lastSourceUrl} -->\n${lastHtml}`);
    console.log(`    · debug HTML written to ${path}`);
  }

  // Stage 2: for each landing page, fetch it and resolve to the PDF.
  // Direct PDFs pass through unchanged.
  const resolved = new Map(); // pdfUrl -> { url, text, year_hint, landing_url? }
  for (const cand of candidates.values()) {
    if (cand.is_pdf) {
      if (!resolved.has(cand.url)) resolved.set(cand.url, cand);
      continue;
    }
    // Fetch landing page, find PDF link in body
    const page = await fetchPage(cand.url);
    if (!page.ok) {
      console.warn(`    · landing fetch failed: ${cand.url} (${page.reason})`);
      continue;
    }
    const pdfUrl = findPdfLinkInHtml(page.html, page.finalUrl);
    if (!pdfUrl) {
      console.warn(`    · no PDF on landing: ${cand.url}`);
      continue;
    }
    if (!resolved.has(pdfUrl)) {
      resolved.set(pdfUrl, {
        url: pdfUrl,
        text: cand.text,
        year_hint: cand.year_hint,
        landing_url: cand.url,
        source_index: cand.source_index,
      });
    }
    // be polite — landing-page resolution is many small requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`    → resolved ${resolved.size} PDF(s) after two-stage discovery`);
  return [...resolved.values()];
}

function severityForText(t) {
  const s = String(t || '').toLowerCase();
  if (/\b(must|abolish|urgent|immediate(ly)?|abolition|repeal)\b/.test(s)) return 'critical';
  if (/\b(should|require|introduce|enact|legislate|amend|expand|increase)\b/.test(s)) return 'high';
  return 'medium';
}

function buildRecordsFromExtraction(source, pdfRef, extraction) {
  const recs = Array.isArray(extraction?.recommendations) ? extraction.recommendations : [];
  if (recs.length === 0) return [];

  const report_title = String(extraction.report_title || pdfRef.text || '(untitled report)').slice(0, 500);
  const report_date = typeof extraction.report_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(extraction.report_date)
    ? extraction.report_date
    : (typeof extraction.report_year === 'number' ? `${extraction.report_year}-01-01` : null);

  return recs
    .filter((r) => r && typeof r.text === 'string' && r.text.trim().length > 20)
    .map((r) => {
      const text = String(r.text).trim().slice(0, 2000);
      const llmSeverity = ['critical', 'high', 'medium'].includes(r.severity) ? r.severity : null;
      return {
        jurisdiction: source.jurisdiction,
        domain: DEFAULT_DOMAIN,
        oversight_body: source.oversight_body,
        report_title,
        report_date,
        report_url: pdfRef.url,
        recommendation_number: String(r.number || '').slice(0, 50) || null,
        recommendation_text: text,
        status: DEFAULT_STATUS,
        status_notes: null,
        target_department: r.target_body ? String(r.target_body).slice(0, 200) : null,
        severity: llmSeverity || severityForText(text),
        metadata: {
          source_key: source.key,
          body_name: source.body_name,
          anchor_text: pdfRef.text || null,
          extracted_at: new Date().toISOString(),
          llm_provider: extraction._provider || null,
          llm_model: extraction._model || null,
          is_youth_focused: extraction.is_youth_focused ?? null,
          year_hint: pdfRef.year_hint ?? null,
        },
      };
    });
}

async function processPdf(source, pdfRef) {
  console.log(`\n→ [${source.key.toUpperCase()}] ${pdfRef.text || '(no anchor text)'}`);
  console.log(`  ${pdfRef.url}`);

  const pdf = await fetchPdf(pdfRef.url);
  if (!pdf.ok) {
    console.log(`  · skip: ${pdf.reason}`);
    return { ok: false, reason: pdf.reason, records: [] };
  }

  const text = await extractPdfText(pdf.buffer);
  if (!text || text.length < 500) {
    console.log(`  · skip: text too short (${text.length} chars) — likely scanned image PDF`);
    return { ok: false, reason: 'text_too_short', records: [] };
  }

  // SAC reports often >100pp. Recommendations cluster in the front matter
  // (exec summary lists them) AND the back (annexed list). Take the first
  // 30K chars (exec summary + body) plus the last 15K chars (often the
  // verbatim recommendation list / appendices). This catches both styles.
  const head = text.slice(0, 30000);
  const tail = text.length > 30000 ? text.slice(-15000) : '';
  const truncated = tail ? `${head}\n\n[... middle pages omitted ...]\n\n${tail}` : head;

  const userContent = `Document URL: ${pdfRef.url}\nAnchor text on index page: ${pdfRef.text || '(none)'}\nJurisdiction: ${source.jurisdiction}\nIssuing body: ${source.body_name}\n\nDocument text:\n${truncated}`;

  if (PROVIDERS.length === 0) {
    console.log('  · no LLM keys (GEMINI_API_KEY / CEREBRAS_API_KEY) — would extract here');
    return { ok: false, reason: 'no_llm_keys', records: [], pdf_bytes: pdf.buffer.length, text_chars: text.length };
  }

  const llm = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!llm) {
    console.log('  · all LLM providers failed');
    return { ok: false, reason: 'llm_failed', records: [] };
  }
  const j = llm.json || {};
  j._provider = llm.provider;
  j._model = llm.model;

  // Skip-list at extraction time — second pass after we have content
  if (j.is_youth_focused === false) {
    console.log('  · skip: LLM reports not youth-focused');
    return { ok: false, reason: 'not_youth_focused', records: [] };
  }
  if (j.is_statistical_only === true) {
    console.log('  · skip: LLM reports statistical-only release');
    return { ok: false, reason: 'statistical_only', records: [] };
  }
  if (j.is_submission_to_inquiry === true) {
    console.log('  · skip: LLM reports this is a submission TO an inquiry');
    return { ok: false, reason: 'submission_to_inquiry', records: [] };
  }

  const records = buildRecordsFromExtraction(source, pdfRef, j);
  console.log(`  · ${llm.provider}: title="${(j.report_title || '?').slice(0, 80)}" · date=${j.report_date || '?'} · ${records.length} recommendation(s) extracted`);
  records.slice(0, 3).forEach((r, i) => {
    console.log(`      · rec ${r.recommendation_number || `(unnumbered ${i + 1})`} [${r.severity}]: ${r.recommendation_text.slice(0, 110)}${r.recommendation_text.length > 110 ? '…' : ''}`);
  });

  return { ok: true, records };
}

async function insertWithConflictSkip(records) {
  if (records.length === 0) return { inserted: 0, conflicted: 0 };
  // Spec: ON CONFLICT (oversight_body, report_title, recommendation_text) DO NOTHING
  //
  // The table does NOT have a unique constraint on that triple. Supabase's
  // `.upsert({ ignoreDuplicates: true, onConflict: '...' })` requires an
  // existing unique/exclusion constraint, which we don't want to add (would
  // be a migration). So we manually check existence by querying first, then
  // insert only the diff. This is the same pattern used by
  // seed-rcadic-recommendations.mjs.
  const conflictKey = (r) => `${r.oversight_body}|${r.report_title}|${r.recommendation_text}`;

  // Group by (oversight_body, report_title) to reduce queries
  const groups = new Map();
  for (const r of records) {
    const gk = `${r.oversight_body}||${r.report_title}`;
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk).push(r);
  }

  const existingKeys = new Set();
  for (const [, group] of groups) {
    const { oversight_body, report_title } = group[0];
    const { data, error } = await supabase
      .from('oversight_recommendations')
      .select('recommendation_text')
      .eq('oversight_body', oversight_body)
      .eq('report_title', report_title);
    if (error) {
      console.warn(`  · existence-check failed for ${oversight_body} / ${report_title.slice(0, 50)}: ${error.message}`);
      continue;
    }
    (data || []).forEach((r) => existingKeys.add(`${oversight_body}|${report_title}|${r.recommendation_text}`));
  }

  const toInsert = records.filter((r) => !existingKeys.has(conflictKey(r)));
  const conflicted = records.length - toInsert.length;

  if (toInsert.length === 0) return { inserted: 0, conflicted };

  // Batch in chunks of 50 to keep payload small.
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const slice = toInsert.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from('oversight_recommendations')
      .insert(slice, { count: 'exact' });
    if (error) throw new Error(`insert failed: ${error.message}`);
    inserted += typeof count === 'number' ? count : slice.length;
  }
  return { inserted, conflicted };
}

async function main() {
  console.log(`Sentencing Advisory Councils ingestion · ${apply ? 'APPLY' : 'DRY-RUN'}${limit !== Infinity ? ` · limit=${limit}` : ''}\n`);
  if (PROVIDERS.length === 0) {
    console.log('(no LLM keys — dry-run will discover/download PDFs but skip extraction)\n');
  }

  const sources = sourceArg ? SOURCES.filter((s) => s.key === sourceArg) : SOURCES;
  if (sources.length === 0) {
    console.error(`No source matches --source ${sourceArg}. Known: ${SOURCES.map((s) => s.key).join(', ')}`);
    process.exit(1);
  }

  // Stage 1: discover all candidate PDFs across all configured sources.
  const discovered = []; // {source, pdfRef}[]
  const perSourceCounts = {};
  for (const source of sources) {
    const pdfs = await discoverForSource(source);
    perSourceCounts[source.key] = pdfs.length;
    for (const p of pdfs) discovered.push({ source, pdfRef: p });
  }

  console.log(`\nDiscovery summary:`);
  for (const [k, n] of Object.entries(perSourceCounts)) console.log(`  · ${k}: ${n}`);

  // Stop-criterion + VIC/TAS fallback per task spec.
  const vicCount = perSourceCounts.vic ?? 0;
  const tasCount = perSourceCounts.tas ?? 0;
  if (vicCount < MIN_VIC_PDFS && tasCount < MIN_VIC_PDFS && !sourceArg) {
    const debugPath = '/tmp/sac-discovery-diagnostic.txt';
    writeFileSync(
      debugPath,
      `Discovery returned fewer than ${MIN_VIC_PDFS} PDFs from VIC AND TAS.\n\n` +
        `Counts:\n${JSON.stringify(perSourceCounts, null, 2)}\n\n` +
        `Likely causes:\n` +
        `  - VIC publications index moved/restructured\n` +
        `  - JS-rendered list (would need playwright)\n` +
        `  - Youth-keyword filter too narrow\n` +
        `\nUse --debug-html to dump the index HTML and inspect, then adjust YOUTH_SIGNALS or index_urls.\n`
    );
    console.error(`\n! Discovery failed for primary sources (VIC=${vicCount}, TAS=${tasCount}). Diagnostic: ${debugPath}`);
    process.exit(2);
  }

  // Stage 2: process each PDF, optionally cap by --limit.
  const toProcess = discovered.slice(0, Math.min(limit, discovered.length));
  console.log(`\nProcessing ${toProcess.length} PDF(s) (of ${discovered.length} discovered)\n`);

  let extracted = 0;
  let skipped = 0;
  let totalRecs = 0;
  let totalInserted = 0;
  let totalConflicted = 0;

  for (const { source, pdfRef } of toProcess) {
    const result = await processPdf(source, pdfRef);
    if (!result.ok) {
      skipped++;
      // be polite even on skip
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
      continue;
    }
    extracted++;
    totalRecs += result.records.length;

    if (apply && result.records.length > 0) {
      try {
        const { inserted, conflicted } = await insertWithConflictSkip(result.records);
        totalInserted += inserted;
        totalConflicted += conflicted;
        console.log(`  · DB: ${inserted} inserted · ${conflicted} skipped (already present)`);
      } catch (e) {
        console.warn(`  · DB insert failed: ${e.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }

  console.log('\n--- Summary ---');
  console.log(`Discovered PDFs:        ${discovered.length}`);
  console.log(`Processed:              ${toProcess.length}`);
  console.log(`Extracted (with recs):  ${extracted}`);
  console.log(`Skipped:                ${skipped}`);
  console.log(`Recommendations total:  ${totalRecs}`);
  if (apply) {
    console.log(`Rows inserted:          ${totalInserted}`);
    console.log(`Rows skipped (conflict):${totalConflicted}`);
  } else {
    console.log(`Mode:                   DRY-RUN (no rows written — use --apply to persist)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
