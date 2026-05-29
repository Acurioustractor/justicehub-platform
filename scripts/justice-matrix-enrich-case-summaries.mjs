#!/usr/bin/env node
/**
 * Improve the one-line summary fields (strategic_issue + key_holding) on
 * ai_scraped cases whose summary is thin/boilerplate. These fields feed the
 * explore list-row excerpt, so a better summary shows up directly in search.
 *
 * HARD RULE (trust): grounded-or-skip. We fetch the source page and the model
 * may use ONLY that text. If the source does not fetch (HUDOC/Curia bot-block)
 * or is too thin (a pending CJEU reference with no judgment), we leave the row
 * exactly as it is. We never invent a summary from prior knowledge. This means
 * the genuinely-thin stubs stay thin, honestly, and we only deepen what has real
 * source content (CourtListener opinions, EDAL summaries, etc).
 *
 * Updated rows get embedding=NULL so the embed-new pass regenerates them and the
 * better text flows into semantic search too.
 *
 * Usage:
 *   node scripts/justice-matrix-enrich-case-summaries.mjs                (dry run)
 *   node scripts/justice-matrix-enrich-case-summaries.mjs --apply --limit 250
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = readFileSync(`${root}/.env.local`, 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => { const [k, ...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a; }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = (() => { const i = argv.indexOf('--limit'); return i >= 0 ? parseInt(argv[i + 1], 10) : 12; })();

const PROVIDERS = [
  { name: 'anthropic', key: 'ANTHROPIC_API_KEY', anthropic: true, model: 'claude-sonnet-4-6' },
  { name: 'groq', key: 'GROQ_API_KEY', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: 'GEMINI_API_KEY', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJSON(text) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { const a = cleaned.indexOf('{'); const b = cleaned.lastIndexOf('}'); if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1)); throw new Error('no JSON'); }
}
async function oneCall(p, prompt) {
  const maxTries = p.anthropic ? 5 : 1;
  let lastErr;
  for (let i = 0; i < maxTries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = p.anthropic
        ? await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env[p.key], 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: p.model, max_tokens: 600, messages: [{ role: 'user', content: prompt }] }), signal: ctrl.signal })
        : await fetch(`${p.base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env[p.key]}` }, body: JSON.stringify({ model: p.model, max_tokens: 600, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }), signal: ctrl.signal });
      if (res.status === 429 && p.anthropic && i < maxTries - 1) { await sleep(4000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`${p.name} ${res.status}`);
      const json = await res.json();
      const text = p.anthropic ? json.content?.[0]?.text ?? '' : json.choices?.[0]?.message?.content ?? '';
      return parseJSON(text);
    } catch (e) { lastErr = e; if (p.anthropic && i < maxTries - 1) { await sleep(4000 * (i + 1)); continue; } throw e; } finally { clearTimeout(t); }
  }
  throw lastErr ?? new Error(`${p.name} exhausted`);
}
async function callLLMJson(prompt) {
  const available = PROVIDERS.filter((p) => env[p.key]);
  if (!available.length) throw new Error('no LLM key');
  let lastErr;
  for (const p of available) { try { return await oneCall(p, prompt); } catch (e) { lastErr = e; } }
  throw lastErr ?? new Error('exhausted');
}

async function fetchSourceText(url) {
  if (!url || url.startsWith('mailto:')) return '';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });
    if (!res.ok) return '';
    const html = await res.text();
    return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 16000);
  } catch { return ''; } finally { clearTimeout(t); }
}

function prompt(c, pageText) {
  return `You are improving the summary of a strategic-litigation case profile, using ONLY the source page text below. Do not use prior knowledge of the case.

Case: ${c.case_citation}
Jurisdiction: ${c.jurisdiction}   Court: ${c.court ?? 'unknown'}   Year: ${c.year ?? 'unknown'}
Current strategic_issue: ${c.strategic_issue ?? '(none)'}

SOURCE PAGE TEXT:
${pageText}

Return ONLY this JSON:
{"strategic_issue":"the legal question / strategic angle this case raises, 1-2 sentences, or null","key_holding":"what the court actually decided and why it matters, 1-2 sentences, or null"}

Rules: ground every word in the SOURCE PAGE TEXT. If the text is too thin to state the issue or the holding (e.g. only a case number and a one-line subject), return null for that field rather than padding it. Never invent facts, parties, or outcomes not in the text.`;
}

async function run() {
  console.log(`\nCase-summary enrichment  |  ${APPLY ? 'APPLY' : 'DRY RUN'}  |  limit ${LIMIT}`);
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,court,year,strategic_issue,key_holding,authoritative_link')
    .eq('source', 'ai_scraped')
    .not('authoritative_link', 'is', null)
    .or('strategic_issue.is.null,key_holding.is.null')
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) { console.error(error.message); process.exit(1); }
  const rows = data ?? [];
  console.log(`Checking ${rows.length} row(s).\n`);

  let improved = 0, noSource = 0, noGround = 0, failed = 0;
  for (const r of rows) {
    const text = await fetchSourceText(r.authoritative_link);
    if (text.length < 400) { noSource++; continue; } // blocked / stub — leave as-is
    let out;
    try { out = await callLLMJson(prompt(r, text)); } catch { failed++; continue; }

    const patch = {};
    // Only replace a thin strategic_issue with a meaningfully richer grounded one.
    if (out.strategic_issue && out.strategic_issue.length > (r.strategic_issue?.length ?? 0) + 20)
      patch.strategic_issue = String(out.strategic_issue).slice(0, 600);
    if (r.key_holding == null && out.key_holding)
      patch.key_holding = String(out.key_holding).slice(0, 600);
    if (!Object.keys(patch).length) { noGround++; continue; }

    console.log(`  + ${Object.keys(patch).join(',')}  <-  ${(r.case_citation || '').slice(0, 56)}`);
    if (APPLY) {
      // Null the embedding so embed-new regenerates it from the improved text.
      const { error: upErr } = await supabase.from('justice_matrix_cases').update({ ...patch, embedding: null, updated_at: new Date().toISOString() }).eq('id', r.id);
      if (upErr) { console.log(`    ! write failed: ${upErr.message}`); failed++; continue; }
    }
    improved++;
    await sleep(700);
  }
  console.log(`\n${APPLY ? 'Improved' : 'Would improve'} ${improved}  |  no fetchable source ${noSource}  |  source too thin to ground ${noGround}  |  failed ${failed}  |  of ${rows.length}.`);
  if (APPLY && improved) console.log('Run: node scripts/justice-matrix-embed-new.mjs  (regenerate embeddings for the improved rows)');
}
run().catch((e) => { console.error(e); process.exit(1); });
