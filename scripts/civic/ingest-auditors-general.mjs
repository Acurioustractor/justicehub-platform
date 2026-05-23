#!/usr/bin/env node
/**
 * State Auditors-General — performance audit ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md §7.A
 * Schema: supabase/migrations/20260523_auditor_general_audits.sql
 *
 * Scrapes the 6 verified state Audit Office index pages (QLD, NSW, VIC, WA,
 * SA, TAS — NT/ACT skipped until URLs are verified per spec), filters listed
 * reports by youth-justice keyword signals, downloads matching PDFs, runs
 * pdf-parse v2 → Gemini LLM to extract structured fields matching the
 * `auditor_general_audits` schema.
 *
 * Dry-run by default — only prints what would land. Use --apply to write.
 * Idempotent on url (UNIQUE) and (jurisdiction, lower(title)) — re-runs
 * update extractions in place rather than duplicating.
 *
 * Usage:
 *   node scripts/civic/ingest-auditors-general.mjs                 # dry-run, all jurisdictions
 *   node scripts/civic/ingest-auditors-general.mjs --apply         # write to auditor_general_audits
 *   node scripts/civic/ingest-auditors-general.mjs --jurisdiction qld   # single jurisdiction
 *   node scripts/civic/ingest-auditors-general.mjs --limit 3       # only process first 3 matched audits
 *   node scripts/civic/ingest-auditors-general.mjs --debug-html    # dump first index page to /tmp
 *
 * Discovery fallback: if every jurisdiction returns zero matched audits,
 * dumps diagnostic HTML and exits non-zero.
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
const jurisdictionArg = args.find((_, i) => args[i - 1] === '--jurisdiction');
const jurisdictionFilter = jurisdictionArg ? jurisdictionArg.toLowerCase() : null;

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB — audit reports are heavier than JR papers
const FETCH_TIMEOUT_MS = 45000;
const MIN_YEAR = 2020; // v1: only recent audits
const POLITE_DELAY_MS = 1500;

// Per spec §7.A: 6 verified jurisdictions. NT + ACT skipped pending URL verification.
// Each entry has the index URL and a tolerant regex matcher for what counts as a
// performance-audit listing on that site (the markup varies per jurisdiction).
const JURISDICTIONS = [
  {
    code: 'qld',
    name: 'Queensland Audit Office',
    indexUrls: [
      'https://www.qao.qld.gov.au/reports-resources/reports-parliament',
      'https://www.qao.qld.gov.au/reports-resources/reports-parliament?type=2',
    ],
  },
  {
    code: 'nsw',
    name: 'NSW Audit Office',
    indexUrls: [
      'https://www.audit.nsw.gov.au/our-work/reports/performance',
      'https://www.audit.nsw.gov.au/publications/performance-audit-reports',
    ],
  },
  {
    code: 'vic',
    name: 'Victorian Auditor-General Office',
    indexUrls: [
      'https://www.audit.vic.gov.au/reports',
      'https://www.audit.vic.gov.au/our-work/published-reports',
    ],
  },
  {
    code: 'wa',
    name: 'Office of the Auditor General Western Australia',
    indexUrls: [
      'https://audit.wa.gov.au/reports-and-publications/reports/',
      'https://audit.wa.gov.au/reports-and-publications/reports/?_report_type=performance-audit',
    ],
  },
  {
    code: 'sa',
    name: 'Auditor-General Department South Australia',
    indexUrls: [
      'https://www.audit.sa.gov.au/reports',
      'https://www.audit.sa.gov.au/publications-and-reports/published-reports',
    ],
  },
  {
    code: 'tas',
    name: 'Tasmanian Audit Office',
    indexUrls: [
      'https://www.audit.tas.gov.au/publication-category/performance-audit/',
      'https://www.audit.tas.gov.au/publications/',
    ],
  },
];

// YJ keyword signals — case-insensitive, matched against link text + URL slug.
// Tuned to be permissive at discovery (the LLM later confirms relevance) but
// excludes obvious adjacent topics (adult prison, child protection only).
const YJ_KEYWORDS = [
  'youth', 'juvenile', 'young offender', 'young people', 'children',
  'detention', 'reintegrat', 'rehabilitation', 'corrective services',
  'serious crime', 'youth crime', 'youth justice', 'child safety',
];

// Anti-keywords — strong signals that a hit is NOT youth-justice scoped.
// Prevents flooding the LLM with adult prison + child-protection-only reports.
const ANTI_KEYWORDS = [
  'adult', 'prison procurement', 'aged care', 'disability ndis',
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

const EXTRACTION_PROMPT = `You are extracting structured facts from an Australian state Auditor-General performance audit report PDF.

These reports are independent assessments of how well a government department or agency is performing its functions. We are specifically interested in audits touching youth justice — youth detention, young offender reintegration, children's services with a justice nexus, serious youth crime responses.

Output JSON with these fields. Use null when the document doesn't contain the data — do not invent.

- title: string — the official report title, exactly as it appears on the cover/front matter.
- report_number: string — e.g. "Report 15: 2023-24", "Report 4 of 2024". Null if no formal number.
- publication_date: string ISO date (YYYY-MM-DD) — when the audit office published the report.
- tabled_date: string ISO date (YYYY-MM-DD) — when the report was tabled in parliament. Often appears in the front matter. Distinct from publication_date.
- yj_relevant: boolean — true only if the report's primary subject is youth justice, youth detention, young offender rehabilitation/reintegration, or a youth-specific cohort within the justice system. False if the youth angle is incidental.
- yj_relevance_reason: string — one short sentence explaining why yj_relevant=true/false (max 200 chars).
- key_findings: array of 3-8 strings — verbatim or close-paraphrased findings as they appear in the report's findings/observations section. Include numbers and named programs where present. No fabrication.
- key_recommendations: array of objects with shape:
    { number: string|null, text: string, target_body: string|null, addressed_to: string|null, response: 'accepted'|'partially_accepted'|'rejected'|'noted'|null }
    "number" is the formal recommendation number if any (e.g. "1", "5(a)"). "target_body" is the entity expected to action it. "response" reflects the agency's response if recorded in the report.
- status: one of "open" | "partially_implemented" | "implemented" | "rejected" — overall implementation status if the report itself is a follow-up. Default "open" for first-time audits.
- notes: string — anything else surprising or context-shifting (max 300 chars).

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
        signal: AbortSignal.timeout(90000),
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

// Extract every <a> on the index page and score it for YJ relevance.
// Returns array of { url, text, score, year } absolutised against baseUrl.
function extractAuditLinks(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('javascript:')) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const hay = `${rawHref} ${text}`.toLowerCase();
    if (ANTI_KEYWORDS.some((k) => hay.includes(k))) continue;

    const matches = YJ_KEYWORDS.filter((k) => hay.includes(k));
    if (matches.length === 0) continue;

    // Score: more keyword hits = higher confidence. Also bonus for "report" / "audit".
    let score = matches.length;
    if (/\baudit\b|\breport\b|\breview\b/.test(hay)) score += 1;
    if (/\bperformance\b/.test(hay)) score += 1;

    const yearMatch = hay.match(/20\d{2}/g);
    const year = yearMatch ? Math.max(...yearMatch.map(Number)) : null;
    if (year !== null && year < MIN_YEAR) continue;

    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    candidates.push({ url: absolute, text, score, year, matched_keywords: matches });
  }
  return candidates;
}

// Resolve a content-page link (HTML landing) to its underlying PDF.
function findPdfLinkInHtml(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    // Prefer the report PDF, skip "presentation slides" or "media release" PDFs.
    if (/presentation|slides|media[- ]release|fact[- ]sheet|brochure/.test(hay)) continue;
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

async function discoverForJurisdiction(juris) {
  const seen = new Map();
  let lastHtml = '';
  let lastSourceUrl = '';

  for (const indexUrl of juris.indexUrls) {
    console.log(`  · scanning ${indexUrl}`);
    const page = await fetchPage(indexUrl);
    if (!page.ok) {
      console.warn(`    ! ${page.reason}`);
      continue;
    }
    lastHtml = page.html;
    lastSourceUrl = indexUrl;
    const found = extractAuditLinks(page.html, page.finalUrl);
    console.log(`    · ${found.length} YJ-keyword matches`);
    for (const link of found) {
      // dedupe by URL, prefer higher score on collision
      const existing = seen.get(link.url);
      if (!existing || link.score > existing.score) {
        seen.set(link.url, { ...link, source_index: indexUrl });
      }
    }
    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }

  const all = [...seen.values()].sort((a, b) => b.score - a.score);

  if (debugHtml && lastHtml) {
    const debugPath = `/tmp/aga-${juris.code}-debug.html`;
    writeFileSync(debugPath, `<!-- source: ${lastSourceUrl} -->\n${lastHtml}`);
    console.log(`    · debug HTML written to ${debugPath}`);
  }

  return { jurisdiction: juris.code, candidates: all, lastHtml, lastSourceUrl };
}

async function processAudit(juris, candidate) {
  console.log(`\n→ [${juris.code.toUpperCase()}] ${candidate.text}`);
  console.log(`  ${candidate.url}`);
  console.log(`  · score=${candidate.score} year=${candidate.year ?? '?'} keywords=[${candidate.matched_keywords.join(', ')}]`);

  const pdf = await fetchPdf(candidate.url);
  if (!pdf.ok) {
    console.log(`  · skip: ${pdf.reason}`);
    return { ok: false, reason: pdf.reason };
  }

  const text = await extractPdfText(pdf.buffer);
  if (!text || text.length < 1000) {
    console.log(`  · skip: text too short (${text.length} chars) — likely scanned image PDF`);
    return { ok: false, reason: 'text_too_short' };
  }

  // Audit reports run 40-200 pages. Front-matter (cover/contents/exec summary)
  // + findings + recommendations live in the first ~50K chars, which is what
  // we send to the LLM. Beyond that is appendix detail.
  const truncated = text.slice(0, 50000);
  const userContent = `Jurisdiction: ${juris.code.toUpperCase()} (${juris.name})\nDocument URL: ${candidate.url}\nAnchor text on index page: ${candidate.text}\n\nDocument text:\n${truncated}`;

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

  // Reject extractions the LLM has flagged as non-YJ-relevant.
  if (j.yj_relevant === false) {
    console.log(`  · LLM marked NOT yj-relevant: ${j.yj_relevance_reason || '(no reason)'}`);
    return { ok: false, reason: 'not_yj_relevant' };
  }

  console.log(
    `  · ${llm.provider}: "${j.title || '?'}" · ${j.report_number || 'no-number'} · pub=${j.publication_date || '?'} · tabled=${j.tabled_date || '?'} · status=${j.status || '?'}`
  );
  if (Array.isArray(j.key_findings)) {
    j.key_findings.slice(0, 3).forEach((f, i) => {
      console.log(`      · finding ${i + 1}: ${String(f).slice(0, 140)}${String(f).length > 140 ? '…' : ''}`);
    });
  }
  if (Array.isArray(j.key_recommendations)) {
    console.log(`      · ${j.key_recommendations.length} recommendations`);
  }

  return {
    ok: true,
    record: {
      jurisdiction: juris.code,
      title: j.title || candidate.text.slice(0, 200),
      report_number: j.report_number ?? null,
      url: candidate.url,
      publication_date: isIsoDate(j.publication_date) ? j.publication_date : null,
      tabled_date: isIsoDate(j.tabled_date) ? j.tabled_date : null,
      key_findings: Array.isArray(j.key_findings) ? j.key_findings : null,
      key_recommendations: Array.isArray(j.key_recommendations) ? j.key_recommendations : null,
      status: ['open', 'partially_implemented', 'implemented', 'rejected'].includes(j.status)
        ? j.status
        : 'open',
      raw_text: text.slice(0, 200000), // cap to keep row size sane
      metadata: {
        anchor_text: candidate.text,
        source_index: candidate.source_index,
        matched_keywords: candidate.matched_keywords,
        discovery_score: candidate.score,
        discovery_year_hint: candidate.year,
        yj_relevance_reason: j.yj_relevance_reason ?? null,
        llm_notes: j.notes ?? null,
        pdf_bytes: pdf.buffer.length,
      },
      extracted_at: new Date().toISOString(),
      llm_model: `${llm.provider}/${llm.model}`,
    },
  };
}

function isIsoDate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

async function upsertAudit(record) {
  // Two unique constraints: url (column-level), and (jurisdiction, lower(title))
  // (index). Supabase .upsert can only target one — we use url as the primary
  // conflict target and fall back to a select-then-update path if the
  // jurisdiction/title combo already exists with a different URL.
  const { data: existingByTitle } = await supabase
    .from('auditor_general_audits')
    .select('id, url')
    .eq('jurisdiction', record.jurisdiction)
    .ilike('title', record.title)
    .limit(1);

  if (existingByTitle && existingByTitle[0] && existingByTitle[0].url !== record.url) {
    // Existing row with same (jurisdiction,title) but different URL — update in place.
    const { error } = await supabase
      .from('auditor_general_audits')
      .update(record)
      .eq('id', existingByTitle[0].id);
    if (error) throw new Error(`update-by-title failed: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from('auditor_general_audits')
    .upsert(record, { onConflict: 'url' });
  if (error) throw new Error(`upsert failed: ${error.message}`);
}

async function main() {
  console.log(`Auditor-General ingestion · ${apply ? 'APPLY' : 'DRY-RUN'}${jurisdictionFilter ? ` · juris=${jurisdictionFilter}` : ''}${limit !== Infinity ? ` · limit=${limit}` : ''}\n`);
  if (PROVIDERS.length === 0) {
    console.log('(no LLM keys — dry-run will discover audits and download, but skip extraction)\n');
  }

  const jurisdictions = jurisdictionFilter
    ? JURISDICTIONS.filter((j) => j.code === jurisdictionFilter)
    : JURISDICTIONS;

  if (jurisdictions.length === 0) {
    console.error(`No jurisdiction matched "${jurisdictionFilter}". Valid: ${JURISDICTIONS.map((j) => j.code).join(', ')}`);
    process.exit(1);
  }

  const discoveryByJuris = [];
  for (const juris of jurisdictions) {
    console.log(`\n· ${juris.code.toUpperCase()} — ${juris.name}`);
    const res = await discoverForJurisdiction(juris);
    discoveryByJuris.push({ juris, ...res });
    console.log(`  → ${res.candidates.length} audit candidates after dedupe`);
  }

  const totalCandidates = discoveryByJuris.reduce((acc, d) => acc + d.candidates.length, 0);

  if (totalCandidates === 0) {
    console.error('\n! Zero audit candidates discovered across all jurisdictions.');
    console.error('  This usually means the audit office index pages have been restructured');
    console.error('  or are JS-rendered (need headless browser fallback).');
    for (const d of discoveryByJuris) {
      if (d.lastHtml) {
        const debugPath = `/tmp/aga-${d.jurisdiction}-debug.html`;
        writeFileSync(debugPath, `<!-- source: ${d.lastSourceUrl} -->\n${d.lastHtml}`);
        console.error(`  · ${d.jurisdiction}: HTML dumped to ${debugPath} (last index: ${d.lastSourceUrl})`);
      }
    }
    process.exit(2);
  }

  console.log(`\n${totalCandidates} total candidates across ${jurisdictions.length} jurisdictions.\n`);

  let extracted = 0;
  let skipped = 0;
  let written = 0;
  let processed = 0;

  for (const d of discoveryByJuris) {
    if (processed >= limit) break;
    const remaining = limit - processed;
    const toProcess = d.candidates.slice(0, Math.min(remaining, d.candidates.length));
    for (const candidate of toProcess) {
      processed++;
      const result = await processAudit(d.juris, candidate);
      if (!result.ok) {
        skipped++;
        continue;
      }
      extracted++;
      if (apply) {
        try {
          await upsertAudit(result.record);
          written++;
        } catch (e) {
          console.warn(`  · DB upsert failed: ${e.message}`);
        }
      }
      // be polite to state audit office hosts
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(
    `\nCandidates: ${totalCandidates} · processed: ${processed} · extracted: ${extracted} · skipped: ${skipped}${
      apply ? ` · written: ${written}` : ' (dry-run, nothing written)'
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
