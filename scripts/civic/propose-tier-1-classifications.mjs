#!/usr/bin/env node
/**
 * Civic Intelligence v1 — Tier 1/2/3 + sector proposer.
 *
 * Universe: all `organizations` in NT or QLD linked by alma_interventions.operating_organization_id
 *           where verification_status != 'ai_generated' (~338 orgs on 2026-05-15).
 *
 * For each org, an LLM proposes:
 *   - tier (1, 2, 3)
 *   - sector_category (one of the 10 buckets from civic_org_classifications)
 *   - confidence (0..1)
 *   - evidence_snippet (one sentence justifying the call)
 *
 * Output written to civic_org_classifications with confirmed_at = null.
 * Re-running upserts on organization_id. Bulk human sweep in /admin/civic/tier-1-curation.
 *
 * Usage:
 *   node scripts/civic/propose-tier-1-classifications.mjs [--dry-run] [--limit N] [--only-state NT|QLD]
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
const STATE_ARG = process.argv.find((a) => a.startsWith('--only-state='));
const ONLY_STATE = STATE_ARG ? STATE_ARG.split('=')[1].toUpperCase() : null;

const BATCH_SIZE = 5;
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const VALID_SECTORS = [
  'primary_frontline', 'peak_body', 'consultancy', 'government',
  'research_academic', 'legal_service', 'advocacy', 'funder', 'media', 'other',
];

const SYSTEM_PROMPT = `You classify Australian organisations by their role in the youth justice ecosystem. You apply written definitions strictly.

TIER 1 — Primary frontline youth justice service.
  An Aboriginal community-controlled organisation, community-based not-for-profit, or small social-enterprise hybrid whose PRIMARY delivered service is one of: pre-court diversion, bail support, on-Country mentoring, post-release reintegration, family-led conferencing, legal first-response for under-eighteens.
  The organisation must employ frontline workers, hold relationships with young people, and operate in or adjacent to a community affected by youth criminalisation.

TIER 2 — Adjacent service.
  Peak bodies, statewide legal services, advocacy organisations, research centres that work alongside Tier 1 but do not carry the daily case load.

TIER 3 — System actors.
  Consultancies, government departments, large generalist NFPs without a primary YJ stream, funders, media.

SECTOR CATEGORIES (pick exactly one):
  primary_frontline — Tier 1 service delivery
  peak_body — industry/sector peak
  consultancy — paid advisory firm
  government — department or statutory agency
  research_academic — university, research institute
  legal_service — legal aid, ATSILS, community legal centre
  advocacy — advocacy/lobbying org without service delivery
  funder — philanthropic foundation or government grant body
  media — news org
  other — does not fit above

DECISION RULES:
  - Indigenous community-controlled org + youth/diversion/justice mention → almost certainly Tier 1 primary_frontline
  - "Legal Aid" / "ATSILS" / "Aboriginal Legal" in name → legal_service (could be Tier 1 if youth-specific, else Tier 2)
  - "Consulting" / "Advisory" / "Pty Ltd" without charity registration → consultancy, Tier 3
  - University, research centre → research_academic, Tier 2 or 3
  - Department, Commission, Minister → government, Tier 3
  - "Foundation" giving grants (not receiving) → funder, Tier 3
  - Large generalist NFP (e.g. Mission Australia, Save the Children) without a primary YJ stream named → Tier 2 unless clearly running primary frontline YJ service

CONFIDENCE GUIDE:
  0.9-1.0 — Multiple strong signals all point the same way (e.g. indigenous-flag + name contains "youth" + has diversion intervention)
  0.7-0.89 — Clear primary signal with no contradictions
  0.5-0.69 — Reasonable inference; would benefit from human review
  <0.5 — Genuinely ambiguous

Return a JSON array matching input order. Each element: {"tier":1|2|3,"sector":"primary_frontline","conf":0.85,"why":"<= 20 word evidence"}.
Keep "why" to 20 words or fewer. No nested objects. No newlines inside strings. Output the array and nothing else.`;

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

async function classifyBatch(orgs) {
  const userPrompt = orgs
    .map((o, i) => {
      const interventions = (o.interventions || []).slice(0, 5).map((i) => `${i.name} (${i.service_role || i.type || 'unknown'})`).join('; ') || 'none on file';
      return `${i + 1}. "${o.name}" — ABN ${o.abn || 'unknown'}, state ${o.state}, indigenous_org=${o.is_indigenous_org ? 'YES' : 'no'}, registry_sector=${o.gs_sector || 'unknown'}, description="${(o.description || '').slice(0, 200)}", interventions: ${interventions}`;
    })
    .join('\n');

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Classify these ${orgs.length} organisations against the Tier 1/2/3 + sector definitions. Return ONLY a JSON array with exactly ${orgs.length} objects.\n\n${userPrompt}` },
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
      const parsed = parseJsonArray(content, orgs.length);
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
  return orgs.map(() => ({ tier: null, sector: 'other', conf: 0, why: 'classification failed' }));
}

async function fetchUniverse() {
  // 1) Get all distinct YJ org IDs (verified interventions). Paginate to avoid PostgREST default cap.
  const yjOrgIdSet = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('operating_organization_id')
      .neq('verification_status', 'ai_generated')
      .not('operating_organization_id', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) yjOrgIdSet.add(r.operating_organization_id);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // 2) Fetch only those YJ org records, filtered by state. Chunk org IDs to keep IN() lists manageable.
  const states = ONLY_STATE ? [ONLY_STATE] : ['NT', 'QLD'];
  const orgIdsAll = Array.from(yjOrgIdSet);
  const orgs = [];
  for (let i = 0; i < orgIdsAll.length; i += 100) {
    const chunk = orgIdsAll.slice(i, i + 100);
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, abn, state, is_indigenous_org, description, gs_entity_id')
      .in('id', chunk)
      .in('state', states);
    if (error) throw error;
    orgs.push(...(data || []));
  }
  let finalOrgs = orgs;
  if (LIMIT) finalOrgs = finalOrgs.slice(0, LIMIT);

  // 3) Fetch interventions per org (chunked — keeps URL headers within limits).
  const orgIds = finalOrgs.map((o) => o.id);
  const interventionsByOrg = new Map();
  for (let i = 0; i < orgIds.length; i += 100) {
    const chunk = orgIds.slice(i, i + 100);
    const { data: ints, error: intErr } = await supabase
      .from('alma_interventions')
      .select('name, service_role, type, operating_organization_id, verification_status')
      .in('operating_organization_id', chunk)
      .neq('verification_status', 'ai_generated');
    if (intErr) throw intErr;
    for (const it of ints || []) {
      const arr = interventionsByOrg.get(it.operating_organization_id) || [];
      arr.push(it);
      interventionsByOrg.set(it.operating_organization_id, arr);
    }
  }

  // 4) Side-fetch gs_entities sectors.
  const entityIds = finalOrgs.map((o) => o.gs_entity_id).filter(Boolean);
  const sectorById = new Map();
  if (entityIds.length) {
    const { data: ents, error: entErr } = await supabase
      .from('gs_entities')
      .select('id, sector')
      .in('id', entityIds);
    if (entErr) console.warn(`  gs_entities lookup failed: ${entErr.message} (proceeding without sector)`);
    else for (const e of ents || []) sectorById.set(e.id, e.sector);
  }

  return finalOrgs.map((o) => ({
    ...o,
    gs_sector: sectorById.get(o.gs_entity_id) || null,
    interventions: interventionsByOrg.get(o.id) || [],
  }));
}

async function upsertProposal(org, result) {
  const tier = [1, 2, 3].includes(result.tier) ? result.tier : null;
  const sector = VALID_SECTORS.includes(result.sector) ? result.sector : 'other';
  const confidence = typeof result.conf === 'number' ? Math.max(0, Math.min(1, result.conf)) : 0;
  const evidence = (result.why || '').slice(0, 500);

  if (DRY_RUN) {
    console.log(`  [dry] ${org.name} → T${tier} / ${sector} (${confidence})`);
    return;
  }

  const { error } = await supabase
    .from('civic_org_classifications')
    .upsert(
      {
        organization_id: org.id,
        llm_proposed_tier: tier,
        llm_proposed_sector: sector,
        llm_confidence: confidence,
        llm_evidence_snippet: evidence,
        llm_model: MODEL,
        llm_proposed_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id', ignoreDuplicates: false },
    );

  if (error) {
    console.error(`  Upsert failed for ${org.name}: ${error.message}`);
    return;
  }
}

async function main() {
  console.log('=== Civic Intelligence Tier 1 Proposer ===');
  console.log(DRY_RUN ? '(DRY RUN — no DB writes)' : '(LIVE — will write to civic_org_classifications)');
  if (ONLY_STATE) console.log(`State filter: ${ONLY_STATE}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);

  const universe = await fetchUniverse();
  console.log(`\nUniverse: ${universe.length} orgs with verified YJ interventions in ${ONLY_STATE || 'NT+QLD'}\n`);

  const counts = { tier: { 1: 0, 2: 0, 3: 0, null: 0 }, sector: {}, lowConf: 0 };

  for (let i = 0; i < universe.length; i += BATCH_SIZE) {
    const batch = universe.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(universe.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} orgs)...`);

    const results = await classifyBatch(batch);

    for (let j = 0; j < batch.length; j++) {
      const org = batch[j];
      const result = results[j] || {};
      await upsertProposal(org, result);

      const tierKey = result.tier ?? 'null';
      counts.tier[tierKey] = (counts.tier[tierKey] || 0) + 1;
      counts.sector[result.sector] = (counts.sector[result.sector] || 0) + 1;
      if ((result.conf || 0) < 0.7) counts.lowConf++;
    }

    if (i + BATCH_SIZE < universe.length) await sleep(1000);
  }

  console.log('\n=== Summary ===');
  console.log('Tier distribution:', counts.tier);
  console.log('Sector distribution:', counts.sector);
  console.log(`Low-confidence (<0.7) needing closer review: ${counts.lowConf}`);
  console.log(`\nNext: sweep /admin/civic/tier-1-curation to confirm proposals.`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
