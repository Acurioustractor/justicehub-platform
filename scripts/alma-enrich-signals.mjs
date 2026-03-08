#!/usr/bin/env node
/**
 * ALMA Signal Field Enrichment
 *
 * Uses callLLM() to fill missing evidence_level, harm_risk_level,
 * and replication_readiness from intervention descriptions + context.
 * These fields directly feed portfolio score calculation.
 *
 * Usage:
 *   node scripts/alma-enrich-signals.mjs                # dry-run (first 5)
 *   node scripts/alma-enrich-signals.mjs --apply         # write to DB
 *   node scripts/alma-enrich-signals.mjs --apply --batch 50
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
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || (applyMode ? '50' : '5'));

let callLLM, parseJSON;

async function loadModules() {
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
}

// Valid enum values from DB constraints
const EVIDENCE_LEVELS = [
  'Untested (theory/pilot stage)',
  'Promising (community-endorsed, emerging evidence)',
  'Effective (strong evaluation, positive outcomes)',
  'Proven (RCT/quasi-experimental, replicated)',
  'Indigenous-led (culturally grounded, community authority)',
];

const HARM_RISK_LEVELS = ['Low', 'Medium', 'High', 'Requires cultural review'];

const REPLICATION_READINESS = [
  'Not ready (needs more development)',
  'Ready with support (requires adaptation guidance)',
  'Ready (playbook available)',
  'Community authority required',
];

function buildPrompt(interventions) {
  const batch = interventions.map((i, idx) => ({
    idx: idx + 1,
    name: i.name,
    type: i.type,
    description: (i.description || '').substring(0, 600),
    geography: i.geography,
    operating_organization: i.operating_organization,
    cultural_authority: i.cultural_authority,
    // Flag which fields are missing
    needs: {
      evidence_level: !i.evidence_level,
      harm_risk_level: !i.harm_risk_level,
      replication_readiness: !i.replication_readiness,
    },
  }));

  return `You are an expert in Australian youth justice programs and evidence-based practice.

For each intervention, assess the MISSING fields based on the description and context provided.

VALID VALUES:

evidence_level (choose one):
- "Untested (theory/pilot stage)" — new/pilot programs, no formal evaluation
- "Promising (community-endorsed, emerging evidence)" — community support, some positive signals
- "Effective (strong evaluation, positive outcomes)" — formal evaluation showing positive outcomes
- "Proven (RCT/quasi-experimental, replicated)" — rigorous research, replicated results
- "Indigenous-led (culturally grounded, community authority)" — led by Indigenous communities with cultural authority

harm_risk_level (choose one):
- "Low" — unlikely to cause harm, well-understood approach
- "Medium" — some risk factors, needs monitoring
- "High" — significant potential for harm if poorly implemented
- "Requires cultural review" — involves cultural practices/knowledge needing community authority

replication_readiness (choose one):
- "Not ready (needs more development)" — early stage, no replication framework
- "Ready with support (requires adaptation guidance)" — can be replicated with expert guidance
- "Ready (playbook available)" — documented, transferable methodology
- "Community authority required" — replication requires Indigenous community permission/leadership

GUIDELINES:
- If the intervention is Aboriginal/Indigenous community-led, consider "Indigenous-led" for evidence_level
- Programs working with cultural knowledge/practices should get "Requires cultural review" for harm_risk
- Government grant programs are typically "Untested" or "Promising" unless evaluation is mentioned
- Long-running programs (mentioned as established) are more likely "Promising" or "Effective"
- Only use "Proven" if RCT or quasi-experimental evidence is explicitly mentioned
- Only fill fields marked as needed (needs: true)

INTERVENTIONS:
${JSON.stringify(batch, null, 2)}

Return JSON:
{
  "results": [
    {
      "idx": 1,
      "evidence_level": "value or null if not needed",
      "harm_risk_level": "value or null if not needed",
      "replication_readiness": "value or null if not needed"
    }
  ]
}

Return ONLY valid JSON.`;
}

console.log('\n🔬 ALMA Signal Field Enrichment');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
console.log(`Batch size: ${batchSize}\n`);

async function main() {
  await loadModules();

  // Get interventions missing any signal field, paginate past 1000
  let allInterventions = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: page, error: pageErr } = await supabase
      .from('alma_interventions')
      .select('id, name, type, description, geography, operating_organization, cultural_authority, evidence_level, harm_risk_level, replication_readiness')
      .or('evidence_level.is.null,harm_risk_level.is.null,replication_readiness.is.null')
      .order('name')
      .range(from, from + pageSize - 1);
    if (pageErr) throw pageErr;
    if (!page || page.length === 0) break;
    allInterventions = allInterventions.concat(page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  const missingEvidence = allInterventions.filter((i) => !i.evidence_level).length;
  const missingHarm = allInterventions.filter((i) => !i.harm_risk_level).length;
  const missingReplication = allInterventions.filter((i) => !i.replication_readiness).length;

  console.log(`Interventions needing enrichment: ${allInterventions.length}`);
  console.log(`  Missing evidence_level: ${missingEvidence}`);
  console.log(`  Missing harm_risk_level: ${missingHarm}`);
  console.log(`  Missing replication_readiness: ${missingReplication}`);
  console.log(`Processing: ${Math.min(batchSize, allInterventions.length)}\n`);

  if (allInterventions.length === 0) {
    console.log('✅ All signal fields populated!');
    return;
  }

  const toProcess = allInterventions.slice(0, batchSize);
  let updated = 0;
  let llmCalls = 0;
  let errors = 0;

  // Process in sub-batches of 15
  const subBatchSize = 15;
  for (let i = 0; i < toProcess.length; i += subBatchSize) {
    const batch = toProcess.slice(i, i + subBatchSize);
    const batchNum = Math.floor(i / subBatchSize) + 1;
    const totalBatches = Math.ceil(toProcess.length / subBatchSize);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} interventions)...`);

    try {
      const prompt = buildPrompt(batch);
      const response = await callLLM(prompt, {
        maxTokens: 3000,
        temperature: 0.1,
        systemPrompt: 'You are an expert in Australian youth justice evidence assessment. Return only valid JSON.',
      });
      llmCalls++;

      const parsed = parseJSON(response);
      const results = parsed.results || parsed;

      if (!Array.isArray(results)) {
        console.warn('  ⚠️ Unexpected format, skipping batch');
        continue;
      }

      for (const result of results) {
        const idx = (result.idx || 0) - 1;
        if (idx < 0 || idx >= batch.length) continue;
        const intervention = batch[idx];
        const updates = {};

        // Validate and collect updates
        if (result.evidence_level && !intervention.evidence_level) {
          if (EVIDENCE_LEVELS.includes(result.evidence_level)) {
            updates.evidence_level = result.evidence_level;
          } else {
            // Fuzzy match
            const match = EVIDENCE_LEVELS.find(
              (v) => v.toLowerCase().includes(result.evidence_level.toLowerCase()) ||
                result.evidence_level.toLowerCase().includes(v.split(' (')[0].toLowerCase())
            );
            if (match) updates.evidence_level = match;
          }
        }

        if (result.harm_risk_level && !intervention.harm_risk_level) {
          if (HARM_RISK_LEVELS.includes(result.harm_risk_level)) {
            updates.harm_risk_level = result.harm_risk_level;
          } else {
            const match = HARM_RISK_LEVELS.find(
              (v) => v.toLowerCase() === result.harm_risk_level.toLowerCase()
            );
            if (match) updates.harm_risk_level = match;
          }
        }

        if (result.replication_readiness && !intervention.replication_readiness) {
          if (REPLICATION_READINESS.includes(result.replication_readiness)) {
            updates.replication_readiness = result.replication_readiness;
          } else {
            const match = REPLICATION_READINESS.find(
              (v) => v.toLowerCase().includes(result.replication_readiness.toLowerCase()) ||
                result.replication_readiness.toLowerCase().includes(v.split(' (')[0].toLowerCase())
            );
            if (match) updates.replication_readiness = match;
          }
        }

        if (Object.keys(updates).length === 0) continue;

        if (applyMode) {
          const { error: updateErr } = await supabase
            .from('alma_interventions')
            .update(updates)
            .eq('id', intervention.id);

          if (updateErr) {
            console.error(`  ✗ ${intervention.name.substring(0, 40)}: ${updateErr.message}`);
            errors++;
            continue;
          }
        }

        updated++;
        const fields = Object.keys(updates).join(', ');
        console.log(`  ✅ ${intervention.name.substring(0, 40)}... → ${fields}`);
      }
    } catch (err) {
      console.error(`  ✗ Batch ${batchNum} failed: ${err.message}`);
      errors++;
    }

    // Rate limit
    if (i + subBatchSize < toProcess.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Results');
  console.log('═'.repeat(60));
  console.log(`LLM calls: ${llmCalls}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
  if (!applyMode) {
    console.log('\n(dry-run — no changes written)');
    console.log('Run with --apply to write changes.');
  }
  console.log(`Remaining: ${allInterventions.length - toProcess.length}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
