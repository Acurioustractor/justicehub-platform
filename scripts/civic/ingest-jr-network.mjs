#!/usr/bin/env node
/**
 * JR Network evaluations — PDF ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md §5.A
 * Schema: supabase/migrations/20260523_jr_evaluations.sql
 *
 * Scrapes the Justice Reinvestment Network research index pages, discovers
 * all .pdf links, downloads each, runs pdf-parse v2 to extract text, then
 * calls an LLM (Gemini 2.5 Flash primary, Cerebras fallback) to extract
 * structured fields matching the `jr_evaluations` schema.
 *
 * Dry-run by default — only prints what would land. Use --apply to write.
 * Idempotent on source_url.
 *
 * Usage:
 *   node scripts/civic/ingest-jr-network.mjs                  # dry-run, all discovered PDFs
 *   node scripts/civic/ingest-jr-network.mjs --apply          # write to jr_evaluations
 *   node scripts/civic/ingest-jr-network.mjs --limit 3        # only process first 3 PDFs
 *   node scripts/civic/ingest-jr-network.mjs --debug-html     # dump first index page to /tmp
 *
 * Discovery fallback: if fewer than 5 PDFs are found across all index pages,
 * dumps the last fetched HTML to /tmp/jr-debug.html and exits non-zero so
 * the operator can adjust the link-extraction heuristic.
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

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB cap — JR reports tend to be image-heavy
const FETCH_TIMEOUT_MS = 30000;
const MIN_EXPECTED_PDFS = 5; // fallback threshold per spec

// Index pages from build-specs §5.A. The JR Network publishes research in a
// few siloed sections; rather than rely on a single index we crawl multiple
// candidate listing pages and dedupe by URL.
const INDEX_URLS = [
  'https://justicereinvestment.net.au/research-papers-and-reports/',
  'https://justicereinvestment.net.au/resources/',
  'https://justicereinvestment.net.au/maranguka/',
  'https://justicereinvestment.net.au/about-justice-reinvestment/',
];

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

const EXTRACTION_PROMPT = `You are extracting structured facts from a Justice Reinvestment evaluation or research paper PDF.

These documents typically evaluate community-led crime-prevention initiatives in Australian Aboriginal communities (Maranguka in Bourke NSW, Olabud Doogethu in Halls Creek WA, Moree, Glen Innes, Cooktown).

Output JSON with these fields. Use null when the document doesn't contain the data — do not invent.

- program_name: string — e.g. "Maranguka Justice Reinvestment", "Olabud Doogethu". Null if not a single-program evaluation.
- site_location: string — town and state, e.g. "Bourke, NSW". Include traditional name in brackets if mentioned, e.g. "Bourke (Barkindji Country), NSW".
- evaluator: string — the body that authored / commissioned the evaluation. e.g. "KPMG", "ANU JR Hub", "Just Reinvest NSW".
- publication_year: integer (e.g. 2018). The year the report was published.
- evaluation_type: one of "impact_assessment" | "community_led" | "academic". Pick the closest:
    * impact_assessment = commissioned by funder or government, quantitative outcome focus (e.g. KPMG-style)
    * community_led = produced by or with the community, narrative + outcomes blended
    * academic = university research, peer-review oriented
- program_cost_dollars: integer — total annual or evaluation-period operating cost in AUD if stated. No commas.
- claimed_savings_dollars: integer — claimed economic benefit / cost-avoidance / govt savings in AUD if stated.
- outcomes_json: object with:
    * key_findings: array of 3-5 verbatim or close-paraphrased findings (strings, with numbers where present)
    * metrics: object with any quantitative outcomes named (e.g. "domestic_violence_reduction_pct": 23)
    * mechanisms: array of strings — named approaches/interventions (e.g. "Aboriginal-led backbone team", "Cross-sector data sharing")
    * geography: string — region / community covered
- notes: string — anything else surprising or context-shifting (max 200 chars)

Return ONLY JSON, no prose.`;

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

// Extract all .pdf links from an index page, with anchor text for context.
// Returns array of { url, text } absolutised against baseUrl.
function extractPdfLinks(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    // Match .pdf in href OR query string (some links are /file?id=... that serve PDFs but
    // we only want clearly-marked .pdf URLs to avoid false positives on the index).
    if (!/\.pdf(\?|#|$)/i.test(rawHref)) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    results.push({ url: absolute, text });
  }
  return results;
}

// Reused by fetchPdf landing-page fallback — same heuristic as
// alma-extract-annual-reports.mjs: prefer the highest-year .pdf link
// whose context mentions report/evaluation/research/maranguka/etc.
function findPdfLinkInHtml(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    const hasSignal = /report|evaluat|research|maranguka|olabud|reinvestment|impact|assessment/.test(hay);
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

async function discoverAllPdfs() {
  const seen = new Map(); // url -> { url, text, source_index }
  let lastHtml = '';
  let lastSourceUrl = '';

  for (const indexUrl of INDEX_URLS) {
    console.log(`· scanning ${indexUrl}`);
    const page = await fetchPage(indexUrl);
    if (!page.ok) {
      console.warn(`  ! ${page.reason}`);
      continue;
    }
    lastHtml = page.html;
    lastSourceUrl = indexUrl;
    const found = extractPdfLinks(page.html, page.finalUrl);
    console.log(`  · ${found.length} .pdf links`);
    for (const link of found) {
      if (!seen.has(link.url)) {
        seen.set(link.url, { ...link, source_index: indexUrl });
      }
    }
    // be polite
    await new Promise((r) => setTimeout(r, 1500));
  }

  const all = [...seen.values()];

  if (debugHtml && lastHtml) {
    writeFileSync('/tmp/jr-debug.html', `<!-- source: ${lastSourceUrl} -->\n${lastHtml}`);
    console.log('  · debug HTML written to /tmp/jr-debug.html');
  }

  if (all.length < MIN_EXPECTED_PDFS) {
    const debugPath = '/tmp/jr-debug.html';
    writeFileSync(debugPath, `<!-- source: ${lastSourceUrl} (last scanned)\n     discovered: ${all.length}/${MIN_EXPECTED_PDFS} expected -->\n${lastHtml}`);
    console.error(`\n! Discovery returned ${all.length} PDFs (expected ≥${MIN_EXPECTED_PDFS}).`);
    console.error(`  Diagnostic HTML: ${debugPath}`);
    console.error(`  Last index scanned: ${lastSourceUrl}`);
    console.error(`  This usually means JR Network restructured their site OR the index pages are JS-rendered.`);
    console.error(`  Inspect the HTML and adjust INDEX_URLS / extractPdfLinks() heuristics.`);
    process.exit(2);
  }

  return all;
}

async function processPdf(pdfRef) {
  console.log(`\n→ ${pdfRef.text || '(no anchor text)'}`);
  console.log(`  ${pdfRef.url}`);

  const pdf = await fetchPdf(pdfRef.url);
  if (!pdf.ok) {
    console.log(`  · skip: ${pdf.reason}`);
    return { ok: false, reason: pdf.reason };
  }

  const text = await extractPdfText(pdf.buffer);
  if (!text || text.length < 500) {
    console.log(`  · skip: text too short (${text.length} chars) — likely scanned image PDF`);
    return { ok: false, reason: 'text_too_short' };
  }

  // JR reports range 20-150 pages; first 40K chars covers exec summary,
  // methodology, and most of the findings/recommendations.
  const truncated = text.slice(0, 40000);
  const userContent = `Document URL: ${pdfRef.url}\nAnchor text on index page: ${pdfRef.text || '(none)'}\n\nDocument text:\n${truncated}`;

  if (PROVIDERS.length === 0) {
    console.log('  · no LLM keys configured (CEREBRAS_API_KEY / GEMINI_API_KEY) — would extract here');
    return { ok: false, reason: 'no_llm_keys', pdf_bytes: pdf.buffer.length, text_chars: text.length };
  }

  const llm = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!llm) {
    console.log('  · all LLM providers failed');
    return { ok: false, reason: 'llm_failed' };
  }

  const j = llm.json || {};
  console.log(
    `  · ${llm.provider}: program=${j.program_name || '?'} · site=${j.site_location || '?'} · ${j.publication_year || '?'} · ${j.evaluator || '?'}` +
      (j.program_cost_dollars ? ` · cost=$${j.program_cost_dollars.toLocaleString()}` : '') +
      (j.claimed_savings_dollars ? ` · savings=$${j.claimed_savings_dollars.toLocaleString()}` : '')
  );
  if (Array.isArray(j.outcomes_json?.key_findings)) {
    j.outcomes_json.key_findings.slice(0, 3).forEach((f, i) => {
      console.log(`      · finding ${i + 1}: ${String(f).slice(0, 120)}${String(f).length > 120 ? '…' : ''}`);
    });
  }

  return {
    ok: true,
    record: {
      program_name: j.program_name ?? null,
      site_location: j.site_location ?? null,
      alma_organization_id: null, // resolved separately — not done in this script
      evaluator: j.evaluator ?? null,
      publication_year: typeof j.publication_year === 'number' ? j.publication_year : null,
      evaluation_type: ['impact_assessment', 'community_led', 'academic'].includes(j.evaluation_type)
        ? j.evaluation_type
        : null,
      program_cost_dollars: typeof j.program_cost_dollars === 'number' ? j.program_cost_dollars : null,
      claimed_savings_dollars: typeof j.claimed_savings_dollars === 'number' ? j.claimed_savings_dollars : null,
      outcomes_json: j.outcomes_json ?? null,
      source_url: pdfRef.url,
      pdf_storage_path: null,
      verification_status: 'unverified',
      extracted_at: new Date().toISOString(),
      extractor: { provider: llm.provider, model: llm.model, anchor_text: pdfRef.text },
    },
  };
}

async function upsertEvaluation(record) {
  // Conflict on source_url (UNIQUE in schema). Use ON CONFLICT via .upsert
  // with onConflict: 'source_url' so re-runs update extractions in place.
  const { error } = await supabase
    .from('jr_evaluations')
    .upsert(record, { onConflict: 'source_url' });
  if (error) throw new Error(`upsert failed: ${error.message}`);
}

async function main() {
  console.log(`JR Network ingestion · ${apply ? 'APPLY' : 'DRY-RUN'}${limit !== Infinity ? ` · limit=${limit}` : ''}\n`);
  if (PROVIDERS.length === 0) {
    console.log('(no LLM keys — dry-run will discover PDFs and download, but skip extraction)\n');
  }

  const pdfs = await discoverAllPdfs();
  console.log(`\n${pdfs.length} unique PDF links discovered.\n`);

  const toProcess = pdfs.slice(0, Math.min(limit, pdfs.length));

  let extracted = 0;
  let skipped = 0;
  let written = 0;
  for (const pdfRef of toProcess) {
    const result = await processPdf(pdfRef);
    if (!result.ok) {
      skipped++;
      continue;
    }
    extracted++;
    if (apply) {
      try {
        await upsertEvaluation(result.record);
        written++;
      } catch (e) {
        console.warn(`  · DB upsert failed: ${e.message}`);
      }
    }
    // be polite to JR Network's host
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    `\nDiscovered: ${pdfs.length} · processed: ${toProcess.length} · extracted: ${extracted} · skipped: ${skipped}${
      apply ? ` · written: ${written}` : ' (dry-run, nothing written)'
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
