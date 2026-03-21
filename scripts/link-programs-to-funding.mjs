#!/usr/bin/env node
/**
 * link-programs-to-funding.mjs
 *
 * Matches government programs → funding records → interventions.
 * Three-stage linkage:
 *   1. Program → Funding (fuzzy match on program_name)
 *   2. Funding → Intervention (populate justice_funding.alma_intervention_id)
 *   3. Program → Intervention (junction table alma_program_interventions)
 *
 * Usage:
 *   node scripts/link-programs-to-funding.mjs                    # dry-run all states
 *   node scripts/link-programs-to-funding.mjs --apply             # write to DB
 *   node scripts/link-programs-to-funding.mjs --apply --state=QLD # QLD only
 *   node scripts/link-programs-to-funding.mjs --apply --llm       # use LLM for ambiguous matches
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── ENV ──────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch { /* ignore */ }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const useLLM = args.includes('--llm');
const stateArg = args.find((a) => a.startsWith('--state='))?.split('=')[1]?.toUpperCase();

const stats = {
  programToFunding: { linked: 0, skipped: 0 },
  fundingToIntervention: { linked: 0, skipped: 0 },
  programToIntervention: { linked: 0, skipped: 0 },
  llmCalls: 0,
};

// ── LLM (optional, for ambiguous matches) ─────────────────────────

const PROVIDERS = [
  { name: 'groq', key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
];

async function callLLM(prompt) {
  stats.llmCalls++;
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: 'You match Australian youth justice program names. Return JSON only.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch { continue; }
  }
  return null;
}

// ── NORMALIZATION ────────────────────────────────────────────────────

function normalize(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|and|of|for|in|to|a|an)\b/g, '')
    .replace(/\b(program|programme|project|initiative|scheme|service|services)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1.0;

  // Token overlap (Jaccard)
  const tokensA = new Set(na.split(' '));
  const tokensB = new Set(nb.split(' '));
  const intersection = [...tokensA].filter((t) => tokensB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  const jaccard = intersection.length / union.size;

  // Substring containment bonus
  let containment = 0;
  if (na.includes(nb) || nb.includes(na)) containment = 0.3;

  return Math.min(1.0, jaccard + containment);
}

// ── STAGE 1: Program → Funding ──────────────────────────────────────

async function linkProgramsToFunding() {
  console.log('\n── Stage 1: Program → Funding ──');

  const filter = supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction, budget_amount');
  if (stateArg) filter.eq('jurisdiction', stateArg);
  const { data: programs } = await filter;

  if (!programs?.length) {
    console.log('  No programs found');
    return;
  }

  console.log(`  ${programs.length} programs to match`);

  // Get distinct funding program names for matching
  const fundingFilter = supabase
    .from('justice_funding')
    .select('id, program_name, state, amount_dollars')
    .not('program_name', 'is', null);
  if (stateArg) fundingFilter.eq('state', stateArg);
  const { data: fundingRecords } = await fundingFilter.limit(5000);

  if (!fundingRecords?.length) {
    console.log('  No funding records found');
    return;
  }

  // Build lookup of normalized funding names
  const fundingByNorm = new Map();
  for (const f of fundingRecords) {
    const norm = normalize(f.program_name);
    if (!fundingByNorm.has(norm)) fundingByNorm.set(norm, []);
    fundingByNorm.get(norm).push(f);
  }

  for (const prog of programs) {
    const normProg = normalize(prog.name);

    // Exact normalized match
    if (fundingByNorm.has(normProg)) {
      const matches = fundingByNorm.get(normProg);
      console.log(`  [EXACT] ${prog.name} → ${matches.length} funding records`);
      stats.programToFunding.linked++;
      continue;
    }

    // Fuzzy match — find best
    let bestScore = 0;
    let bestName = null;
    for (const [norm, records] of fundingByNorm) {
      const score = similarity(prog.name, records[0].program_name);
      if (score > bestScore) {
        bestScore = score;
        bestName = records[0].program_name;
      }
    }

    if (bestScore >= 0.6) {
      console.log(`  [FUZZY ${bestScore.toFixed(2)}] ${prog.name} → ${bestName}`);
      stats.programToFunding.linked++;
    } else if (useLLM && bestScore >= 0.3 && bestName) {
      // LLM disambiguation
      const prompt = `Are these the same youth justice program? Answer JSON: {"match": true/false, "confidence": 0.0-1.0}
Program A: "${prog.name}" (${prog.jurisdiction})
Program B: "${bestName}"`;
      const raw = await callLLM(prompt);
      try {
        const result = JSON.parse(raw);
        if (result?.match && result?.confidence > 0.7) {
          console.log(`  [LLM ✓] ${prog.name} → ${bestName} (${result.confidence})`);
          stats.programToFunding.linked++;
        } else {
          console.log(`  [LLM ✗] ${prog.name} — no match`);
          stats.programToFunding.skipped++;
        }
      } catch {
        stats.programToFunding.skipped++;
      }
    } else {
      stats.programToFunding.skipped++;
    }
  }
}

// ── STAGE 2: Funding → Intervention ─────────────────────────────────

async function linkFundingToInterventions() {
  console.log('\n── Stage 2: Funding → Intervention ──');

  // Get unlinked funding records with program names
  const filter = supabase
    .from('justice_funding')
    .select('id, program_name, state')
    .is('alma_intervention_id', null)
    .not('program_name', 'is', null);
  if (stateArg) filter.eq('state', stateArg);
  const { data: unlinked } = await filter.limit(2000);

  if (!unlinked?.length) {
    console.log('  No unlinked funding records');
    return;
  }

  console.log(`  ${unlinked.length} unlinked funding records`);

  // Get all interventions for matching
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, operating_organization')
    .neq('verification_status', 'ai_generated')
    .limit(2000);

  if (!interventions?.length) {
    console.log('  No interventions found');
    return;
  }

  // Build normalized intervention lookup
  const interventionsByNorm = new Map();
  for (const i of interventions) {
    const norm = normalize(i.name);
    interventionsByNorm.set(norm, i);
  }

  let linked = 0;
  const updates = [];

  // Get distinct program names to avoid re-matching
  const distinctNames = [...new Set(unlinked.map((f) => f.program_name))];
  console.log(`  ${distinctNames.length} distinct program names to match`);

  for (const programName of distinctNames) {
    const normName = normalize(programName);

    // Exact
    if (interventionsByNorm.has(normName)) {
      const intervention = interventionsByNorm.get(normName);
      const matchingFunding = unlinked.filter((f) => f.program_name === programName);
      for (const f of matchingFunding) {
        updates.push({ id: f.id, alma_intervention_id: intervention.id });
      }
      console.log(`  [EXACT] ${programName} → ${intervention.name} (${matchingFunding.length} records)`);
      linked += matchingFunding.length;
      continue;
    }

    // Fuzzy
    let bestScore = 0;
    let bestIntervention = null;
    for (const [, intervention] of interventionsByNorm) {
      const score = similarity(programName, intervention.name);
      if (score > bestScore) {
        bestScore = score;
        bestIntervention = intervention;
      }
    }

    if (bestScore >= 0.6 && bestIntervention) {
      const matchingFunding = unlinked.filter((f) => f.program_name === programName);
      for (const f of matchingFunding) {
        updates.push({ id: f.id, alma_intervention_id: bestIntervention.id });
      }
      console.log(`  [FUZZY ${bestScore.toFixed(2)}] ${programName} → ${bestIntervention.name} (${matchingFunding.length} records)`);
      linked += matchingFunding.length;
    }
  }

  console.log(`  Total linkable: ${linked} records`);

  if (applyMode && updates.length > 0) {
    // Batch update in chunks of 100
    for (let i = 0; i < updates.length; i += 100) {
      const chunk = updates.slice(i, i + 100);
      for (const upd of chunk) {
        const { error } = await supabase
          .from('justice_funding')
          .update({ alma_intervention_id: upd.alma_intervention_id })
          .eq('id', upd.id);
        if (error) {
          console.log(`  [ERROR] Update ${upd.id}: ${error.message}`);
        }
      }
      console.log(`  Updated ${Math.min(i + 100, updates.length)}/${updates.length}`);
    }
    stats.fundingToIntervention.linked = linked;
  } else {
    stats.fundingToIntervention.linked = linked;
    if (!applyMode) console.log('  [DRY RUN] No updates written');
  }
}

// ── STAGE 3: Program → Intervention (junction) ─────────────────────

async function linkProgramsToInterventions() {
  console.log('\n── Stage 3: Program → Intervention (junction) ──');

  const filter = supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction');
  if (stateArg) filter.eq('jurisdiction', stateArg);
  const { data: programs } = await filter;

  if (!programs?.length) {
    console.log('  No programs found');
    return;
  }

  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name')
    .neq('verification_status', 'ai_generated')
    .limit(2000);

  if (!interventions?.length) {
    console.log('  No interventions found');
    return;
  }

  // Check existing links
  const { data: existingLinks } = await supabase
    .from('alma_program_interventions')
    .select('program_id, intervention_id');
  const linkedSet = new Set((existingLinks || []).map((l) => `${l.program_id}:${l.intervention_id}`));

  const interventionsByNorm = new Map();
  for (const i of interventions) {
    interventionsByNorm.set(normalize(i.name), i);
  }

  for (const prog of programs) {
    const normProg = normalize(prog.name);

    // Find matching intervention
    let bestScore = 0;
    let bestIntervention = null;

    for (const [norm, intervention] of interventionsByNorm) {
      const score = similarity(prog.name, intervention.name);
      if (score > bestScore) {
        bestScore = score;
        bestIntervention = intervention;
      }
    }

    if (bestScore >= 0.5 && bestIntervention) {
      const key = `${prog.id}:${bestIntervention.id}`;
      if (linkedSet.has(key)) {
        stats.programToIntervention.skipped++;
        continue;
      }

      if (applyMode) {
        const { error } = await supabase.from('alma_program_interventions').insert({
          program_id: prog.id,
          intervention_id: bestIntervention.id,
          relationship: 'implements',
        });
        if (error && error.code !== '23505') {
          console.log(`  [ERROR] ${error.message}`);
        } else {
          console.log(`  [LINK] ${prog.name} → ${bestIntervention.name} (implements)`);
          stats.programToIntervention.linked++;
        }
      } else {
        console.log(`  [DRY] ${prog.name} → ${bestIntervention.name} (${bestScore.toFixed(2)})`);
        stats.programToIntervention.linked++;
      }
    } else {
      stats.programToIntervention.skipped++;
    }
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Program → Funding → Intervention Linkage               ║`);
  console.log(`║  Mode: ${(applyMode ? 'APPLY' : 'DRY RUN').padEnd(49)}║`);
  if (stateArg) console.log(`║  State: ${stateArg.padEnd(48)}║`);
  console.log(`║  LLM assist: ${String(useLLM).padEnd(43)}║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);

  await linkProgramsToFunding();
  await linkFundingToInterventions();
  await linkProgramsToInterventions();

  console.log(`\n── Summary ──`);
  console.log(`  Program → Funding:       ${stats.programToFunding.linked} linked, ${stats.programToFunding.skipped} skipped`);
  console.log(`  Funding → Intervention:  ${stats.fundingToIntervention.linked} linked, ${stats.fundingToIntervention.skipped} skipped`);
  console.log(`  Program → Intervention:  ${stats.programToIntervention.linked} linked, ${stats.programToIntervention.skipped} skipped`);
  if (useLLM) console.log(`  LLM calls: ${stats.llmCalls}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
