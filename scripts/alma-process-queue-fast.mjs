#!/usr/bin/env node
/**
 * ALMA Fast Queue Processor
 * 
 * Quickly processes pending links without heavy LLM extraction
 * Just scrapes and stores basic info for later enrichment
 * 
 * Usage:
 *   node alma-process-queue-fast.mjs --batch 50
 */

import { readFileSync, existsSync } from 'fs';
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

// Validate
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

// Parse args
const args = process.argv.slice(2);
const batchSize = parseInt(args.find((_, i) => args[i-1] === '--batch') || '50');

console.log('\n🚀 ALMA Fast Queue Processor');
console.log('═'.repeat(60));
console.log(`Batch size: ${batchSize}\n`);

async function processQueue() {
  // Get pending links
  const { data: pendingLinks, error } = await supabase
    .from('alma_discovered_links')
    .select('*')
    .eq('status', 'pending')
    .order('predicted_relevance', { ascending: false, nullsFirst: false })
    .limit(batchSize);

  if (error) {
    console.error('❌ Error fetching queue:', error.message);
    return;
  }

  if (!pendingLinks || pendingLinks.length === 0) {
    console.log('✅ No pending links in queue!');
    return;
  }

  console.log(`📋 Processing ${pendingLinks.length} pending links...\n`);

  let processed = 0;
  let successful = 0;
  let failed = 0;
  let newInterventions = 0;

  for (let i = 0; i < pendingLinks.length; i++) {
    const link = pendingLinks[i];
    const progress = `[${i + 1}/${pendingLinks.length}]`;
    
    console.log(`${progress} ${link.url.substring(0, 60)}...`);

    try {
      // Mark as queued
      await supabase
        .from('alma_discovered_links')
        .update({ status: 'queued' })
        .eq('id', link.id);

      // Scrape
      const result = await firecrawl.scrapeUrl(link.url, {
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 30000,
      });

      if (!result.success) {
        console.log(`   ❌ Scrape failed: ${result.error}`);
        await supabase
          .from('alma_discovered_links')
          .update({ 
            status: 'error',
            error_message: result.error,
            metadata: { ...link.metadata, failed_at: new Date().toISOString() }
          })
          .eq('id', link.id);
        failed++;
        continue;
      }

      const content = result.markdown || '';
      const title = result.metadata?.title || link.url;
      
      // Quality check
      if (content.length < 300) {
        console.log(`   ⚠️ Content too short (${content.length} chars)`);
        await supabase
          .from('alma_discovered_links')
          .update({ 
            status: 'rejected',
            metadata: { ...link.metadata, rejected_reason: 'content_too_short', word_count: content.split(/\s+/).length }
          })
          .eq('id', link.id);
        processed++;
        continue;
      }

      const wordCount = content.split(/\s+/).length;
      console.log(`   ✅ ${wordCount} words`);

      // Extract basic info without LLM
      const isGov = link.url.includes('.gov.au');
      const isIndigenous = /aboriginal|indigenous|natsils|snaicc|als|vals|naaja|alrm/.test(link.url.toLowerCase());
      
      const interventionType = isIndigenous ? 'Cultural Connection' : 
                               isGov ? 'Prevention' : 
                               link.predicted_type === 'program' ? 'Diversion' : 'Support';

      // Create intervention
      const { data: intervention, error: insertError } = await supabase
        .from('alma_interventions')
        .insert({
          name: title.substring(0, 200),
          description: content.substring(0, 500),
          type: interventionType,
          consent_level: isIndigenous ? 'Community Controlled' : 'Public Knowledge Commons',
          cultural_authority: isIndigenous ? title : null,
          website: link.url,
          geography: link.predicted_type?.includes('government') ? [link.predicted_type.split(' ')[0]?.toUpperCase() || 'National'] : ['National'],
          source_documents: [{ url: link.url, title: title.substring(0, 100), scraped_at: new Date().toISOString() }],
          metadata: {
            scraped_at: new Date().toISOString(),
            word_count: wordCount,
            from_queue: true,
            source_link_id: link.id,
            full_content: content.substring(0, 10000),
          },
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`   ℹ️ Already exists`);
        } else {
          console.log(`   ❌ Insert error: ${insertError.message}`);
        }
      } else {
        console.log(`   💾 New intervention: ${intervention.id.substring(0, 8)}...`);
        newInterventions++;
      }

      // Mark as scraped
      await supabase
        .from('alma_discovered_links')
        .update({ 
          status: 'scraped',
          scraped_at: new Date().toISOString(),
          metadata: {
            ...link.metadata,
            scraped_at: new Date().toISOString(),
            word_count: wordCount,
            title: title,
          }
        })
        .eq('id', link.id);

      successful++;

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      await supabase
        .from('alma_discovered_links')
        .update({ 
          status: 'error',
          error_message: err.message,
        })
        .eq('id', link.id);
      failed++;
    }

    processed++;
    
    // Rate limiting
    if (i < pendingLinks.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Batch Complete');
  console.log('═'.repeat(60));
  console.log(`Processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`New interventions: ${newInterventions}`);

  // Get updated queue stats
  const { count: remaining } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`\n📋 Remaining in queue: ${remaining || 0}`);
  console.log(`\nTo process more, run:`);
  console.log(`   node scripts/alma-process-queue-fast.mjs --batch 50`);
}

processQueue().catch(console.error);
