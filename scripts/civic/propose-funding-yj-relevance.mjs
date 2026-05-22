#!/usr/bin/env node
/**
 * Civic Intelligence v1 — YJ-relevance classification for justice_funding rows.
 *
 * v1 priority: 433 QLD consultancy spend rows. The headline funding ratio
 * compares confirmed-YJ consultancy spend against confirmed Tier 1 grant spend.
 *
 * For each funding row, an LLM proposes:
 *   - is_yj_relevant (true/false)
 *   - yj_relevance_category: direct_yj_service | yj_research_or_review |
 *                             yj_advisory_consultancy | yj_infrastructure_or_capital |
 *                             broader_justice_includes_yj | not_yj_related
 *   - confidence
 *   - evidence_snippet
 *
 * Usage:
 *   node scripts/civic/propose-funding-yj-relevance.mjs [--dry-run] [--limit N] [--state QLD] [--mode consultancy|tier1|all]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars');
if (!GEMINI_KEY) throw new Error('Missing GEMINI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseArg('--limit', null, (v) => parseInt(v, 10));
const STATE = parseArg('--state', null);
const MODE = parseArg('--mode', 'consultancy'); // consultancy | tier1 | all

function parseArg(prefix, fallback, transform = (v) => v) {
  const arg = process.argv.find((a) => a.startsWith(prefix + '='));
  return arg ? transform(arg.split('=')[1]) : fallback;
}

const BATCH_SIZE = 5;
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const VALID_CATEGORIES = [
  'direct_yj_service', 'yj_research_or_review', 'yj_advisory_consultancy',
  'yj_infrastructure_or_capital', 'broader_justice_includes_yj', 'not_yj_related',
];

const SYSTEM_PROMPT = `You classify Australian justice-sector funding records for youth-justice relevance. Each row represents money awarded to a recipient for a stated purpose.

YJ-RELEVANCE DEFINITION:
A funding row IS YJ-relevant if its project description, program name, or recipient indicates the money funds:
  - Services to young people (typically <25, sometimes <18) in or at risk of the justice system
  - Diversion, bail support, post-release, on-Country mentoring for young people
  - Youth detention infrastructure / services
  - Family-led conferencing for youth offenders
  - Youth legal aid / advocacy / legal representation
  - Research or reviews specifically on youth justice systems
  - Advisory work specifically on youth justice policy / programs / detention systems

A funding row is NOT YJ-relevant if it funds:
  - Adult corrections only
  - General courts (without youth-court focus)
  - General police (without youth-specific stream)
  - General health / education / housing without justice-system framing
  - Domestic violence response (unless specifically youth-led)

CATEGORY (pick exactly one if YJ-relevant; otherwise "not_yj_related"):
  direct_yj_service — money to a service provider delivering YJ programs directly
  yj_research_or_review — funded research, evaluation, or formal review on YJ
  yj_advisory_consultancy — paid advisory/consulting work on YJ policy or programs
  yj_infrastructure_or_capital — capital works for detention centres, YJ facilities
  broader_justice_includes_yj — justice spend where YJ is one component but not the focus
  not_yj_related — not relevant to youth justice

CONFIDENCE:
  0.9+ clear single signal
  0.7-0.89 likely with minor ambiguity
  <0.7 ambiguous, flag for review

Return a JSON array matching input order. Each element: {"yj":true|false,"cat":"yj_advisory_consultancy","conf":0.92,"why":"<= 15 words"}.
Output the array and nothing else.`;

function parseJsonArray(content, expectedLength) {
  let str = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    const obj = JSON.parse(str);
    if (Array.isArray(obj)) return obj.length === expectedLength ? obj : null;
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length === expectedLength) return val;
    }
  } catch {}
  const arrMatch = str.match(/\[[\s\S]*\]/);
  if (!arrMatch) return null;
  let arrStr = arrMatch[0].replace(/,\s*([}\]])/g, '$1').replace(/\/\/[^\n]*/g, '');
  try {
    const arr = JSON.parse(arrStr);
    return Array.isArray(arr) && arr.length === expectedLength ? arr : null;
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function classifyBatch(rows) {
  const userPrompt = rows
    .map((r, i) => {
      const recipient = (r.recipient_name || 'unknown').slice(0, 100);
      const program = (r.program_name || '').slice(0, 100);
      const desc = (r.project_description || '').slice(0, 250);
      const amount = r.amount_dollars ? `$${Math.round(Number(r.amount_dollars)).toLocaleString()}` : '?';
      return `${i + 1}. recipient="${recipient}", program="${program}", state=${r.state || '?'}, amount=${amount}, desc="${desc}"`;
    })
    .join('\n');

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Classify these ${rows.length} funding rows. Return ONLY a JSON array with exactly ${rows.length} objects.\n\n${userPrompt}` },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GEMINI_KEY}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`  Gemini ${res.status}: ${errText.slice(0, 200)}`);
        if (res.status === 429) { await sleep(30000); continue; }
        throw new Error(`Gemini ${res.status}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const parsed = parseJsonArray(content, rows.length);
      if (!parsed) {
        console.error(`  Failed to parse (${content.length} chars). First 200:`, content.slice(0, 200));
        continue;
      }
      return parsed;
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < 2) await sleep(5000);
    }
  }
  return rows.map(() => ({ yj: null, cat: 'not_yj_related', conf: 0, why: 'classification failed' }));
}

async function fetchUniverse() {
  // Paginate to avoid PostgREST 1000-row default cap.
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    let q = supabase
      .from('justice_funding')
      .select('id, recipient_name, recipient_abn, program_name, project_description, amount_dollars, state, funding_type, sector')
      .range(from, from + PAGE - 1);

    if (STATE) q = q.eq('state', STATE);

    if (MODE === 'consultancy') {
      q = q.or('recipient_name.ilike.%consulting%,recipient_name.ilike.%advisory%,recipient_name.ilike.%deloitte%,recipient_name.ilike.%kpmg%,recipient_name.ilike.%pwc%,recipient_name.ilike.%ernst%young%,recipient_name.ilike.%mckinsey%,recipient_name.ilike.%boston consulting%,recipient_name.ilike.%accenture%');
    }
    // mode=tier1 and mode=all handled by the caller via state and other args

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return LIMIT ? all.slice(0, LIMIT) : all;
}

async function upsertProposal(row, result) {
  const yj = result.yj === true || result.yj === 'true';
  const cat = VALID_CATEGORIES.includes(result.cat) ? result.cat : 'not_yj_related';
  const confidence = typeof result.conf === 'number' ? Math.max(0, Math.min(1, result.conf)) : 0;
  const evidence = (result.why || '').slice(0, 500);

  if (DRY_RUN) {
    console.log(`  [dry] ${row.recipient_name?.slice(0, 50)} → yj=${yj} (${cat}, ${confidence})`);
    return;
  }

  const { error } = await supabase
    .from('civic_funding_yj_classifications')
    .upsert(
      {
        funding_id: row.id,
        llm_proposed_yj: yj,
        llm_proposed_category: cat,
        llm_confidence: confidence,
        llm_evidence_snippet: evidence,
        llm_model: MODEL,
        llm_proposed_at: new Date().toISOString(),
      },
      { onConflict: 'funding_id', ignoreDuplicates: false },
    );

  if (error) console.error(`  Upsert failed: ${error.message}`);
}

async function main() {
  console.log('=== Civic Intelligence Funding YJ-Relevance Classifier ===');
  console.log(DRY_RUN ? '(DRY RUN — no DB writes)' : '(LIVE)');
  console.log(`Mode: ${MODE}, State: ${STATE || 'all'}, Limit: ${LIMIT || 'none'}`);

  const universe = await fetchUniverse();
  console.log(`\nUniverse: ${universe.length} funding rows\n`);

  const counts = { yj: 0, notYj: 0, cat: {}, lowConf: 0 };

  for (let i = 0; i < universe.length; i += BATCH_SIZE) {
    const batch = universe.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(universe.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} rows)...`);

    const results = await classifyBatch(batch);
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const result = results[j] || {};
      await upsertProposal(row, result);
      if (result.yj) counts.yj++;
      else counts.notYj++;
      counts.cat[result.cat] = (counts.cat[result.cat] || 0) + 1;
      if ((result.conf || 0) < 0.7) counts.lowConf++;
    }
    if (i + BATCH_SIZE < universe.length) await sleep(1000);
  }

  console.log('\n=== Summary ===');
  console.log(`YJ-relevant: ${counts.yj} / ${universe.length}`);
  console.log(`Not YJ-relevant: ${counts.notYj}`);
  console.log('Category distribution:', counts.cat);
  console.log(`Low-confidence (<0.7): ${counts.lowConf}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
