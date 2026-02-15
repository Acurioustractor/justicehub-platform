#!/usr/bin/env node
/**
 * ALMA RSS/Feed Monitor
 * 
 * Monitors RSS feeds and news sources for new content
 * Automatically adds new articles to the scraping queue
 * 
 * Usage:
 *   node alma-feed-monitor.mjs --once       (single check)
 *   node alma-feed-monitor.mjs --daemon     (continuous monitoring)
 *   node alma-feed-monitor.mjs --setup      (initialize feed list)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

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
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter(key => !env[key]);
if (missing.length > 0) {
  console.error('❌ Missing:', missing.join(', '));
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const rssParser = new Parser();

// Parse arguments
const args = process.argv.slice(2);
const mode = args.includes('--daemon') ? 'daemon' : args.includes('--setup') ? 'setup' : 'once';
const intervalMinutes = parseInt(args.find((_, i) => args[i-1] === '--interval') || '60');

// Feed sources to monitor
const FEEDS = [
  // Government
  { name: 'AIHW', url: 'https://www.aihw.gov.au/rss', type: 'research', relevance: 0.9 },
  { name: 'AIC', url: 'https://www.aic.gov.au/rss.xml', type: 'research', relevance: 0.85 },
  
  // Indigenous
  { name: 'NATSILS', url: 'https://www.natsils.org.au/feed/', type: 'indigenous', relevance: 0.95 },
  { name: 'SNAICC', url: 'https://www.snaicc.org.au/feed/', type: 'indigenous', relevance: 0.9 },
  
  // Advocacy
  { name: 'Amnesty AU', url: 'https://www.amnesty.org.au/feed/', type: 'advocacy', relevance: 0.7 },
  { name: 'HRLC', url: 'https://www.hrlc.org.au/feed/', type: 'advocacy', relevance: 0.8 },
  
  // News
  { name: 'ABC News', url: 'https://www.abc.net.au/news/feed/45910/rss.xml', type: 'media', relevance: 0.6 },
  { name: 'The Guardian AU', url: 'https://www.theguardian.com/au/rss', type: 'media', relevance: 0.6 },
  
  // Legal
  { name: 'Law Society', url: 'https://www.lawsociety.com.au/rss/news', type: 'research', relevance: 0.7 },
];

// State file to track last check
const STATE_FILE = join(__dirname, '.alma-feed-state.json');

function loadState() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    } catch {}
  }
  return { lastCheck: {}, seenGuids: [] };
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Keywords for relevance filtering
const YOUTH_JUSTICE_KEYWORDS = [
  'youth justice', 'juvenile justice', 'young offender',
  'youth detention', 'youth prison', 'juvenile detention',
  'aboriginal youth', 'indigenous youth', 'first nations youth',
  'youth diversion', 'youth program', 'youth service',
  'child protection', 'out of home care', 'oOHC',
  'raising the age', 'youth crime', 'youth offending',
  'restorative justice', 'therapeutic justice',
];

function isRelevantItem(item) {
  const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.summary || ''}`.toLowerCase();
  return YOUTH_JUSTICE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function extractLinksFromContent(content) {
  const links = [];
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    links.push(match[0]);
  }
  return [...new Set(links)];
}

// Check a single feed
async function checkFeed(feed) {
  console.log(`\n📡 ${feed.name}`);
  
  try {
    const feedData = await rssParser.parseURL(feed.url);
    const state = loadState();
    const lastCheck = new Date(state.lastCheck[feed.name] || 0);
    
    const newItems = [];
    
    for (const item of feedData.items || []) {
      const pubDate = item.pubDate || item.isoDate;
      if (!pubDate) continue;
      
      const itemDate = new Date(pubDate);
      
      // Skip if we've seen this GUID or it's older than last check
      const guid = item.guid || item.link || item.id;
      if (state.seenGuids.includes(guid) || itemDate <= lastCheck) {
        continue;
      }
      
      // Check relevance
      if (!isRelevantItem(item)) {
        state.seenGuids.push(guid);
        continue;
      }
      
      newItems.push({
        title: item.title,
        link: item.link,
        pubDate: itemDate,
        guid,
        content: item.contentSnippet || item.summary || '',
      });
      
      state.seenGuids.push(guid);
    }
    
    // Update last check time
    state.lastCheck[feed.name] = new Date().toISOString();
    saveState(state);
    
    console.log(`   ✅ ${newItems.length} new relevant items`);
    
    return newItems;
  } catch (err) {
    console.log(`   ❌ ${err.message}`);
    return [];
  }
}

// Add items to queue
async function addToQueue(items, feedType, feedRelevance) {
  if (items.length === 0) return 0;
  
  const toInsert = [];
  
  for (const item of items) {
    // Primary link
    toInsert.push({
      url: item.link,
      source_url: item.link,
      predicted_type: feedType,
      predicted_relevance: feedRelevance,
      status: 'pending',
      metadata: {
        title: item.title,
        discovered_via: 'rss_feed',
        pub_date: item.pubDate,
        content_snippet: item.content.substring(0, 200),
      },
    });
    
    // Extract additional links from content
    const contentLinks = extractLinksFromContent(item.content);
    for (const link of contentLinks.slice(0, 3)) { // Max 3 per article
      if (link !== item.link) {
        toInsert.push({
          url: link,
          source_url: item.link,
          predicted_type: 'website',
          predicted_relevance: feedRelevance * 0.8,
          status: 'pending',
          metadata: {
            discovered_via: 'rss_extracted',
            parent_article: item.title,
          },
        });
      }
    }
  }
  
  // Batch insert
  let inserted = 0;
  const batchSize = 50;
  
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('alma_discovered_links')
      .upsert(batch, { onConflict: 'url', ignoreDuplicates: true })
      .select();
    
    if (!error) {
      inserted += data?.length || 0;
    }
  }
  
  return inserted;
}

// Main monitoring function
async function monitorFeeds() {
  console.log('\n📰 ALMA Feed Monitor');
  console.log('═'.repeat(60));
  console.log(`Mode: ${mode} | Feeds: ${FEEDS.length}`);
  
  if (mode === 'setup') {
    console.log('\n📝 Feed configuration:');
    FEEDS.forEach(f => console.log(`   ${f.name}: ${f.url}`));
    console.log('\n✅ Setup complete. Run with --once or --daemon');
    return;
  }
  
  let totalNewItems = 0;
  let totalAdded = 0;
  
  do {
    console.log(`\n🕐 Check at ${new Date().toISOString()}`);
    
    for (const feed of FEEDS) {
      const newItems = await checkFeed(feed);
      totalNewItems += newItems.length;
      
      if (newItems.length > 0) {
        const added = await addToQueue(newItems, feed.type, feed.relevance);
        totalAdded += added;
        console.log(`   💾 Added ${added} links to queue`);
      }
    }
    
    console.log(`\n📊 Summary: ${totalNewItems} items, ${totalAdded} added to queue`);
    
    if (mode === 'daemon') {
      console.log(`⏳ Sleeping for ${intervalMinutes} minutes...`);
      await new Promise(r => setTimeout(r, intervalMinutes * 60 * 1000));
    }
  } while (mode === 'daemon');
  
  console.log('\n✅ Monitoring complete!');
  console.log(`   Total items found: ${totalNewItems}`);
  console.log(`   Total added to queue: ${totalAdded}`);
}

monitorFeeds().catch(console.error);
