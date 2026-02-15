#!/usr/bin/env node
/**
 * ALMA Unified Scraper
 * 
 * Consolidated scraper that replaces:
 * - alma-deep-scrape.mjs
 * - alma-enhanced-scrape.mjs
 * - alma-scrape-with-learning.mjs
 * - alma-cost-optimized-extract.mjs
 * 
 * Features:
 * - URL health checking
 * - Circuit breaker pattern
 * - Firecrawl integration for JS rendering
 * - Content quality validation
 * - Progress tracking
 * - Error recovery with exponential backoff
 * - Support for 403-blocked sites via enhanced headers
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import Anthropic from '@anthropic-ai/sdk';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment from both .env.local (dev) and process.env (production)
function loadEnv() {
  const env = { ...process.env };
  
  // Try to load from .env.local if it exists (development)
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
          // Only use .env.local value if not already set in process.env
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch (err) {
      console.warn('Warning: Could not read .env.local, using process.env only');
    }
  }
  
  return env;
}

const env = loadEnv();

// Validate required environment variables
function validateEnv() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FIRECRAWL_API_KEY'];
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these in your environment or .env.local file');
    process.exit(1);
  }
}

validateEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

// State file for resume capability
const STATE_FILE = join(__dirname, '.alma-scraper-state.json');

// Circuit breaker state
const circuitBreakers = new Map();
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60 * 60 * 1000; // 1 hour

// User agents to rotate for 403-blocked sites
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

// Sources registry - loaded from database or uses defaults
async function loadSources() {
  // Try to load from database first
  const { data: dbSources, error } = await supabase
    .from('alma_sources')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.warn(`⚠️  Database error loading sources: ${error.message}`);
    console.warn('   Falling back to default sources');
  }

  if (dbSources && dbSources.length > 0) {
    console.log(`📋 Loaded ${dbSources.length} sources from database`);
    return dbSources;
  }

  // Fall back to default sources
  console.log('📋 Using default source registry');
  return getDefaultSources();
}

function getDefaultSources() {
  return [
    // Government - Priority 1
    { name: 'AIHW Youth Justice', url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice', type: 'government', jurisdiction: 'National', priority: 100, cultural_authority: false },
    { name: 'AIHW Youth Detention', url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024', type: 'government', jurisdiction: 'National', priority: 95, cultural_authority: false },
    { name: 'QLD Youth Justice', url: 'https://www.youthjustice.qld.gov.au/', type: 'government', jurisdiction: 'QLD', priority: 90, cultural_authority: false },
    { name: 'NSW Youth Justice', url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html', type: 'government', jurisdiction: 'NSW', priority: 90, cultural_authority: false },
    { name: 'VIC Youth Justice', url: 'https://www.justice.vic.gov.au/youth-justice', type: 'government', jurisdiction: 'VIC', priority: 90, cultural_authority: false, requires_js: true },
    { name: 'WA Youth Justice', url: 'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services', type: 'government', jurisdiction: 'WA', priority: 85, cultural_authority: false },
    { name: 'SA Youth Justice', url: 'https://www.childprotection.sa.gov.au/youth-justice', type: 'government', jurisdiction: 'SA', priority: 85, cultural_authority: false, requires_js: true },
    { name: 'NT Youth Justice', url: 'https://agd.nt.gov.au/', type: 'government', jurisdiction: 'NT', priority: 85, cultural_authority: false },
    { name: 'TAS Youth Justice', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/', type: 'government', jurisdiction: 'TAS', priority: 85, cultural_authority: false },
    { name: 'ACT Community Services', url: 'https://www.communityservices.act.gov.au/', type: 'government', jurisdiction: 'ACT', priority: 85, cultural_authority: false },

    // Indigenous - Priority 1 (Cultural Authority)
    { name: 'NATSILS', url: 'https://www.natsils.org.au/', type: 'indigenous', jurisdiction: 'National', priority: 100, cultural_authority: true },
    { name: 'SNAICC', url: 'https://www.snaicc.org.au/', type: 'indigenous', jurisdiction: 'National', priority: 95, cultural_authority: true },
    { name: 'QATSICPP', url: 'https://www.qatsicpp.com.au/', type: 'indigenous', jurisdiction: 'QLD', priority: 90, cultural_authority: true },
    { name: 'ALS NSW/ACT', url: 'https://www.alsnswact.org.au/', type: 'indigenous', jurisdiction: 'NSW/ACT', priority: 90, cultural_authority: true, ssl_issues: true },
    { name: 'VALS', url: 'https://www.vals.org.au/', type: 'indigenous', jurisdiction: 'VIC', priority: 90, cultural_authority: true, ssl_issues: true },
    { name: 'NAAJA', url: 'https://www.naaja.org.au/', type: 'indigenous', jurisdiction: 'NT', priority: 90, cultural_authority: true, ssl_issues: true },
    { name: 'ALRM SA', url: 'https://www.alrm.org.au/', type: 'indigenous', jurisdiction: 'SA', priority: 90, cultural_authority: true, ssl_issues: true },
    { name: 'ALS WA', url: 'https://www.als.org.au/', type: 'indigenous', jurisdiction: 'WA', priority: 90, cultural_authority: true, ssl_issues: true },

    // Research - Priority 2
    { name: 'AIC Research', url: 'https://www.aic.gov.au/research', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false, extended_timeout: true },
    { name: 'Clearinghouse for Youth Justice', url: 'https://www.youthjusticeclearinghouse.gov.au/', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false },

    // Advocacy - Priority 2
    { name: 'Youth Law Australia', url: 'https://www.youthlaw.asn.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false, ssl_issues: true },
    { name: 'Human Rights Law Centre', url: 'https://www.hrlc.org.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false, ssl_issues: true },
    { name: 'Amnesty Australia', url: 'https://www.amnesty.org.au/', type: 'advocacy', jurisdiction: 'National', priority: 70, cultural_authority: false },
  ];
}

// Check URL health with enhanced options for 403-blocked sites
async function checkUrlHealth(url, options = {}) {
  const { skipSslVerify = false, useEnhancedHeaders = false } = options;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const headers = {
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    };
    
    if (useEnhancedHeaders) {
      headers['Upgrade-Insecure-Requests'] = '1';
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Cache-Control'] = 'max-age=0';
    }
    
    const fetchOptions = {
      method: 'HEAD',
      signal: controller.signal,
      headers,
    };
    
    // For SSL-issue sites, we need to use https module directly
    if (skipSslVerify) {
      clearTimeout(timeout);
      return await checkUrlHealthWithSslBypass(url);
    }
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);
    
    if (response.status === 200) {
      return { healthy: true };
    } else if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      return { healthy: true, redirectUrl: response.headers.get('location') };
    } else if (response.status === 403) {
      return { healthy: false, error: `HTTP 403 Forbidden - may require browser automation`, blocked: true };
    } else {
      return { healthy: false, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    if (err.message && err.message.includes('SSL')) {
      return { healthy: false, error: 'SSL/Certificate error', sslIssue: true };
    }
    return { healthy: false, error: err.message };
  }
}

// SSL bypass health check for problematic sites
async function checkUrlHealthWithSslBypass(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 10000,
      rejectUnauthorized: false, // Bypass SSL verification
      headers: {
        'User-Agent': USER_AGENTS[0],
      },
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ healthy: true });
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        resolve({ healthy: true, redirectUrl: res.headers.location });
      } else {
        resolve({ healthy: false, error: `HTTP ${res.statusCode}` });
      }
    });
    
    req.on('error', (err) => resolve({ healthy: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false, error: 'Timeout' });
    });
    
    req.end();
  });
}

// Circuit breaker check
function checkCircuitBreaker(domain) {
  const state = circuitBreakers.get(domain);
  if (!state) return true;
  
  if (state.blocked) {
    if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
      circuitBreakers.delete(domain);
      return true;
    }
    return false;
  }
  return true;
}

function recordFailure(domain) {
  const state = circuitBreakers.get(domain) || { failures: 0, lastFailure: 0, blocked: false };
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.blocked = true;
    console.warn(`⚠️  Circuit breaker OPEN for ${domain}`);
  }
  
  circuitBreakers.set(domain, state);
}

function recordSuccess(domain) {
  circuitBreakers.delete(domain);
}

// Scrape a single URL with retry logic and enhanced error handling
async function scrapeSource(source, options = {}) {
  const startTime = Date.now();
  const { skipHealthCheck = false, verbose = false, maxRetries = 3 } = options;
  
  try {
    const urlObj = new URL(source.url);
    const domain = urlObj.hostname;
    
    if (verbose) console.log(`🔍 ${source.name} (${source.url})`);
    
    // Check circuit breaker
    if (!checkCircuitBreaker(domain)) {
      return { 
        success: false, 
        source: source.name,
        error: 'Circuit breaker open',
        duration: Date.now() - startTime
      };
    }
    
    // Check if source requires special handling
    const requiresJs = source.requires_js || source.metadata?.requires_js;
    const hasSslIssues = source.ssl_issues || source.metadata?.ssl_issues;
    const extendedTimeout = source.extended_timeout || source.metadata?.extended_timeout;
    
    // Health check with enhanced options for problematic sites
    if (!skipHealthCheck) {
      const healthOptions = {
        skipSslVerify: hasSslIssues,
        useEnhancedHeaders: requiresJs
      };
      
      const health = await checkUrlHealth(source.url, healthOptions);
      
      if (!health.healthy) {
        // If 403 blocked, suggest using Playwright
        if (health.blocked) {
          return { 
            success: false, 
            source: source.name,
            error: '403 Forbidden - use Playwright scraper for this site',
            requiresPlaywright: true,
            duration: Date.now() - startTime
          };
        }
        
        // If SSL issue, try SSL bypass
        if (health.sslIssue) {
          if (verbose) console.log('   🔧 Retrying with SSL bypass...');
        } else {
          recordFailure(domain);
          return { 
            success: false, 
            source: source.name,
            error: `Health check failed: ${health.error}`,
            duration: Date.now() - startTime
          };
        }
      }
      
      if (health.redirectUrl) {
        source.url = health.redirectUrl;
      }
    }
    
    // Scrape with Firecrawl and retry logic
    let scrapeResult = null;
    let lastError = null;
    
    // Dynamic timeout based on source type
    const baseTimeout = extendedTimeout ? 60000 : requiresJs ? 45000 : 30000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
          if (verbose) console.log(`   🔄 Retry ${attempt}/${maxRetries} after ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
        
        scrapeResult = await firecrawl.scrapeUrl(source.url, {
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          timeout: baseTimeout + (attempt * 10000), // Increase timeout on retries
          waitFor: requiresJs ? 8000 : 0,
        });
        
        if (scrapeResult.success) {
          break; // Success, exit retry loop
        }
        
        lastError = scrapeResult.error;
        
      } catch (err) {
        lastError = err.message;
        if (verbose) console.log(`   ⚠️  Attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
    
    if (!scrapeResult || !scrapeResult.success) {
      recordFailure(domain);
      return { 
        success: false, 
        source: source.name,
        error: scrapeResult?.error || lastError || 'Scraping failed after all retries',
        duration: Date.now() - startTime
      };
    }
    
    // Extract content
    const content = scrapeResult.markdown || scrapeResult.html || '';
    const title = scrapeResult.metadata?.title || source.name;
    
    // Content quality validation
    const minLength = 300; // Reduced from 500 for more permissive scraping
    const hasMeaningfulWords = /youth|justice|program|community|child|young|detention|support|service|legal|aboriginal|indigenous/i.test(content);
    
    if (content.length < minLength || !hasMeaningfulWords) {
      recordFailure(domain);
      return { 
        success: false, 
        source: source.name,
        error: `Content quality check failed: ${content.length < minLength ? 'too short' : 'no relevant keywords'}`,
        duration: Date.now() - startTime
      };
    }
    
    recordSuccess(domain);
    
    return {
      success: true,
      source: source.name,
      title,
      content: content.slice(0, 15000), // Limit storage
      url: source.url,
      type: source.type,
      jurisdiction: source.jurisdiction,
      cultural_authority: source.cultural_authority,
      wordCount: content.split(/\s+/).length,
      duration: Date.now() - startTime,
    };
    
  } catch (err) {
    try {
      const urlObj = new URL(source.url);
      recordFailure(urlObj.hostname);
    } catch {}
    
    return { 
      success: false, 
      source: source.name,
      error: err.message,
      duration: Date.now() - startTime
    };
  }
}

// Store scraped data
async function storeScrapedData(result) {
  try {
    // Add to discovered links
    const { data: linkData, error: linkError } = await supabase
      .from('alma_discovered_links')
      .upsert({
        url: result.url,
        discovered_from: result.url,
        status: 'scraped',
        scraped_at: new Date().toISOString(),
        predicted_type: result.type,
        metadata: {
          title: result.title,
          word_count: result.wordCount,
          cultural_authority: result.cultural_authority,
          jurisdiction: result.jurisdiction,
        },
      }, {
        onConflict: 'url'
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error storing link:', linkError);
      return false;
    }

    // Add to interventions if it's a program
    if (result.type === 'government' || result.type === 'indigenous') {
      const { error: interventionError } = await supabase
        .from('alma_interventions')
        .insert({
          name: result.title,
          description: result.content.slice(0, 500),
          type: result.cultural_authority ? 'Cultural Connection' : 'Prevention',
          consent_level: result.cultural_authority ? 'Community Controlled' : 'Public Knowledge Commons',
          cultural_authority: result.cultural_authority ? result.title : null,
          source_documents: [{ url: result.url, title: result.title, scraped_at: new Date().toISOString() }],
          metadata: {
            scraped_at: new Date().toISOString(),
            word_count: result.wordCount,
            cultural_authority: result.cultural_authority,
            jurisdiction: result.jurisdiction,
            full_content: result.content,
            source_link_id: linkData.id,
          },
        });

      if (interventionError) {
        // Check if it's a duplicate name error
        if (interventionError.code === '23505') {
          console.log(`   ℹ️  Intervention "${result.title}" already exists`);
        } else {
          console.error('Error storing intervention:', interventionError);
        }
      }
    }

    // Log to scrape history
    await supabase.from('alma_scrape_history').insert({
      source_id: result.url,
      url: result.url,
      status: 'success',
      items_found: 1,
      relevance_score: result.cultural_authority ? 1.0 : 0.8,
      novelty_score: 0.5,
      metadata: {
        type: result.type,
        title: result.title,
        word_count: result.wordCount,
        duration: result.duration,
      },
    });

    return true;
  } catch (err) {
    console.error('Error storing data:', err);
    return false;
  }
}

// Main scraping run
async function runScraper(options = {}) {
  const {
    mode = 'quick', // 'quick', 'full', 'health-check'
    jurisdiction = null, // 'QLD', 'NSW', etc. or null for all
    type = null, // 'government', 'indigenous', etc. or null for all
    maxSources = null,
    resume = false,
    verbose = true,
  } = options;

  console.log('\n🔬 ALMA Unified Scraper');
  console.log('═'.repeat(60));
  console.log(`Mode: ${mode}${jurisdiction ? ` | Jurisdiction: ${jurisdiction}` : ''}${type ? ` | Type: ${type}` : ''}`);
  console.log('');

  // Load state if resuming
  let state = { completed: [], failed: [], lastIndex: 0 };
  if (resume && existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      console.log(`📂 Resuming from checkpoint (last index: ${state.lastIndex})`);
    } catch (err) {
      console.warn('⚠️  Could not load state file, starting fresh');
    }
  }

  // Load sources
  const allSources = await loadSources();
  
  // Filter sources
  let sources = allSources.filter(s => {
    if (jurisdiction && s.jurisdiction !== jurisdiction) return false;
    if (type && s.type !== type) return false;
    if (mode === 'quick' && s.priority < 80) return false;
    if (state.completed.includes(s.name)) return false;
    return true;
  });

  if (maxSources) {
    sources = sources.slice(0, maxSources);
  }

  console.log(`📊 Sources to process: ${sources.length}`);
  console.log('');

  // Health check mode
  if (mode === 'health-check') {
    console.log('🏥 Running health checks...\n');
    const results = [];
    
    for (const source of sources) {
      const requiresJs = source.requires_js || source.metadata?.requires_js;
      const hasSslIssues = source.ssl_issues || source.metadata?.ssl_issues;
      
      const health = await checkUrlHealth(source.url, {
        skipSslVerify: hasSslIssues,
        useEnhancedHeaders: requiresJs
      });
      
      results.push({
        name: source.name,
        url: source.url,
        healthy: health.healthy,
        error: health.error,
      });
      
      if (verbose) {
        const status = health.healthy ? '✅' : health.blocked ? '🔒' : health.sslIssue ? '🔐' : '❌';
        console.log(`${status} ${source.name}${health.error ? ` (${health.error})` : ''}`);
      }
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 500));
    }

    const healthy = results.filter(r => r.healthy).length;
    const blocked = results.filter(r => r.error?.includes('403')).length;
    const sslIssues = results.filter(r => r.error?.includes('SSL')).length;
    
    console.log(`\n📈 Health Check Results:`);
    console.log(`   ✅ Healthy: ${healthy}/${results.length}`);
    console.log(`   🔒 Blocked (403): ${blocked}`);
    console.log(`   🔐 SSL Issues: ${sslIssues}`);
    console.log(`   ❌ Other errors: ${results.length - healthy - blocked - sslIssues}`);
    
    return { mode: 'health-check', results };
  }

  // Scraping mode
  const results = {
    successful: [],
    failed: [],
    requiresPlaywright: [],
    duration: 0,
  };

  const startTime = Date.now();

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const progress = `[${i + 1}/${sources.length}]`;
    
    if (verbose) {
      console.log(`${progress} Processing: ${source.name}`);
    }

    const result = await scrapeSource(source, { verbose });
    
    if (result.success) {
      results.successful.push(result);
      state.completed.push(source.name);
      
      // Store in database
      await storeScrapedData(result);
      
      if (verbose) {
        console.log(`   ✅ ${result.wordCount} words in ${result.duration}ms${result.cultural_authority ? ' [Cultural Authority]' : ''}`);
      }
    } else {
      results.failed.push(result);
      state.failed.push(source.name);
      
      if (result.requiresPlaywright) {
        results.requiresPlaywright.push(result);
      }
      
      if (verbose) {
        console.log(`   ❌ ${result.error}`);
      }
    }

    // Save state periodically
    state.lastIndex = i;
    if (i % 5 === 0) {
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }

    // Rate limiting
    if (i < sources.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  results.duration = Date.now() - startTime;

  // Final state save
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  // Report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Scraping Complete');
  console.log('═'.repeat(60));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  if (results.requiresPlaywright.length > 0) {
    console.log(`🔒 Need Playwright: ${results.requiresPlaywright.length}`);
  }
  console.log(`⏱️  Duration: ${(results.duration / 1000).toFixed(1)}s`);
  if (sources.length > 0) {
    console.log(`⚡ Avg time: ${(results.duration / sources.length).toFixed(0)}ms per source`);
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed sources:');
    results.failed.forEach(f => console.log(`   - ${f.source}: ${f.error}`));
  }
  
  if (results.requiresPlaywright.length > 0) {
    console.log('\n🔒 Sites requiring Playwright (403 blocked):');
    results.requiresPlaywright.forEach(f => console.log(`   - ${f.source}`));
    console.log('\n   Run: node scripts/alma-playwright-scrape.mjs');
  }

  // Circuit breaker status
  const blockedDomains = Array.from(circuitBreakers.entries()).filter(([_, s]) => s.blocked);
  if (blockedDomains.length > 0) {
    console.log(`\n⚠️  Blocked domains (circuit breaker): ${blockedDomains.map(([d]) => d).join(', ')}`);
  }

  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'quick';

  const options = {
    mode: 'quick',
    jurisdiction: null,
    type: null,
    maxSources: null,
    resume: args.includes('--resume'),
    verbose: !args.includes('--quiet'),
  };

  // Parse command
  if (['quick', 'full', 'health-check'].includes(command)) {
    options.mode = command;
  } else if (command === 'jurisdiction') {
    options.mode = 'full';
    options.jurisdiction = args[1]?.toUpperCase();
    if (!options.jurisdiction) {
      console.error('Usage: alma-unified-scraper.mjs jurisdiction <QLD|NSW|VIC|...>');
      process.exit(1);
    }
  } else if (command === 'type') {
    options.mode = 'full';
    options.type = args[1];
    if (!options.type) {
      console.error('Usage: alma-unified-scraper.mjs type <government|indigenous|research|...>');
      process.exit(1);
    }
  } else if (command === 'top') {
    options.mode = 'quick';
    options.maxSources = parseInt(args[1]) || 10;
  } else if (command === 'resume') {
    options.resume = true;
    options.mode = 'full';
  } else {
    console.log(`
Usage: node alma-unified-scraper.mjs [command] [options]

Commands:
  quick                    Top priority sources (default)
  full                     All sources
  health-check             Check URL health only
  jurisdiction <name>      Sources for specific state/territory
  type <type>              Sources by type (government/indigenous/research)
  top <n>                  Top N sources by priority
  resume                   Resume interrupted scrape

Options:
  --resume                 Resume from last checkpoint
  --quiet                  Minimal output

Examples:
  node alma-unified-scraper.mjs quick
  node alma-unified-scraper.mjs jurisdiction QLD
  node alma-unified-scraper.mjs type indigenous
  node alma-unified-scraper.mjs full --resume
`);
    process.exit(0);
  }

  try {
    await runScraper(options);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
