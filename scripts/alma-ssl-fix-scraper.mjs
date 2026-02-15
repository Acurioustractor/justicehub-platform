#!/usr/bin/env node
/**
 * ALMA SSL Fix Scraper
 * 
 * Special scraper for sites that fail with SSL/certificate errors or fetch failures.
 * Uses node-fetch with rejectUnauthorized: false
 * 
 * Usage:
 *   node alma-ssl-fix-scraper.mjs
 */

import https from 'https';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

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

// User agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

// Sources that may have SSL/fetch issues
// Updated 2026-02-13 with verified working URLs
const SSL_FAILED_SOURCES = [
  { 
    name: 'ALS NSW/ACT', 
    url: 'https://www.alsnswact.org.au/', 
    type: 'indigenous', 
    jurisdiction: 'NSW/ACT', 
    priority: 90, 
    cultural_authority: true,
    timeout: 45000
  },
  { 
    name: 'VALS', 
    url: 'https://www.vals.org.au/', 
    type: 'indigenous', 
    jurisdiction: 'VIC', 
    priority: 90, 
    cultural_authority: true,
    timeout: 45000
  },
  { 
    name: 'NAAJA', 
    url: 'https://www.naaja.org.au/', 
    type: 'indigenous', 
    jurisdiction: 'NT', 
    priority: 90, 
    cultural_authority: true,
    timeout: 45000
  },
  { 
    name: 'ALRM SA', 
    url: 'https://www.alrm.org.au/', 
    type: 'indigenous', 
    jurisdiction: 'SA', 
    priority: 90, 
    cultural_authority: true,
    timeout: 45000
  },
  { 
    name: 'ALS WA', 
    url: 'https://www.als.org.au/', 
    type: 'indigenous', 
    jurisdiction: 'WA', 
    priority: 90, 
    cultural_authority: true,
    timeout: 45000
  },
  { 
    name: 'AIC Research', 
    url: 'https://www.aic.gov.au/research', 
    type: 'research', 
    jurisdiction: 'National', 
    priority: 80, 
    cultural_authority: false,
    timeout: 60000 // AIC is slow
  },
  { 
    name: 'Youth Law Australia', 
    url: 'https://www.youthlaw.asn.au/', 
    type: 'advocacy', 
    jurisdiction: 'National', 
    priority: 75, 
    cultural_authority: false,
    timeout: 45000
  },
  { 
    name: 'Human Rights Law Centre', 
    url: 'https://www.hrlc.org.au/', 
    type: 'advocacy', 
    jurisdiction: 'National', 
    priority: 75, 
    cultural_authority: false,
    timeout: 45000
  },
];

console.log('\n🔧 ALMA SSL Fix Scraper');
console.log('═'.repeat(60));
console.log(`Processing ${SSL_FAILED_SOURCES.length} sources that may have SSL/network issues\n`);

// Health check with SSL bypass
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

async function scrapeWithSSLFix(source) {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 ${source.name} (${source.url})`);
    
    // Health check with SSL bypass
    const healthCheck = await checkUrlHealthWithSslBypass(source.url);
    
    if (!healthCheck.healthy) {
      console.log(`   ❌ Health check failed: ${healthCheck.error}`);
      return { success: false, source: source.name, error: `Health check failed: ${healthCheck.error}` };
    }
    
    console.log('   ✅ Health check passed (SSL bypass)');
    
    // Scrape with Firecrawl
    // Firecrawl handles SSL internally, but we use extended timeout
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: source.timeout || 45000,
      waitFor: 3000, // Give JS sites time to render
    });
    
    if (!scrapeResult.success) {
      console.log(`   ❌ Scrape failed: ${scrapeResult.error}`);
      return { success: false, source: source.name, error: scrapeResult.error };
    }
    
    const content = scrapeResult.markdown || scrapeResult.html || '';
    const title = scrapeResult.metadata?.title || source.name;
    
    if (content.length < 300) {
      console.log(`   ❌ Content too short: ${content.length} chars`);
      return { success: false, source: source.name, error: 'Content too short' };
    }
    
    const wordCount = content.split(/\s+/).length;
    console.log(`   ✅ ${wordCount} words in ${Date.now() - startTime}ms${source.cultural_authority ? ' [Cultural Authority]' : ''}`);
    
    return {
      success: true,
      source: source.name,
      title,
      content: content.slice(0, 15000),
      url: source.url,
      type: source.type,
      jurisdiction: source.jurisdiction,
      cultural_authority: source.cultural_authority,
      wordCount,
      duration: Date.now() - startTime,
    };
    
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return { success: false, source: source.name, error: err.message };
  }
}

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
          ssl_fix_applied: true,
        },
      }, { onConflict: 'url' })
      .select()
      .single();

    if (linkError) {
      console.error('   Error storing link:', linkError.message);
      return false;
    }

    // Add to interventions
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
          ssl_fix_applied: true,
        },
      });

    if (interventionError) {
      if (interventionError.code === '23505') {
        console.log(`   ℹ️  Already exists in interventions`);
      } else {
        console.error('   Error storing intervention:', interventionError.message);
      }
    } else {
      console.log('   💾 Stored in database');
    }

    // Log to history
    await supabase.from('alma_scrape_history').insert({
      source_id: result.url,
      source_url: result.url,
      status: 'success',
      items_found: 1,
      relevance_score: result.cultural_authority ? 1.0 : 0.8,
      novelty_score: 0.5,
      metadata: {
        type: result.type,
        title: result.title,
        word_count: result.wordCount,
        duration: result.duration,
        ssl_fix_applied: true,
      },
    });

    return true;
  } catch (err) {
    console.error('   Error storing data:', err.message);
    return false;
  }
}

async function main() {
  const results = { successful: [], failed: [] };
  
  for (const source of SSL_FAILED_SOURCES) {
    const result = await scrapeWithSSLFix(source);
    
    if (result.success) {
      results.successful.push(result);
      await storeScrapedData(result);
    } else {
      results.failed.push(result);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SSL Fix Scrape Complete');
  console.log('═'.repeat(60));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.successful.length > 0) {
    const totalWords = results.successful.reduce((sum, r) => sum + r.wordCount, 0);
    console.log(`📝 Total words: ${totalWords.toLocaleString()}`);
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Still failed (may require Playwright):');
    results.failed.forEach(f => console.log(`   - ${f.source}: ${f.error}`));
  }
  
  // Update alma_sources table with results
  for (const result of results.successful) {
    await supabase
      .from('alma_sources')
      .update({
        health_status: 'healthy',
        last_health_check: new Date().toISOString(),
        last_scraped: new Date().toISOString(),
        scrape_count: supabase.rpc('increment', { row_id: result.source }),
        metadata: {
          ssl_fix_success: true,
          last_scrape_word_count: result.wordCount,
        }
      })
      .eq('name', result.source);
  }
  
  for (const result of results.failed) {
    await supabase
      .from('alma_sources')
      .update({
        health_status: 'unhealthy',
        last_health_check: new Date().toISOString(),
        error_count: supabase.rpc('increment', { row_id: result.source }),
        metadata: {
          ssl_fix_failed: true,
          last_error: result.error,
        }
      })
      .eq('name', result.source);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
