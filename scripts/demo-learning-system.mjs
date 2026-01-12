#!/usr/bin/env node

/**
 * ALMA Learning System Demonstration
 *
 * Shows how the continuous learning system works with real data.
 */

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
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function demonstrateLearningSystem() {
  console.log('\n🧠 ALMA Continuous Learning System - Demonstration\n');
  console.log('='.repeat(70));

  // 1. Check current interventions
  console.log('\n📊 Step 1: Current ALMA Interventions\n');

  const { data: interventions, error: intError } = await supabase
    .from('alma_interventions')
    .select('id, name, type, evidence_level, cultural_authority')
    .order('created_at', { ascending: false })
    .limit(10);

  if (intError) {
    console.error('Error:', intError);
    return;
  }

  console.log(`Found ${interventions.length} recent interventions:`);
  interventions.forEach((int, i) => {
    console.log(`  ${i + 1}. ${int.name || 'Unknown'}`);
    console.log(`     Type: ${int.type || 'Unknown'}`);
    console.log(`     Evidence: ${int.evidence_level || 'Missing'}`);
    console.log(`     Authority: ${int.cultural_authority || 'Missing'}`);
    console.log('');
  });

  // 2. Analyze quality
  console.log('\n📈 Step 2: Quality Analysis\n');

  const withEvidence = interventions.filter(i => i.evidence_level && i.evidence_level !== 'Unknown').length;
  const withAuthority = interventions.filter(i => i.cultural_authority).length;
  const complete = interventions.filter(i =>
    i.evidence_level &&
    i.evidence_level !== 'Unknown' &&
    i.cultural_authority
  ).length;

  console.log(`Quality Metrics:`);
  console.log(`  Evidence populated: ${withEvidence}/${interventions.length} (${(withEvidence/interventions.length*100).toFixed(0)}%)`);
  console.log(`  Authority populated: ${withAuthority}/${interventions.length} (${(withAuthority/interventions.length*100).toFixed(0)}%)`);
  console.log(`  Complete (both): ${complete}/${interventions.length} (${(complete/interventions.length*100).toFixed(0)}%)`);

  // 3. Simulate learning pattern
  console.log('\n🎯 Step 3: Learning Pattern Discovery\n');

  console.log('If we were to record extraction attempts, the system would learn:');
  console.log('');
  console.log('Pattern Example 1: Document Type Success Rates');
  console.log('  government_report → table_focused strategy → 85% success');
  console.log('  research_paper → narrative_focused strategy → 78% success');
  console.log('  service_directory → list_focused strategy → 92% success');
  console.log('');
  console.log('Pattern Example 2: Quality Indicators');
  console.log('  Keywords like "Aboriginal Community Controlled" → High authority (0.9)');
  console.log('  Keywords like "randomized controlled trial" → High evidence (0.9)');
  console.log('  Keywords like "recidivism rate" → Outcomes present');
  console.log('');
  console.log('Pattern Example 3: Review Triggers');
  console.log('  Confidence < 0.6 → Flag for human review');
  console.log('  0 interventions extracted → Flag for review (extraction failure)');
  console.log('  Missing both evidence AND authority → Flag for review');

  // 4. Check learning tables
  console.log('\n🗄️  Step 4: Learning System Tables\n');

  const tables = [
    'alma_extraction_history',
    'alma_learning_patterns',
    'alma_quality_metrics',
    'alma_human_feedback',
    'alma_extraction_strategies'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count || 0} records`);
    }
  }

  // 5. Show what needs review
  console.log('\n👤 Step 5: Interventions Needing Human Review\n');

  const needsReview = interventions.filter(i =>
    !i.evidence_level ||
    i.evidence_level === 'Unknown' ||
    !i.cultural_authority
  );

  console.log(`${needsReview.length} interventions need review:\n`);

  needsReview.slice(0, 5).forEach(int => {
    const issues = [];
    if (!int.evidence_level || int.evidence_level === 'Unknown') {
      issues.push('Missing evidence level');
    }
    if (!int.cultural_authority) {
      issues.push('Missing cultural authority');
    }

    console.log(`  🟡 ${int.name}`);
    console.log(`     Issues: ${issues.join(', ')}`);
    console.log('');
  });

  // 6. Demonstrate how it would work in production
  console.log('\n⚙️  Step 6: How It Works in Production\n');

  console.log('When you run extraction with learning enabled:');
  console.log('');
  console.log('1. Before extraction:');
  console.log('   → System recommends best strategy based on document type');
  console.log('   → "For government_report, use table_focused (85% confidence)"');
  console.log('');
  console.log('2. During extraction:');
  console.log('   → Track what fields were successfully extracted');
  console.log('   → Calculate confidence score (0-1)');
  console.log('   → Record performance metrics (time, tokens, cost)');
  console.log('');
  console.log('3. After extraction:');
  console.log('   → Determine if human review needed');
  console.log('   → Record extraction history for learning');
  console.log('   → Generate quality assessment');
  console.log('');
  console.log('4. Daily learning cycle:');
  console.log('   → Analyze successful extractions');
  console.log('   → Discover new patterns');
  console.log('   → Calibrate confidence scores');
  console.log('   → Update extraction strategies');

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Demonstration Complete\n');
  console.log('The learning system is ready to track and improve extractions.');
  console.log('Run: node scripts/alma-scrape-with-learning.mjs batch 10');
  console.log('');
}

demonstrateLearningSystem().catch(console.error);
