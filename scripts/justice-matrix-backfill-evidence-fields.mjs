#!/usr/bin/env node
/**
 * Backfill the quantitative spine on alma_evidence: effect_size, sample_size,
 * timeframe, limitations. These are the fields researchers and funders act on,
 * and they sit near 0% (the detail page renders dark blocks for ~99% of rows).
 *
 * HARD RULE (from the trust analysis): never synthesise a number not in the
 * source. Grounded-or-null. The model is told to return null for anything not
 * explicitly stated in the text, and we only ever fill empty fields.
 *
 * Text source per row, best-first: the CrossRef abstract (for rows that gained a
 * DOI - that is where quantitative studies report N and effect size), plus our
 * stored findings + methodology. No DOI -> stored text only (lower yield).
 *
 * Claude-first multi-provider with retry-on-JSON-fail (mirrors backfill-deep).
 *
 * Usage:
 *   node scripts/justice-matrix-backfill-evidence-fields.mjs                 (dry run)
 *   node scripts/justice-matrix-backfill-evidence-fields.mjs --apply
 *   node scripts/justice-matrix-backfill-evidence-fields.mjs --apply --limit 50
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = readFileSync(`${root}/.env.local`, 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => {
    const [k, ...v] = l.split('=');
    a[k.trim()] = v.join('=').trim();
    return a;
  }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = (() => {
  const i = argv.indexOf('--limit');
  return i >= 0 ? parseInt(argv[i + 1], 10) : 100;
})();

// Claude first: most reliable at honest "null when not stated" extraction.
const PROVIDERS = [
  { name: 'anthropic', key: 'ANTHROPIC_API_KEY', anthropic: true, model: 'claude-sonnet-4-6' },
  { name: 'groq', key: 'GROQ_API_KEY', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: 'GEMINI_API_KEY', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
];

function parseJSON(text) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const a = cleaned.indexOf('{');
    const b = cleaned.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1));
    throw new Error('no JSON');
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One provider call returning parsed JSON, or throws. Anthropic (the quality
// extractor for the grounded-or-null judgement) retries on 429 with backoff so a
// rate-limit during a burst does not silently abandon it for a weaker model that
// just returns null effect_size. Weaker providers get one shot.
async function oneCall(p, prompt) {
  const maxTries = p.anthropic ? 5 : 1;
  let lastErr;
  for (let i = 0; i < maxTries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = p.anthropic
        ? await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': env[p.key], 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: p.model, max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
            signal: ctrl.signal,
          })
        : await fetch(`${p.base}/chat/completions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${env[p.key]}` },
            body: JSON.stringify({ model: p.model, max_tokens: 700, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
            signal: ctrl.signal,
          });
      if (res.status === 429 && p.anthropic && i < maxTries - 1) {
        await sleep(4000 * (i + 1)); // 4s, 8s, 12s, 16s backoff
        continue;
      }
      if (!res.ok) throw new Error(`${p.name} ${res.status}`);
      const json = await res.json();
      const text = p.anthropic ? json.content?.[0]?.text ?? '' : json.choices?.[0]?.message?.content ?? '';
      return parseJSON(text);
    } catch (e) {
      lastErr = e;
      if (p.anthropic && i < maxTries - 1) { await sleep(4000 * (i + 1)); continue; }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr ?? new Error(`${p.name} exhausted`);
}

async function callLLMJson(prompt) {
  const available = PROVIDERS.filter((p) => env[p.key]);
  if (!available.length) throw new Error('no LLM key');
  let lastErr;
  for (const p of available) {
    try {
      return await oneCall(p, prompt);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('exhausted');
}

function stripJats(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function crossrefAbstract(doi) {
  if (!doi) return '';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}?select=abstract&mailto=hello@justicehub.org.au`, {
      headers: { accept: 'application/json' }, signal: ctrl.signal,
    });
    if (!res.ok) return '';
    const json = await res.json();
    return stripJats(json?.message?.abstract).slice(0, 3000);
  } catch { return ''; } finally { clearTimeout(t); }
}

// effect_size is a CONSTRAINED vocabulary in the DB (CHECK constraint), not free
// text. The model must return exactly one of these, or null when it cannot tell.
const EFFECT_ENUM = ['Large positive', 'Moderate positive', 'Small positive', 'Null', 'Mixed', 'Not measured'];

function prompt(text) {
  return `You are extracting structured fields from a research study about a justice or social program. Use ONLY what the text states. Do NOT invent numbers or over-claim an effect.

Return ONLY this JSON:
{"effect_size": "<one label, see below, or null>","sample_size": "<integer participant count if explicitly stated, else null>","timeframe": "<study duration or follow-up period if stated, e.g. 12-month follow-up, else null>","limitations": "<limitations the authors state about their own study, else null>"}

effect_size must be EXACTLY one of these six strings, or null if you genuinely cannot tell:
- "Large positive"     study reports a large beneficial effect on its main outcome
- "Moderate positive"  a moderate beneficial effect
- "Small positive"     a small beneficial effect
- "Null"               reports no effect / no significant difference
- "Mixed"              beneficial on some outcomes, not others
- "Not measured"       the study does not measure or report an effect on an outcome (e.g. a program description, framework, or report with no outcome data)
Choose a positive level ONLY when the text clearly describes a beneficial result. When unsure between two levels, pick the lower. Never output any other string for effect_size.

Rules: sample_size must be an explicit number or null, never an estimate. Do not invent limitations the authors did not state.

TEXT:
${text.slice(0, 6000)}`;
}

async function run() {
  console.log(`\nEvidence quantitative-spine backfill  |  ${APPLY ? 'APPLY' : 'DRY RUN'}  |  limit ${LIMIT}`);
  const { data, error } = await supabase
    .from('alma_evidence')
    .select('id,title,findings,methodology,doi,effect_size,sample_size,timeframe,limitations')
    .or('effect_size.is.null,sample_size.is.null,timeframe.is.null,limitations.is.null')
    .not('findings', 'is', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) { console.error(error.message); process.exit(1); }
  const rows = data ?? [];
  console.log(`Checking ${rows.length} row(s).\n`);

  let filled = 0, failed = 0;
  for (const r of rows) {
    const abstract = await crossrefAbstract(r.doi);
    const text = [r.findings, r.methodology, abstract].filter(Boolean).join('\n\n').trim();
    if (text.length < 30) continue;
    let out;
    try { out = await callLLMJson(prompt(text)); } catch { failed++; continue; }

    // Only fill empty fields; never overwrite; null where the model found nothing.
    const patch = {};
    // effect_size is enum-constrained; only write an allowed label, else leave null.
    if (r.effect_size == null && typeof out.effect_size === 'string' && EFFECT_ENUM.includes(out.effect_size)) patch.effect_size = out.effect_size;
    if (r.sample_size == null && Number.isInteger(out.sample_size)) patch.sample_size = out.sample_size;
    if (r.timeframe == null && out.timeframe) patch.timeframe = String(out.timeframe).slice(0, 200);
    if (r.limitations == null && out.limitations) patch.limitations = String(out.limitations).slice(0, 1000);
    if (!Object.keys(patch).length) continue;

    console.log(`  + ${Object.keys(patch).join(',')}  <-  ${(r.title || '').slice(0, 60)}`);
    if (APPLY) {
      const { error: upErr } = await supabase.from('alma_evidence').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', r.id);
      if (upErr) { console.log(`    ! write failed: ${upErr.message}`); failed++; }
      else filled++;
    } else filled++;
    await sleep(800); // pace under Claude's rate limit; 429s self-correct via backoff
  }
  console.log(`\n${APPLY ? 'Filled' : 'Would fill'} ${filled} / ${rows.length}  |  failed ${failed}.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
