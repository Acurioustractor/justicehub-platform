#!/usr/bin/env node
/**
 * ALMA SSL Fix Scraper
 * 
 * Special scraper for sites that fail with SSL/certificate errors.
 * Uses node-fetch with rejectUnauthorized: false
 * 
 * Usage:
 *   node alma-ssl-fix-scraper.mjs
 */

import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

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

// Sources that failed with SSL/fetch errors
const SSL_FAILED_SOURCES = [
  { name: 'ALS NSW/ACT', url: 'https://www.alsnswact.org.au/', type: 'indigenous', jurisdiction: 'NSW/ACT', priority: 90, cultural_authority: true },
  { name: 'VALS', url: 'https://www.vals.org.au/', type: 'indigenous', jurisdiction: 'VIC', priority: 90, cultural_authority: true },
  { name: 'NAAJA', url: 'https://www.naaja.org.au/', type: 'indigenous', jurisdiction: 'NT', priority: 90, cultural_authority: true },
  { name: 'ALRM SA', url: 'https://www.alrm.org.au/', type: 'indigenous', jurisdiction: 'SA', priority: 90, cultural_authority: true },
  { name: 'ALS WA', url: 'https://www.als.org.au/', type: 'indigenous', jurisdiction: 'WA', priority: 90, cultural_authority: true },
  { name: 'AIC Research', url: 'https://www.aic.gov.au/research', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false },
  { name: 'Youth Law Australia', url: 'https://www.youthlaw.asn.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false },
  { name: 'Human Rights Law Centre', url: 'https://www.hrlc.org.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false },
];

console.log('\n🔧 ALMA SSL Fix Scraper');
console.log('═'.repeat(60));
console.log(`Processing ${SSL_FAILED_SOURCES.length} sources that failed SSL verification\n`);

async function scrapeWithSSLFix(source) {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 ${source.name} (${source.url})`);
    
    // Skip SSL verification in health check
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const healthCheck = await new Promise((resolve) => {
      const req = https.get(source.url, { agent, timeout: 10000 }, (res) => {
        resolve({ healthy: res.statusCode === 200, statusCode: res.statusCode });
      });
      req.on('error', (err) => resolve({ healthy: false, error: err.message }));
      req.on('timeout', () => resolve({ healthy: false, error: 'Timeout' }));
    });
    
    if (!healthCheck.healthy) {
      console.log(`   ❌ Health check failed: HTTP ${healthCheck.statusCode || healthCheck.error}`);
      return { success: false, source: source.name, error: 'Health check failed' };
    }
    
    console.log('   ✅ Health check passed');
    
    // Scrape with Firecrawl (Firecrawl handles SSL internally)
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: source.name === 'AIC Research' ? 60000 : 45000,
    });
    
    if (!scrapeResult.success) {
      console.log(`   ❌ Scrape failed: ${scrapeResult.error}`);
      return { success: false, source: source.name, error: scrapeResult.error };
    }
    
    const content = scrapeResult.markdown || scrapeResult.html || '';
    const title = scrapeResult.metadata?.title || source.name;
    
    if (content.length < 500) {
      console.log(`   ❌ Content too short: ${content.length} chars`);
      return { success: false, source: source.name, error: 'Content too short' };
    }
    
    console.log(`   ✅ ${content.split(/\s+/).length} words in ${Date.now() - startTime}ms${source.cultural_authority ? ' [Cultural Authority]' : ''}`);
    
    return {
      success: true,
      source: source.name,
      title,
      content: content.slice(0, 15000),
      url: source.url,
      type: source.type,
      jurisdiction: source.jurisdiction,
      cultural_authority: source.cultural_authority,
      wordCount: content.split(/\s+/).length,
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
    console.log('\n❌ Still failed:');
    results.failed.forEach(f => console.log(`   - ${f.source}: ${f.error}`));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
