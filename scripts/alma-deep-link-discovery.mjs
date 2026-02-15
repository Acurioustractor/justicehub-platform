#!/usr/bin/env node
/**
 * ALMA Deep Link Discovery
 * 
 * Crawl 2-3 levels deep from already-scraped sources
 * Finds sub-pages, program pages, and related content
 * 
 * Usage:
 *   node alma-deep-link-discovery.mjs --depth 2
 *   node alma-deep-link-discovery.mjs --depth 3 --limit 500
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
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
    } catch {}
  }
  return env;
}

const env = loadEnv();

// Validate environment
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FIRECRAWL_API_KEY'];
const missing = required.filter(key => !env[key]);
if (missing.length > 0) {
  console.error('❌ Missing:', missing.join(', '));
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

// Parse arguments
const args = process.argv.slice(2);
const maxDepth = parseInt(args.find((_, i) => args[i-1] === '--depth') || '2');
const linkLimit = parseInt(args.find((_, i) => args[i-1] === '--limit') || '1000');
const dryRun = args.includes('--dry-run');

console.log('\n🔍 ALMA Deep Link Discovery');
console.log('═'.repeat(60));
console.log(`Max Depth: ${maxDepth} | Link Limit: ${linkLimit}`);
console.log(dryRun ? '🧪 DRY RUN - not saving to database\n' : '');

// Australian youth justice relevant domains
const RELEVANT_DOMAINS = [
  'gov.au',
  'org.au',
  'asn.au',
  'edu.au',
  'aihw.gov.au',
  'aic.gov.au',
  'natsils.org.au',
  'snaicc.org.au',
  'alsnswact.org.au',
  'vals.org.au',
  'naaja.org.au',
  'alrm.org.au',
  'als.org.au',
];

// Keywords for relevance scoring
const RELEVANCE_KEYWORDS = [
  'youth', 'young people', 'juvenile', 'young person',
  'justice', 'legal', 'court', 'detention',
  'aboriginal', 'indigenous', 'torres strait',
  'program', 'service', 'support', 'intervention',
  'diversion', 'prevention', 'rehabilitation',
  'community', 'family', 'housing', 'mental health',
  'queensland', 'qld', 'nsw', 'victoria', 'vic', 'wa', 'sa', 'tas', 'nt', 'act'
];

// Irrelevant URL patterns
const SKIP_PATTERNS = [
  /facebook\.com/, /twitter\.com/, /instagram\.com/,
  /linkedin\.com/, /youtube\.com/, /vimeo\.com/,
  /\.pdf$/, /\.doc$/, /\.docx$/,
  /login/, /signin/, /admin/,
  /calendar/, /event\/\d{4}/,
  /news\/\d{4}/, /blog\/\d{4}/,
];

// Check if URL is relevant
function isRelevantUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Check domain relevance
    const isAuDomain = RELEVANT_DOMAINS.some(d => urlObj.hostname.includes(d));
    
    // Check for skip patterns
    const shouldSkip = SKIP_PATTERNS.some(pattern => pattern.test(url));
    
    return isAuDomain && !shouldSkip;
  } catch {
    return false;
  }
}

// Calculate relevance score
function calculateRelevance(url, linkText = '') {
  let score = 0;
  const text = (url + ' ' + linkText).toLowerCase();
  
  // Domain bonus
  if (RELEVANT_DOMAINS.some(d => text.includes(d))) score += 20;
  
  // Keyword matches
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (text.includes(keyword)) score += 10;
  }
  
  // Path relevance
  if (/\/(programs?|services?|about|what-we-do)/.test(url)) score += 15;
  if (/\/(youth|young|juvenile)/.test(url)) score += 20;
  if (/\/(aboriginal|indigenous|first-nations)/.test(url)) score += 25;
  
  // Penalize likely irrelevant pages
  if (/contact|privacy|terms|sitemap/.test(url)) score -= 20;
  if (/\d{4}/.test(url)) score -= 10; // Year-based URLs often news
  
  return Math.max(0, Math.min(100, score));
}

// Determine link type
function predictType(url, linkText = '') {
  const text = (url + ' ' + linkText).toLowerCase();
  
  if (/government|gov\.au|department|dcj|justice|agd/.test(text)) return 'government';
  if (/aboriginal|indigenous|natsils|snaicc|als|vals|naaja|alrm/.test(text)) return 'indigenous';
  if (/research|report|study|evaluation|aihw|aic/.test(text)) return 'research';
  if (/advocacy|law|legal|rights|amnesty|hrlc/.test(text)) return 'advocacy';
  if (/program|service|support|intervention/.test(text)) return 'program';
  return 'website';
}

// Fetch and extract links from a page
async function extractLinks(url) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: false, // We want all links
      timeout: 30000,
    });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Extract links from HTML
    const html = result.html || '';
    const links = [];
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].trim();
      
      // Resolve relative URLs
      let fullUrl;
      try {
        fullUrl = new URL(href, url).href;
      } catch {
        continue;
      }
      
      // Skip non-HTTP links
      if (!fullUrl.startsWith('http')) continue;
      
      // Skip same-page anchors
      if (fullUrl.split('#')[0] === url) continue;
      
      links.push({ url: fullUrl, text });
    }
    
    return {
      success: true,
      links: links.filter(l => isRelevantUrl(l.url)),
      title: result.metadata?.title || '',
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Main discovery function
async function deepDiscovery() {
  // Get already scraped pages as starting points
  const { data: scrapedLinks } = await supabase
    .from('alma_discovered_links')
    .select('url')
    .eq('status', 'scraped')
    .limit(50);
  
  const startingUrls = scrapedLinks?.map(l => l.url) || [];
  
  console.log(`🚀 Starting from ${startingUrls.length} scraped pages\n`);
  
  const discovered = new Map(); // URL -> { relevance, type, source, depth }
  const processed = new Set();
  
  // BFS traversal
  let queue = startingUrls.map(url => ({ url, depth: 1, source: 'seed' }));
  
  while (queue.length > 0 && discovered.size < linkLimit) {
    const { url, depth, source } = queue.shift();
    
    if (processed.has(url) || depth > maxDepth) continue;
    processed.add(url);
    
    console.log(`[Depth ${depth}] ${url.substring(0, 60)}...`);
    
    const result = await extractLinks(url);
    
    if (!result.success) {
      console.log(`   ❌ ${result.error}`);
      continue;
    }
    
    console.log(`   📎 Found ${result.links.length} links`);
    
    // Process discovered links
    for (const link of result.links) {
      if (discovered.has(link.url)) continue;
      
      const relevance = calculateRelevance(link.url, link.text);
      const type = predictType(link.url, link.text);
      
      // Only keep high-relevance links
      if (relevance >= 30) {
        discovered.set(link.url, {
          url: link.url,
          relevance,
          type,
          source: url,
          depth,
          linkText: link.text,
        });
        
        // Add to queue for next depth level
        if (depth < maxDepth) {
          queue.push({ url: link.url, depth: depth + 1, source: url });
        }
      }
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n📊 Discovery Complete`);
  console.log(`   Total discovered: ${discovered.size} links`);
  console.log(`   Processed pages: ${processed.size}`);
  
  // Group by type
  const byType = {};
  for (const [_, data] of discovered) {
    byType[data.type] = (byType[data.type] || 0) + 1;
  }
  
  console.log('\n📋 By Type:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`   ${type}: ${count}`));
  
  // Filter for high-relevance only
  const highRelevance = Array.from(discovered.values())
    .filter(d => d.relevance >= 50)
    .sort((a, b) => b.relevance - a.relevance);
  
  console.log(`\n⭐ High Relevance (50+): ${highRelevance.length}`);
  
  // Save to database
  if (!dryRun && highRelevance.length > 0) {
    console.log('\n💾 Saving to database...');
    
    const toInsert = highRelevance.map(d => ({
      url: d.url,
      discovered_from: d.source,
      predicted_type: d.type,
      predicted_relevance: d.relevance / 100,
      status: 'pending',
      metadata: {
        discovered_at: new Date().toISOString(),
        discovery_depth: d.depth,
        link_text: d.linkText,
      },
    }));
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('alma_discovered_links')
        .upsert(batch, { onConflict: 'url', ignoreDuplicates: true })
        .select();
      
      if (error) {
        console.error(`   ❌ Batch ${i}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
        console.log(`   ✅ Batch ${i}: ${data?.length || 0} inserted`);
      }
    }
    
    console.log(`\n🎉 Added ${inserted} new links to queue!`);
  } else if (dryRun) {
    console.log('\n🧪 DRY RUN - Would save:', highRelevance.length, 'links');
    console.log('\nTop 10 discoveries:');
    highRelevance.slice(0, 10).forEach(d => {
      console.log(`   [${d.relevance}] ${d.type} - ${d.url.substring(0, 50)}...`);
    });
  }
  
  return discovered;
}

deepDiscovery().catch(console.error);
