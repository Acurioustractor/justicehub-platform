#!/usr/bin/env node
/**
 * Run All Data Enrichment Scripts
 *
 * Master script to run all data enrichment operations in sequence.
 * Includes historical inquiries, media items, international programs,
 * and ALMA evidence enrichment.
 *
 * Usage: node scripts/data-enrichment/run-all-enrichment.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scripts = [
  {
    name: 'Historical Inquiries',
    file: 'seed-historical-inquiries.mjs',
    description: 'Seeds 17 Australian royal commissions and parliamentary inquiries'
  },
  {
    name: 'Media Items',
    file: 'seed-media-items.mjs',
    description: 'Seeds gallery content with videos, photos, artwork'
  },
  {
    name: 'International Programs',
    file: 'seed-international-programs.mjs',
    description: 'Seeds evidence-based programs from 10+ countries'
  },
  {
    name: 'ALMA Evidence Enrichment',
    file: 'enrich-alma-evidence.mjs',
    description: 'Fixes untitled evidence items and links to interventions'
  }
];

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      cwd: join(__dirname, '../..'),
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                       ║');
  console.log('║          JUSTICEHUB DATA ENRICHMENT - MASTER RUNNER                   ║');
  console.log('║                                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('Scripts to run:');
  scripts.forEach((script, i) => {
    console.log(`  ${i + 1}. ${script.name}`);
    console.log(`     ${script.description}`);
  });
  console.log('\n');

  const results = [];

  for (const script of scripts) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  Running: ${script.name}`);
    console.log(`${'═'.repeat(70)}\n`);

    const startTime = Date.now();

    try {
      await runScript(join(__dirname, script.file));
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      results.push({ name: script.name, status: '✅ Success', duration: `${duration}s` });
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      results.push({ name: script.name, status: '❌ Failed', duration: `${duration}s`, error: error.message });
      console.error(`\nError running ${script.name}:`, error.message);
    }
  }

  // Summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         ENRICHMENT SUMMARY                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('Results:');
  console.log('─'.repeat(50));
  results.forEach(r => {
    console.log(`  ${r.status}  ${r.name} (${r.duration})`);
    if (r.error) {
      console.log(`        Error: ${r.error}`);
    }
  });
  console.log('─'.repeat(50));

  const successCount = results.filter(r => r.status.includes('Success')).length;
  const failCount = results.filter(r => r.status.includes('Failed')).length;

  console.log(`\n  Total: ${successCount} succeeded, ${failCount} failed`);

  if (failCount === 0) {
    console.log('\n✅ All enrichment scripts completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run SQL migration: scripts/sql/add-entity-relationships.sql');
    console.log('  2. Verify data: Visit /admin/content-health');
    console.log('  3. Test pages: /youth-justice-report/inquiries, /gallery, /centre-of-excellence/global-insights');
  } else {
    console.log('\n⚠️  Some scripts failed. Check errors above and re-run if needed.');
  }

  console.log('\n');
}

main().catch(console.error);
