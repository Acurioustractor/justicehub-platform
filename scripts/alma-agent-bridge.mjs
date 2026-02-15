#!/usr/bin/env node
/**
 * ALMA Agent Bridge
 *
 * Connects ACT Farmhand's ALMAAgent (Python) to JusticeHub's ALMA system (TypeScript).
 *
 * This bridge enables:
 * - Pattern detection across interventions
 * - Signal tracking for programs
 * - Ethics checking before operations
 * - Translation between community and funder language
 * - Portfolio intelligence analysis
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Call ALMAAgent from Python
 */
async function callALMAAgent(command) {
  return new Promise((resolve, reject) => {
    const pythonPath = '/Users/benknight/act-global-infrastructure/act-personal-ai';

    // Spawn Python process
    const python = spawn('python3', [
      '-c',
      `
import sys
import asyncio
sys.path.insert(0, '${pythonPath}')

from agents.alma_agent import ALMAAgent

async def main():
    agent = ALMAAgent()
    result = await agent.run('${command.replace(/'/g, "\\'")}')
    print(result)

asyncio.run(main())
      `.trim()
    ]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ALMAAgent failed: ${errorOutput}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

/**
 * Detect patterns across all JusticeHub interventions
 */
async function detectPatternsInInterventions() {
  console.log('\n=== Detecting Patterns in JusticeHub Interventions ===\n');

  // Get all interventions
  const { data: interventions, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .in('review_status', ['Approved', 'Published']);

  if (error || !interventions) {
    console.error('Failed to fetch interventions:', error);
    return;
  }

  console.log(`Found ${interventions.length} interventions to analyze\n`);

  // Group by state/jurisdiction
  const byState = interventions.reduce((acc, i) => {
    const state = i.jurisdiction || 'Unknown';
    if (!acc[state]) acc[state] = [];
    acc[state].push(i);
    return acc;
  }, {});

  console.log('Interventions by State:');
  Object.entries(byState).forEach(([state, items]) => {
    console.log(`  ${state}: ${items.length} interventions`);
  });

  // Group by type
  const byType = interventions.reduce((acc, i) => {
    const type = i.type || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(i);
    return acc;
  }, {});

  console.log('\nInterventions by Type:');
  Object.entries(byType).forEach(([type, items]) => {
    console.log(`  ${type}: ${items.length} interventions`);
  });

  // Use ALMAAgent to detect patterns
  console.log('\n--- Calling ALMAAgent for Pattern Detection ---\n');
  try {
    const patterns = await callALMAAgent('detect patterns for justicehub');
    console.log(patterns);
  } catch (err) {
    console.error('ALMAAgent error:', err.message);
  }

  return { byState, byType };
}

/**
 * Calculate portfolio signals for each intervention
 */
async function calculatePortfolioSignalsForAll() {
  console.log('\n=== Calculating Portfolio Signals for All Interventions ===\n');

  const { data: interventions, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .in('review_status', ['Approved', 'Published']);

  if (error || !interventions) {
    console.error('Failed to fetch interventions:', error);
    return;
  }

  console.log(`Analyzing ${interventions.length} interventions\n`);

  // Use ALMAAgent to calculate portfolio signals
  console.log('--- Calling ALMAAgent for Portfolio Signal Calculation ---\n');
  try {
    const signals = await callALMAAgent('calculate portfolio signals');
    console.log(signals);
  } catch (err) {
    console.error('ALMAAgent error:', err.message);
  }

  // Calculate signals using database function (PostgreSQL)
  for (const intervention of interventions.slice(0, 5)) { // First 5 for demo
    console.log(`\nCalculating signals for: ${intervention.name}`);

    const { data, error } = await supabase.rpc('calculate_portfolio_signals', {
      intervention_id: intervention.id,
    });

    if (error) {
      console.error(`  Error: ${error.message}`);
    } else if (data && data.length > 0) {
      const signals = data[0];
      console.log(`  Evidence Strength: ${signals.evidence_strength_signal?.toFixed(2) || 'N/A'}`);
      console.log(`  Community Authority: ${signals.community_authority_signal?.toFixed(2) || 'N/A'} [HIGHEST WEIGHT]`);
      console.log(`  Harm Risk: ${signals.harm_risk_signal?.toFixed(2) || 'N/A'} (inverted)`);
      console.log(`  Implementation: ${signals.implementation_capability_signal?.toFixed(2) || 'N/A'}`);
      console.log(`  Option Value: ${signals.option_value_signal?.toFixed(2) || 'N/A'}`);
      console.log(`  Portfolio Score: ${signals.portfolio_score?.toFixed(2) || 'N/A'}`);
    }
  }
}

/**
 * Track signals for JusticeHub project
 */
async function trackJusticeHubSignals() {
  console.log('\n=== Tracking ALMA Signals for JusticeHub ===\n');

  // Get interventions with community authority
  const { data: communityControlled, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .eq('consent_level', 'Community Controlled')
    .in('review_status', ['Approved', 'Published']);

  if (error) {
    console.error('Failed to fetch community controlled interventions:', error);
    return;
  }

  console.log(`Found ${communityControlled?.length || 0} Community Controlled interventions\n`);

  // Use ALMAAgent to track signals
  console.log('--- Calling ALMAAgent for Signal Tracking ---\n');
  try {
    const signals = await callALMAAgent('track signals for justicehub');
    console.log(signals);
  } catch (err) {
    console.error('ALMAAgent error:', err.message);
  }

  // Signal breakdown
  if (communityControlled && communityControlled.length > 0) {
    console.log('\n--- Community Authority Analysis ---\n');

    const withCulturalAuthority = communityControlled.filter(i => i.cultural_authority);
    const withoutCulturalAuthority = communityControlled.filter(i => !i.cultural_authority);

    console.log(`With Cultural Authority: ${withCulturalAuthority.length}`);
    console.log(`Without Cultural Authority: ${withoutCulturalAuthority.length}`);

    if (withoutCulturalAuthority.length > 0) {
      console.log('\n⚠️ WARNING: Community Controlled interventions without cultural authority:');
      withoutCulturalAuthority.forEach(i => {
        console.log(`  - ${i.name} (${i.jurisdiction})`);
      });
    }
  }
}

/**
 * Check ethics for proposed intervention
 */
async function checkEthicsExample() {
  console.log('\n=== Ethics Check Examples ===\n');

  const testCases = [
    {
      name: 'ALLOWED: Track system-level recidivism patterns',
      command: 'check ethics: Track system-level recidivism patterns across jurisdictions',
    },
    {
      name: 'BLOCKED: Predict individual youth',
      command: 'check ethics: Predict which individual youth will reoffend based on profile',
    },
    {
      name: 'ALLOWED: Surface patterns for decision makers',
      command: 'check ethics: Surface patterns from interventions for human decision makers',
    },
    {
      name: 'BLOCKED: Rank organizations',
      command: 'check ethics: Rank organizations by effectiveness to create leaderboard',
    },
  ];

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---\n`);
    try {
      const result = await callALMAAgent(testCase.command);
      console.log(result);
      console.log('');
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

/**
 * Translate community language to funder language
 */
async function translationExamples() {
  console.log('\n=== Translation Examples ===\n');

  const examples = [
    'yarning circles',
    'elder mentorship',
    'cultural healing',
    'unpaid cross-system coordination',
  ];

  for (const example of examples) {
    console.log(`--- Translating: "${example}" ---\n`);
    try {
      const result = await callALMAAgent(
        `translate '${example}' from community to funder`
      );
      console.log(result);
      console.log('');
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ALMA Agent Bridge - JusticeHub Intelligence Layer       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  try {
    switch (command) {
      case 'patterns':
        await detectPatternsInInterventions();
        break;

      case 'signals':
        await trackJusticeHubSignals();
        break;

      case 'portfolio':
        await calculatePortfolioSignalsForAll();
        break;

      case 'ethics':
        await checkEthicsExample();
        break;

      case 'translate':
        await translationExamples();
        break;

      case 'all':
        await detectPatternsInInterventions();
        await trackJusticeHubSignals();
        await calculatePortfolioSignalsForAll();
        await checkEthicsExample();
        await translationExamples();
        break;

      default:
        console.log('\nUsage: node scripts/alma-agent-bridge.mjs [command]\n');
        console.log('Commands:');
        console.log('  patterns   - Detect patterns across interventions');
        console.log('  signals    - Track ALMA signals for JusticeHub');
        console.log('  portfolio  - Calculate portfolio signals');
        console.log('  ethics     - Run ethics check examples');
        console.log('  translate  - Run translation examples');
        console.log('  all        - Run all commands (default)');
        break;
    }

    console.log('\n✅ ALMA Agent Bridge completed\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
