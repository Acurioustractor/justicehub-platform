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
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment from both .env.local (dev) and process.env (production)
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
    } catch (err) {
      // Ignore errors
    }
  }
  
  return env;
}

const env = loadEnv();

// Initialize Supabase for logging
const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  const logLine = `[${timestamp}] ${prefix} ${message}\n`;
  
  console.log(logLine.trim());
  
  // Append to log file
  try {
    const logsDir = join(root, 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    appendFileSync(join(logsDir, 'alma-scheduler.log'), logLine);
  } catch {
    // Ignore errors
  }
}

// Run scraper with specific args
function runScraper(args) {
  return new Promise((resolve) => {
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
        resolve({ success: false, error: errorOutput || output, output });
      }
    });
    
    // Timeout after 30 minutes
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: 'Timeout after 30 minutes' });
    }, 30 * 60 * 1000);
  });
}

// Run SSL fix scraper
function runSslFixScraper() {
  return new Promise((resolve) => {
    const scraperPath = join(__dirname, 'alma-ssl-fix-scraper.mjs');
    const child = spawn('node', [scraperPath], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());
    
    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
    
    // Timeout after 10 minutes
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: 'Timeout' });
    }, 10 * 60 * 1000);
  });
}

// Run Playwright scraper for JS-heavy sites
function runPlaywrightScraper() {
  return new Promise((resolve) => {
    const scraperPath = join(__dirname, 'alma-playwright-scrape.mjs');
    const child = spawn('node', [scraperPath], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());
    
    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
    
    // Timeout after 20 minutes
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: 'Timeout' });
    }, 20 * 60 * 1000);
  });
}

// Create ingestion job record
async function createJobRecord(jobType, config) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('alma_ingestion_jobs')
      .insert({
        job_type: jobType,
        status: 'running',
        config,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      log(`Failed to create job record: ${error.message}`, 'warning');
      return null;
    }
    
    return data.id;
  } catch (err) {
    log(`Error creating job record: ${err.message}`, 'warning');
    return null;
  }
}

// Update job record
async function updateJobRecord(jobId, updates) {
  if (!supabase || !jobId) return;
  
  try {
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (err) {
    log(`Error updating job record: ${err.message}`, 'warning');
  }
}

// Hourly job: High priority sources only
async function hourlyJob() {
  log('Starting hourly scrape (top 5 priority sources)');
  
  const jobId = await createJobRecord('hourly_scrape', { mode: 'top', count: 5 });
  
  const result = await runScraper(['top', '5']);
  
  if (result.success) {
    log('Hourly scrape completed successfully', 'success');
    await updateJobRecord(jobId, { 
      status: 'completed', 
      completed_at: new Date().toISOString(),
      result: { success: true }
    });
  } else {
    log(`Hourly scrape failed: ${result.error}`, 'error');
    await updateJobRecord(jobId, { 
      status: 'failed', 
      completed_at: new Date().toISOString(),
      result: { success: false, error: result.error }
    });
  }
  
  return result;
}

// Daily job: Full scrape of all sources
async function dailyJob() {
  log('Starting daily full scrape');
  
  const jobId = await createJobRecord('daily_scrape', { mode: 'full' });
  
  const results = {
    indigenous: null,
    government: null,
    research: null,
    sslFix: null,
  };
  
  // Indigenous sources (cultural authority priority)
  log('Scraping Indigenous sources...');
  results.indigenous = await runScraper(['type', 'indigenous']);
  
  // Government sources
  log('Scraping Government sources...');
  results.gov = await runScraper(['type', 'government']);
  
  // Research sources
  log('Scraping Research sources...');
  results.research = await runScraper(['type', 'research']);
  
  // Run SSL fix scraper for problematic sites
  log('Running SSL fix scraper for Indigenous legal services...');
  results.sslFix = await runSslFixScraper();
  
  const allSuccess = results.indigenous.success && results.gov.success && results.research.success;
  
  if (allSuccess) {
    log('Daily scrape completed successfully', 'success');
    await updateJobRecord(jobId, { 
      status: 'completed', 
      completed_at: new Date().toISOString(),
      result: { 
        success: true, 
        indigenous: results.indigenous.success,
        government: results.gov.success,
        research: results.research.success,
        sslFix: results.sslFix.success,
      }
    });
  } else {
    log('Daily scrape completed with some failures', 'warning');
    await updateJobRecord(jobId, { 
      status: 'completed_with_errors', 
      completed_at: new Date().toISOString(),
      result: { 
        success: false, 
        indigenous: results.indigenous.success,
        government: results.gov.success,
        research: results.research.success,
        sslFix: results.sslFix.success,
      }
    });
  }
  
  return results;
}

// Weekly job: Deep scrape with discovery
async function weeklyJob() {
  log('Starting weekly deep scrape with link discovery');
  
  const jobId = await createJobRecord('weekly_scrape', { mode: 'deep' });
  
  // First do a full scrape
  const dailyResults = await dailyJob();
  
  // Run Playwright scraper for JS-heavy sites
  log('Running Playwright scraper for JavaScript-heavy sites...');
  const playwrightResult = await runPlaywrightScraper();
  
  if (playwrightResult.success) {
    log('Playwright scrape completed', 'success');
  } else {
    log('Playwright scrape had issues', 'warning');
  }
  
  // Then run source discovery
  log('Running source discovery...');
  const discoveryPath = join(__dirname, 'alma-source-discovery.mjs');
  
  const discoveryResult = await new Promise((resolve) => {
    const child = spawn('node', [discoveryPath], {
      cwd: root,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => output += data);
    child.stderr.on('data', (data) => output += data);
    
    child.on('close', (code) => {
      if (code === 0) {
        log('Source discovery completed', 'success');
        resolve({ success: true, output });
      } else {
        log(`Source discovery failed: ${output}`, 'error');
        resolve({ success: false, error: output });
      }
    });
    
    // Timeout after 30 minutes
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: 'Timeout' });
    }, 30 * 60 * 1000);
  });
  
  await updateJobRecord(jobId, { 
    status: discoveryResult.success ? 'completed' : 'completed_with_errors', 
    completed_at: new Date().toISOString(),
    result: {
      daily: dailyResults,
      playwright: playwrightResult.success,
      discovery: discoveryResult.success,
    }
  });
  
  return { dailyResults, playwrightResult, discoveryResult };
}

// Monthly job: Health check and registry update
async function monthlyJob() {
  log('Starting monthly maintenance');
  
  const jobId = await createJobRecord('monthly_maintenance', { mode: 'maintenance' });
  
  // Health check all sources
  log('Running health checks on all sources...');
  const healthResult = await runScraper(['health-check']);
  
  // Update source registry with health status
  log('Updating source registry...');
  
  // Clear old state files
  log('Cleaning up old state files...');
  try {
    const stateFile = join(__dirname, '.alma-scraper-state.json');
    if (existsSync(stateFile)) {
      writeFileSync(stateFile, JSON.stringify({ completed: [], failed: [], lastIndex: 0 }, null, 2));
      log('State file reset');
    }
  } catch (err) {
    log(`Could not reset state file: ${err.message}`, 'warning');
  }
  
  if (healthResult.success) {
    log('Monthly maintenance completed', 'success');
    await updateJobRecord(jobId, { 
      status: 'completed', 
      completed_at: new Date().toISOString(),
      result: { healthCheck: true }
    });
  } else {
    log('Monthly maintenance completed with issues', 'warning');
    await updateJobRecord(jobId, { 
      status: 'completed_with_errors', 
      completed_at: new Date().toISOString(),
      result: { healthCheck: false, error: healthResult.error }
    });
  }
  
  return healthResult;
}

// Funding scraper job
async function runFundingScraper() {
  log('Starting funding opportunity scrape');

  const jobId = await createJobRecord('funding_scrape', { mode: 'funding' });

  try {
    // Hit the funding scrape API endpoint
    const baseUrl = env.NEXT_PUBLIC_APP_URL || env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/funding/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const result = await response.json();
      log(`Funding scrape completed: ${JSON.stringify(result)}`, 'success');
      await updateJobRecord(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: { success: true, ...result },
      });
      return { success: true, result };
    } else {
      const errorText = await response.text();
      log(`Funding scrape failed: ${response.status} ${errorText}`, 'error');
      await updateJobRecord(jobId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        result: { success: false, error: errorText },
      });
      return { success: false, error: errorText };
    }
  } catch (err) {
    log(`Funding scrape error: ${err.message}`, 'error');
    await updateJobRecord(jobId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      result: { success: false, error: err.message },
    });
    return { success: false, error: err.message };
  }
}

// Community programs sync — filter ALMA interventions for community-relevant types
async function syncCommunityPrograms() {
  if (!supabase) {
    log('Supabase not configured, skipping community programs sync', 'warning');
    return { success: false, error: 'No supabase' };
  }

  log('Starting community programs sync');

  const COMMUNITY_TYPES = [
    'Community-Led',
    'Cultural Connection',
    'Diversion',
    'Early Intervention',
    'Family Strengthening',
    'Prevention',
    'Wraparound Support',
  ];

  try {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('id, name, type')
      .in('type', COMMUNITY_TYPES);

    if (error) {
      log(`Community sync query failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }

    log(`Community programs sync: ${data?.length || 0} interventions match community types`, 'success');
    return { success: true, count: data?.length || 0 };
  } catch (err) {
    log(`Community programs sync error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// Weekly report generation
async function generateWeeklyReport() {
  if (!supabase) {
    log('Supabase not configured, skipping weekly report', 'warning');
    return { success: false, error: 'No supabase' };
  }

  log('Generating weekly intelligence report');

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Count new interventions this week
    const { count: newInterventions } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Count new evidence this week
    const { count: newEvidence } = await supabase
      .from('alma_evidence')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get scraper health
    const { data: recentJobs } = await supabase
      .from('alma_ingestion_jobs')
      .select('status')
      .gte('created_at', weekAgo.toISOString());

    const jobStats = {
      total: recentJobs?.length || 0,
      completed: recentJobs?.filter(j => j.status === 'completed').length || 0,
      failed: recentJobs?.filter(j => j.status === 'failed').length || 0,
    };

    const scraperHealth = jobStats.total === 0
      ? 'No scraper runs this week'
      : `${jobStats.completed}/${jobStats.total} jobs completed (${jobStats.failed} failures)`;

    const weekStart = weekAgo.toISOString().split('T')[0];
    const weekEnd = now.toISOString().split('T')[0];

    const summary = [
      `Week of ${weekStart} to ${weekEnd}:`,
      `- ${newInterventions || 0} new interventions documented`,
      `- ${newEvidence || 0} new evidence records added`,
      `- Scraper status: ${scraperHealth}`,
    ].join('\n');

    const { error: insertError } = await supabase
      .from('alma_weekly_reports')
      .insert({
        title: `Weekly Intelligence Report — ${weekEnd}`,
        summary,
        week_start: weekStart,
        week_end: weekEnd,
        report_data: {
          new_interventions: newInterventions || 0,
          evidence_updates: newEvidence || 0,
          scraper_health: scraperHealth,
          scraper_jobs: jobStats,
        },
      });

    if (insertError) {
      log(`Failed to insert weekly report: ${insertError.message}`, 'error');
      return { success: false, error: insertError.message };
    }

    log(`Weekly report generated: ${newInterventions || 0} new interventions, ${newEvidence || 0} evidence updates`, 'success');
    return { success: true, newInterventions, newEvidence };
  } catch (err) {
    log(`Weekly report generation error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  // Ensure logs directory exists
  try {
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
    // Also run funding scrape and weekly report on weekly schedule
    await runFundingScraper();
    await syncCommunityPrograms();
    await generateWeeklyReport();
  } else if (args.includes('--monthly')) {
    await monthlyJob();
  } else if (args.includes('--funding')) {
    await runFundingScraper();
  } else if (args.includes('--report')) {
    await generateWeeklyReport();
  } else if (args.includes('--sync-programs')) {
    await syncCommunityPrograms();
  } else if (args.includes('--test')) {
    // Quick test run
    log('Running test scrape (top 3)');
    const result = await runScraper(['top', '3']);
    console.log('\n--- Test Result ---');
    console.log(result.output);
    if (result.error) {
      console.log('Error:', result.error);
    }
  } else {
    console.log(`
Usage: node alma-scheduler.mjs [option]

Options:
  --hourly         Scrape top 5 priority sources
  --daily          Full scrape of all source types + SSL fix
  --weekly         Deep scrape + funding + community sync + weekly report
  --monthly        Health check and maintenance
  --funding        Run funding opportunity scrape only
  --report         Generate weekly intelligence report only
  --sync-programs  Sync community programs from ALMA interventions
  --test           Quick test run (top 3)

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
