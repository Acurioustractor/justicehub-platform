/**
 * Background Scraper Daemon
 * Runs scraping tasks on a schedule in the background
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ScraperConfig {
  enabled: boolean;
  schedule: {
    daily: boolean;
    hourOfDay: number; // 0-23 (AEST)
    daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  };
  batchSize: number;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  notificationEmail?: string;
}

// Load config
function loadConfig(): ScraperConfig {
  const configPath = path.join(process.cwd(), 'config', 'scraper-daemon.json');

  // Default config
  const defaultConfig: ScraperConfig = {
    enabled: true,
    schedule: {
      daily: true,
      hourOfDay: 2, // 2 AM AEST
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    },
    batchSize: 5,
    priorityFilter: 'all',
  };

  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf-8');
    return { ...defaultConfig, ...JSON.parse(configData) };
  }

  return defaultConfig;
}

// Log to file
function log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  console.log(logMessage);

  // Append to log file
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `scraper-daemon-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Run scraper
async function runScraper(config: ScraperConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    log(`Starting scraper batch (size: ${config.batchSize}, priority: ${config.priorityFilter})`);

    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'scrape-qld-services-batch.ts');

    const child = spawn('npx', [
      'tsx',
      scriptPath,
      config.batchSize.toString(),
      config.priorityFilter,
    ], {
      env: { ...process.env, NODE_OPTIONS: '--require dotenv/config' },
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      log(output.trim());
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      log(output.trim(), 'error');
    });

    child.on('close', (code) => {
      if (code === 0) {
        log('Scraper batch completed successfully');
        resolve();
      } else {
        log(`Scraper batch failed with code ${code}`, 'error');
        reject(new Error(`Scraper failed with code ${code}`));
      }

      // Save detailed logs
      const logDir = path.join(process.cwd(), 'logs', 'scraper-runs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const runLogFile = path.join(logDir, `run-${new Date().toISOString()}.log`);
      fs.writeFileSync(runLogFile, `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);
    });
  });
}

// Check if should run now
function shouldRunNow(config: ScraperConfig): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  // Check if current day is in schedule
  if (!config.schedule.daysOfWeek.includes(currentDay)) {
    return false;
  }

  // Check if current hour matches scheduled hour
  return currentHour === config.schedule.hourOfDay;
}

// Main daemon loop
async function main() {
  log('🤖 Scraper Daemon starting...');

  const config = loadConfig();

  if (!config.enabled) {
    log('Scraper daemon is disabled in config', 'warn');
    process.exit(0);
  }

  log(`Schedule: ${config.schedule.daily ? 'Daily' : 'Weekly'} at ${config.schedule.hourOfDay}:00`);
  log(`Days of week: ${config.schedule.daysOfWeek.join(', ')}`);
  log(`Batch size: ${config.batchSize}`);
  log(`Priority filter: ${config.priorityFilter}`);

  // Track last run
  let lastRunDate: string | null = null;

  // Check every hour
  const checkInterval = 60 * 60 * 1000; // 1 hour

  while (true) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // Check if we should run
      if (shouldRunNow(config) && lastRunDate !== today) {
        log('📅 Scheduled run triggered');
        await runScraper(config);
        lastRunDate = today;
        log('✅ Scheduled run completed');
      } else {
        const nextRun = new Date(now);
        nextRun.setHours(config.schedule.hourOfDay, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        log(`⏳ Next scheduled run: ${nextRun.toISOString()}`);
      }
    } catch (error) {
      log(`Error during scraper run: ${error}`, 'error');
    }

    // Wait for next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Scraper Daemon shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Scraper Daemon terminating...');
  process.exit(0);
});

// Run daemon
main().catch(error => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});
