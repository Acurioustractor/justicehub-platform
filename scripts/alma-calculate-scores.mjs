#!/usr/bin/env node
/**
 * ALMA Portfolio Score Calculator
 *
 * Calls the calculate_portfolio_signals() RPC for every intervention
 * and writes the 5 signals + portfolio_score back to the row.
 *
 * Usage:
 *   node scripts/alma-calculate-scores.mjs           # dry-run
 *   node scripts/alma-calculate-scores.mjs --apply    # write to DB
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

console.log('\n📊 ALMA Portfolio Score Calculator');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}\n`);

async function main() {
  // Get all interventions (paginate past Supabase 1000-row default)
  let interventions = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: page, error: pageErr } = await supabase
      .from('alma_interventions')
      .select('id, name, portfolio_score')
      .order('name')
      .range(from, from + pageSize - 1);
    if (pageErr) throw pageErr;
    if (!page || page.length === 0) break;
    interventions = interventions.concat(page);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  const error = null;

  if (error) throw error;

  const noScore = interventions.filter((i) => i.portfolio_score === null);
  const hasScore = interventions.filter((i) => i.portfolio_score !== null);

  console.log(`Total interventions: ${interventions.length}`);
  console.log(`Already scored: ${hasScore.length}`);
  console.log(`Needs scoring: ${noScore.length}\n`);

  // Score ALL interventions (recalculate even existing ones since data changed)
  const toScore = interventions;
  let scored = 0;
  let errors = 0;
  const scoreDist = { high: 0, medium: 0, low: 0 };

  for (let i = 0; i < toScore.length; i++) {
    const intervention = toScore[i];

    try {
      const { data: signals, error: rpcError } = await supabase
        .rpc('calculate_portfolio_signals', {
          p_intervention_id: intervention.id,
        });

      if (rpcError || !signals || signals.length === 0) {
        if (rpcError) console.error(`  ✗ ${intervention.name.substring(0, 40)}: ${rpcError.message}`);
        errors++;
        continue;
      }

      const s = signals[0];

      if (s.portfolio_score >= 0.7) scoreDist.high++;
      else if (s.portfolio_score >= 0.4) scoreDist.medium++;
      else scoreDist.low++;

      if (applyMode) {
        const { error: updateErr } = await supabase
          .from('alma_interventions')
          .update({
            portfolio_score: s.portfolio_score,
            evidence_strength_signal: s.evidence_strength,
            community_authority_signal: s.community_authority,
            harm_risk_signal: s.harm_risk,
            implementation_capability_signal: s.implementation_capability,
            option_value_signal: s.option_value,
          })
          .eq('id', intervention.id);

        if (updateErr) {
          console.error(`  ✗ Update ${intervention.name.substring(0, 40)}: ${updateErr.message}`);
          errors++;
          continue;
        }
      }

      scored++;

      // Progress every 100
      if (scored % 100 === 0) {
        console.log(`  ... scored ${scored}/${toScore.length}`);
      }
    } catch (err) {
      errors++;
    }
  }

  console.log(`\nScored: ${scored}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nScore distribution:`);
  console.log(`  High (≥0.7):   ${scoreDist.high}`);
  console.log(`  Medium (0.4-0.7): ${scoreDist.medium}`);
  console.log(`  Low (<0.4):    ${scoreDist.low}`);

  if (!applyMode) {
    console.log('\nRun with --apply to write scores.');
  }

  // Show top 10
  if (applyMode) {
    const { data: top } = await supabase
      .from('alma_interventions')
      .select('name, portfolio_score, evidence_strength_signal, community_authority_signal')
      .order('portfolio_score', { ascending: false })
      .limit(10);

    if (top) {
      console.log('\nTop 10 interventions by portfolio score:');
      for (const t of top) {
        console.log(`  ${Number(t.portfolio_score).toFixed(3)} | ev:${Number(t.evidence_strength_signal).toFixed(2)} ca:${Number(t.community_authority_signal).toFixed(2)} | ${t.name.substring(0, 50)}`);
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
