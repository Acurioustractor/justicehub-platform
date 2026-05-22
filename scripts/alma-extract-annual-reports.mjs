#!/usr/bin/env node
/**
 * ALMA annual-report deep-extract — downloads PDF annual reports and
 * extracts structured facts (year, people served, outcomes, funders,
 * board members) with an LLM. Writes results to
 * organizations.acnc_data.annual_report_facts so they're queryable
 * without re-parsing.
 *
 * Targets orgs that have annual_report_url set (either from the
 * enrichment script's extraction or from prior data) but no
 * annual_report_facts in acnc_data yet.
 *
 * Usage:
 *   node scripts/alma-extract-annual-reports.mjs           # dry-run, 5 orgs
 *   node scripts/alma-extract-annual-reports.mjs --apply   # write facts
 *   node scripts/alma-extract-annual-reports.mjs --apply --batch 25
 *
 * Safety:
 *   - 10MB PDF size cap; bigger reports are skipped (likely scanned image PDFs)
 *   - Per-host fetch delay of 2s
 *   - Only processes PDFs (content-type check); HTML "annual reports" skipped
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '5', 10);

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB cap — scanned-image PDFs blow past this
const FETCH_TIMEOUT_MS = 30000;

const PROVIDERS = [
  {
    name: 'cerebras',
    key: env.CEREBRAS_API_KEY,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'qwen-3-235b-a22b-instruct-2507',
  },
  {
    name: 'gemini',
    key: env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
].filter((p) => p.key);

if (PROVIDERS.length === 0) {
  console.error('No LLM keys. Set CEREBRAS_API_KEY or GEMINI_API_KEY.');
  process.exit(1);
}

const EXTRACTION_PROMPT = `You are extracting structured facts from an Australian community organisation's annual report PDF.

Output JSON with these fields. Use null when the report doesn't contain the data — do not invent.

- report_year: integer (e.g. 2024). The year the report covers (not the year published).
- people_served: object with { number: integer, definition: string } e.g. { "number": 1247, "definition": "young people supported through case management" }
- top_outcomes: array of up to 5 strings — concrete outcomes claimed, with numbers when stated. e.g. "82% of participants completed the program (n=156)"
- funders: array of organisation names — funders or major partners the report acknowledges
- board_members: array of strings — names of board members or directors listed
- programs: array of strings — names of programs or initiatives described
- revenue_aud: integer — total revenue in AUD if stated
- expenditure_aud: integer — total expenditure in AUD if stated
- staff_count: integer — staff/employee count if stated
- volunteers_count: integer — volunteer count if stated
- cultural_indicators: array of strings — anything signalling Indigenous-led status, on-Country work, Elder governance, language use, etc.
- notes: string — anything else surprising or context-shifting

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
    // HTML landing page — try to discover a PDF link on it before giving up.
    // Many orgs publish an /annual-reports/ index page rather than a direct
    // PDF URL, so we parse for the most-recent annual-report link.
    if (ct.includes('text/html')) {
      if (!allowLandingPageCrawl) {
        return { ok: false, reason: 'html_not_pdf' };
      }
      const html = await res.text();
      const discovered = findAnnualReportPdfLink(html, res.url || url);
      if (!discovered) {
        return { ok: false, reason: 'html_no_pdf_links_found' };
      }
      console.log(`  · landing page → crawled, trying ${discovered}`);
      return fetchPdf(discovered, { allowLandingPageCrawl: false });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PDF_BYTES) {
      return { ok: false, reason: `too_large:${buf.length}` };
    }
    // Quick PDF magic-number check — every PDF starts with %PDF
    if (buf.slice(0, 4).toString() !== '%PDF') {
      return { ok: false, reason: 'not_a_pdf_file' };
    }
    return { ok: true, buffer: buf, finalUrl: res.url || url };
  } catch (e) {
    return { ok: false, reason: `fetch_failed: ${e.message}` };
  }
}

// Parse HTML for PDF links that look like annual reports. Picks the one
// with the highest 4-digit year in its href or anchor text; falls back to
// the first PDF whose context mentions "annual" or "report".
function findAnnualReportPdfLink(html, baseUrl) {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    const hasAnnualSignal = /annual|report|impact|year[\s-]?in[\s-]?review/.test(hay);
    if (!hasAnnualSignal) continue;
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
    // pdf-parse v2 ships a named PDFParse class. Construct with { data }
    // and call getText() to get { text }.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result?.text || '';
  } catch (e) {
    console.warn(`  · pdf-parse failed: ${e.message}`);
    return '';
  }
}

async function processOrg(org) {
  console.log(`\n→ ${org.name} (${org.slug}) — ${org.annual_report_url}`);
  const pdf = await fetchPdf(org.annual_report_url);
  if (!pdf.ok) {
    console.log(`  · skip: ${pdf.reason}`);
    return { ok: false, reason: pdf.reason };
  }
  const text = await extractPdfText(pdf.buffer);
  if (!text || text.length < 500) {
    console.log(`  · skip: text too short (${text.length} chars) — likely scanned image PDF`);
    return { ok: false, reason: 'text_too_short' };
  }
  // Reports can be 50-150 pages; trim to first ~40K chars which usually
  // covers everything except long board-bios appendix.
  const truncated = text.slice(0, 40000);
  const userContent = `Organisation: ${org.name}\nReport URL: ${org.annual_report_url}\n\nReport text:\n${truncated}`;

  const llm = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!llm) {
    console.log('  · all LLM providers failed');
    return { ok: false, reason: 'llm_failed' };
  }

  const facts = {
    ...llm.json,
    extracted_at: new Date().toISOString(),
    extractor: { provider: llm.provider, model: llm.model },
    source_pdf_bytes: pdf.buffer.length,
  };

  console.log(
    `  · ${llm.provider}: year=${facts.report_year || '?'}, ${
      facts.people_served?.number ? `served ${facts.people_served.number}` : 'no people-count'
    }, ${facts.top_outcomes?.length || 0} outcomes, ${facts.funders?.length || 0} funders`
  );

  return { ok: true, facts };
}

async function main() {
  console.log(`ALMA annual-report extract · ${apply ? 'APPLY' : 'DRY-RUN'} · batch=${batchSize}\n`);

  // Eligibility: has annual_report_url AND no annual_report_facts in acnc_data yet
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, annual_report_url, acnc_data')
    .not('annual_report_url', 'is', null)
    .neq('archived', true)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(batchSize * 3);

  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }

  const eligible = (orgs || [])
    .filter((o) => !o.acnc_data?.annual_report_facts)
    .slice(0, batchSize);

  if (eligible.length === 0) {
    console.log('Nothing to do — all orgs with annual_report_url have already been extracted.');
    return;
  }

  console.log(`Processing ${eligible.length} orgs.\n`);

  let success = 0;
  let skipped = 0;
  for (const org of eligible) {
    const result = await processOrg(org);
    if (!result.ok) {
      skipped++;
      // Record the failure into acnc_data so we don't keep retrying the same broken URL
      if (apply) {
        const existing = org.acnc_data || {};
        const newAcnc = {
          ...existing,
          annual_report_extraction_failed: {
            reason: result.reason,
            attempted_at: new Date().toISOString(),
          },
        };
        await supabase.from('organizations').update({ acnc_data: newAcnc }).eq('id', org.id);
      }
      continue;
    }
    if (apply) {
      const existing = org.acnc_data || {};
      const newAcnc = {
        ...existing,
        annual_report_facts: result.facts,
      };
      const { error: updErr } = await supabase
        .from('organizations')
        .update({ acnc_data: newAcnc })
        .eq('id', org.id);
      if (updErr) {
        console.warn(`  · DB update failed: ${updErr.message}`);
        skipped++;
        continue;
      }
    }
    success++;
    // be polite to the source server
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n${success} extracted${apply ? ' and written' : ' (dry-run)'} · ${skipped} skipped`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
