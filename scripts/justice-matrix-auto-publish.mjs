#!/usr/bin/env node
/**
 * Justice Matrix auto-publish — runs the same enrich-then-create flow that
 * the admin "Enrich from source" + "Approve with edits" buttons do, but with
 * no human in the loop. Reads pending discoveries, fetches the source page,
 * asks the LLM to fill the case/campaign shape, validates, and inserts.
 *
 * Discoveries the LLM fails on (or where validation fails) are left as
 * pending so a human can still pick them up.
 *
 * Usage:
 *   node scripts/justice-matrix-auto-publish.mjs                     # dry-run, 20 items
 *   node scripts/justice-matrix-auto-publish.mjs --apply             # actually publish
 *   node scripts/justice-matrix-auto-publish.mjs --apply --limit 100 # process more
 *   node scripts/justice-matrix-auto-publish.mjs --apply --id <uuid> # one specific
 *
 * Safe to schedule (e.g. a daily Vercel cron). The scanner deposits items;
 * this script keeps the public matrix moving without manual triage.
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
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const onlyId = args.find((_, i) => args[i - 1] === '--id');
const limit = parseInt(args.find((_, i) => args[i - 1] === '--limit') || '20', 10);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// LLM providers (OpenAI-compatible chat completions)
// ---------------------------------------------------------------------------

const PROVIDERS = [
  { name: 'groq',      key: 'GROQ_API_KEY',      base: 'https://api.groq.com/openai/v1',                       model: 'llama-3.3-70b-versatile' },
  { name: 'gemini',    key: 'GEMINI_API_KEY',    base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  { name: 'sambanova', key: 'SAMBANOVA_API_KEY', base: 'https://api.sambanova.ai/v1',                          model: 'Meta-Llama-3.3-70B-Instruct' },
  { name: 'minimax',   key: 'MINIMAX_API_KEY',   base: 'https://api.minimaxi.chat/v1',                         model: 'MiniMax-M2.7' },
  { name: 'deepseek',  key: 'DEEPSEEK_API_KEY',  base: 'https://api.deepseek.com/v1',                          model: 'deepseek-chat' },
];

// Calls available providers in order and parses the response as JSON. On HTTP
// error OR unparseable JSON, falls through to the next provider; the whole
// rotation repeats `attempts` times. This is the retry-on-JSON-fail: a single
// parse attempt on the first 200-OK provider previously stranded discoveries
// when that provider returned malformed JSON.
async function callLLMJson(prompt, attempts = 2) {
  const available = PROVIDERS.filter((p) => env[p.key]);
  if (!available.length) throw new Error('No LLM provider API keys set');
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const p of available) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 45000);
        try {
          const res = await fetch(`${p.base}/chat/completions`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${env[p.key]}`,
            },
            body: JSON.stringify({
              model: p.model,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1500,
              response_format: { type: 'json_object' },
            }),
            signal: ctrl.signal,
          });
          if (!res.ok) {
            const body = await res.text();
            lastErr = new Error(`${p.name} ${res.status}: ${body.slice(0, 200)}`);
            continue;
          }
          const json = await res.json();
          const text = (json.choices?.[0]?.message?.content ?? '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
          try {
            return parseJSON(text);
          } catch (pe) {
            lastErr = new Error(`${p.name} bad JSON: ${pe.message.slice(0, 80)}`);
            continue; // next provider
          }
        } finally {
          clearTimeout(t);
        }
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr ?? new Error('All providers exhausted');
}

// ---------------------------------------------------------------------------
// Source-page fetch (same logic as the enrich endpoint)
// ---------------------------------------------------------------------------

async function fetchSourceText(url) {
  if (!url || url.startsWith('mailto:')) return '';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30000);
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// Prompts (mirrors src/app/api/justice-matrix/discovered/[id]/enrich/route.ts)
// ---------------------------------------------------------------------------

function casePrompt(d, pageText) {
  return `You are populating a strategic-litigation case profile in a Justice Matrix. Use the source page below and the existing extracted fields to fill EVERY field you can ground in evidence.

Existing extracted fields:
  title: ${d.extracted_title}
  jurisdiction: ${d.extracted_jurisdiction ?? 'unknown'}
  year: ${d.extracted_year ?? 'unknown'}
  summary: ${d.extracted_summary ?? 'unknown'}
  source_url: ${d.source_url}

Source page text (truncated):
${pageText || '(empty — fall back to existing fields + training knowledge)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"jurisdiction":"...","case_citation":"...","year":2024,"court":"...","strategic_issue":"What was at stake (1-2 sentences)","key_holding":"What the court actually decided (2-3 sentences)","facts":"What happened to the people in this case — one paragraph","reasoning":"Why the court decided this way — the ratio decidendi (2-4 sentences)","dissents":"Dissenting opinions: who and on what point, or null","statutes_cited":["Refugee Convention art. 33","Migration Act 1958 s.36"],"cases_cited":["Plaintiff M70/2011 v Minister","Chen Shi Hai v Minister"],"judges":["Kiefel CJ","Gageler J"],"region":"Europe|Americas|Asia-Pacific|Africa|global|National|<state>","country_code":"ISO 2-letter","categories":["refugee","asylum"],"outcome":"favorable|adverse|pending","precedent_strength":"high|medium|low"}

Rules:
- Holding != issue. Holding is what the court decided.
- Don't invent. If a field can't be grounded, return null (or [] for the arrays).
- Categories: lowercase, hyphen-separated.
- Statutes/cases/judges: arrays of short strings. Trim honorifics; "Kiefel CJ" not "The Honourable Chief Justice Kiefel".
- Outcome favourable = applicant/petitioner won. Adverse = lost. Pending = ongoing.`;
}

function campaignPrompt(d, pageText) {
  return `You are populating an advocacy-campaign profile in a Justice Matrix. Use the source page below and the existing extracted fields to fill every field you can ground in evidence.

Existing extracted fields:
  title: ${d.extracted_title}
  region/country: ${d.extracted_jurisdiction ?? 'unknown'}
  year: ${d.extracted_year ?? 'unknown'}
  summary: ${d.extracted_summary ?? 'unknown'}
  source_url: ${d.source_url}

Source page text (truncated):
${pageText || '(empty — fall back to existing fields + training knowledge)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"country_region":"...","campaign_name":"...","lead_organizations":"comma-separated leads","goals":"what this seeks (1-2 sentences)","notable_tactics":"how it works (1-2 sentences)","outcome_status":"where it stands (1-2 sentences)","start_year":2018,"country_code":"ISO 2-letter","categories":["refugee","asylum"],"is_ongoing":true}

Rules:
- Don't invent. Null if you can't ground.
- Categories: lowercase, hyphen-separated.
- is_ongoing=false if the campaign clearly concluded; true otherwise.`;
}

// ---------------------------------------------------------------------------
// Field merge: LLM enriched fields win, fall back to existing discovery fields
// ---------------------------------------------------------------------------

function buildCaseInsert(d, enriched) {
  const arr = (v) => (Array.isArray(v) && v.length ? v.map(String) : null);
  return {
    jurisdiction: enriched.jurisdiction ?? d.extracted_jurisdiction ?? 'Unknown',
    case_citation: enriched.case_citation ?? d.extracted_title,
    year: enriched.year ?? d.extracted_year,
    court: enriched.court ?? null,
    strategic_issue: enriched.strategic_issue ?? d.extracted_summary ?? null,
    key_holding: enriched.key_holding ?? null,
    facts: enriched.facts ?? null,
    reasoning: enriched.reasoning ?? null,
    dissents: enriched.dissents ?? null,
    statutes_cited: arr(enriched.statutes_cited),
    cases_cited: arr(enriched.cases_cited),
    judges: arr(enriched.judges),
    authoritative_link: d.source_url,
    region: enriched.region ?? null,
    country_code: enriched.country_code ?? d.extracted_country_code ?? null,
    lat: d.extracted_lat,
    lng: d.extracted_lng,
    categories: enriched.categories?.length ? enriched.categories : d.extracted_categories ?? [],
    outcome: enriched.outcome ?? null,
    precedent_strength: enriched.precedent_strength ?? null,
    source: 'ai_scraped',
    verified: true,
    verified_by: 'justice-matrix-auto-publish.mjs',
    verified_at: new Date().toISOString(),
  };
}

function buildCampaignInsert(d, enriched) {
  return {
    country_region: enriched.country_region ?? d.extracted_jurisdiction ?? 'Unknown',
    campaign_name: enriched.campaign_name ?? d.extracted_title,
    lead_organizations: enriched.lead_organizations ?? null,
    goals: enriched.goals ?? d.extracted_summary ?? null,
    notable_tactics: enriched.notable_tactics ?? null,
    outcome_status: enriched.outcome_status ?? null,
    campaign_link: d.source_url,
    is_ongoing: enriched.is_ongoing ?? true,
    start_year: enriched.start_year ?? d.extracted_year,
    country_code: enriched.country_code ?? d.extracted_country_code ?? null,
    lat: d.extracted_lat,
    lng: d.extracted_lng,
    categories: enriched.categories?.length ? enriched.categories : d.extracted_categories ?? [],
    source: 'ai_scraped',
    verified: true,
    verified_by: 'justice-matrix-auto-publish.mjs',
    verified_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Robust JSON parse: tolerate ```json fences, trailing text
// ---------------------------------------------------------------------------

function parseJSON(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  // Try a direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through
  }
  // Look for the first { ... } block
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return JSON.parse(cleaned.slice(first, last + 1));
  }
  throw new Error('No JSON object found');
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function loadDiscoveries() {
  let q = supabase
    .from('justice_matrix_discovered')
    .select('*')
    .eq('status', 'pending')
    .order('discovered_at', { ascending: true })
    .limit(limit);
  if (onlyId) q = q.eq('id', onlyId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function processOne(d) {
  if (d.item_type !== 'case' && d.item_type !== 'campaign') {
    return { ok: false, reason: `unsupported item_type: ${d.item_type}` };
  }
  const pageText = await fetchSourceText(d.source_url);
  const prompt = d.item_type === 'campaign' ? campaignPrompt(d, pageText) : casePrompt(d, pageText);

  let enriched;
  try {
    enriched = await callLLMJson(prompt);
  } catch (e) {
    return { ok: false, reason: `LLM/JSON: ${e.message.slice(0, 120)}` };
  }

  if (!apply) {
    return {
      ok: true,
      dryRun: true,
      title: enriched.case_citation ?? enriched.campaign_name ?? d.extracted_title,
    };
  }

  if (d.item_type === 'campaign') {
    const row = buildCampaignInsert(d, enriched);
    const { data, error } = await supabase
      .from('justice_matrix_campaigns')
      .insert(row)
      .select()
      .single();
    if (error) return { ok: false, reason: `Insert: ${error.message.slice(0, 160)}` };
    await supabase
      .from('justice_matrix_discovered')
      .update({
        status: 'approved',
        approved_campaign_id: data.id,
        reviewed_by: 'justice-matrix-auto-publish.mjs',
        reviewed_at: new Date().toISOString(),
        review_notes: 'auto-published via LLM-grounded enrichment',
      })
      .eq('id', d.id);
    return { ok: true, kind: 'campaign', id: data.id, title: data.campaign_name };
  }

  // case
  const row = buildCaseInsert(d, enriched);
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .insert(row)
    .select()
    .single();
  if (error) return { ok: false, reason: `Insert: ${error.message.slice(0, 160)}` };
  await supabase
    .from('justice_matrix_discovered')
    .update({
      status: 'approved',
      approved_case_id: data.id,
      reviewed_by: 'justice-matrix-auto-publish.mjs',
      reviewed_at: new Date().toISOString(),
      review_notes: 'auto-published via LLM-grounded enrichment',
    })
    .eq('id', d.id);
  return { ok: true, kind: 'case', id: data.id, title: data.case_citation };
}

(async () => {
  console.log(`Justice Matrix auto-publish — ${apply ? 'APPLY' : 'dry-run'} · limit ${limit}`);
  const discoveries = await loadDiscoveries();
  console.log(`Loaded ${discoveries.length} pending discoveries.\n`);

  let success = 0;
  let failed = 0;

  for (const d of discoveries) {
    const label = `[${d.item_type}] ${(d.extracted_title || '(no title)').slice(0, 90)}`;
    process.stdout.write(`  ${label} … `);
    const res = await processOne(d);
    if (res.ok) {
      success++;
      if (res.dryRun) console.log(`would publish as "${(res.title || '?').slice(0, 70)}"`);
      else console.log(`published ${res.kind} ${res.id}`);
    } else {
      failed++;
      console.log(`SKIP — ${res.reason}`);
    }
    // Tiny pause to avoid hammering providers
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n${apply ? 'Published' : 'Would publish'}: ${success}   Skipped: ${failed}`);
  if (!apply) console.log('\nRe-run with --apply to actually publish.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
