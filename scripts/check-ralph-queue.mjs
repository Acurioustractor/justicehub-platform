#!/usr/bin/env node
/**
 * Check Ralph Scraper Queue Status
 * Verifies the alma_discovered_links queue has data and is ready for processing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
  console.log('\\n🔍 Checking Ralph Scraper Queue Status...');
  console.log('=' .repeat(50));

  // Get queue counts by status
  const statuses = ['pending', 'queued', 'scraped', 'rejected', 'error'];
  const counts = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('alma_discovered_links')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      console.error(`Error fetching ${status} count:`, error.message);
      counts[status] = 0;
    } else {
      counts[status] = count || 0;
    }
  }

  console.log('\\n📊 Queue Status:');
  console.log(`   Pending:  ${counts.pending}`);
  console.log(`   Queued:   ${counts.queued}`);
  console.log(`   Scraped:  ${counts.scraped}`);
  console.log(`   Rejected: ${counts.rejected}`);
  console.log(`   Error:    ${counts.error}`);
  console.log(`   ─────────────────`);
  console.log(`   Total:    ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

  // Get sample of pending links
  if (counts.pending > 0) {
    console.log('\\n📋 Sample Pending Links:');
    const { data: samples } = await supabase
      .from('alma_discovered_links')
      .select('id, url, predicted_type, predicted_relevance')
      .eq('status', 'pending')
      .order('predicted_relevance', { ascending: false })
      .limit(5);

    samples?.forEach((link, i) => {
      console.log(`   ${i + 1}. [${link.predicted_type || 'unknown'}] ${link.url.substring(0, 60)}...`);
      console.log(`      Relevance: ${link.predicted_relevance || 'N/A'}`);
    });
  }

  // Check ALMA source registry
  const { count: sourceCount } = await supabase
    .from('alma_source_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`\\n📚 Source Registry: ${sourceCount || 0} registered sources`);

  // Check scrape history
  const { count: historyCount } = await supabase
    .from('alma_scrape_history')
    .select('*', { count: 'exact', head: true });

  console.log(`📜 Scrape History: ${historyCount || 0} records`);

  // Check if ready for Ralph
  console.log('\\n' + '=' .repeat(50));
  if (counts.pending > 0 || counts.queued > 0) {
    console.log('✅ Queue has items ready for processing!');
    console.log(`   Run: ./ralph/scraper.sh`);
  } else {
    console.log('⚠️  Queue is empty. Need to discover new links first.');
    console.log('   Run: node scripts/alma-follow-links.mjs');
  }

  return counts;
}

async function seedQueue() {
  console.log('\\n🌱 Seeding queue with initial links...');

  // Youth justice relevant URLs to seed
  const seedLinks = [
    { url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2022-23', type: 'government', relevance: 9.5 },
    { url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice', type: 'government', relevance: 9.0 },
    { url: 'https://www.abs.gov.au/statistics/people/crime-and-justice', type: 'government', relevance: 8.5 },
    { url: 'https://www.alrc.gov.au/publication/pathways-to-justice/', type: 'legal', relevance: 8.0 },
    { url: 'https://humanrights.gov.au/our-work/childrens-rights', type: 'government', relevance: 8.5 },
    { url: 'https://www.sentencingcouncil.vic.gov.au/sentencing-statistics/children-young-people', type: 'legal', relevance: 8.0 },
    { url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-strategies', type: 'government', relevance: 9.0 },
    { url: 'https://www.childcomm.qld.gov.au/publications', type: 'government', relevance: 8.5 },
    { url: 'https://www.snaicc.org.au/resources/', type: 'indigenous', relevance: 9.0 },
    { url: 'https://antar.org.au/issues/justice', type: 'indigenous', relevance: 8.5 },
  ];

  let added = 0;
  for (const link of seedLinks) {
    const { error } = await supabase
      .from('alma_discovered_links')
      .upsert({
        url: link.url,
        discovered_from: 'seed',
        predicted_type: link.type,
        predicted_relevance: link.relevance,
        status: 'pending',
        priority: Math.floor(link.relevance),
      }, { onConflict: 'url', ignoreDuplicates: true });

    if (!error) {
      added++;
      console.log(`   Added: ${link.url.substring(0, 50)}...`);
    }
  }

  console.log(`\\n✅ Added ${added} seed links to queue`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--seed')) {
  await seedQueue();
}

await checkQueue();
