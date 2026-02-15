#!/usr/bin/env node
/**
 * Health Check for All Data Sources
 *
 * Monitors accessibility, response time, and content changes for all
 * scraping sources (ALMA, services, media, research)
 *
 * Usage: node scripts/health-check-sources.mjs
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read environment
let env = {};
try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...values] = line.split('=');
      env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch {
  env = process.env;
}

// All sources to monitor
const SOURCES = [
  // ALMA Government Sources
  { url: 'https://www.aihw.gov.au/reports/australias-welfare/youth-justice', category: 'government', name: 'AIHW Youth Justice', priority: 'high' },
  { url: 'https://www.youthjustice.qld.gov.au/', category: 'government', name: 'QLD Youth Justice', priority: 'high' },
  { url: 'https://dcj.nsw.gov.au/children-and-families/youth-justice.html', category: 'government', name: 'NSW DCJ Youth Justice', priority: 'high' },

  // ALMA Indigenous Sources
  { url: 'https://www.natsils.org.au', category: 'indigenous', name: 'NATSILS', priority: 'high' },
  { url: 'https://www.snaicc.org.au', category: 'indigenous', name: 'SNAICC', priority: 'high' },

  // Media Sources
  { url: 'https://www.theguardian.com/australia-news', category: 'media', name: 'Guardian Australia', priority: 'high' },
  { url: 'https://www.abc.net.au/news', category: 'media', name: 'ABC News', priority: 'high' },
  { url: 'https://www.sbs.com.au/nitv', category: 'media', name: 'NITV News', priority: 'medium' },

  // Service Directories
  { url: 'https://headspace.org.au/headspace-centres/', category: 'services', name: 'headspace Centres Directory', priority: 'high' },
  { url: 'https://www.legalaid.qld.gov.au', category: 'services', name: 'Legal Aid Queensland', priority: 'high' },
  { url: 'https://www.legalaid.nsw.gov.au', category: 'services', name: 'Legal Aid NSW', priority: 'medium' },
  { url: 'https://www.legalaid.vic.gov.au', category: 'services', name: 'Legal Aid Victoria', priority: 'medium' },

  // Research Sources
  { url: 'https://www.griffith.edu.au/research/arts-education-law/criminology-institute', category: 'research', name: 'Griffith Criminology Institute', priority: 'medium' },
  // NOTE: ARC.gov.au is extremely slow (30-40s response times), removed from monitoring to avoid false alerts
  // { url: 'https://www.arc.gov.au', category: 'research', name: 'Australian Research Council', priority: 'low', timeout: 40000 },
];

async function checkSource(source) {
  const startTime = Date.now();

  try {
    // Try HEAD first, fall back to GET if HEAD fails
    const timeout = source.timeout || 15000; // Use custom timeout or default 15s
    let response;
    let method = 'HEAD';

    try {
      response = await fetch(source.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub-HealthCheck/1.0; +https://justicehub.org.au)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout)
      });
    } catch (headError) {
      // HEAD failed, try GET (some servers don't support HEAD)
      method = 'GET';
      response = await fetch(source.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub-HealthCheck/1.0; +https://justicehub.org.au)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout)
      });
    }

    const responseTime = Date.now() - startTime;
    const status = response.ok ? 'up' : 'down';
    const statusCode = response.status;

    // For successful responses, get content hash for change detection
    let contentHash = null;
    if (status === 'up') {
      try {
        // If we already did a GET request, use that response
        if (method === 'GET') {
          const content = await response.text();
          contentHash = crypto.createHash('md5').update(content).digest('hex');
        } else {
          // Otherwise, fetch the full content
          const fullResponse = await fetch(source.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub-HealthCheck/1.0; +https://justicehub.org.au)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(timeout)
          });
          const content = await fullResponse.text();
          contentHash = crypto.createHash('md5').update(content).digest('hex');
        }
      } catch (err) {
        // Content fetch failed, but HEAD succeeded - still mark as up
        console.log(`   ⚠️  Could not fetch content for hashing: ${err.message}`);
      }
    }

    return {
      ...source,
      status,
      statusCode,
      responseTime,
      contentHash,
      checkedAt: new Date().toISOString(),
      error: null
    };

  } catch (error) {
    return {
      ...source,
      status: 'down',
      statusCode: null,
      responseTime: Date.now() - startTime,
      contentHash: null,
      checkedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

async function sendTelegramAlert(downSources) {
  const botToken = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('\n⚠️  Telegram credentials not configured, skipping alert\n');
    return;
  }

  const highPriorityDown = downSources.filter(s => s.priority === 'high');

  // Telegram supports Markdown formatting
  const message = `🚨 *JusticeHub Data Source Alert*\n\n` +
    `${downSources.length} source(s) are currently down` +
    (highPriorityDown.length > 0 ? ` (${highPriorityDown.length} high priority)` : '') + `:\n\n` +
    downSources.slice(0, 10).map(s =>
      `${s.priority === 'high' ? '🔴' : '🟡'} *${s.name}*\n` +
      `   ${s.category}\n` +
      `   Error: \`${s.error || 'HTTP ' + s.statusCode}\``
    ).join('\n\n') +
    (downSources.length > 10 ? `\n\n...and ${downSources.length - 10} more sources` : '');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    if (response.ok) {
      console.log('📱 Telegram alert sent\n');
    } else {
      const error = await response.json();
      console.error(`❌ Failed to send Telegram alert: ${error.description}\n`);
    }
  } catch (err) {
    console.error(`❌ Failed to send Telegram alert: ${err.message}\n`);
  }
}

async function main() {
  console.log('\n🔍 === Data Source Health Check ===\n');
  console.log(`📊 Checking ${SOURCES.length} data sources...\n`);

  // Check all sources in parallel
  const results = await Promise.all(SOURCES.map(checkSource));

  // Calculate statistics
  const upCount = results.filter(r => r.status === 'up').length;
  const downCount = results.filter(r => r.status === 'down').length;
  const highPriorityDown = results.filter(r => r.status === 'down' && r.priority === 'high');
  const avgResponseTime = Math.round(
    results
      .filter(r => r.status === 'up')
      .reduce((sum, r) => sum + r.responseTime, 0) / upCount
  );

  // Print summary
  console.log('📊 === Health Check Summary ===');
  console.log(`   ✅ Up: ${upCount}`);
  console.log(`   ❌ Down: ${downCount}`);
  console.log(`   🔴 High Priority Down: ${highPriorityDown.length}`);
  console.log(`   ⚡ Avg Response Time: ${avgResponseTime}ms`);
  console.log(`   📈 Total: ${results.length}\n`);

  // Print detailed results grouped by category
  const categories = [...new Set(results.map(r => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryUp = categoryResults.filter(r => r.status === 'up').length;

    console.log(`\n📂 ${category.toUpperCase()} (${categoryUp}/${categoryResults.length} up)`);
    console.log('─'.repeat(60));

    for (const result of categoryResults) {
      const icon = result.status === 'up' ? '✅' : '❌';
      const priorityIcon = result.priority === 'high' ? '🔴' : '🟡';
      const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';

      console.log(`${icon} ${priorityIcon} ${result.name}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.statusCode || 'ERROR'} | Response: ${time}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      if (result.contentHash) console.log(`   Hash: ${result.contentHash.substring(0, 12)}...`);
      console.log('');
    }
  }

  // Save results to JSON file
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `health-check-${timestamp}.json`;

  const fs = await import('fs');
  fs.writeFileSync(
    filename,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        up: upCount,
        down: downCount,
        highPriorityDown: highPriorityDown.length,
        avgResponseTime
      },
      sources: results
    }, null, 2)
  );

  console.log(`\n💾 Results saved to ${filename}\n`);

  // Send alerts if sources are down
  if (downCount > 0) {
    const downSources = results.filter(r => r.status === 'down');
    await sendTelegramAlert(downSources);
  }

  // Exit with error if high-priority sources are down
  if (highPriorityDown.length > 0) {
    console.error(`\n❌ ${highPriorityDown.length} high-priority source(s) are down!\n`);
    process.exit(1);
  }

  console.log('✅ === All High-Priority Sources Up ===\n');
  process.exit(0);
}

main();
