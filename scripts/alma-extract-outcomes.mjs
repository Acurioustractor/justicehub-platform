#!/usr/bin/env node
/**
 * ALMA Outcomes Extraction v2
 *
 * Extracts measurable outcomes from intervention descriptions.
 * Quality controls:
 * - No "Unnamed outcome" or generic placeholders
 * - Requires specific outcome_type from approved list
 * - Requires measurement method description
 * - Only processes interventions with 50+ char descriptions
 *
 * Usage:
 *   node scripts/alma-extract-outcomes.mjs              # dry-run (20 interventions)
 *   node scripts/alma-extract-outcomes.mjs --apply       # write to DB
 *   node scripts/alma-extract-outcomes.mjs --apply --batch 100
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
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '20');

const OUTCOME_TYPES = [
  'Reduced recidivism',
  'Educational engagement',
  'Community safety',
  'Mental health/wellbeing',
  'Diversion from justice system',
  'Reduced detention/incarceration',
  'Cultural connection',
  'Family connection',
  'Employment/training',
  'Reduced substance use',
  'System cost reduction',
  'Healing/restoration',
];

const PROVIDERS = [
  { name: 'openai', key: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  { name: 'groq', key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { name: 'minimax', key: env.MINIMAX_API_KEY, url: 'https://api.minimaxi.chat/v1/chat/completions', model: 'MiniMax-M2.5' },
];

async function callLLM(prompt, { maxTokens = 3000 } = {}) {
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.1,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`  [${provider.name}] ${res.status}: ${errText.substring(0, 100)}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch (err) {
      console.error(`  [${provider.name}] error: ${err.message}`);
      continue;
    }
  }
  console.error('  All providers failed');
  throw new Error('All LLM providers failed');
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) try { return JSON.parse(match[1]); } catch {}
  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) try { return JSON.parse(jsonMatch[1]); } catch {}
  return null;
}

async function extractOutcomesBatch(interventions) {
  const prompt = `You are an Australian youth justice researcher extracting MEASURABLE OUTCOMES from program descriptions.

RULES:
- Only extract outcomes that are CLEARLY supported by the description
- Each outcome MUST have a specific, measurable description (not generic)
- Each outcome MUST have a measurement method
- outcome_type MUST be one of: ${OUTCOME_TYPES.join(', ')}
- Do NOT invent outcomes not mentioned in the description
- If no outcomes are identifiable, return empty outcomes array
- Quality > quantity: 1-3 strong outcomes is better than 5 weak ones

INTERVENTIONS:
${interventions.map((i, idx) => `[${idx + 1}] "${i.name}" (${i.type})
  Org: ${i.operating_organization || 'unknown'}
  Description: ${(i.description || '').substring(0, 400)}`).join('\n\n')}

For each intervention, return outcomes with:
- name: Short, specific outcome name (3-10 words, e.g. "Reduction in youth reoffending rates")
- outcome_type: One of the types listed above
- measurement: How this is measured (e.g. "Pre/post recidivism data from justice system records over 12 months")

Return JSON:
{
  "results": [
    { "idx": 1, "outcomes": [{ "name": "...", "outcome_type": "...", "measurement": "..." }] }
  ]
}`;

  try {
    const raw = await callLLM(prompt, { maxTokens: 3000 });
    const parsed = extractJSON(raw);
    if (!parsed) console.error(`\n  JSON parse failed. Raw length: ${raw.length}. Last 50: ${raw.substring(raw.length - 50)}`);
    else if (!parsed.results) console.error(`\n  No 'results' key. Keys: ${Object.keys(parsed).join(', ')}. Sample: ${JSON.stringify(parsed).substring(0, 200)}`);
    return parsed;
  } catch (err) {
    console.error(`\n  LLM call failed: ${err.message}`);
    return null;
  }
}

function isValidOutcome(outcome) {
  if (!outcome.name || outcome.name.length < 5) return false;
  if (!outcome.measurement || outcome.measurement.length < 10) return false;
  if (!OUTCOME_TYPES.includes(outcome.outcome_type)) return false;
  const rejects = ['unnamed', 'unknown', 'n/a', 'none', 'tbd', 'outcome 1', 'general'];
  if (rejects.some(r => outcome.name.toLowerCase().includes(r))) return false;
  return true;
}

async function main() {
  console.log('ALMA Outcomes Extraction v2');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Batch size: ${batchSize}\n`);

  const { data: existingOutcomeLinks } = await supabase
    .from('alma_intervention_outcomes')
    .select('intervention_id');
  const hasOutcomes = new Set((existingOutcomeLinks || []).map(r => r.intervention_id));

  const allCandidates = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('alma_interventions')
      .select('id, name, type, operating_organization, description')
      .neq('verification_status', 'ai_generated')
      .not('description', 'is', null)
      .range(from, from + 999);
    if (!data?.length) break;
    allCandidates.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const candidates = allCandidates
    .filter(c => !hasOutcomes.has(c.id) && (c.description?.length || 0) >= 50)
    .slice(0, batchSize);

  console.log(`Total visible: ${allCandidates.length}`);
  console.log(`Already have outcomes: ${hasOutcomes.size}`);
  console.log(`Candidates: ${candidates.length}\n`);

  if (!candidates.length) { console.log('No candidates.'); return; }

  const results = { outcomes_extracted: 0, outcome_links: 0, processed: 0, with_outcomes: 0, rejected: 0, errors: [] };

  const CHUNK = 5;
  for (let i = 0; i < candidates.length; i += CHUNK) {
    const chunk = candidates.slice(i, i + CHUNK);
    process.stdout.write(`\rProcessing... ${i + chunk.length}/${candidates.length}`);
    if (i > 0) await new Promise(r => setTimeout(r, 1500));

    try {
      const parsed = await extractOutcomesBatch(chunk);
      if (!parsed?.results) { results.errors.push(`Chunk ${i}: no results`); continue; }

      let chunkTotal = 0;
      for (const r of parsed.results) {
        chunkTotal += (r.outcomes?.length || 0);
      }
      if (chunkTotal === 0) console.error(`\n  Chunk ${i}: ${parsed.results.length} results but 0 outcomes`);

      for (const r of parsed.results) {
        if (!r.outcomes?.length) continue;
        const intervention = chunk[(r.idx || 1) - 1];
        if (!intervention) { console.error(`\n  Bad idx ${r.idx} for chunk ${i}`); continue; }
        results.processed++;
        let added = 0;

        for (const outcome of r.outcomes) {
          if (!isValidOutcome(outcome)) { results.rejected++; continue; }

          if (apply) {
            const { data: ins, error: insErr } = await supabase
              .from('alma_outcomes')
              .insert({ name: outcome.name, outcome_type: outcome.outcome_type, description: outcome.name, measurement_method: outcome.measurement, metadata: { auto_extracted: true, source: 'extract_v2' } })
              .select('id').single();
            if (insErr) console.error(`\n  DB insert error: ${insErr.message}`);
            if (ins) {
              results.outcomes_extracted++;
              added++;
              const { error } = await supabase.from('alma_intervention_outcomes').insert({ intervention_id: intervention.id, outcome_id: ins.id });
              if (!error) results.outcome_links++;
            }
          } else {
            results.outcomes_extracted++;
            added++;
            console.log(`\n  ${intervention.name.substring(0, 40)}: ${outcome.name} (${outcome.outcome_type})`);
          }
        }
        if (added > 0) results.with_outcomes++;
      }
    } catch (err) {
      results.errors.push(`Chunk ${i}: ${err.message}`);
    }
  }

  console.log('\n\n--- Results ---');
  console.log(`Processed: ${results.processed} | With outcomes: ${results.with_outcomes}`);
  console.log(`Outcomes extracted: ${results.outcomes_extracted} | Links: ${results.outcome_links}`);
  console.log(`Rejected (low quality): ${results.rejected}`);
  if (results.errors.length) results.errors.forEach(e => console.log(`  Error: ${e}`));
  if (!apply) console.log('\nDry run. Use --apply to write changes.');

  const { count: tot } = await supabase.from('alma_outcomes').select('*', { count: 'exact', head: true });
  const { count: links } = await supabase.from('alma_intervention_outcomes').select('*', { count: 'exact', head: true });
  console.log(`\nDB totals: ${tot} outcomes, ${links} links`);
}

main().catch(console.error);
