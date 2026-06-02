#!/usr/bin/env node
/**
 * Paul Ramsay Foundation annual reviews -> foundation_grantees.
 *
 * The current PRF annual reviews are published as Webflow pages, not just PDFs.
 * This importer therefore handles both HTML review pages and linked PDFs:
 *   1. Discover known/current annual-review URLs plus sitemap annual-review hits.
 *   2. Extract "Our partners" commitment lists directly from page links.
 *   3. Run an LLM over case-study/body text for explicit named grants/amounts.
 *   4. Validate LLM output with the foundation grant schema shape.
 *   5. Idempotently insert/update foundation_grantees rows.
 *
 * Dry-run by default. Use --apply to write to production Supabase.
 *
 * Usage:
 *   node scripts/civic/ingest-paul-ramsay-annual-reviews.mjs
 *   node scripts/civic/ingest-paul-ramsay-annual-reviews.mjs --year 2025 --limit 25
 *   node scripts/civic/ingest-paul-ramsay-annual-reviews.mjs --source-url https://...
 *   node scripts/civic/ingest-paul-ramsay-annual-reviews.mjs --skip-llm
 *   node scripts/civic/ingest-paul-ramsay-annual-reviews.mjs --apply
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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
const args = process.argv.slice(2);

function flag(name) {
  return args.includes(name);
}

function option(name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = args.indexOf(name);
  if (idx >= 0) return args[idx + 1];
  return null;
}

const apply = flag('--apply');
const debug = flag('--debug');
const skipLlm = flag('--skip-llm');
const sourceUrlArg = option('--source-url');
const yearFilter = option('--year') ? parseInt(option('--year'), 10) : null;
const limitArg = option('--limit');
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const maxReviewsArg = option('--max-reviews');
const maxReviews = maxReviewsArg ? parseInt(maxReviewsArg, 10) : Infinity;
const maxChunksArg = option('--max-chunks');
const maxChunks = maxChunksArg ? parseInt(maxChunksArg, 10) : 6;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const PRF = {
  foundation_id: '4ee5baca-c898-4318-ae2b-d79b95379cc7',
  foundation_abn: '32623132472',
  foundation_name: 'Paul Ramsay Foundation Limited',
  website: 'https://www.paulramsayfoundation.org.au/',
};

const SOURCE_KEY = 'paul_ramsay_annual_review';
const FETCH_TIMEOUT_MS = 45000;
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const CHUNK_CHARS = 24000;
const CHUNK_OVERLAP = 1200;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  Accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
};

const KNOWN_REVIEW_URLS = [
  { url: 'https://www.paulramsayfoundation.org.au/2025-annual-review', year: 2025, title: 'Annual Review 2025' },
  { url: 'https://www.paulramsayfoundation.org.au/annual-review', year: 2024, title: 'Annual Review 2024' },
  { url: 'https://www.paulramsayfoundation.org.au/news-resources/2023-in-review-connection-collaboration-community', year: 2023, title: 'Annual Review 2023' },
  { url: 'https://www.paulramsayfoundation.org.au/news-resources/together-for-impact-2022-annual-review', year: 2022, title: 'Annual Review 2022' },
  { url: 'https://www.paulramsayfoundation.org.au/news-resources/growing-our-partnerships-for-potential', year: 2022, title: 'Five Years in Review' },
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

// Mirrors FoundationGrantExtractionResponseSchema in src/lib/ai/llm-schemas.ts.
// This standalone .mjs script cannot import the TS module without a tsx loader.
const FoundationGrantExtractionItemSchema = z.object({
  grantee_name: z.string().min(2).max(300),
  grant_amount: z.number().nonnegative().nullable().optional(),
  grant_year: z.number().int().min(2006).max(new Date().getFullYear() + 1),
  program_name: z.string().max(300).nullable().optional(),
  evidence_text: z.string().min(10).max(1000),
  source_section: z.string().max(200).nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
  yj_relevance_hint: z.enum([
    'direct_yj_service',
    'yj_research',
    'yj_advocacy',
    'broader_justice_includes_yj',
    'indigenous_youth_general',
    'not_yj',
  ]).catch('not_yj'),
});

const FoundationGrantExtractionResponseSchema = z.object({
  grants: z.array(FoundationGrantExtractionItemSchema).default([]),
});

const EXTRACTION_PROMPT = `You extract named grants from Paul Ramsay Foundation annual review text.

Return JSON only:
{
  "grants": [
    {
      "grantee_name": "organisation receiving funding",
      "grant_amount": 3450000,
      "grant_year": 2025,
      "program_name": "short grant/program/purpose",
      "evidence_text": "short source sentence or close paraphrase that proves the grant",
      "source_section": "heading or case study title",
      "confidence": "high|medium|low",
      "yj_relevance_hint": "direct_yj_service|yj_research|yj_advocacy|broader_justice_includes_yj|indigenous_youth_general|not_yj"
    }
  ]
}

Rules:
- Extract only named recipient organisations that the text says received PRF funding, a PRF grant, a donation, or a program-related investment.
- Do not extract aggregate portfolio totals unless tied to a named recipient.
- Do not extract projects, reports, datasets, places, authors, people, PRF itself, or government co-funders as grantees.
- grant_amount must be a number of Australian dollars when explicitly stated. Use null when no exact amount is stated.
- grant_year should be the report/FY year unless the text states another commitment year.
- Use evidence_text under 1000 characters and do not fabricate details.
- If a chunk has no extractable named grant, return {"grants":[]}.`;

function log(...parts) {
  console.log(...parts);
}

function dbg(...parts) {
  if (debug) console.log('  [debug]', ...parts);
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function cleanText(s) {
  return decodeHtml(s)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToPlainText(html) {
  let s = html;
  s = s.replace(/<(script|style|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<\/(p|div|section|article|li|h[1-6]|tr|td|br)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeHtml(s);
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

function normaliseName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(ltd|limited|inc|incorporated|pty|plc|co|company)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normaliseProgramName(name) {
  const cleaned = cleanText(name || '').slice(0, 300);
  return cleaned || null;
}

function inferReportYear(url, text = '') {
  const hay = `${url} ${text.slice(0, 5000)}`;
  const fy = hay.match(/FY\s?(\d{2})/i);
  if (fy) return 2000 + parseInt(fy[1], 10);
  const annual = hay.match(/(?:annual review|in review|review)[^\d]{0,20}(20\d{2})/i);
  if (annual) return parseInt(annual[1], 10);
  const years = hay.match(/20\d{2}/g) || [];
  if (!years.length) return null;
  return Math.max(...years.map(Number));
}

function reportFyLabel(year) {
  return `FY${String(year).slice(-2)}`;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, url };
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/pdf')) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_PDF_BYTES) return { ok: false, reason: `pdf_too_large:${buffer.length}`, url };
      return { ok: true, contentType: 'pdf', buffer, finalUrl: res.url || url };
    }
    return { ok: true, contentType: 'html', html: await res.text(), finalUrl: res.url || url };
  } catch (e) {
    return { ok: false, reason: `fetch_failed:${e.message}`, url };
  }
}

async function extractPdfText(buffer) {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return { text: result?.text || '', pages: result?.pages?.length ?? null };
  } catch (e) {
    return { text: '', pages: null, error: e.message };
  }
}

function extractSitemapLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(decodeHtml(m[1].trim()));
  return locs;
}

async function discoverReviewPages() {
  const byUrl = new Map();
  const add = (item) => {
    if (!item?.url) return;
    if (yearFilter && item.year && item.year !== yearFilter) return;
    byUrl.set(item.url.replace(/\/$/, ''), item);
  };

  if (sourceUrlArg) {
    add({ url: sourceUrlArg, year: yearFilter, title: 'Operator supplied review URL' });
  } else {
    KNOWN_REVIEW_URLS.forEach(add);
  }

  const sitemap = await fetchPage('https://www.paulramsayfoundation.org.au/sitemap.xml');
  if (sitemap.ok && sitemap.contentType === 'html') {
    for (const url of extractSitemapLocs(sitemap.html)) {
      const lower = url.toLowerCase();
      if (!/annual-review|annual.?review|in-review|five-years-in-review|growing-our-partnerships/.test(lower)) continue;
      const year = inferReportYear(url);
      if (yearFilter && year !== yearFilter) continue;
      add({ url, year, title: year ? `Annual Review ${year}` : 'Annual Review' });
    }
  } else {
    dbg(`sitemap skipped: ${sitemap.reason || sitemap.contentType}`);
  }

  return [...byUrl.values()]
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, maxReviews);
}

function extractLinks(html, baseUrl) {
  const links = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const rawHref = decodeHtml(hrefMatch[1].trim());
    let href;
    try {
      href = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    links.push({
      href,
      text: cleanText(m[2]),
      index: m.index,
    });
  }
  return links;
}

function shouldSkipPartnerLink(link) {
  const text = link.text;
  const lowerText = text.toLowerCase();
  const lowerHref = link.href.toLowerCase();
  if (!text || text.length < 3 || text.length > 120) return true;
  if (/^(read|learn|image|contact|privacy|subscribe|download|view|more|home)$/i.test(text)) return true;
  if (/annual|review|case study|message from|numbers at|about paul|our strategy|contact us|read the|full report|learning paper|newsletter/.test(lowerText)) return true;
  if (/facebook|instagram|youtube|twitter|x\.com|linkedin\.com\/company\/paul-ramsay|paulramsayfoundation\.org\.au/.test(lowerHref)) return true;
  if (/cdn\.prod\.website-files\.com|\.pdf($|\?)/.test(lowerHref)) return true;
  if (/^20\d{2}/.test(text)) return true;
  if (/^[a-z]$/i.test(text)) return true;
  return false;
}

function extractPartnerRowsFromHtml(html, source) {
  const caseStudiesIndex = html.search(/Case Studies/i);
  const strategyIndex = html.search(/Our strategy/i);
  const boundary = [caseStudiesIndex, strategyIndex].filter((n) => n > 0).sort((a, b) => a - b)[0] || html.length;
  const links = extractLinks(html.slice(0, boundary), source.finalUrl || source.url);
  const seen = new Set();
  const rows = [];

  for (const link of links) {
    if (shouldSkipPartnerLink(link)) continue;
    const key = normaliseName(link.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(buildGrantRow({
      grantee_name: link.text,
      grant_amount: null,
      grant_year: source.year,
      program_name: `${reportFyLabel(source.year)} commitment`,
      evidence_text: `Listed by Paul Ramsay Foundation as an organisation that received a new commitment of funding in ${reportFyLabel(source.year)}.`,
      source_section: `Our partners in ${source.year}`,
      source_url: source.url,
      source_document_url: source.finalUrl || source.url,
      extraction_method: 'prf_annual_review_partner_list',
      confidence: 'source_listed',
      metadata: {
        partner_url: link.href,
      },
    }));
  }

  if (rows.length > 0) return rows;

  // Fallback for pages where partner cards render as text without usable links.
  const text = htmlToPlainText(html);
  const start = text.search(/These organisations received|This is a list of organisations/i);
  const end = text.search(/Case Studies/i);
  if (start < 0 || end <= start) return rows;
  const lines = text.slice(start, end).split('\n');
  for (const line of lines) {
    const candidate = line.trim();
    if (candidate.length < 3 || candidate.length > 120) continue;
    if (/^(Our partners|in 20\d{2}|No items found|These organisations|This is a list|[A-Z])$/.test(candidate)) continue;
    if (/annual|review|strategy|funding|grant|donation|program related/i.test(candidate)) continue;
    const key = normaliseName(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(buildGrantRow({
      grantee_name: candidate,
      grant_amount: null,
      grant_year: source.year,
      program_name: `${reportFyLabel(source.year)} commitment`,
      evidence_text: `Listed by Paul Ramsay Foundation as an organisation that received a commitment of funding in ${reportFyLabel(source.year)}.`,
      source_section: `Our partners in ${source.year}`,
      source_url: source.url,
      source_document_url: source.finalUrl || source.url,
      extraction_method: 'prf_annual_review_partner_list',
      confidence: 'source_listed',
      metadata: {},
    }));
  }
  return rows;
}

function chunkText(text) {
  if (!text || text.length <= CHUNK_CHARS) return text ? [text] : [];
  const chunks = [];
  let pos = 0;
  while (pos < text.length) {
    const end = Math.min(pos + CHUNK_CHARS, text.length);
    let breakPoint = end;
    if (end < text.length) {
      const window = text.slice(Math.max(pos, end - 3000), end);
      const lastDouble = window.lastIndexOf('\n\n');
      const lastSingle = window.lastIndexOf('\n');
      const cut = lastDouble > 0 ? lastDouble : lastSingle;
      if (cut > 0) breakPoint = Math.max(pos, end - 3000) + cut;
    }
    chunks.push(text.slice(pos, breakPoint));
    if (breakPoint >= text.length) break;
    pos = Math.max(breakPoint - CHUNK_OVERLAP, pos + 1);
  }
  return chunks;
}

async function callLLM(userContent) {
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
            { role: 'system', content: EXTRACTION_PROMPT },
            { role: 'user', content: userContent },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) {
        dbg(`LLM ${provider.name} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) continue;
      try {
        return { provider: provider.name, model: provider.model, json: JSON.parse(raw) };
      } catch {
        const m = raw.match(/\{[\s\S]+\}/);
        if (m) return { provider: provider.name, model: provider.model, json: JSON.parse(m[0]) };
      }
    } catch (e) {
      dbg(`LLM ${provider.name} failed: ${e.message}`);
    }
  }
  return null;
}

function sourceBodyForLlm(text, source) {
  const titlePatterns = [
    new RegExp(`Annual Review\\s+${source.year}`, 'i'),
    new RegExp(`${source.year}\\s+in Review`, 'i'),
    /Together for Impact/i,
    /Five Years in Review/i,
    /Growing partnerships for potential/i,
  ];
  const starts = titlePatterns
    .map((pattern) => text.search(pattern))
    .filter((idx) => idx >= 0);
  const start = starts.length > 0 ? Math.min(...starts) : 0;
  const afterStart = text.slice(start);
  const endPatterns = [
    /\nConnect with us\b/i,
    /\nRelated (articles|resources|stories)\b/i,
    /\nMore from\b/i,
    /\nSubscribe\b/i,
  ];
  const ends = endPatterns
    .map((pattern) => afterStart.search(pattern))
    .filter((idx) => idx > 0);
  const end = ends.length > 0 ? Math.min(...ends) : afterStart.length;
  return afterStart.slice(0, end);
}

async function extractLlmRows(text, source) {
  if (skipLlm || PROVIDERS.length === 0) return [];
  const body = sourceBodyForLlm(text, source);
  const chunks = chunkText(body).slice(0, maxChunks);
  const rows = [];

  for (let i = 0; i < chunks.length; i++) {
    const userContent = [
      `Source title: ${source.title || `Annual Review ${source.year}`}`,
      `Source URL: ${source.url}`,
      `Report/FY year: ${source.year}`,
      `Chunk ${i + 1} of ${chunks.length}`,
      '',
      chunks[i],
    ].join('\n');
    const llm = await callLLM(userContent);
    if (!llm) continue;
    const parsed = FoundationGrantExtractionResponseSchema.safeParse(llm.json);
    if (!parsed.success) {
      dbg(`LLM validation failed: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
      continue;
    }
    for (const grant of parsed.data.grants) {
      rows.push(buildGrantRow({
        ...grant,
        source_url: source.url,
        source_document_url: source.finalUrl || source.url,
        extraction_method: 'prf_annual_review_llm',
        confidence: `llm_${grant.confidence}`,
        metadata: {
          source_section: grant.source_section ?? null,
          extractor_provider: llm.provider,
          llm_model: llm.model,
          yj_relevance_hint: grant.yj_relevance_hint,
          chunk_index: i + 1,
          chunk_count: chunks.length,
        },
      }));
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  return rows;
}

function buildGrantRow(input) {
  const granteeName = cleanText(input.grantee_name);
  const programName = normaliseProgramName(input.program_name);
  const now = new Date().toISOString();
  return {
    foundation_id: PRF.foundation_id,
    foundation_abn: PRF.foundation_abn,
    foundation_name: PRF.foundation_name,
    grantee_name: granteeName,
    grantee_name_normalised: normaliseName(granteeName),
    grantee_entity_id: null,
    grantee_abn: null,
    grant_amount: Number.isFinite(input.grant_amount) ? input.grant_amount : null,
    grant_year: Number.isInteger(input.grant_year) ? input.grant_year : null,
    program_name: programName,
    source_url: input.source_url,
    source_document_url: input.source_document_url,
    evidence_text: cleanText(input.evidence_text).slice(0, 1000),
    link_method: 'public_annual_review',
    extraction_method: input.extraction_method,
    confidence: input.confidence || 'source_listed',
    metadata: {
      imported_by: 'scripts/civic/ingest-paul-ramsay-annual-reviews.mjs',
      source_key: SOURCE_KEY,
      source_section: input.source_section ?? null,
      ...(input.metadata || {}),
    },
    extracted_at: now,
    updated_at: now,
  };
}

function rowKey(row) {
  return [
    row.foundation_id,
    row.grantee_name_normalised,
    row.grant_year ?? '',
    row.program_name ?? '',
    row.source_url,
    row.extraction_method,
  ].join('|');
}

function dedupeRows(rows) {
  const byKey = new Map();
  for (const row of rows) {
    if (!row.grantee_name || !row.grantee_name_normalised || !row.source_url) continue;
    const key = rowKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }
    if (!existing.grant_amount && row.grant_amount) {
      byKey.set(key, { ...existing, ...row, metadata: { ...existing.metadata, ...row.metadata } });
    }
  }
  return [...byKey.values()];
}

async function resolveFoundation() {
  if (!supabase) return PRF;
  const { data, error } = await supabase
    .from('foundations')
    .select('id, acnc_abn, name, website')
    .eq('acnc_abn', PRF.foundation_abn)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`foundation lookup failed: ${error.message}`);
  if (!data?.id) return PRF;
  PRF.foundation_id = data.id;
  PRF.foundation_name = data.name || PRF.foundation_name;
  PRF.website = data.website || PRF.website;
  return PRF;
}

async function upsertGrant(row) {
  let q = supabase
    .from('foundation_grantees')
    .select('id')
    .eq('foundation_id', row.foundation_id)
    .eq('grantee_name_normalised', row.grantee_name_normalised)
    .eq('source_url', row.source_url)
    .eq('extraction_method', row.extraction_method)
    .limit(1);

  q = row.grant_year === null ? q.is('grant_year', null) : q.eq('grant_year', row.grant_year);
  q = row.program_name === null ? q.is('program_name', null) : q.eq('program_name', row.program_name);

  const { data: existing, error: lookupError } = await q.maybeSingle();
  if (lookupError) throw new Error(`lookup failed for ${row.grantee_name}: ${lookupError.message}`);

  if (existing?.id) {
    const { error } = await supabase
      .from('foundation_grantees')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(`update failed for ${row.grantee_name}: ${error.message}`);
    return 'updated';
  }

  const { error } = await supabase.from('foundation_grantees').insert(row);
  if (error) throw new Error(`insert failed for ${row.grantee_name}: ${error.message}`);
  return 'inserted';
}

async function updateSourceInventory() {
  const { count, error: countError } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true })
    .eq('foundation_id', PRF.foundation_id)
    .in('extraction_method', ['prf_annual_review_partner_list', 'prf_annual_review_llm']);
  if (countError) throw new Error(`source count failed: ${countError.message}`);

  const { error } = await supabase
    .from('data_sources_inventory')
    .update({
      status: 'active',
      ingest_method: 'html_pdf_parse_llm',
      url: 'https://www.paulramsayfoundation.org.au/annual-review',
      row_count: count || 0,
      last_refreshed_at: new Date().toISOString(),
      coverage_note: 'PRF annual review importer. Partner-list rows are commitment signals; explicit grant amounts are extracted only when stated in review text.',
      updated_at: new Date().toISOString(),
    })
    .eq('source_key', SOURCE_KEY);
  if (error) throw new Error(`source inventory update failed: ${error.message}`);
  return count || 0;
}

async function processSource(source) {
  log(`\n-> ${source.title || source.url}`);
  log(`  ${source.url}`);
  const fetched = await fetchPage(source.url);
  if (!fetched.ok) {
    log(`  - skip: ${fetched.reason}`);
    return { rows: [], skipped: fetched.reason };
  }

  let text = '';
  let html = '';
  let pages = null;
  const finalUrl = fetched.finalUrl || source.url;
  let format = fetched.contentType;

  if (fetched.contentType === 'pdf') {
    const ex = await extractPdfText(fetched.buffer);
    text = ex.text;
    pages = ex.pages;
    if (ex.error) log(`  - pdf-parse warning: ${ex.error}`);
  } else {
    html = fetched.html;
    text = htmlToPlainText(html);
    format = 'html';
  }

  const inferredYear = yearFilter || source.year || inferReportYear(source.url, text);
  if (!inferredYear) {
    log('  - skip: could not infer report year');
    return { rows: [], skipped: 'missing_year' };
  }
  if (yearFilter && inferredYear !== yearFilter) {
    log(`  - skip: inferred year ${inferredYear}, filter ${yearFilter}`);
    return { rows: [], skipped: 'year_filter' };
  }

  const resolvedSource = { ...source, year: inferredYear, finalUrl, title: source.title || `Annual Review ${inferredYear}` };
  log(`  - ${format}, year=${inferredYear}, text=${text.length.toLocaleString()} chars${pages ? `, pages=${pages}` : ''}`);

  const partnerRows = html ? extractPartnerRowsFromHtml(html, resolvedSource) : [];
  log(`  - partner rows: ${partnerRows.length}`);

  const llmRows = await extractLlmRows(text, resolvedSource);
  if (!skipLlm && PROVIDERS.length > 0) log(`  - LLM rows: ${llmRows.length}`);
  if (!skipLlm && PROVIDERS.length === 0) log('  - no LLM keys configured, skipped LLM extraction');

  return { rows: [...partnerRows, ...llmRows] };
}

async function main() {
  log(`PRF annual review ingestion - ${apply ? 'APPLY' : 'DRY-RUN'}${yearFilter ? ` - year=${yearFilter}` : ''}${limit !== Infinity ? ` - limit=${limit}` : ''}`);
  if (!skipLlm && PROVIDERS.length > 0) log(`LLM providers: ${PROVIDERS.map((p) => p.name).join(' -> ')}`);
  if (skipLlm) log('LLM extraction disabled by --skip-llm');
  if (apply && !supabase) {
    console.error('FATAL: --apply requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (apply) await resolveFoundation();
  const sources = await discoverReviewPages();
  if (sources.length === 0) {
    console.error('No PRF annual review pages discovered.');
    process.exit(2);
  }
  log(`Discovered ${sources.length} review page(s).`);

  const allRows = [];
  const skipped = [];
  for (const source of sources) {
    const result = await processSource(source);
    if (result.skipped) skipped.push({ url: source.url, reason: result.skipped });
    allRows.push(...result.rows);
    await new Promise((r) => setTimeout(r, 800));
  }

  const deduped = dedupeRows(allRows).slice(0, limit);
  const withAmounts = deduped.filter((r) => r.grant_amount !== null).length;
  const byMethod = deduped.reduce((acc, row) => {
    acc[row.extraction_method] = (acc[row.extraction_method] || 0) + 1;
    return acc;
  }, {});

  log('\n--- Summary -------------------------------------');
  log(`Candidate rows: ${allRows.length}`);
  log(`After dedupe/limit: ${deduped.length}`);
  log(`Rows with explicit amounts: ${withAmounts}`);
  Object.entries(byMethod).forEach(([method, count]) => log(`  ${method}: ${count}`));
  if (skipped.length) skipped.forEach((s) => log(`  skipped ${s.url}: ${s.reason}`));

  deduped.slice(0, 12).forEach((row, i) => {
    const amount = row.grant_amount === null ? 'amount unknown' : `$${row.grant_amount.toLocaleString()}`;
    log(`  ${i + 1}. ${row.grantee_name} - ${row.grant_year || '?'} - ${amount} - ${row.program_name || 'no program'}`);
  });

  const amountRows = deduped.filter((row) => row.grant_amount !== null).slice(0, 8);
  if (amountRows.length > 0) {
    log('\nExplicit amount samples:');
    amountRows.forEach((row, i) => {
      log(`  ${i + 1}. ${row.grantee_name} - $${row.grant_amount.toLocaleString()} - ${row.program_name || 'no program'}`);
    });
  }

  if (!apply) {
    log('\nDry-run only. Pass --apply to write foundation_grantees and activate data_sources_inventory.');
    return;
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  for (const row of deduped) {
    try {
      const status = await upsertGrant(row);
      if (status === 'inserted') inserted++;
      else updated++;
    } catch (e) {
      errors++;
      console.warn(`  ! ${e.message}`);
    }
  }
  const inventoryCount = await updateSourceInventory();
  log(`\nDB writes: inserted=${inserted}, updated=${updated}, errors=${errors}`);
  log(`Updated ${SOURCE_KEY} row_count=${inventoryCount}, status=active`);
  if (errors > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
