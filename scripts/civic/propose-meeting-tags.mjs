#!/usr/bin/env node
/**
 * Civic Intelligence v1 — meeting sector tag proposer.
 *
 * Universe: civic_ministerial_diaries rows where organisation OR purpose ILIKE
 *           '%youth%', '%detention%', or '%justice%' (160 rows on 2026-05-15, all QLD).
 *
 * For each meeting, an LLM proposes:
 *   - sector_category (one of the 10 buckets from civic_meeting_tags)
 *   - is_yj_relevant (sanity check on the keyword filter)
 *   - confidence (0..1)
 *   - evidence_snippet
 *
 * Output written to civic_meeting_tags with confirmed_at = null.
 * Re-running upserts on diary_id.
 *
 * Usage:
 *   node scripts/civic/propose-meeting-tags.mjs [--dry-run] [--limit N]
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
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : null;

const BATCH_SIZE = 5;
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const VALID_SECTORS = [
  'primary_frontline', 'peak_body', 'consultancy', 'government',
  'research_academic', 'legal_service', 'advocacy', 'funder', 'media', 'other',
];

const SYSTEM_PROMPT = `You classify ministerial meeting attendees by sector. The minister portfolios are youth-justice-adjacent in Queensland, Australia. Apply written definitions strictly.

SECTOR CATEGORIES (pick exactly one):
  primary_frontline — Aboriginal/community-controlled NFP, small NFP whose primary delivered service is frontline youth justice work (diversion, bail support, on-Country mentoring, post-release, family conferencing, youth legal first-response)
  peak_body — industry/sector peak body (e.g. Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
  consultancy — paid advisory firm (Deloitte, KPMG, EY, PwC, McKinsey, Boston Consulting, smaller "Consulting" / "Advisory" Pty Ltd)
  government — department, statutory agency, ministerial staff, Director-General, Commissioner, other government employees, oversight commissions
  research_academic — university, research institute, think tank
  legal_service — legal aid commission, ATSILS, Aboriginal Legal Service, community legal centre, bar association
  advocacy — advocacy/lobbying org without direct service delivery (Amnesty, HRLC, Justice Reform Initiative)
  funder — philanthropic foundation, grant body, family office giving money
  media — news org, journalist
  other — does not fit above (use sparingly)

DECISION RULES:
  - "Director-General", "Department of...", "Commissioner of...", "Ministerial Staff", "Assistant Minister" → government
  - "Pty Ltd" / "Consulting" / "Advisory" / Big-4 firms (Deloitte, KPMG, EY, PwC) → consultancy
  - "Aboriginal Legal", "ATSILS", "Legal Aid", "Community Legal Centre" → legal_service
  - "Foundation", "Trust", "Philanthropy" — if a GIVING body (not a service org with "Foundation" in the name) → funder
  - Community-controlled Aboriginal NFP delivering programs to young people → primary_frontline
  - Generalist large NFPs (Mission Australia, Save the Children) without primary YJ stream named → peak_body or other
  - When in doubt between peak_body and primary_frontline: if the org is a STATE-WIDE peak, peak_body. If it delivers to actual young people, primary_frontline.

IS_YJ_RELEVANT:
  - true if the meeting is about youth justice policy, programs, individual cases, or governance of YJ systems
  - false if the meeting is about a different portfolio area that shares a minister (e.g. domestic violence prevention) and has no YJ content

CONFIDENCE:
  0.9+ — clear single signal
  0.7-0.89 — clear with minor ambiguity
  <0.7 — genuinely ambiguous, flag for human review

Return a JSON array matching input order. Each element: {"sector":"government","yj":true,"conf":0.95,"why":"<= 15 words"}.
Keep "why" to 15 words or fewer. No newlines inside strings. Output the array and nothing else.`;

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

async function classifyBatch(diaries) {
  const userPrompt = diaries
    .map((d, i) => {
      const portfolio = (d.portfolio || '').slice(0, 120);
      const org = (d.organisation || d.who_met || '').slice(0, 250);
      const purpose = (d.purpose || '').slice(0, 150);
      return `${i + 1}. minister=${d.minister_name || '?'}, portfolio="${portfolio}", date=${d.meeting_date}, met="${org}", purpose="${purpose}"`;
    })
    .join('\n');

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Classify these ${diaries.length} meetings. Return ONLY a JSON array with exactly ${diaries.length} objects.\n\n${userPrompt}` },
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
        if (res.status === 429) {
          console.log('  Rate limited, waiting 30s...');
          await sleep(30000);
          continue;
        }
        throw new Error(`Gemini ${res.status}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const parsed = parseJsonArray(content, diaries.length);
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
  return diaries.map(() => ({ sector: 'other', yj: null, conf: 0, why: 'classification failed' }));
}

async function fetchUniverse() {
  // YJ-relevant subset: keyword filter on organisation OR purpose.
  let query = supabase
    .from('civic_ministerial_diaries')
    .select('id, minister_name, portfolio, meeting_date, who_met, organisation, organisation_abn, purpose, meeting_type, linked_entity_id, jurisdiction')
    .or('organisation.ilike.%youth%,organisation.ilike.%detention%,organisation.ilike.%justice%,purpose.ilike.%youth%,purpose.ilike.%detention%,purpose.ilike.%justice%')
    .order('meeting_date', { ascending: false });

  if (LIMIT) query = query.limit(LIMIT);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function upsertProposal(diary, result) {
  const sector = VALID_SECTORS.includes(result.sector) ? result.sector : 'other';
  const isYj = result.yj === true || result.yj === 'true' || result.yj === null;
  const confidence = typeof result.conf === 'number' ? Math.max(0, Math.min(1, result.conf)) : 0;
  const evidence = (result.why || '').slice(0, 500);

  if (DRY_RUN) {
    console.log(`  [dry] ${diary.meeting_date} ${diary.minister_name} → ${sector} (${confidence}) ${isYj ? '' : '[NOT YJ]'}`);
    return;
  }

  const { error } = await supabase
    .from('civic_meeting_tags')
    .upsert(
      {
        diary_id: diary.id,
        is_yj_relevant: isYj,
        llm_proposed_sector: sector,
        llm_confidence: confidence,
        llm_evidence_snippet: evidence,
        llm_model: MODEL,
        llm_proposed_at: new Date().toISOString(),
      },
      { onConflict: 'diary_id', ignoreDuplicates: false },
    );

  if (error) console.error(`  Upsert failed for ${diary.id}: ${error.message}`);
}

async function main() {
  console.log('=== Civic Intelligence Meeting Tagger ===');
  console.log(DRY_RUN ? '(DRY RUN — no DB writes)' : '(LIVE — will write to civic_meeting_tags)');
  if (LIMIT) console.log(`Limit: ${LIMIT}`);

  const universe = await fetchUniverse();
  console.log(`\nUniverse: ${universe.length} YJ-relevant diary entries\n`);

  const counts = { sector: {}, lowConf: 0, notYj: 0 };

  for (let i = 0; i < universe.length; i += BATCH_SIZE) {
    const batch = universe.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(universe.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} meetings)...`);

    const results = await classifyBatch(batch);

    for (let j = 0; j < batch.length; j++) {
      const diary = batch[j];
      const result = results[j] || {};
      await upsertProposal(diary, result);

      counts.sector[result.sector] = (counts.sector[result.sector] || 0) + 1;
      if ((result.conf || 0) < 0.7) counts.lowConf++;
      if (result.yj === false) counts.notYj++;
    }

    if (i + BATCH_SIZE < universe.length) await sleep(1000);
  }

  console.log('\n=== Summary ===');
  console.log('Sector distribution:', counts.sector);
  console.log(`Low-confidence (<0.7): ${counts.lowConf}`);
  console.log(`LLM flagged as NOT YJ-relevant (review): ${counts.notYj}`);
  console.log(`\nNext: sweep /admin/civic/meeting-tagging to confirm tags.`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
