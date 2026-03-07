#!/usr/bin/env node
/**
 * ALMA Outcomes Extraction
 *
 * Uses callLLM() rotation (Groq/Gemini free first) to extract
 * structured outcomes from intervention descriptions.
 *
 * Only targets interventions with descriptions > 200 chars
 * that have NO linked outcomes yet.
 *
 * Usage:
 *   node scripts/alma-extract-outcomes.mjs                # dry-run (first 5)
 *   node scripts/alma-extract-outcomes.mjs --apply         # write to DB
 *   node scripts/alma-extract-outcomes.mjs --apply --batch 50  # custom batch
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
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

// Set all env vars so callLLM() can find API keys
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || (applyMode ? '20' : '5'));

// Dynamic import of callLLM and parseJSON (ESM → TS via tsx)
let callLLM, parseJSON;

async function loadModules() {
  // We need to use dynamic import with tsx loader or compile
  // Since these are TS files, use a fetch-style approach with the LLM client directly
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
}

// Valid outcome types from DB schema
// Must match alma_outcomes_outcome_type_check constraint exactly
const OUTCOME_TYPES = [
  'Reduced detention/incarceration',
  'Reduced recidivism',
  'Diversion from justice system',
  'Educational engagement',
  'Employment/training',
  'Family connection',
  'Cultural connection',
  'Mental health/wellbeing',
  'Reduced substance use',
  'Community safety',
  'System cost reduction',
  'Healing/restoration',
];

// Map common LLM variations to valid types
const OUTCOME_TYPE_ALIASES = {
  'family reunification': 'Family connection',
  'family strengthening': 'Family connection',
  'housing stability': 'Housing stability', // no match — map to closest
  'substance use reduction': 'Reduced substance use',
  'community engagement': 'Community safety',
  'reduced reoffending': 'Reduced recidivism',
  'cultural identity': 'Cultural connection',
  'healing': 'Healing/restoration',
  'restoration': 'Healing/restoration',
  'cost reduction': 'System cost reduction',
  'cost savings': 'System cost reduction',
};

function buildPrompt(interventions) {
  const batch = interventions.map((i, idx) => ({
    idx: idx + 1,
    name: i.name,
    type: i.type,
    description: (i.description || '').substring(0, 800),
    geography: i.geography,
    target_cohort: i.target_cohort,
  }));

  return `You are an expert in Australian youth justice programs. Extract outcomes from these intervention descriptions.

For each intervention, identify 1-4 outcomes that are explicitly or strongly implied by the description.

VALID OUTCOME TYPES (use exactly):
${OUTCOME_TYPES.map((t) => `- "${t}"`).join('\n')}

INTERVENTIONS:
${JSON.stringify(batch, null, 2)}

Return a JSON object with this structure:
{
  "results": [
    {
      "idx": 1,
      "outcomes": [
        {
          "name": "Short descriptive name of specific outcome",
          "outcome_type": "One of the valid types above",
          "description": "1-2 sentence description of the outcome",
          "measurement_method": "How this could be measured (optional)",
          "time_horizon": "Immediate (<6 months)" | "Short-term (6-12 months)" | "Medium-term (1-3 years)" | "Long-term (3+ years)",
          "beneficiary": "Young person" | "Family" | "Community" | "System/Government"
        }
      ]
    }
  ]
}

RULES:
- Only extract outcomes supported by the description text
- Do NOT invent outcomes not implied by the description
- Use exact outcome_type strings from the list above
- Each outcome needs a unique, specific name (not just the type)
- Return ONLY valid JSON, no markdown or explanation`;
}

console.log('\n🎯 ALMA Outcomes Extraction');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
console.log(`Batch size: ${batchSize}\n`);

async function main() {
  await loadModules();

  // Get interventions with descriptions that have NO outcomes
  const { data: allInterventions, error: intErr } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, geography, target_cohort');
  if (intErr) throw intErr;

  // Get existing outcome links
  const { data: existingLinks, error: linkErr } = await supabase
    .from('alma_intervention_outcomes')
    .select('intervention_id');
  if (linkErr) throw linkErr;

  const hasOutcome = new Set((existingLinks || []).map((l) => l.intervention_id));

  // Filter: description > 200 chars AND no outcomes yet
  const candidates = allInterventions.filter(
    (i) =>
      i.description &&
      i.description.length > 200 &&
      !hasOutcome.has(i.id)
  );

  console.log(`Total interventions: ${allInterventions.length}`);
  console.log(`Already have outcomes: ${hasOutcome.size}`);
  console.log(`Candidates (desc > 200 chars, no outcomes): ${candidates.length}`);
  console.log(`Processing: ${Math.min(batchSize, candidates.length)}\n`);

  if (candidates.length === 0) {
    console.log('✅ No candidates to process!');
    return;
  }

  const toProcess = candidates.slice(0, batchSize);
  let totalOutcomesCreated = 0;
  let totalLinksCreated = 0;
  let llmCalls = 0;

  // Process in sub-batches of 10 for LLM
  const subBatchSize = 10;
  for (let i = 0; i < toProcess.length; i += subBatchSize) {
    const batch = toProcess.slice(i, i + subBatchSize);
    const batchNum = Math.floor(i / subBatchSize) + 1;
    const totalBatches = Math.ceil(toProcess.length / subBatchSize);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} interventions)...`);

    try {
      const prompt = buildPrompt(batch);
      const response = await callLLM(prompt, {
        maxTokens: 4096,
        temperature: 0.2,
        systemPrompt: 'You are an expert in Australian youth justice. Extract structured outcomes from intervention descriptions. Return only valid JSON.',
      });
      llmCalls++;

      const parsed = parseJSON(response);
      const results = parsed.results || parsed;

      if (!Array.isArray(results)) {
        console.warn('  ⚠️ Unexpected response format, skipping batch');
        continue;
      }

      for (const result of results) {
        const idx = (result.idx || 0) - 1;
        if (idx < 0 || idx >= batch.length) continue;
        const intervention = batch[idx];
        const outcomes = result.outcomes || [];

        for (const outcome of outcomes) {
          if (!outcome.name || !outcome.outcome_type) continue;

          // Validate outcome_type
          if (!OUTCOME_TYPES.includes(outcome.outcome_type)) {
            // Try alias map first
            const aliasKey = Object.keys(OUTCOME_TYPE_ALIASES).find(
              (k) => outcome.outcome_type.toLowerCase().includes(k) || k.includes(outcome.outcome_type.toLowerCase())
            );
            if (aliasKey) {
              outcome.outcome_type = OUTCOME_TYPE_ALIASES[aliasKey];
            } else {
              // Try fuzzy match against valid types
              const closest = OUTCOME_TYPES.find(
                (t) => t.toLowerCase().includes(outcome.outcome_type.toLowerCase()) ||
                  outcome.outcome_type.toLowerCase().includes(t.toLowerCase())
              );
              if (closest) {
                outcome.outcome_type = closest;
              } else {
                console.warn(`  ⚠️ Invalid outcome_type "${outcome.outcome_type}" — skipping`);
                continue;
              }
            }
          }

          if (applyMode) {
            // Check if this outcome already exists (by name + type)
            const { data: existing } = await supabase
              .from('alma_outcomes')
              .select('id')
              .eq('name', outcome.name)
              .eq('outcome_type', outcome.outcome_type)
              .limit(1);

            let outcomeId;
            if (existing && existing.length > 0) {
              outcomeId = existing[0].id;
            } else {
              // Create new outcome
              const { data: newOutcome, error: createErr } = await supabase
                .from('alma_outcomes')
                .insert({
                  name: outcome.name,
                  outcome_type: outcome.outcome_type,
                  description: outcome.description || null,
                  measurement_method: outcome.measurement_method || null,
                  time_horizon: outcome.time_horizon || null,
                  beneficiary: outcome.beneficiary || 'Young person',
                })
                .select('id')
                .single();

              if (createErr) {
                console.error(`    ✗ Create outcome: ${createErr.message}`);
                continue;
              }
              outcomeId = newOutcome.id;
              totalOutcomesCreated++;
            }

            // Link to intervention
            const { error: linkErr } = await supabase
              .from('alma_intervention_outcomes')
              .insert({
                intervention_id: intervention.id,
                outcome_id: outcomeId,
              });

            if (linkErr) {
              if (linkErr.code !== '23505') {
                console.error(`    ✗ Link: ${linkErr.message}`);
              }
            } else {
              totalLinksCreated++;
            }
          }

          console.log(`  ✅ ${intervention.name.substring(0, 30)}... → ${outcome.name} (${outcome.outcome_type})`);
        }
      }
    } catch (err) {
      console.error(`  ✗ Batch ${batchNum} failed: ${err.message}`);
    }

    // Rate limit between sub-batches
    if (i + subBatchSize < toProcess.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Results');
  console.log('═'.repeat(60));
  console.log(`LLM calls: ${llmCalls}`);
  if (applyMode) {
    console.log(`New outcomes created: ${totalOutcomesCreated}`);
    console.log(`New links created: ${totalLinksCreated}`);
  } else {
    console.log('(dry-run — no changes written)');
    console.log('\nRun with --apply to write changes.');
  }
  console.log(`Remaining candidates: ${candidates.length - toProcess.length}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
