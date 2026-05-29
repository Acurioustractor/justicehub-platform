#!/usr/bin/env node
/**
 * State Auditors-General — performance audit ingestion.
 *
 * Spec: docs/civic-connectors/build-specs.md §7.A
 * Schema: supabase/migrations/20260523_auditor_general_audits.sql
 *
 * Discovery strategy: most state audit office sites have JS-rendered or
 * AJAX-paginated index pages that don't expose report links in raw HTML.
 * Instead we use their XML sitemaps (verified for QLD, NSW, VIC, WA, SA, TAS)
 * which list every published report URL in machine-readable form.
 *
 * For each sitemap we:
 *   1. Walk all <loc> entries
 *   2. Filter by YJ keyword signals on the URL slug
 *   3. Filter to recent reports (slug or sitemap lastmod >= 2020)
 *   4. Fetch the report's landing page
 *   5. Resolve to PDF where one exists (some, e.g. WA Banksia Hill, are
 *      multi-page HTML reports — we ingest the landing page's combined text)
 *   6. Extract structured fields via Gemini LLM
 *
 * Dry-run by default — only prints what would land. Use --apply to write.
 * Idempotent on url (UNIQUE) and (jurisdiction, lower(title)) — re-runs
 * update extractions in place rather than duplicating.
 *
 * NT and ACT are skipped until their sitemaps are verified (per spec §7.A).
 *
 * Usage:
 *   node scripts/civic/ingest-auditors-general.mjs                 # dry-run, all jurisdictions
 *   node scripts/civic/ingest-auditors-general.mjs --apply         # write to auditor_general_audits
 *   node scripts/civic/ingest-auditors-general.mjs --jurisdiction qld   # single jurisdiction
 *   node scripts/civic/ingest-auditors-general.mjs --limit 3       # only process first 3 matched audits
 *   node scripts/civic/ingest-auditors-general.mjs --debug-html    # dump first index page to /tmp
 *
 * Discovery fallback: if every jurisdiction returns zero matched audits,
 * dumps diagnostic and exits non-zero.
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

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 45000;
const MIN_YEAR = 2020; // v1: only recent audits
const POLITE_DELAY_MS = 1500;

// Per spec §7.A: 6 verified jurisdictions. NT + ACT skipped pending URL verification.
//
// Each jurisdiction has:
// - code: short jurisdiction code stored in DB
// - name: full audit-office name (used in LLM prompt context)
// - sitemaps: XML sitemap URLs to walk for report discovery
// - reportPathPatterns: regexes that match a "this is a report landing page" URL
//     (filters out media releases, nav pages, taxonomy pages from the sitemap)
// - reportRootSlug: the URL path prefix beneath which only the root counts as the
//     canonical report (used for WA where reports are multi-page HTML)
const JURISDICTIONS = [
  {
    code: 'qld',
    name: 'Queensland Audit Office',
    sitemaps: ['https://www.qao.qld.gov.au/sitemap.xml'],
    reportPathPatterns: [
      /\/reports-resources\/reports-parliament\/[^/]+\/?$/i,
    ],
  },
  {
    code: 'nsw',
    name: 'NSW Audit Office',
    sitemaps: ['https://www.audit.nsw.gov.au/sitemap.xml'],
    reportPathPatterns: [
      /\/our-work\/reports\/[^/]+\/?$/i,
    ],
  },
  {
    code: 'vic',
    name: 'Victorian Auditor-General Office (VAGO)',
    sitemaps: ['https://www.audit.vic.gov.au/sitemap.xml'],
    reportPathPatterns: [
      /\/report\/[^/]+\/?$/i,
    ],
  },
  {
    code: 'wa',
    name: 'Office of the Auditor General Western Australia',
    sitemaps: [
      'https://audit.wa.gov.au/report-sitemap.xml',
      'https://audit.wa.gov.au/report-sitemap2.xml',
      'https://audit.wa.gov.au/report-sitemap3.xml',
    ],
    // WA reports are split into chapters under one slug. The chapter URLs
    // also appear in the sitemap — collapse to the parent.
    reportPathPatterns: [
      /\/reports-and-publications\/reports\/[^/]+\/?$/i,
    ],
    collapseToParent: /^(https:\/\/audit\.wa\.gov\.au\/reports-and-publications\/reports\/[^/]+)\//i,
  },
  {
    code: 'sa',
    name: 'Auditor-General Department South Australia',
    sitemaps: ['https://www.audit.sa.gov.au/sitemap.xml'],
    // SA: no public-facing slug pattern that singles out reports cleanly.
    // We accept any /reports/ subpath (filtered later by YJ keyword match).
    reportPathPatterns: [
      /\/reports?\/[^/]+\/?$/i,
      /\/publications-and-reports\/[^/]+\/?$/i,
    ],
  },
  {
    code: 'tas',
    name: 'Tasmanian Audit Office',
    sitemaps: ['https://audit.tas.gov.au/page-sitemap.xml'],
    reportPathPatterns: [
      /\/publication\/[^/]+\/?$/i,
    ],
  },
];

// YJ keyword signals — matched against URL slug (lowercased, dashes preserved).
// We are deliberately permissive at discovery; the LLM later confirms relevance.
const YJ_KEYWORDS = [
  'youth', 'young-offender', 'young-people', 'juvenile', 'children',
  'detention', 'reintegrat', 'rehabilitat', 'banksia', 'don-dale',
  'cleveland-youth', 'parkville', 'bimberi', 'youth-justice',
  'youth-crime', 'serious-crime', 'crossover', 'child-safety',
];

// Anti-keywords — strong "this is NOT youth-justice" signals.
const ANTI_KEYWORDS = [
  'aged-care', 'disability-ndis', 'mining-rehabilit',
  'land-rehabilit', 'mine-rehabilit', 'wastewater', 'organic-waste',
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

const EXTRACTION_PROMPT = `You are extracting structured facts from an Australian state Auditor-General performance audit report.

These reports are independent assessments of how well a government department or agency is performing its functions. We are specifically interested in audits touching youth justice — youth detention, young offender reintegration, children's services with a justice nexus, serious youth crime responses, youth crime policy implementation.

Output JSON with these fields. Use null when the document doesn't contain the data — do not invent.

- title: string — the official report title, exactly as it appears on the cover/front matter or page header.
- report_number: string — e.g. "Report 15: 2023-24", "Report 4 of 2024". Null if no formal number.
- publication_date: string ISO date (YYYY-MM-DD) — when the audit office published the report.
- tabled_date: string ISO date (YYYY-MM-DD) — when the report was tabled in parliament. Often appears in the front matter and may be earlier than publication. Distinct from publication_date.
- yj_relevant: boolean — true only if the report's primary subject is youth justice, youth detention, young offender rehabilitation/reintegration, or a youth-specific cohort within the justice/safety system. False if the youth angle is incidental (e.g. mine rehabilitation, organic waste, aged care).
- yj_relevance_reason: string — one short sentence explaining why yj_relevant=true/false (max 200 chars).
- key_findings: array of 3-8 strings — verbatim or close-paraphrased findings as they appear in the report's findings/observations section. Include numbers and named programs where present. No fabrication.
- key_recommendations: array of objects with shape:
    { number: string|null, text: string, target_body: string|null, addressed_to: string|null, response: "accepted"|"partially_accepted"|"rejected"|"noted"|null }
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

async function fetchUrl(url, { accept = 'text/html,application/xhtml+xml,*/*' } = {}) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
        Accept: accept,
      },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, status: res.status };
    return { ok: true, res };
  } catch (e) {
    return { ok: false, reason: `fetch_failed: ${e.message}` };
  }
}

async function fetchText(url) {
  const r = await fetchUrl(url);
  if (!r.ok) return r;
  return { ok: true, text: await r.res.text(), finalUrl: r.res.url || url };
}

async function fetchBuffer(url, { acceptPdf = true } = {}) {
  const r = await fetchUrl(url, { accept: acceptPdf ? 'application/pdf,text/html,*/*' : 'text/html,*/*' });
  if (!r.ok) return r;
  const ct = (r.res.headers.get('content-type') || '').toLowerCase();
  const buf = Buffer.from(await r.res.arrayBuffer());
  return { ok: true, buffer: buf, contentType: ct, finalUrl: r.res.url || url };
}

function isYjSlug(url) {
  const lower = url.toLowerCase();
  if (ANTI_KEYWORDS.some((k) => lower.includes(k))) return { matched: false };
  const hits = YJ_KEYWORDS.filter((k) => lower.includes(k));
  return { matched: hits.length > 0, hits };
}

function slugYear(url) {
  const m = url.match(/20\d{2}/g);
  return m ? Math.max(...m.map(Number)) : null;
}

function extractLocs(xml) {
  // Walk sitemap-format XML and emit { loc, lastmod } for every <url> entry.
  const out = [];
  const urlRe = /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = urlRe.exec(xml)) !== null) {
    const block = m[1];
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/i);
    const modMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/i);
    if (!locMatch) continue;
    out.push({ loc: locMatch[1].trim(), lastmod: modMatch ? modMatch[1].trim() : null });
  }
  return out;
}

// Resolve a content-page link (HTML landing) to its underlying PDF if one exists.
function findPdfLinkInHtml(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    // Skip presentation slides, fact sheets, media releases as separate PDFs.
    if (/presentation|slides|media[- ]release|fact[- ]sheet|brochure|easy[- ]english/.test(hay)) continue;
    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    // Prefer "report" / "performance audit" / "tabled" PDFs.
    const isReport = /report|audit|performance|tabled/.test(hay);
    candidates.push({ url: absolute, isReport, text });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.isReport ? 1 : 0) - (a.isReport ? 1 : 0));
  return candidates[0].url;
}

// Strip HTML tags + scripts + styles, leaving readable text. Good enough for
// passing report landing pages (e.g. WA Banksia Hill) into the LLM when no
// PDF exists.
function htmlToText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  let lastXml = '';
  let lastSourceUrl = '';

  for (const sitemapUrl of juris.sitemaps) {
    console.log(`  · sitemap ${sitemapUrl}`);
    const page = await fetchText(sitemapUrl);
    if (!page.ok) {
      console.warn(`    ! ${page.reason}`);
      continue;
    }
    lastXml = page.text;
    lastSourceUrl = sitemapUrl;

    const entries = extractLocs(page.text);
    console.log(`    · ${entries.length} sitemap entries`);

    let hits = 0;
    for (const entry of entries) {
      let url = entry.loc;

      // Apply jurisdiction-specific collapse (WA chapter URLs → parent).
      if (juris.collapseToParent) {
        const m = url.match(juris.collapseToParent);
        if (m) url = m[1] + '/';
      }

      // Path pattern filter.
      const matches = juris.reportPathPatterns.some((re) => re.test(url));
      if (!matches) continue;

      // YJ keyword filter on slug.
      const yj = isYjSlug(url);
      if (!yj.matched) continue;

      // Date filter — prefer slug year, fall back to sitemap lastmod year.
      const slugY = slugYear(url);
      const lastmodY = entry.lastmod ? parseInt(entry.lastmod.slice(0, 4), 10) : null;
      const effectiveYear = slugY || lastmodY;
      if (effectiveYear && effectiveYear < MIN_YEAR) continue;

      // Dedupe on collapsed URL.
      if (seen.has(url)) continue;
      seen.set(url, {
        url,
        matched_keywords: yj.hits,
        slug_year: slugY,
        sitemap_lastmod: entry.lastmod,
        source_sitemap: sitemapUrl,
      });
      hits++;
    }
    console.log(`    · ${hits} YJ-relevant report URLs`);
    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }

  if (debugHtml && lastXml) {
    const debugPath = `/tmp/aga-${juris.code}-debug.xml`;
    writeFileSync(debugPath, `<!-- source: ${lastSourceUrl} -->\n${lastXml.slice(0, 200000)}`);
    console.log(`    · debug XML written to ${debugPath}`);
  }

  return { jurisdiction: juris.code, candidates: [...seen.values()], lastXml, lastSourceUrl };
}

async function processAudit(juris, candidate) {
  console.log(`\n→ [${juris.code.toUpperCase()}] ${candidate.url}`);
  console.log(`  · keywords=[${candidate.matched_keywords.join(', ')}] · slug_year=${candidate.slug_year ?? '?'} · lastmod=${candidate.sitemap_lastmod ?? '?'}`);

  // Fetch the landing page.
  const landing = await fetchBuffer(candidate.url, { acceptPdf: true });
  if (!landing.ok) {
    console.log(`  · skip: landing fetch failed (${landing.reason})`);
    return { ok: false, reason: landing.reason };
  }

  let documentText = '';
  let pdfBytes = null;
  let pdfUrl = null;

  if (landing.contentType.includes('application/pdf') && landing.buffer.slice(0, 4).toString() === '%PDF') {
    // Direct-link PDF.
    if (landing.buffer.length > MAX_PDF_BYTES) {
      console.log(`  · skip: PDF too large (${landing.buffer.length})`);
      return { ok: false, reason: `pdf_too_large:${landing.buffer.length}` };
    }
    documentText = await extractPdfText(landing.buffer);
    pdfBytes = landing.buffer.length;
    pdfUrl = candidate.url;
  } else {
    // HTML landing page — try to find an associated PDF, else use page text.
    const html = landing.buffer.toString('utf8');
    const pdfLink = findPdfLinkInHtml(html, landing.finalUrl);
    if (pdfLink) {
      console.log(`  · landing page → trying PDF ${pdfLink}`);
      const pdf = await fetchBuffer(pdfLink, { acceptPdf: true });
      if (pdf.ok && pdf.buffer.slice(0, 4).toString() === '%PDF' && pdf.buffer.length <= MAX_PDF_BYTES) {
        documentText = await extractPdfText(pdf.buffer);
        pdfBytes = pdf.buffer.length;
        pdfUrl = pdfLink;
      } else {
        console.log(`  · PDF fetch failed or invalid (${pdf.reason || 'not a pdf'}); falling back to HTML text`);
      }
    }
    if (!documentText) {
      documentText = htmlToText(html);
      // For multi-page HTML reports (WA Banksia Hill) the landing page itself
      // only has the title + chapter nav. Try to also pull the auditor-generals-overview
      // and key-findings chapters if they exist as siblings.
      const childPaths = ['auditor-generals-overview/', 'key-findings/', 'recommendations/', 'conclusion/'];
      const supplementaryParts = [];
      for (const childPath of childPaths) {
        const childUrl = candidate.url.replace(/\/?$/, '/') + childPath;
        const childPage = await fetchText(childUrl);
        if (childPage.ok) {
          const childText = htmlToText(childPage.text);
          if (childText.length > 500) supplementaryParts.push(`[${childPath}]\n${childText}`);
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (supplementaryParts.length > 0) {
        documentText = documentText + '\n\n' + supplementaryParts.join('\n\n');
        console.log(`  · combined HTML report (${supplementaryParts.length} chapters fetched)`);
      }
    }
  }

  if (!documentText || documentText.length < 1000) {
    console.log(`  · skip: text too short (${documentText.length} chars)`);
    return { ok: false, reason: 'text_too_short' };
  }

  const truncated = documentText.slice(0, 50000);
  const userContent = `Jurisdiction: ${juris.code.toUpperCase()} (${juris.name})\nReport landing URL: ${candidate.url}${pdfUrl && pdfUrl !== candidate.url ? `\nUnderlying PDF: ${pdfUrl}` : ''}\nMatched keywords (URL slug): ${candidate.matched_keywords.join(', ')}\n\nDocument text:\n${truncated}`;

  if (PROVIDERS.length === 0) {
    console.log('  · no LLM keys configured (CEREBRAS_API_KEY / GEMINI_API_KEY) — would extract here');
    return { ok: false, reason: 'no_llm_keys', text_chars: documentText.length, pdf_bytes: pdfBytes };
  }

  const llm = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!llm) {
    console.log('  · all LLM providers failed');
    return { ok: false, reason: 'llm_failed' };
  }

  const j = llm.json || {};

  if (j.yj_relevant === false) {
    console.log(`  · LLM marked NOT yj-relevant: ${j.yj_relevance_reason || '(no reason)'}`);
    return { ok: false, reason: 'not_yj_relevant', llm_notes: j.yj_relevance_reason };
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
      title: j.title || candidate.url.split('/').filter(Boolean).pop().replace(/-/g, ' '),
      report_number: j.report_number ?? null,
      url: candidate.url,
      publication_date: isIsoDate(j.publication_date) ? j.publication_date : null,
      tabled_date: isIsoDate(j.tabled_date) ? j.tabled_date : null,
      key_findings: Array.isArray(j.key_findings) ? j.key_findings : null,
      key_recommendations: Array.isArray(j.key_recommendations) ? j.key_recommendations : null,
      status: ['open', 'partially_implemented', 'implemented', 'rejected'].includes(j.status)
        ? j.status
        : 'open',
      raw_text: documentText.slice(0, 200000),
      metadata: {
        source_sitemap: candidate.source_sitemap,
        sitemap_lastmod: candidate.sitemap_lastmod,
        slug_year: candidate.slug_year,
        matched_keywords: candidate.matched_keywords,
        pdf_url: pdfUrl,
        pdf_bytes: pdfBytes,
        yj_relevance_reason: j.yj_relevance_reason ?? null,
        llm_notes: j.notes ?? null,
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
  // Two unique constraints: url (column-level), (jurisdiction, lower(title)) (index).
  // Supabase .upsert can target one — use url as primary; if a row exists with
  // matching (jurisdiction,title) but different URL, update in place.
  const { data: existingByTitle } = await supabase
    .from('auditor_general_audits')
    .select('id, url')
    .eq('jurisdiction', record.jurisdiction)
    .ilike('title', record.title)
    .limit(1);

  if (existingByTitle && existingByTitle[0] && existingByTitle[0].url !== record.url) {
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
    console.error('  This usually means the audit office sitemaps have moved or are blocked.');
    for (const d of discoveryByJuris) {
      if (d.lastXml) {
        const debugPath = `/tmp/aga-${d.jurisdiction}-debug.xml`;
        writeFileSync(debugPath, `<!-- source: ${d.lastSourceUrl} -->\n${d.lastXml.slice(0, 200000)}`);
        console.error(`  · ${d.jurisdiction}: XML dumped to ${debugPath} (last sitemap: ${d.lastSourceUrl})`);
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
