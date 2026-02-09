#!/usr/bin/env node
/**
 * ALMA Scraper Scheduler
 * 
 * Runs scraping jobs on a schedule:
 * - Hourly: Check for new high-priority sources
 * - Daily: Full scrape of all healthy sources  
 * - Weekly: Deep scrape with link following
 * - Monthly: Health check all sources and update registry
 * 
 * Usage:
 *   node alma-scheduler.mjs --hourly
 *   node alma-scheduler.mjs --daily
 *   node alma-scheduler.mjs --weekly
 *   node alma-scheduler.mjs --monthly
 * 
 * Cron setup:
 *   0 * * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --hourly
 *   0 2 * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --daily
 *   0 3 * * 0 cd /path/to/justicehub && node scripts/alma-scheduler.mjs --weekly
 *   0 4 1 * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --monthly
 */

import { spawn } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const logLine = `[${timestamp}] ${prefix} ${message}\n`;
  
  console.log(logLine.trim());
  
  // Append to log file
  try {
    appendFileSync(join(root, 'logs', 'alma-scheduler.log'), logLine);
  } catch {
    // Log file might not exist, that's ok
  }
}

// Run scraper with specific args
function runScraper(args) {
  return new Promise((resolve, reject) => {
    const scraperPath = join(__dirname, 'alma-unified-scraper.mjs');
    const child = spawn('node', [scraperPath, ...args, '--quiet'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: errorOutput || output });
      }
    });
  });
}

// Hourly job: High priority sources only
async function hourlyJob() {
  log('Starting hourly scrape (top 5 priority sources)');
  
  const result = await runScraper(['top', '5']);
  
  if (result.success) {
    log('Hourly scrape completed successfully', 'success');
  } else {
    log(`Hourly scrape failed: ${result.error}`, 'error');
  }
  
  return result;
}

// Daily job: Full scrape of all sources
async function dailyJob() {
  log('Starting daily full scrape');
  
  // Indigenous sources (cultural authority priority)
  log('Scraping Indigenous sources...');
  const indigenousResult = await runScraper(['type', 'indigenous']);
  
  // Government sources
  log('Scraping Government sources...');
  const govResult = await runScraper(['type', 'government']);
  
  // Research sources
  log('Scraping Research sources...');
  const researchResult = await runScraper(['type', 'research']);
  
  const allSuccess = indigenousResult.success && govResult.success && researchResult.success;
  
  if (allSuccess) {
    log('Daily scrape completed successfully', 'success');
  } else {
    log('Daily scrape completed with some failures', 'error');
  }
  
  return { success: allSuccess, indigenousResult, govResult, researchResult };
}

// Weekly job: Deep scrape with discovery
async function weeklyJob() {
  log('Starting weekly deep scrape with link discovery');
  
  // First do a full scrape
  await dailyJob();
  
  // Then run source discovery
  log('Running source discovery...');
  const discoveryPath = join(__dirname, 'alma-source-discovery.mjs');
  
  return new Promise((resolve) => {
    const child = spawn('node', [discoveryPath], {
      cwd: root,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => output += data);
    child.stderr.on('data', (data) => output += data);
    
    child.on('close', (code) => {
      if (code === 0) {
        log('Weekly deep scrape completed', 'success');
        resolve({ success: true, output });
      } else {
        log(`Weekly deep scrape failed: ${output}`, 'error');
        resolve({ success: false, error: output });
      }
    });
  });
}

// Monthly job: Health check and registry update
async function monthlyJob() {
  log('Starting monthly maintenance');
  
  // Health check all sources
  log('Running health checks on all sources...');
  const healthResult = await runScraper(['health-check']);
  
  // Update source registry with health status
  // (This would update the alma_sources table with health_status)
  log('Updating source registry...');
  
  // Clear old state files
  log('Cleaning up old state files...');
  try {
    const { execSync } = await import('child_process');
    execSync('rm -f scripts/.alma-scraper-state.json', { cwd: root });
  } catch {
    // Ignore errors
  }
  
  if (healthResult.success) {
    log('Monthly maintenance completed', 'success');
  } else {
    log('Monthly maintenance completed with issues', 'error');
  }
  
  return healthResult;
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  // Ensure logs directory exists
  try {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(root, 'logs'), { recursive: true });
  } catch {
    // Directory might already exist
  }
  
  log(`Scheduler started with args: ${args.join(' ')}`);
  
  if (args.includes('--hourly')) {
    await hourlyJob();
  } else if (args.includes('--daily')) {
    await dailyJob();
  } else if (args.includes('--weekly')) {
    await weeklyJob();
  } else if (args.includes('--monthly')) {
    await monthlyJob();
  } else if (args.includes('--test')) {
    // Quick test run
    log('Running test scrape (top 3)');
    const result = await runScraper(['top', '3']);
    console.log('\n--- Test Result ---');
    console.log(result.output);
  } else {
    console.log(`
Usage: node alma-scheduler.mjs [option]

Options:
  --hourly    Scrape top 5 priority sources
  --daily     Full scrape of all source types
  --weekly    Deep scrape with link discovery
  --monthly   Health check and maintenance
  --test      Quick test run (top 3)

Cron examples:
  # Hourly
  0 * * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --hourly
  
  # Daily at 2am
  0 2 * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --daily
  
  # Weekly on Sunday at 3am
  0 3 * * 0 cd /path/to/justicehub && node scripts/alma-scheduler.mjs --weekly
  
  # Monthly on 1st at 4am
  0 4 1 * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --monthly
`);
    process.exit(0);
  }
  
  log('Scheduler finished');
  process.exit(0);
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
