#!/usr/bin/env node

/**
 * JusticeHub Automation Deployment Readiness Checker
 *
 * This script verifies that all prerequisites are met for deploying
 * the automated data pipelines.
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const REQUIRED_GITHUB_SECRETS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'FIRECRAWL_API_KEY',
  'EMPATHY_LEDGER_SUPABASE_URL',
  'EMPATHY_LEDGER_SUPABASE_ANON_KEY',
];

const OPTIONAL_GITHUB_SECRETS = [
  'SLACK_WEBHOOK_URL',
  'NEXT_PUBLIC_SITE_URL',
];

const REQUIRED_WORKFLOWS = [
  '.github/workflows/sync-empathy-ledger.yml',
  '.github/workflows/health-monitoring.yml',
  '.github/workflows/service-directory-scraping.yml',
  '.github/workflows/alma-ingestion.yml',
  '.github/workflows/daily-media-sentiment.yml',
];

const REQUIRED_SCRIPTS = [
  'scripts/sync-empathy-ledger.mjs',
  'scripts/health-check-sources.mjs',
  'scripts/apply-unification-migration.mjs',
];

let checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function logCheck(status, message) {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' };
  console.log(`${symbols[status]} ${message}`);

  if (status === 'pass') checks.passed++;
  else if (status === 'fail') checks.failed++;
  else if (status === 'warn') checks.warnings++;
}

async function checkGitHubSecrets() {
  console.log('\n🔐 Checking GitHub Secrets...\n');

  try {
    const output = execSync('gh secret list', { encoding: 'utf-8' });
    const configuredSecrets = output.split('\n').map(line => line.split('\t')[0]).filter(Boolean);

    for (const secret of REQUIRED_GITHUB_SECRETS) {
      if (configuredSecrets.includes(secret)) {
        logCheck('pass', `${secret} is configured`);
      } else {
        logCheck('fail', `${secret} is NOT configured (REQUIRED)`);
      }
    }

    for (const secret of OPTIONAL_GITHUB_SECRETS) {
      if (configuredSecrets.includes(secret)) {
        logCheck('pass', `${secret} is configured`);
      } else {
        logCheck('warn', `${secret} is NOT configured (optional)`);
      }
    }
  } catch (error) {
    logCheck('fail', 'GitHub CLI not available or not authenticated');
    console.log('   Run: gh auth login');
  }
}

async function checkWorkflows() {
  console.log('\n📋 Checking GitHub Workflows...\n');

  for (const workflow of REQUIRED_WORKFLOWS) {
    if (fs.existsSync(workflow)) {
      logCheck('pass', `${path.basename(workflow)} exists`);
    } else {
      logCheck('fail', `${workflow} is missing`);
    }
  }
}

async function checkScripts() {
  console.log('\n🔧 Checking Automation Scripts...\n');

  for (const script of REQUIRED_SCRIPTS) {
    if (fs.existsSync(script)) {
      logCheck('pass', `${path.basename(script)} exists`);
    } else {
      logCheck('fail', `${script} is missing`);
    }
  }
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Checking JusticeHub Database Connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logCheck('fail', 'Supabase credentials not found in .env.local');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if exec() function exists
    const { data: execData, error: execError } = await supabase.rpc('exec', {
      sql: 'SELECT 1 as test'
    });

    if (execError) {
      logCheck('fail', 'exec() RPC function not found - run scripts/create-exec-function.mjs');
    } else {
      logCheck('pass', 'exec() RPC function is configured');
    }

    // Check if unification tables exist
    const tables = [
      'article_related_interventions',
      'article_related_evidence',
      'story_related_interventions',
      'alma_intervention_profiles',
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        logCheck('fail', `Table ${table} does not exist - run migration`);
      } else if (error) {
        logCheck('warn', `Table ${table} check failed: ${error.message}`);
      } else {
        logCheck('pass', `Table ${table} exists`);
      }
    }

  } catch (error) {
    logCheck('fail', `Database connection failed: ${error.message}`);
  }
}

async function checkEmpathyLedgerConnection() {
  console.log('\n🔗 Checking Empathy Ledger Connection...\n');

  const elUrl = process.env.EMPATHY_LEDGER_SUPABASE_URL;
  const elKey = process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY;

  if (!elUrl || !elKey) {
    logCheck('warn', 'Empathy Ledger credentials not found in .env.local (OK if only testing GitHub secrets)');
    return;
  }

  try {
    const supabase = createClient(elUrl, elKey);

    // Check if public_profiles table exists
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, justicehub_enabled, justicehub_role')
      .limit(1);

    if (error) {
      logCheck('fail', `Empathy Ledger connection failed: ${error.message}`);
    } else {
      logCheck('pass', 'Empathy Ledger database connection successful');

      // Check if justicehub_enabled column exists
      if (data && data.length > 0 && 'justicehub_enabled' in data[0]) {
        logCheck('pass', 'Empathy Ledger has justicehub_enabled column');
      } else {
        logCheck('warn', 'Empathy Ledger may be missing justicehub_enabled column');
      }
    }

    // Check for profiles marked for sync
    const { data: enabledProfiles, error: enabledError } = await supabase
      .from('public_profiles')
      .select('id, display_name, justicehub_role')
      .eq('justicehub_enabled', true);

    if (enabledError) {
      logCheck('warn', 'Could not check for enabled profiles');
    } else if (enabledProfiles && enabledProfiles.length > 0) {
      logCheck('pass', `Found ${enabledProfiles.length} profiles marked for JusticeHub sync`);
    } else {
      logCheck('warn', 'No profiles marked for JusticeHub sync (run prepare-empathy-ledger.sql)');
    }

  } catch (error) {
    logCheck('fail', `Empathy Ledger check failed: ${error.message}`);
  }
}

async function checkDocumentation() {
  console.log('\n📚 Checking Documentation...\n');

  const docs = [
    'AUTOMATION_QUICK_START.md',
    'GITHUB_SECRETS_SETUP.md',
    'DEPLOYMENT_NEXT_STEPS.md',
    'DATA_INGESTION_AUTOMATION_PLAN.md',
    'ALMA_UNIFICATION_COMPLETE.md',
  ];

  for (const doc of docs) {
    if (fs.existsSync(doc)) {
      logCheck('pass', `${doc} exists`);
    } else {
      logCheck('warn', `${doc} is missing`);
    }
  }
}

async function main() {
  console.log('🚀 JusticeHub Automation Deployment Readiness Check');
  console.log('====================================================\n');
  console.log('Date:', new Date().toISOString());
  console.log('');

  await checkGitHubSecrets();
  await checkWorkflows();
  await checkScripts();
  await checkDatabaseConnection();
  await checkEmpathyLedgerConnection();
  await checkDocumentation();

  console.log('\n====================================================');
  console.log('📊 Summary');
  console.log('====================================================\n');
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`⚠️  Warnings: ${checks.warnings}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log('');

  if (checks.failed === 0 && checks.warnings === 0) {
    console.log('🎉 ALL CHECKS PASSED - Ready for deployment!\n');
    console.log('Next steps:');
    console.log('  1. Test workflows: gh workflow run sync-empathy-ledger.yml');
    console.log('  2. Monitor: gh run list --limit 5');
    console.log('');
    process.exit(0);
  } else if (checks.failed === 0) {
    console.log('✅ READY FOR DEPLOYMENT (with warnings)\n');
    console.log('Warnings are non-critical but recommended to fix.');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ NOT READY FOR DEPLOYMENT\n');
    console.log('Fix failed checks before deploying automation workflows.');
    console.log('See DEPLOYMENT_NEXT_STEPS.md for guidance.');
    console.log('');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
