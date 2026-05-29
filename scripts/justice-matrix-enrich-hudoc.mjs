#!/usr/bin/env node
/**
 * Real-source enrichment for HUDOC (ECtHR) cases. The hudoc.echr.coe.int PAGE
 * bot-blocks (403), so the generic summary enricher couldn't ground anything.
 * But the HUDOC APIs are public and work:
 *   - search:   /app/query/results?query=...appno:"NN/YY"  -> conclusion, article,
 *               docname, importance, and the REAL itemid (the scanner mangled some
 *               links by appending the appno, e.g. 001-54796/16; the API gives the
 *               true 001-250202).
 *   - doc body: /app/conversion/docx/html/body?library=ECHR&id=001-XXXXX -> full
 *               judgment text.
 *
 * So we pull official content and ground a real strategic_issue + key_holding in
 * it, set outcome (from the conclusion) + precedent_strength (from importance),
 * and FIX the mangled authoritative_link to the canonical itemid. Trust rule
 * holds: everything is grounded in the HUDOC API response, nothing invented; a
 * case the API can't resolve is skipped.
 *
 * Usage:
 *   node scripts/justice-matrix-enrich-hudoc.mjs               (dry run)
 *   node scripts/justice-matrix-enrich-hudoc.mjs --apply --limit 80
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = readFileSync(`${root}/.env.local`, 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => { const [k, ...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a; }, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = (() => { const i = argv.indexOf('--limit'); return i >= 0 ? parseInt(argv[i + 1], 10) : 10; })();
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// MiniMax first: the user's MiniMax plan has ample quota (the free groq/gemini
// tiers were exhausted by today's runs) and M2.7 writes far better prose. It is a
// reasoning model (emits <think>, no JSON mode), so it needs more tokens and no
// response_format; parseJSON strips the think block. Cheap free providers follow;
// Anthropic kept last-resort only (cost).
const PROVIDERS = [
  { name: 'minimax', key: 'MINIMAX_API_KEY', base: 'https://api.minimaxi.chat/v1', model: 'MiniMax-M2.7', noJson: true, maxTokens: 2500 },
  { name: 'groq', key: 'GROQ_API_KEY', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: 'GEMINI_API_KEY', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  { name: 'cerebras', key: 'CEREBRAS_API_KEY', base: 'https://api.cerebras.ai/v1', model: 'llama3.3-70b' },
  { name: 'sambanova', key: 'SAMBANOVA_API_KEY', base: 'https://api.sambanova.ai/v1', model: 'Meta-Llama-3.3-70B-Instruct' },
  { name: 'anthropic', key: 'ANTHROPIC_API_KEY', anthropic: true, model: 'claude-sonnet-4-6' }, // last resort only
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function parseJSON(t) { const c = t.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(); try { return JSON.parse(c); } catch { const a = c.indexOf('{'), b = c.lastIndexOf('}'); if (a >= 0 && b > a) return JSON.parse(c.slice(a, b + 1)); throw new Error('no JSON'); } }
async function oneCall(p, prompt) {
  const maxTries = 3; let lastErr;
  for (let i = 0; i < maxTries; i++) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const mt = p.maxTokens ?? 600; // reasoning models (minimax) burn tokens on <think>
      const res = p.anthropic
        ? await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env[p.key], 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: p.model, max_tokens: mt, messages: [{ role: 'user', content: prompt }] }), signal: ctrl.signal })
        : await fetch(`${p.base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env[p.key]}` }, body: JSON.stringify({ model: p.model, max_tokens: mt, messages: [{ role: 'user', content: prompt }], ...(p.noJson ? {} : { response_format: { type: 'json_object' } }) }), signal: ctrl.signal });
      // Rate-limited (any provider, incl. groq under burst): wait + retry same provider.
      if ((res.status === 429 || res.status === 503) && i < maxTries - 1) { await sleep(2500 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`${p.name} ${res.status}`); // other HTTP error: fall to next provider
      const json = await res.json();
      return parseJSON(p.anthropic ? json.content?.[0]?.text ?? '' : json.choices?.[0]?.message?.content ?? '');
    } catch (e) {
      lastErr = e;
      // Retry only transient network/abort errors; a thrown HTTP error means "try next provider".
      if (/abort|fetch failed|network|ECONN|terminated/i.test(e.message ?? '') && i < maxTries - 1) { await sleep(1500); continue; }
      throw e;
    } finally { clearTimeout(t); }
  }
  throw lastErr;
}
async function callLLMJson(prompt) {
  const av = PROVIDERS.filter((p) => env[p.key]); if (!av.length) throw new Error('no LLM key');
  let lastErr; for (const p of av) { try { return await oneCall(p, prompt); } catch (e) { lastErr = e; } } throw lastErr;
}

// Pull official metadata from the HUDOC search API, by app number then by name.
async function hudocLookup(appno, docname) {
  const base = 'https://hudoc.echr.coe.int/app/query/results';
  const sel = 'itemid,docname,appno,article,conclusion,kpdate,importance';
  const filterCommon = 'contentsitename=ECHR AND (NOT (doctype=PR OR doctype=HFCOMOLD OR doctype=HECOMOLD))';
  const tries = [];
  if (appno) tries.push(`${filterCommon} AND appno:"${appno}"`);
  if (docname) tries.push(`${filterCommon} AND docname:"${docname.replace(/"/g, '')}"`);
  for (const q of tries) {
    // One appno can have several HUDOC entries (judgment + communicated case +
    // admissibility decision). Pull a few and prefer the substantive judgment
    // (a conclusion mentioning violation) over a "Communicated"/admissibility stub.
    const url = `${base}?query=${encodeURIComponent(q)}&select=${encodeURIComponent(sel)}&sort=&start=0&length=8`;
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: ctrl.signal });
      if (!res.ok) continue;
      const j = await res.json();
      const results = (j?.results ?? []).map((x) => x.columns).filter((x) => x?.itemid);
      if (results.length) return results.find((x) => /violation/i.test(x.conclusion || '')) || results[0];
    } catch { /* next */ } finally { clearTimeout(t); }
  }
  return null;
}
async function hudocBody(itemid) {
  const url = `https://hudoc.echr.coe.int/app/conversion/docx/html/body?library=ECHR&id=${itemid}`;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: ctrl.signal });
    if (!res.ok) return '';
    const html = await res.text();
    return html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#xa0;|&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 14000);
  } catch { return ''; } finally { clearTimeout(t); }
}

// HUDOC conclusion -> outcome for the applicant (expulsion/asylum context).
function outcomeFromConclusion(con) {
  if (!con) return null;
  const c = con.toLowerCase();
  if (/\bviolation of article 3\b/.test(c) && !/no violation of article 3/.test(c)) return 'favorable';
  if (/(^|;)\s*violation of/.test(c.replace(/no violation of/g, 'NOVIOL'))) return 'favorable';
  if (/no violation/.test(c) && !/;\s*violation of/.test(c.replace(/no violation of/g, 'NOVIOL'))) return 'adverse';
  return null;
}
const strengthFromImportance = (imp) => (imp === '1' ? 'high' : imp === '2' ? 'medium' : 'low');

function prompt(c, meta, body) {
  return `Write a clean two-field summary of this European Court of Human Rights case, using ONLY the official HUDOC data below. Compose plain-English sentences. Do not use prior knowledge.

Case: ${c.case_citation}
Official conclusion (verbatim, may cover several articles): ${meta.conclusion}
Articles engaged: ${meta.article}
${body ? `Judgment excerpt: ${body}` : ''}

Return ONLY this JSON:
{"strategic_issue":"<ONE sentence naming the human-rights question, e.g. 'Whether the applicant's expulsion to Iran would expose him to a real risk of treatment contrary to Article 3.'>","key_holding":"<one to two sentences stating what the Court actually decided>"}

HARD STYLE RULES:
- Compose prose. NEVER paste the conclusion verbatim, NEVER list article numbers like "Articles: 2, 3, 35, 41", NEVER begin with "European Court of Human Rights judgment".
- No filler. Banned phrases: "marks a significant outcome", "in the context of", "was at stake", "was in question", "significant outcome in the context of".
- If the conclusion is MIXED (e.g. "No violation of Article 13; Violation of Article 3"), state BOTH parts in the holding — never report only one half.
- Name the right, not just the number: Article 2 = right to life; Article 3 = prohibition of torture / inhuman or degrading treatment; Article 4 of Protocol No. 4 = collective expulsion of aliens; Article 8 = private and family life; Article 13 = effective remedy.
- Ground everything in the conclusion / excerpt; invent no facts, parties, dates, or numbers.`;
}

const APPNO_RE = /no\.?\s*(\d{3,6}\/\d{2})/i;

async function run() {
  console.log(`\nHUDOC real-source enrichment  |  ${APPLY ? 'APPLY' : 'DRY RUN'}  |  limit ${LIMIT}`);
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,year,strategic_issue,key_holding,authoritative_link,outcome,precedent_strength')
    .eq('source', 'ai_scraped')
    .ilike('authoritative_link', '%hudoc%')
    // Re-process ALL HUDOC rows: the tightened prompt re-does the mediocre prose
    // (metadata dumps / padding) from the earlier pass, not just the empty ones.
    .limit(LIMIT);
  if (error) { console.error(error.message); process.exit(1); }
  const rows = data ?? [];
  console.log(`Checking ${rows.length} HUDOC row(s).\n`);

  let improved = 0, noMeta = 0, failed = 0;
  for (const r of rows) {
    const appno = (r.case_citation?.match(APPNO_RE) || [])[1] || null;
    const meta = await hudocLookup(appno, r.case_citation);
    if (!meta) { noMeta++; continue; }
    // Ground in the official conclusion + articles only. The full judgment
    // doc-body is ~1MB each and too slow at corpus scale; conclusion + article is
    // enough for an accurate 1-line legal-question summary. (hudocBody() stays for
    // a future deep, fact-level pass on a curated subset.)
    const body = '';
    let out;
    try { out = await callLLMJson(prompt(r, meta, body)); } catch { failed++; continue; }

    const patch = {};
    // Overwrite the prose: this is a re-do to replace mediocre earlier output, and
    // a clean rewrite is often shorter than the metadata dump it replaces.
    if (out.strategic_issue && !/^european court of human rights judgment/i.test(out.strategic_issue) && !/articles?:\s*\d/i.test(out.strategic_issue))
      patch.strategic_issue = String(out.strategic_issue).slice(0, 600);
    if (out.key_holding) patch.key_holding = String(out.key_holding).slice(0, 600);
    // Official fields + canonical link fix (set even on re-run; outcome/precedent overwrite).
    const oc = outcomeFromConclusion(meta.conclusion);
    if (oc) patch.outcome = oc;
    if (meta.importance) patch.precedent_strength = strengthFromImportance(meta.importance);
    const canonical = `https://hudoc.echr.coe.int/eng?i=${meta.itemid}`;
    if (canonical !== r.authoritative_link) patch.authoritative_link = canonical;
    if (!Object.keys(patch).length) { noMeta++; continue; }

    console.log(`  + ${Object.keys(patch).join(',')}  <-  ${(r.case_citation || '').slice(0, 50)}  [${meta.conclusion?.slice(0, 40)}…]`);
    if (APPLY) {
      // Retry transient pool/connection timeouts (the shared Supabase pooler
      // saturates under load) so a generated enrichment isn't lost to infra noise.
      let wrote = false, werr;
      for (let w = 0; w < 4 && !wrote; w++) {
        const { error: e } = await supabase.from('justice_matrix_cases').update({ ...patch, embedding: null, updated_at: new Date().toISOString() }).eq('id', r.id);
        if (!e) { wrote = true; break; }
        werr = e;
        if (/timeout|connection|pool|terminated|fetch failed|ENOTFOUND|ECONNRESET|socket|network/i.test(e.message ?? '')) { await sleep(3000 * (w + 1)); continue; }
        break; // non-transient error: stop retrying
      }
      if (!wrote) { console.log(`    ! write failed: ${werr?.message}`); failed++; continue; }
    }
    improved++;
    await sleep(1200);
  }
  console.log(`\n${APPLY ? 'Improved' : 'Would improve'} ${improved}  |  API could not resolve ${noMeta}  |  failed ${failed}  |  of ${rows.length}.`);
  if (APPLY && improved) console.log('Run: node scripts/justice-matrix-embed-new.mjs');
}
run().catch((e) => { console.error(e); process.exit(1); });
