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
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
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

const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// State file for resume capability
const STATE_FILE = join(__dirname, '.alma-scraper-state.json');

// Circuit breaker state
const circuitBreakers = new Map();
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60 * 60 * 1000;

// Sources registry - loaded from database or uses defaults
async function loadSources() {
  // Try to load from database first
  const { data: dbSources } = await supabase
    .from('alma_sources')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false });

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
    { name: 'ALS NSW/ACT', url: 'https://www.alsnswact.org.au/', type: 'indigenous', jurisdiction: 'NSW/ACT', priority: 90, cultural_authority: true },
    { name: 'VALS', url: 'https://www.vals.org.au/', type: 'indigenous', jurisdiction: 'VIC', priority: 90, cultural_authority: true },
    { name: 'NAAJA', url: 'https://www.naaja.org.au/', type: 'indigenous', jurisdiction: 'NT', priority: 90, cultural_authority: true },
    { name: 'ALRM SA', url: 'https://www.alrm.org.au/', type: 'indigenous', jurisdiction: 'SA', priority: 90, cultural_authority: true },
    { name: 'ALS WA', url: 'https://www.als.org.au/', type: 'indigenous', jurisdiction: 'WA', priority: 90, cultural_authority: true },

    // Research - Priority 2
    { name: 'AIC Research', url: 'https://www.aic.gov.au/research', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false },
    { name: 'Clearinghouse for Youth Justice', url: 'https://www.youthjusticeclearinghouse.gov.au/', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false },

    // Advocacy - Priority 2
    { name: 'Youth Law Australia', url: 'https://www.youthlaw.asn.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false },
    { name: 'Human Rights Law Centre', url: 'https://www.hrlc.org.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false },
    { name: 'Amnesty Australia', url: 'https://www.amnesty.org.au/', type: 'advocacy', jurisdiction: 'National', priority: 70, cultural_authority: false },
  ];
}

// Check URL health
async function checkUrlHealth(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'JusticeHub-ALMA-Scraper/1.0 (Research Bot)',
      },
    });
    
    clearTimeout(timeout);
    
    if (response.status === 200) {
      return { healthy: true };
    } else if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      return { healthy: true, redirectUrl: response.headers.get('location') };
    } else {
      return { healthy: false, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    return { healthy: false, error: err.message };
  }
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

// Scrape a single URL with retry logic
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
    
    // Health check
    if (!skipHealthCheck) {
      const health = await checkUrlHealth(source.url);
      if (!health.healthy) {
        recordFailure(domain);
        return { 
          success: false, 
          source: source.name,
          error: `Health check failed: ${health.error}`,
          duration: Date.now() - startTime
        };
      }
      if (health.redirectUrl) {
        source.url = health.redirectUrl;
      }
    }
    
    // Scrape with Firecrawl and retry logic
    let scrapeResult = null;
    let lastError = null;
    
    // Dynamic timeout based on source type
    const baseTimeout = source.requires_js ? 45000 : 30000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          if (verbose) console.log(`   🔄 Retry ${attempt}/${maxRetries} after ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
        
        scrapeResult = await firecrawl.scrapeUrl(source.url, {
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          timeout: baseTimeout + (attempt * 10000), // Increase timeout on retries
          waitFor: source.requires_js ? 5000 : 0,
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
    const minLength = 500;
    const hasMeaningfulWords = /youth|justice|program|community|child|young|detention|support/i.test(content);
    
    if (content.length < minLength || !hasMeaningfulWords) {
      recordFailure(domain);
      return { 
        success: false, 
        source: source.name,
        error: `Content quality check failed`,
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
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    console.log(`📂 Resuming from checkpoint (last index: ${state.lastIndex})`);
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
      const health = await checkUrlHealth(source.url);
      results.push({
        name: source.name,
        url: source.url,
        healthy: health.healthy,
        error: health.error,
      });
      
      if (verbose) {
        const status = health.healthy ? '✅' : '❌';
        console.log(`${status} ${source.name}${health.error ? ` (${health.error})` : ''}`);
      }
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 500));
    }

    const healthy = results.filter(r => r.healthy).length;
    console.log(`\n📈 Health Check Results: ${healthy}/${results.length} sources healthy`);
    
    return { mode: 'health-check', results };
  }

  // Scraping mode
  const results = {
    successful: [],
    failed: [],
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
  console.log(`⏱️  Duration: ${(results.duration / 1000).toFixed(1)}s`);
  console.log(`⚡ Avg time: ${(results.duration / sources.length).toFixed(0)}ms per source`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed sources:');
    results.failed.forEach(f => console.log(`   - ${f.source}: ${f.error}`));
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
