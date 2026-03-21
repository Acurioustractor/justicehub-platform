#!/usr/bin/env node
/**
 * Classify all alma_interventions for youth justice relevance.
 *
 * Adds:
 *   - serves_youth_justice (boolean): does this specifically serve young people in/at risk of justice system?
 *   - service_role (text): diversion | bail_support | post_release | residential_therapeutic |
 *                          family_support | legal_aid | community_program | justice_reinvestment |
 *                          prevention | other
 *   - estimated_annual_capacity (integer): rough number of young people served per year
 *
 * Uses Gemini 2.5 Flash (free tier) in batches of 20.
 * Cost: ~$0 (free tier) or <$1 if quota exceeded and falls back to paid.
 *
 * Usage: node scripts/classify-interventions-yj.mjs [--dry-run]
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
const BATCH_SIZE = 10;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;

const VALID_ROLES = [
  'diversion', 'bail_support', 'post_release', 'residential_therapeutic',
  'family_support', 'legal_aid', 'community_program', 'justice_reinvestment',
  'prevention', 'other'
];

const SYSTEM_PROMPT = `You are an Australian youth justice policy expert. You will classify community services and interventions.

For each intervention, determine:

1. **serves_youth_justice** (true/false): Does this organisation or program SPECIFICALLY work with young people (under 25) who are:
   - In detention or youth justice supervision
   - At risk of entering the justice system
   - On bail, diversion, or community orders
   - Exiting detention (post-release support)
   - Involved in youth justice conferencing

   Answer TRUE if the program's primary or significant purpose involves youth justice.
   Answer FALSE if it's general health, aged care, disability, education-only, or adult services that don't specifically target justice-involved youth.

   When in doubt: if the name contains "youth" AND relates to justice/diversion/bail/detention/community orders, it's TRUE.
   Aboriginal community organisations that work with at-risk youth = TRUE.
   General Aboriginal health services without youth justice focus = FALSE.

2. **service_role** (one of: diversion, bail_support, post_release, residential_therapeutic, family_support, legal_aid, community_program, justice_reinvestment, prevention, other):
   - diversion: pre-court programs, cautioning, conferencing, police diversion
   - bail_support: bail accommodation, bail supervision, supported bail
   - post_release: transition from detention, reintegration, throughcare
   - residential_therapeutic: therapeutic residential care, out-of-home care for justice youth
   - family_support: family counselling, family group conferencing, parenting programs for justice families
   - legal_aid: legal representation, Aboriginal legal services, youth legal advice
   - community_program: community-based supervision, mentoring, sport/recreation for at-risk youth, cultural programs
   - justice_reinvestment: justice reinvestment initiatives, place-based justice programs
   - prevention: early intervention, school-based programs, anti-social behaviour prevention
   - other: doesn't fit above categories

3. **estimated_annual_capacity** (integer): Rough estimate of how many young people this program serves per year.
   - Large state-wide legal aid: 5000-20000
   - Major NGO (Life Without Barriers, yourtown): 1000-5000
   - Regional community org: 50-500
   - Small local program: 10-100
   - If truly unknown, estimate 100 as default for small orgs, 500 for medium, 2000 for large

Respond with a JSON array matching the input order. Each element: {"yj": true/false, "role": "...", "cap": number}`;

// ── JSON Parser (robust) ─────────────────────────────────────

function parseJsonResponse(content, expectedLength) {
  // Strip think blocks and markdown fences
  let str = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // If wrapped in { "results": [...] } or similar, extract the array
  try {
    const obj = JSON.parse(str);
    if (Array.isArray(obj)) {
      return obj.length === expectedLength ? obj : null;
    }
    // Look for any array property
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length === expectedLength) return val;
    }
    return null;
  } catch {
    // Try to extract JSON array from the text
  }

  // Find the array in the text
  const arrayMatch = str.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return null;

  str = arrayMatch[0];

  // Fix common issues: trailing commas, single quotes
  str = str.replace(/,\s*([}\]])/g, '$1');
  str = str.replace(/'/g, '"');
  // Remove comments
  str = str.replace(/\/\/[^\n]*/g, '');

  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) && arr.length === expectedLength ? arr : null;
  } catch {
    // Last resort: try to extract individual objects
    const objects = [];
    const objRegex = /\{[^{}]*\}/g;
    let match;
    while ((match = objRegex.exec(str)) !== null) {
      try {
        objects.push(JSON.parse(match[0]));
      } catch {
        // skip malformed object
      }
    }
    return objects.length === expectedLength ? objects : null;
  }
}

// ── Gemini API call ──────────────────────────────────────────

async function classifyBatch(interventions) {
  const prompt = interventions.map((int, i) =>
    `${i + 1}. "${int.name}" by "${int.operating_organization || 'Unknown'}" — type: ${int.type || 'Unknown'}, description: ${(int.description || '').substring(0, 150)}, target: ${int.target_cohort || 'Unknown'}, geography: ${int.geography || 'Unknown'}`
  ).join('\n');

  const body = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Classify these ${interventions.length} interventions. Return ONLY a JSON array with exactly ${interventions.length} objects, each like {"yj":true,"role":"diversion","cap":200}. No comments, no trailing commas, no extra text.\n\n${prompt}` }
    ],
    temperature: 0.1,
    max_tokens: 8192,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  Gemini ${res.status}: ${errText.substring(0, 200)}`);
        if (res.status === 429) {
          console.log('  Rate limited, waiting 30s...');
          await sleep(30000);
          continue;
        }
        throw new Error(`Gemini ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Robust JSON extraction
      const parsed = parseJsonResponse(content, interventions.length);
      if (!parsed) {
        console.error(`  Failed to parse response (${content.length} chars). First 200:`, content.substring(0, 200));
        continue;
      }

      return parsed;
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < 2) await sleep(5000);
    }
  }

  // Fallback: return unknowns
  return interventions.map(() => ({ yj: null, role: 'other', cap: null }));
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('=== Youth Justice Intervention Classifier ===');
  console.log(DRY_RUN ? '(DRY RUN — no DB writes)' : '(LIVE — will update DB)');

  // Fetch all interventions
  const { data: all, error } = await supabase
    .from('alma_interventions')
    .select('id, name, operating_organization, type, description, target_cohort, geography')
    .neq('verification_status', 'ai_generated')
    .order('id');

  if (error) throw error;
  console.log(`\nFetched ${all.length} interventions to classify\n`);

  let classified = 0;
  let yjTrue = 0;
  let yjFalse = 0;
  const roleCounts = {};

  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(all.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} interventions)...`);

    const results = await classifyBatch(batch);

    // Update each intervention
    for (let j = 0; j < batch.length; j++) {
      const int = batch[j];
      const res = results[j];

      const servesYJ = res.yj === true || res.yj === 'true';
      const role = VALID_ROLES.includes(res.role) ? res.role : 'other';
      const cap = typeof res.cap === 'number' && res.cap > 0 ? Math.round(res.cap) : null;

      if (servesYJ) yjTrue++;
      else yjFalse++;
      roleCounts[role] = (roleCounts[role] || 0) + 1;

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from('alma_interventions')
          .update({
            serves_youth_justice: servesYJ,
            service_role: role,
            estimated_annual_capacity: cap,
          })
          .eq('id', int.id);

        if (updateErr) {
          console.error(`  Error updating ${int.name}:`, updateErr.message);
        }
      }

      classified++;
    }

    // Rate limit: ~2 requests per second for free tier
    if (i + BATCH_SIZE < all.length) {
      await sleep(1500);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Total classified: ${classified}`);
  console.log(`Youth Justice: ${yjTrue} (${Math.round(yjTrue / classified * 100)}%)`);
  console.log(`Not Youth Justice: ${yjFalse} (${Math.round(yjFalse / classified * 100)}%)`);
  console.log('\nService Roles:');
  for (const [role, count] of Object.entries(roleCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${role}: ${count}`);
  }

  if (DRY_RUN) {
    console.log('\n(DRY RUN — no changes written to DB)');
  } else {
    console.log('\nAll interventions classified and updated in DB!');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
