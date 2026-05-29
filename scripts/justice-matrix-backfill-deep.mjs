#!/usr/bin/env node
/**
 * Backfill the new deep-case fields (facts, reasoning, dissents, statutes_cited,
 * cases_cited, judges) on existing rows in justice_matrix_cases. Re-fetches the
 * authoritative_link, prompts the LLM to fill JUST these fields (so it doesn't
 * waste tokens regenerating fields we already have), and patches the row.
 *
 * Idempotent: skips rows that already have facts AND reasoning AND judges.
 *
 * Usage:
 *   node scripts/justice-matrix-backfill-deep.mjs                  # dry-run, 10 rows
 *   node scripts/justice-matrix-backfill-deep.mjs --apply          # patch
 *   node scripts/justice-matrix-backfill-deep.mjs --apply --limit 100
 *   node scripts/justice-matrix-backfill-deep.mjs --apply --id <uuid>
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
const limit = parseInt(args.find((_, i) => args[i - 1] === '--limit') || '10', 10);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Claude is first: most capable at grounding legal cases, so it gets the best
// shot at the unfilled (esp. international) backlog. The free OpenAI-compatible
// providers follow as fallback. DeepSeek removed (key returns 402 / no credits).
const PROVIDERS = [
  { name: 'anthropic', key: 'ANTHROPIC_API_KEY', anthropic: true,                                              model: 'claude-sonnet-4-6' },
  { name: 'groq',      key: 'GROQ_API_KEY',      base: 'https://api.groq.com/openai/v1',                       model: 'llama-3.3-70b-versatile' },
  { name: 'gemini',    key: 'GEMINI_API_KEY',    base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  { name: 'sambanova', key: 'SAMBANOVA_API_KEY', base: 'https://api.sambanova.ai/v1',                          model: 'Meta-Llama-3.3-70B-Instruct' },
  { name: 'minimax',   key: 'MINIMAX_API_KEY',   base: 'https://api.minimaxi.chat/v1',                         model: 'MiniMax-M2.7' },
];

// Calls available providers in order and parses the response as JSON. On HTTP
// error OR unparseable JSON, falls through to the next provider; the whole
// rotation repeats `attempts` times. This is the retry-on-JSON-fail: previously
// callLLM returned the first 200-OK provider's text and a single parse attempt
// stranded the case when that text was malformed JSON.
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
          // Anthropic uses its own Messages API (not OpenAI-compatible: different
          // endpoint, headers, and response shape; no response_format — we rely
          // on the prompt's "return ONLY valid JSON" + the tolerant parser).
          const res = p.anthropic
            ? await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-api-key': env[p.key],
                  'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                  model: p.model,
                  max_tokens: 1500,
                  messages: [{ role: 'user', content: prompt }],
                }),
                signal: ctrl.signal,
              })
            : await fetch(`${p.base}/chat/completions`, {
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
            lastErr = new Error(`${p.name} ${res.status}`);
            continue;
          }
          const json = await res.json();
          const rawText = p.anthropic
            ? json.content?.[0]?.text ?? ''
            : json.choices?.[0]?.message?.content ?? '';
          const text = rawText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
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

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error('No JSON object found');
  }
}

function deepPrompt(c, pageText) {
  return `You are filling in deeper fields on an existing strategic-litigation case profile. The basic profile already exists; do NOT overwrite identity fields. Only fill the 6 fields requested.

Existing case profile:
  citation: ${c.case_citation}
  jurisdiction: ${c.jurisdiction}
  year: ${c.year ?? 'unknown'}
  court: ${c.court ?? 'unknown'}
  strategic_issue: ${c.strategic_issue ?? 'unknown'}
  key_holding: ${c.key_holding ?? 'unknown'}
  source_url: ${c.authoritative_link ?? '(none)'}

Source page text (truncated):
${pageText || '(empty — fall back to training knowledge if you have it; null otherwise)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"facts":"What happened to the people in this case — one paragraph","reasoning":"Why the court decided this way — the ratio decidendi (2-4 sentences)","dissents":"Dissenting opinions: who and on what point, or null","statutes_cited":["Refugee Convention art. 33","Migration Act 1958 s.36"],"cases_cited":["Plaintiff M70/2011 v Minister","Chen Shi Hai v Minister"],"judges":["Kiefel CJ","Gageler J"]}

Rules:
- Don't invent. Null (or []) if you can't ground.
- Statutes/cases/judges: arrays of short strings. Trim honorifics; "Kiefel CJ" not "The Honourable Chief Justice Kiefel".
- Facts != strategic_issue. Facts = what happened to the people. Issue = the legal question.
- Reasoning != key_holding. Holding = the decision. Reasoning = why that decision.`;
}

async function loadCases() {
  let q = supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,authoritative_link,facts,reasoning,judges')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (onlyId) q = q.eq('id', onlyId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function processOne(c) {
  // Skip rows that already have all three of the prose fields filled.
  if (c.facts && c.reasoning && c.judges?.length) {
    return { ok: true, skipped: true, reason: 'already filled' };
  }

  const pageText = await fetchSourceText(c.authoritative_link);
  let enriched;
  try {
    enriched = await callLLMJson(deepPrompt(c, pageText));
  } catch (e) {
    return { ok: false, reason: `LLM/JSON: ${e.message.slice(0, 120)}` };
  }

  const arr = (v) => (Array.isArray(v) && v.length ? v.map(String) : null);
  // Never overwrite existing values; only fill empty.
  const patch = {};
  if (!c.facts && enriched.facts) patch.facts = enriched.facts;
  if (!c.reasoning && enriched.reasoning) patch.reasoning = enriched.reasoning;
  if (enriched.dissents) patch.dissents = enriched.dissents;
  if (arr(enriched.statutes_cited)) patch.statutes_cited = arr(enriched.statutes_cited);
  if (arr(enriched.cases_cited)) patch.cases_cited = arr(enriched.cases_cited);
  if ((!c.judges || c.judges.length === 0) && arr(enriched.judges)) patch.judges = arr(enriched.judges);

  if (!Object.keys(patch).length) return { ok: true, skipped: true, reason: 'nothing new from LLM' };

  if (!apply) return { ok: true, dryRun: true, fields: Object.keys(patch) };

  const { error } = await supabase
    .from('justice_matrix_cases')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', c.id);
  if (error) return { ok: false, reason: `update: ${error.message.slice(0, 120)}` };
  return { ok: true, fields: Object.keys(patch) };
}

(async () => {
  console.log(`Justice Matrix deep-fields backfill — ${apply ? 'APPLY' : 'dry-run'} · limit ${limit}`);
  const cases = await loadCases();
  console.log(`Loaded ${cases.length} cases.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;
  for (const c of cases) {
    const label = `${(c.case_citation || '?').slice(0, 80)}`;
    process.stdout.write(`  ${label} … `);
    const res = await processOne(c);
    if (res.ok && res.skipped) {
      skipped++;
      console.log(`skip (${res.reason})`);
    } else if (res.ok) {
      success++;
      if (res.dryRun) console.log(`would fill: ${res.fields.join(', ')}`);
      else console.log(`filled: ${res.fields.join(', ')}`);
    } else {
      failed++;
      console.log(`FAIL — ${res.reason}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nFilled: ${success}   Skipped: ${skipped}   Failed: ${failed}`);
  if (!apply) console.log('\nRe-run with --apply to actually patch.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
