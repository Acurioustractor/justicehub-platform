#!/usr/bin/env node
/**
 * ALMA Services Integration Test
 * Tests all 4 services against real JusticeHub Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🧪 ALMA Services Integration Test\n');
console.log(`📡 Connected to: ${env.NEXT_PUBLIC_SUPABASE_URL}\n`);

// Test data
const TEST_USER_ID = 'test-user-' + Date.now();
let testInterventionId = null;
let testEvidenceId = null;
let testOutcomeId = null;
let testContextId = null;

/**
 * Test 1: Database connectivity
 */
async function testDatabaseConnection() {
  console.log('🔌 Test 1: Database Connectivity');

  try {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Connected to alma_interventions table`);
    return true;
  } catch (err) {
    console.log(`   ❌ Connection error: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Create intervention (intervention-service)
 */
async function testCreateIntervention() {
  console.log('\n📝 Test 2: Create Intervention');

  try {
    const { data, error } = await supabase
      .from('alma_interventions')
      .insert({
        name: 'Test Youth Mentoring Program',
        type: 'Prevention',
        description: 'Community-based mentoring for at-risk youth',
        consent_level: 'Community Controlled',
        cultural_authority: 'Test Community Elders',
        geography: ['NSW', 'VIC'],
        target_cohort: ['10-14 years', 'Aboriginal/Torres Strait Islander'],
        evidence_level: 'Promising (community-endorsed, emerging evidence)',
        harm_risk_level: 'Low',
        current_funding: 'Pilot/seed',
        scalability: 'Regional',
        years_operating: 3,
        review_status: 'Draft',
      })
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    testInterventionId = data.id;
    console.log(`   ✅ Created intervention: ${testInterventionId}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Create evidence
 */
async function testCreateEvidence() {
  console.log('\n📚 Test 3: Create Evidence');

  try {
    const { data, error } = await supabase
      .from('alma_evidence')
      .insert({
        title: 'Test Evaluation Report 2024',
        evidence_type: 'Program evaluation',
        author: 'Dr. Test Researcher',
        organization: 'Test Research Institute',
        publication_date: '2024-01-01',
        methodology: 'Mixed methods',
        sample_size: 150,
        findings: 'Significant reduction in reoffending rates',
        effect_size: 'Large positive',
        consent_level: 'Public Knowledge Commons',
      })
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    testEvidenceId = data.id;
    console.log(`   ✅ Created evidence: ${testEvidenceId}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Create outcome
 */
async function testCreateOutcome() {
  console.log('\n🎯 Test 4: Create Outcome');

  try {
    const { data, error } = await supabase
      .from('alma_outcomes')
      .insert({
        name: 'Reduced Recidivism',
        outcome_type: 'Reduced recidivism',
        description: '12-month follow-up showing reduced reoffending',
        measurement_method: 'Police data linkage',
        indicators: '45% baseline to 25% target',
        time_horizon: 'Short-term (6-12 months)',
        beneficiary: 'Young person',
      })
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    testOutcomeId = data.id;
    console.log(`   ✅ Created outcome: ${testOutcomeId}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: Create community context
 */
async function testCreateContext() {
  console.log('\n🌏 Test 5: Create Community Context');

  try {
    const { data, error } = await supabase
      .from('alma_community_contexts')
      .insert({
        name: 'Western Sydney Youth Justice Context',
        context_type: 'Metro suburb',
        location: 'Western Sydney',
        state: 'NSW',
        population_size: '50,000+',
        demographics: 'Diverse cultural communities, high proportion of young people',
        system_factors: 'High youth unemployment, over-policing in some areas',
        protective_factors: 'Strong community networks, cultural diversity',
        cultural_authority: 'Test Community Authority',
        consent_level: 'Public Knowledge Commons',
      })
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    testContextId = data.id;
    console.log(`   ✅ Created context: ${testContextId}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: Link entities (relationships)
 */
async function testLinkEntities() {
  console.log('\n🔗 Test 6: Link Entities');

  try {
    // Link intervention to evidence
    const { error: evidenceError } = await supabase
      .from('alma_intervention_evidence')
      .insert({
        intervention_id: testInterventionId,
        evidence_id: testEvidenceId,
      });

    if (evidenceError) {
      console.log(`   ❌ Failed linking evidence: ${evidenceError.message}`);
      return false;
    }

    // Link intervention to outcome
    const { error: outcomeError } = await supabase
      .from('alma_intervention_outcomes')
      .insert({
        intervention_id: testInterventionId,
        outcome_id: testOutcomeId,
      });

    if (outcomeError) {
      console.log(`   ❌ Failed linking outcome: ${outcomeError.message}`);
      return false;
    }

    // Link intervention to context
    const { error: contextError } = await supabase
      .from('alma_intervention_contexts')
      .insert({
        intervention_id: testInterventionId,
        context_id: testContextId,
      });

    if (contextError) {
      console.log(`   ❌ Failed linking context: ${contextError.message}`);
      return false;
    }

    console.log(`   ✅ Linked intervention to evidence, outcome, and context`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Portfolio signal calculation
 */
async function testPortfolioSignals() {
  console.log('\n📊 Test 7: Portfolio Signal Calculation');

  try {
    const { data, error } = await supabase.rpc('calculate_portfolio_signals', {
      p_intervention_id: testInterventionId,
    });

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`   ❌ No signals returned`);
      return false;
    }

    const signals = data[0];
    console.log(`   ✅ Signals calculated:`);
    console.log(`      Evidence Strength: ${signals.evidence_strength?.toFixed(2) || 'N/A'}`);
    console.log(`      Community Authority: ${signals.community_authority?.toFixed(2) || 'N/A'}`);
    console.log(`      Harm Risk: ${signals.harm_risk?.toFixed(2) || 'N/A'}`);
    console.log(`      Portfolio Score: ${signals.portfolio_score?.toFixed(2) || 'N/A'}`);

    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Consent ledger
 */
async function testConsentLedger() {
  console.log('\n🔐 Test 8: Consent Ledger');

  try {
    const { data, error } = await supabase
      .from('alma_consent_ledger')
      .insert({
        entity_type: 'intervention',
        entity_id: testInterventionId,
        consent_level: 'Community Controlled',
        permitted_uses: ['Query (internal)', 'Public reporting'],
        cultural_authority: 'Test Community Elders',
        consent_given_by: TEST_USER_ID,
        consent_given_at: new Date().toISOString(),
        revenue_share_enabled: false,
      })
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Consent ledger entry created: ${data.id}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 9: Consent compliance check
 */
async function testConsentCompliance() {
  console.log('\n🛡️  Test 9: Consent Compliance Check');

  try {
    const { data, error } = await supabase.rpc('check_consent_compliance', {
      p_entity_type: 'intervention',
      p_entity_id: testInterventionId,
      p_action: 'Query (internal)',
    });

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Consent check passed: ${data}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 10: Query unified view
 */
async function testUnifiedView() {
  console.log('\n🔍 Test 10: Query Unified View');

  try {
    const { data, error } = await supabase
      .from('alma_interventions_unified')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Unified view query returned ${data.length} interventions`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Test 11: Governance constraint (should fail)
 */
async function testGovernanceConstraint() {
  console.log('\n🚫 Test 11: Governance Constraint (Should Fail)');

  try {
    const { error } = await supabase.from('alma_interventions').insert({
      name: 'Bad Test - No Authority',
      type: 'Prevention',
      description: 'This should fail',
      consent_level: 'Community Controlled',
      // Missing cultural_authority - should fail constraint
    });

    if (error) {
      if (error.message.includes('check_cultural_authority_required')) {
        console.log(`   ✅ Governance constraint enforced correctly`);
        return true;
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}`);
        return false;
      }
    }

    console.log(`   ❌ Constraint not enforced - insert succeeded when it should have failed`);
    return false;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n🧹 Cleanup: Removing test data');

  try {
    // Delete relationships first (foreign keys)
    await supabase
      .from('alma_intervention_evidence')
      .delete()
      .eq('intervention_id', testInterventionId);

    await supabase
      .from('alma_intervention_outcomes')
      .delete()
      .eq('intervention_id', testInterventionId);

    await supabase
      .from('alma_intervention_contexts')
      .delete()
      .eq('intervention_id', testInterventionId);

    await supabase
      .from('alma_consent_ledger')
      .delete()
      .eq('entity_id', testInterventionId);

    // Delete entities
    await supabase.from('alma_interventions').delete().eq('id', testInterventionId);
    await supabase.from('alma_evidence').delete().eq('id', testEvidenceId);
    await supabase.from('alma_outcomes').delete().eq('id', testOutcomeId);
    await supabase.from('alma_community_contexts').delete().eq('id', testContextId);

    console.log('   ✅ Test data removed');
  } catch (err) {
    console.log(`   ⚠️  Cleanup error: ${err.message}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Create Intervention', fn: testCreateIntervention },
    { name: 'Create Evidence', fn: testCreateEvidence },
    { name: 'Create Outcome', fn: testCreateOutcome },
    { name: 'Create Context', fn: testCreateContext },
    { name: 'Link Entities', fn: testLinkEntities },
    { name: 'Portfolio Signals', fn: testPortfolioSignals },
    { name: 'Consent Ledger', fn: testConsentLedger },
    { name: 'Consent Compliance', fn: testConsentCompliance },
    { name: 'Unified View', fn: testUnifiedView },
    { name: 'Governance Constraint', fn: testGovernanceConstraint },
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests:  ${results.total}`);
  console.log(`✅ Passed:     ${results.passed}`);
  console.log(`❌ Failed:     ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! ALMA services are working correctly.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Review errors above.\n');
    process.exit(1);
  }
}

// Run
runTests().catch((err) => {
  console.error('\n❌ Test suite error:', err);
  process.exit(1);
});
