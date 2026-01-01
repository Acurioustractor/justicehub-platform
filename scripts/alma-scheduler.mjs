#!/usr/bin/env node
/**
 * ALMA Scheduler
 *
 * Runs continuous ingestion on a schedule:
 * - Daily: Media sources
 * - Weekly: Indigenous organizations, Legal databases
 * - Monthly: Government sources, Research institutions
 * - Quarterly: Full comprehensive scan
 *
 * Can be run as:
 * 1. Cron job (traditional)
 * 2. GitHub Actions workflow (automated)
 * 3. Long-running process (development)
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/**
 * Schedule configuration
 */
const SCHEDULE = {
  daily: {
    categories: ['media'],
    description: 'Daily media monitoring',
  },
  weekly: {
    categories: ['indigenous', 'legal'],
    description: 'Weekly Indigenous orgs + legal databases',
  },
  monthly: {
    categories: ['government', 'research'],
    description: 'Monthly government + research scan',
  },
  quarterly: {
    categories: ['all'],
    description: 'Quarterly comprehensive scan',
  },
};

/**
 * Run ingestion for specific category
 */
async function runIngestion(category) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting ingestion: ${category}`);

    const child = spawn('node', [
      join(__dirname, 'alma-continuous-ingestion.mjs'),
      category
    ], {
      stdio: 'inherit' // Show output in real-time
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Completed: ${category}\n`);
        resolve(true);
      } else {
        console.error(`❌ Failed: ${category} (exit code ${code})\n`);
        reject(new Error(`Ingestion failed for ${category}`));
      }
    });
  });
}

/**
 * Determine what should run today
 */
function determineSchedule() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const dayOfMonth = now.getDate();
  const month = now.getMonth();

  const toRun = [];

  // Daily (every day)
  toRun.push(...SCHEDULE.daily.categories);

  // Weekly (Sunday)
  if (dayOfWeek === 0) {
    toRun.push(...SCHEDULE.weekly.categories);
  }

  // Monthly (1st of month)
  if (dayOfMonth === 1) {
    toRun.push(...SCHEDULE.monthly.categories);
  }

  // Quarterly (1st of Jan, Apr, Jul, Oct)
  if (dayOfMonth === 1 && [0, 3, 6, 9].includes(month)) {
    toRun.push(...SCHEDULE.quarterly.categories);
  }

  // Remove duplicates
  return [...new Set(toRun)];
}

/**
 * Log run to file
 */
function logRun(categories, success, error) {
  const logFile = join(root, 'alma-ingestion.log');
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'FAILED';
  const errorMsg = error ? ` - ${error.message}` : '';

  const logEntry = `[${timestamp}] ${status}: ${categories.join(', ')}${errorMsg}\n`;

  try {
    writeFileSync(logFile, logEntry, { flag: 'a' });
  } catch (err) {
    console.error('Failed to write log:', err.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           ALMA Ingestion Scheduler                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  const mode = args[0]; // 'daily', 'weekly', 'monthly', 'quarterly', 'auto', or category name

  let categoriesToRun = [];

  if (mode === 'auto') {
    // Automatic scheduling based on date
    categoriesToRun = determineSchedule();
    console.log(`\n📅 Auto-detected schedule for today:`);
    console.log(`   Categories to run: ${categoriesToRun.join(', ')}`);

  } else if (SCHEDULE[mode]) {
    // Run specific schedule
    categoriesToRun = SCHEDULE[mode].categories;
    console.log(`\n⏰ Running ${mode} schedule:`);
    console.log(`   ${SCHEDULE[mode].description}`);
    console.log(`   Categories: ${categoriesToRun.join(', ')}`);

  } else if (mode) {
    // Run specific category
    categoriesToRun = [mode];
    console.log(`\n🎯 Running specific category: ${mode}`);

  } else {
    console.log('\nUsage: node scripts/alma-scheduler.mjs [mode]\n');
    console.log('Modes:');
    console.log('  auto        - Auto-detect based on date (recommended for cron)');
    console.log('  daily       - Run daily schedule (media)');
    console.log('  weekly      - Run weekly schedule (indigenous, legal)');
    console.log('  monthly     - Run monthly schedule (government, research)');
    console.log('  quarterly   - Run quarterly schedule (all)');
    console.log('  [category]  - Run specific category\n');
    console.log('Schedule:');
    console.log('  Daily:      Media sources');
    console.log('  Weekly:     Indigenous organizations, Legal databases');
    console.log('  Monthly:    Government sources, Research institutions');
    console.log('  Quarterly:  Comprehensive scan (all sources)\n');
    console.log('Examples:');
    console.log('  node scripts/alma-scheduler.mjs auto');
    console.log('  node scripts/alma-scheduler.mjs daily');
    console.log('  node scripts/alma-scheduler.mjs government\n');
    console.log('Cron setup (daily at 2am):');
    console.log('  0 2 * * * cd /path/to/JusticeHub && node scripts/alma-scheduler.mjs auto\n');
    process.exit(0);
  }

  // Run ingestion for each category
  const startTime = Date.now();
  const results = [];

  for (const category of categoriesToRun) {
    try {
      await runIngestion(category);
      results.push({ category, success: true });
    } catch (err) {
      console.error(`Error ingesting ${category}:`, err.message);
      results.push({ category, success: false, error: err });
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SCHEDULER SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Categories run: ${categoriesToRun.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${duration} minutes`);
  console.log(`${'='.repeat(60)}\n`);

  // Log to file
  logRun(
    categoriesToRun,
    failed === 0,
    failed > 0 ? new Error(`${failed} categories failed`) : null
  );

  if (failed > 0) {
    console.error(`❌ Scheduler completed with ${failed} failures\n`);
    process.exit(1);
  } else {
    console.log(`✅ Scheduler completed successfully\n`);
    process.exit(0);
  }
}

main();
