#!/usr/bin/env node
/**
 * Mission Australia Youth Survey — annual aggregate-metric ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md section 5.B.
 *
 * Pipeline:
 *   1. Discover the latest Youth Survey landing page link → national PDF URL.
 *   2. Download national PDF (10MB cap; state PDFs are out of scope for v1).
 *   3. pdf-parse v2 → text.
 *   4. LLM (Gemini → Cerebras fallback) targets ~30 high-value metrics
 *      (top concerns ranked, police contact %, mental-health (K6),
 *      bullying, Indigenous-stratified outcomes, state breakdowns, n=).
 *   5. Each metric becomes ONE row in `youth_survey_results`.
 *   6. Dry-run by default; --apply to write. Idempotent on
 *      (survey_year, geography_level, state, cohort_filter, metric_key).
 *
 * Safety:
 *   - Microdata is NOT public. We extract only aggregate published metrics.
 *   - Suppressed cells (the report's own redactions for small samples) are SKIPPED.
 *   - If Mission Australia changes their site DOM and we can't find the PDF,
 *     we dump /tmp/ma-debug.html with a clear error rather than guessing.
 *
 * Usage:
 *   node scripts/civic/ingest-mission-australia-youth-survey.mjs            # dry-run
 *   node scripts/civic/ingest-mission-australia-youth-survey.mjs --apply    # write
 *   node scripts/civic/ingest-mission-australia-youth-survey.mjs --pdf-url <url>  # bypass discovery
 *
 * Do NOT:
 *   - Apply the migration from here.
 *   - Attempt to access raw microdata or individual responses.
 *   - Extend the schema with per-respondent columns.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

// ── env loader (matches alma-extract-annual-reports.mjs pattern) ─────────
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

// ── args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const PDF_URL_OVERRIDE = (() => {
  const i = args.indexOf('--pdf-url');
  return i >= 0 ? args[i + 1] : null;
})();

const LANDING_URL =
  'https://www.missionaustralia.com.au/what-we-do/evidence-impact-and-advocacy/research/youth-survey/';
const USER_AGENT = 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)';
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB — Youth Survey reports run larger than typical annual reports (often 100-150pp).
const FETCH_TIMEOUT_MS = 60000;
const DEBUG_DUMP_PATH = '/tmp/ma-debug.html';

// ── LLM providers (Gemini primary — long context, then Cerebras fallback) ─
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

// ── supabase (only needed for --apply path) ──────────────────────────────
const supabase =
  env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ── LLM extraction prompt (~30 high-value metrics; suppressed cells skipped) ─
const EXTRACTION_PROMPT = `You are extracting AGGREGATE metrics from the Mission Australia Youth Survey national report (PDF text).

ABSOLUTE RULES:
- Extract ONLY aggregate metrics that are explicitly published in the report. Never compute, infer, or estimate.
- If a cell is suppressed (e.g. "*", "n.p.", "<5", "not published", "—"), SKIP that metric. Do not store zero. Do not guess.
- Microdata is not public. Do NOT extract individual responses, quotes, or case examples. Aggregate only.
- Every metric must have a sample_size (n=) when the report states one. If unstated, leave sample_size null.
- Every metric must have a source_page (the PDF page number where it appears). If you can't locate it precisely, leave null and note in 'notes'.

Return a JSON object: { "survey_year": <int>, "metrics": [ ... ] }.

The "survey_year" is the year of the SURVEY (e.g. 2024 for the survey conducted that year), not the publication year.

Each metric object has this shape:
{
  "geography_level": "national" | "state" | "territory",
  "state": "NSW"|"VIC"|"QLD"|"SA"|"WA"|"TAS"|"ACT"|"NT"|null,   // null when geography_level = "national"
  "cohort_filter": { },                                          // {} for whole sample; e.g. {"indigenous": true}, {"age_range": "15-19"}, {"gender": "female"}
  "metric_key": "<stable_snake_case_id>",                        // e.g. "top_concern_cost_of_living_pct", "police_contact_pct"
  "metric_value": <number>,                                      // raw value (e.g. 41.2 for 41.2%, 1 for rank #1, 3.4 for mean K6 score)
  "metric_unit": "percent" | "count" | "rank" | "mean_score",
  "sample_size": <int> | null,
  "source_page": <int> | null,
  "notes": "<wording of the survey item; any caveats>"
}

TARGET ~30 HIGH-VALUE METRICS (prioritised):

A. Top issues / concerns (national, whole-sample, ranked):
   - top_issue_rank_cost_of_living   (rank, 1=highest concern)
   - top_issue_rank_mental_health
   - top_issue_rank_education
   - top_issue_rank_environment
   - top_issue_rank_equity_discrimination
   - top_concern_<theme>_pct  (the % who picked it as a top-3 issue, when reported)

B. Police / justice contact (HIGH PRIORITY — this is the YJ signal):
   - police_contact_pct (national whole-sample)
   - police_contact_pct (cohort_filter: {"indigenous": true})  — if reported
   - feel_safe_in_community_pct

C. Mental health (Kessler-6 / K6 if reported, else equivalent):
   - k6_high_psychological_distress_pct (national)
   - k6_high_psychological_distress_pct (cohort_filter: {"gender": "female"})
   - k6_high_psychological_distress_pct (cohort_filter: {"gender": "male"})
   - k6_high_psychological_distress_pct (cohort_filter: {"indigenous": true}) — if reported
   - mental_health_help_sought_pct

D. Bullying / safety:
   - bullying_experienced_past_year_pct
   - feel_safe_at_school_pct

E. Post-school plans:
   - plan_university_pct
   - plan_apprenticeship_pct
   - plan_work_pct
   - plan_unsure_pct

F. State breakdowns (when the NATIONAL report includes a "by state" table):
   - top_issue_rank_cost_of_living  for each of NSW/VIC/QLD/SA/WA/TAS/ACT/NT
   - top_issue_rank_mental_health   for each state (only if reported in the national PDF)

G. Sample sizes / methodology:
   - sample_size_total (metric_unit: "count", metric_value: total respondents)
   - sample_size_indigenous (metric_unit: "count", cohort_filter: {"indigenous": true})
   - sample_size by state if reported

Use stable snake_case metric_key values — these are the upsert keys.

If a section of the report is suppressed or absent, skip those metrics. Better to return fewer high-quality rows than to invent.

Return ONLY JSON. No prose, no markdown.`;

// ── helpers ──────────────────────────────────────────────────────────────

async function fetchUrl(url, opts = {}) {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      Accept: opts.accept || 'text/html,application/pdf,*/*',
    },
    ...opts,
  });
}

/**
 * Discover the latest national Youth Survey PDF on the landing page.
 * Strategy: walk every <a href> that mentions "youth survey" + ".pdf" +
 * (a 4-digit year OR the word "national" / "report"). Prefer the highest
 * year. Avoid state-named PDFs for v1.
 *
 * Returns { pdfUrl, landingHtml, candidates } or throws with debug dump.
 */
async function discoverLatestPdfUrl() {
  console.log(`\n→ Discovering Youth Survey PDF from ${LANDING_URL}`);
  const res = await fetchUrl(LANDING_URL);
  if (!res.ok) {
    // Mission Australia's site is fronted by Cloudflare's bot-challenge mode
    // (cf-mitigated: challenge). A 403 here almost always means the WAF is
    // refusing a non-JS client, not that the page is gone. Capture the body
    // so the operator can confirm before falling back to --pdf-url.
    let body = '';
    try {
      body = await res.text();
      writeFileSync(DEBUG_DUMP_PATH, body, 'utf8');
    } catch {
      /* best-effort */
    }
    const cfHit = (res.headers.get('cf-mitigated') || '').toLowerCase() === 'challenge'
      || body.toLowerCase().includes('cloudflare');
    throw new Error(
      `Landing page returned HTTP ${res.status}${cfHit ? ' (Cloudflare bot challenge)' : ''}. ` +
        `Dumped response body to ${DEBUG_DUMP_PATH}. ` +
        `Workaround: pass --pdf-url <direct-pdf-url> (the PDF host itself usually permits direct downloads) ` +
        `or run discovery from a residential IP / headless browser.`,
    );
  }
  const html = await res.text();

  // Mission Australia's site often links to a /research-reports/ sub-page
  // with the actual PDF — collect candidates from this page AND any obvious
  // sub-pages we should crawl.
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();

    if (!hay.includes('youth survey') && !hay.includes('youth-survey')) continue;
    if (!hay.endsWith('.pdf') && !hay.includes('.pdf')) {
      // Could be a sub-page link — track it for second-pass crawl.
      candidates.push({ kind: 'subpage', url: absolutize(rawHref, res.url || LANDING_URL), text });
      continue;
    }

    // Skip state-specific PDFs for v1 (spec says start with national).
    const stateNames = ['new-south-wales', 'victoria', 'queensland', 'south-australia', 'western-australia', 'tasmania', 'northern-territory', 'act-', 'nsw-', 'vic-', 'qld-', 'sa-', 'wa-', 'tas-', 'nt-'];
    if (stateNames.some((s) => hay.includes(s))) continue;

    const yearMatch = hay.match(/20\d{2}/g);
    const year = yearMatch ? Math.max(...yearMatch.map(Number)) : 0;
    const nationalSignal = /national|whole|all\s+youth|overview|key\s+findings|summary/i.test(hay) ? 1 : 0;

    candidates.push({
      kind: 'pdf',
      url: absolutize(rawHref, res.url || LANDING_URL),
      text,
      year,
      nationalSignal,
    });
  }

  const pdfCandidates = candidates.filter((c) => c.kind === 'pdf');
  if (pdfCandidates.length > 0) {
    // Highest year wins, then national-signal as tiebreaker.
    pdfCandidates.sort((a, b) => b.year - a.year || b.nationalSignal - a.nationalSignal);
    return { pdfUrl: pdfCandidates[0].url, landingHtml: html, candidates: pdfCandidates };
  }

  // No direct PDFs on the landing page — try one level of crawl into the
  // most-recently-named subpage (e.g. "/youth-survey-2024/").
  const subpages = candidates.filter((c) => c.kind === 'subpage');
  if (subpages.length > 0) {
    // Score subpages by year hint in URL/text.
    const scored = subpages.map((s) => {
      const yearMatch = `${s.url} ${s.text}`.toLowerCase().match(/20\d{2}/g);
      return { ...s, year: yearMatch ? Math.max(...yearMatch.map(Number)) : 0 };
    });
    scored.sort((a, b) => b.year - a.year);
    const best = scored[0];
    console.log(`  · No PDF on landing — crawling sub-page ${best.url}`);

    const subRes = await fetchUrl(best.url);
    if (subRes.ok) {
      const subHtml = await subRes.text();
      const subLinkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
      const subCandidates = [];
      let sm;
      while ((sm = subLinkRe.exec(subHtml)) !== null) {
        const rawHref = sm[1].trim();
        const text = sm[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const hay = `${rawHref} ${text}`.toLowerCase();
        const stateNames = ['new-south-wales', 'victoria', 'queensland', 'south-australia', 'western-australia', 'tasmania', 'northern-territory'];
        if (stateNames.some((s) => hay.includes(s))) continue;
        const yearMatch = hay.match(/20\d{2}/g);
        const year = yearMatch ? Math.max(...yearMatch.map(Number)) : 0;
        const nationalSignal = /national|youth-survey-report|key.findings/i.test(hay) ? 1 : 0;
        subCandidates.push({
          kind: 'pdf',
          url: absolutize(rawHref, subRes.url || best.url),
          text,
          year,
          nationalSignal,
        });
      }
      if (subCandidates.length > 0) {
        subCandidates.sort((a, b) => b.year - a.year || b.nationalSignal - a.nationalSignal);
        return { pdfUrl: subCandidates[0].url, landingHtml: html, candidates: subCandidates };
      }
    }
  }

  // Failed both passes — dump debug HTML and throw with clear pointer.
  try {
    writeFileSync(DEBUG_DUMP_PATH, html, 'utf8');
  } catch {
    // best-effort
  }
  throw new Error(
    `Could not discover a national Youth Survey PDF on ${LANDING_URL}. ` +
      `The page DOM may have changed. Dumped landing HTML to ${DEBUG_DUMP_PATH} — ` +
      `inspect it, then either fix the discovery regex above or pass --pdf-url <direct-pdf-url>.`,
  );
}

function absolutize(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

async function downloadPdf(pdfUrl) {
  console.log(`→ Downloading PDF: ${pdfUrl}`);
  const res = await fetchUrl(pdfUrl, { accept: 'application/pdf' });
  if (!res.ok) throw new Error(`PDF fetch failed: HTTP ${res.status}`);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('text/html')) {
    throw new Error(`Expected PDF but got HTML (content-type=${ct}). URL=${pdfUrl}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_PDF_BYTES) {
    throw new Error(`PDF too large: ${buf.length} bytes (cap ${MAX_PDF_BYTES}).`);
  }
  if (buf.slice(0, 4).toString() !== '%PDF') {
    throw new Error('Downloaded file is not a PDF (no %PDF magic bytes).');
  }
  console.log(`  · ${(buf.length / 1024).toFixed(0)} KB`);
  return { buffer: buf, finalUrl: res.url || pdfUrl };
}

async function extractPdfText(buffer) {
  // pdf-parse v2 — same pattern as alma-extract-annual-reports.mjs.
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result?.text || '';
}

async function callLLM(systemPrompt, userContent) {
  if (PROVIDERS.length === 0) {
    throw new Error('No LLM keys configured (set GEMINI_API_KEY or CEREBRAS_API_KEY in .env.local).');
  }
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
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
        const match = text.match(/\{[\s\S]+\}/);
        if (match) return { provider: provider.name, model: provider.model, json: JSON.parse(match[0]) };
      }
    } catch (e) {
      console.warn(`  · LLM ${provider.name} failed: ${e.message}`);
    }
  }
  throw new Error('All LLM providers failed.');
}

// ── validation: drop anything that looks suppressed or malformed ─────────
function isValidMetric(m) {
  if (!m || typeof m !== 'object') return false;
  if (!m.metric_key || typeof m.metric_key !== 'string') return false;
  if (m.metric_value === null || m.metric_value === undefined) return false;
  if (typeof m.metric_value !== 'number' || Number.isNaN(m.metric_value)) return false;
  if (!m.metric_unit || !['percent', 'count', 'rank', 'mean_score'].includes(m.metric_unit)) return false;
  if (!m.geography_level || !['national', 'state', 'territory'].includes(m.geography_level)) return false;
  // Suppressed-cell guard: many tables encode suppression as a placeholder
  // numeric (e.g. -1, 0 for "n.p."). We only allow 0 for genuine "count" or
  // "rank" units; for percent / mean_score, a 0 is suspect.
  if ((m.metric_unit === 'percent' || m.metric_unit === 'mean_score') && m.metric_value === 0) {
    return false;
  }
  return true;
}

function normaliseMetric(m, surveyYear, sourcePdfUrl) {
  return {
    survey_year: surveyYear,
    geography_level: m.geography_level,
    state: m.state || null,
    cohort_filter: m.cohort_filter || {},
    metric_key: m.metric_key,
    metric_value: m.metric_value,
    metric_unit: m.metric_unit,
    sample_size: typeof m.sample_size === 'number' ? m.sample_size : null,
    source_pdf_url: sourcePdfUrl,
    source_page: typeof m.source_page === 'number' ? m.source_page : null,
    notes: m.notes || null,
  };
}

async function upsertMetric(row) {
  if (!supabase) throw new Error('Supabase client not initialised — check NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  // The unique index covers (survey_year, geography_level, COALESCE(state,''), cohort_filter::text, metric_key).
  // Supabase .upsert() needs an onConflict string matching index columns. Because
  // our index uses an expression (cohort_filter::text), Supabase can't target it
  // directly via .upsert(). Use select-then-insert-or-update instead.
  const cohortJson = JSON.stringify(row.cohort_filter || {});
  const { data: existing, error: selErr } = await supabase
    .from('youth_survey_results')
    .select('id')
    .eq('survey_year', row.survey_year)
    .eq('geography_level', row.geography_level)
    .eq('metric_key', row.metric_key)
    .filter('state', row.state ? 'eq' : 'is', row.state ?? null)
    .filter('cohort_filter', 'eq', cohortJson)
    .limit(1)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') {
    return { ok: false, error: selErr.message };
  }
  if (existing?.id) {
    const { error } = await supabase
      .from('youth_survey_results')
      .update({ ...row, ingested_at: new Date().toISOString() })
      .eq('id', existing.id);
    return error ? { ok: false, error: error.message } : { ok: true, action: 'updated' };
  }
  const { error } = await supabase.from('youth_survey_results').insert(row);
  return error ? { ok: false, error: error.message } : { ok: true, action: 'inserted' };
}

// ── main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mission Australia Youth Survey ingest · ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  if (PROVIDERS.length === 0) {
    console.warn('WARN: no LLM keys set. Discovery + PDF download will run, but no metrics will be extracted.');
  }

  // 1. Discover PDF (unless overridden).
  let pdfUrl;
  if (PDF_URL_OVERRIDE) {
    pdfUrl = PDF_URL_OVERRIDE;
    console.log(`Using --pdf-url override: ${pdfUrl}`);
  } else {
    const discovery = await discoverLatestPdfUrl();
    pdfUrl = discovery.pdfUrl;
    console.log(`  · Picked: ${pdfUrl}`);
    console.log(`  · Considered ${discovery.candidates.length} candidate(s).`);
  }

  // Early stop criteria: if we only needed to prove discovery works.
  if (args.includes('--discover-only')) {
    console.log('\n--discover-only set; stopping after PDF discovery.');
    return;
  }

  // 2. Download.
  const { buffer } = await downloadPdf(pdfUrl);

  // 3. Parse to text.
  console.log('→ Parsing PDF text');
  const text = await extractPdfText(buffer);
  console.log(`  · ${text.length.toLocaleString()} chars extracted`);
  if (text.length < 2000) {
    throw new Error('PDF text suspiciously short — likely a scanned-image PDF. Aborting.');
  }

  // Reports run 100-150pp. Send the first ~120K chars to the LLM — this
  // covers the main body / state tables. Methodology appendix at the back
  // is intentionally omitted.
  const truncated = text.slice(0, 120_000);

  if (PROVIDERS.length === 0) {
    console.log('\nNo LLM keys — stopping after PDF parse. Re-run with GEMINI_API_KEY set to extract metrics.');
    return;
  }

  // 4. Extract.
  console.log('→ LLM extraction (targeting ~30 high-value metrics)');
  const userContent = `Source PDF URL: ${pdfUrl}\n\nFull report text follows:\n\n${truncated}`;
  const llm = await callLLM(EXTRACTION_PROMPT, userContent);
  console.log(`  · ${llm.provider}/${llm.model} returned JSON`);

  const surveyYear =
    typeof llm.json?.survey_year === 'number' ? llm.json.survey_year : null;
  if (!surveyYear) {
    throw new Error('LLM did not return a valid survey_year. Cannot upsert without it.');
  }

  const rawMetrics = Array.isArray(llm.json?.metrics) ? llm.json.metrics : [];
  console.log(`  · ${rawMetrics.length} candidate metrics returned`);

  // 5. Validate + normalise.
  const valid = [];
  const dropped = [];
  for (const m of rawMetrics) {
    if (isValidMetric(m)) {
      valid.push(normaliseMetric(m, surveyYear, pdfUrl));
    } else {
      dropped.push(m);
    }
  }
  console.log(`  · ${valid.length} valid · ${dropped.length} dropped (suppressed/malformed)`);
  if (dropped.length > 0 && dropped.length <= 5) {
    for (const d of dropped) {
      console.log(`    - dropped: ${d?.metric_key || '?'} (value=${d?.metric_value}, unit=${d?.metric_unit})`);
    }
  }

  // 6. Dry-run print or apply.
  console.log(`\n=== Survey ${surveyYear} · ${valid.length} metric(s) ===`);
  for (const row of valid) {
    const cohort = Object.keys(row.cohort_filter).length
      ? ` [${Object.entries(row.cohort_filter).map(([k, v]) => `${k}=${v}`).join(',')}]`
      : '';
    const geo =
      row.geography_level === 'national'
        ? 'NAT'
        : `${row.geography_level.toUpperCase()}:${row.state || '?'}`;
    const sample = row.sample_size ? ` n=${row.sample_size}` : '';
    const page = row.source_page ? ` p.${row.source_page}` : '';
    console.log(
      `  · ${geo}${cohort} ${row.metric_key} = ${row.metric_value}${row.metric_unit === 'percent' ? '%' : ''}${sample}${page}`,
    );
  }

  if (!APPLY) {
    console.log(`\nDRY-RUN complete. Re-run with --apply to write ${valid.length} rows to youth_survey_results.`);
    return;
  }

  if (!supabase) {
    throw new Error('--apply set but Supabase env not configured.');
  }

  console.log(`\n→ Writing ${valid.length} rows to youth_survey_results`);
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  for (const row of valid) {
    const r = await upsertMetric(row);
    if (!r.ok) {
      console.warn(`  · FAIL ${row.metric_key}: ${r.error}`);
      failed++;
      continue;
    }
    if (r.action === 'inserted') inserted++;
    else updated++;
  }
  console.log(`\n${inserted} inserted · ${updated} updated · ${failed} failed`);
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`);
  if (e.message.includes('discover') || e.message.includes('DOM')) {
    console.error(`  Hint: inspect ${DEBUG_DUMP_PATH} or pass --pdf-url <direct-pdf>.`);
  }
  process.exit(1);
});
