#!/usr/bin/env node
/**
 * Story Analytics Dashboard
 * 
 * Displays analytics for synced Empathy Ledger stories:
 * - Total stories synced
 * - Quality distribution
 * - Justice-related stories
 * - Engagement metrics
 * 
 * Usage: node scripts/story-analytics.mjs [--detailed]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Parse args
const args = process.argv.slice(2);
const detailed = args.includes('--detailed');
const exportJson = args.includes('--json');

// Load env
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n📊 === Story Analytics Dashboard ===\n');

async function getAnalytics() {
  // Get summary stats
  const { data: summary } = await supabase
    .from('story_analytics_summary')
    .select('*')
    .single();
  
  // Get quality distribution
  const { data: qualityDist } = await supabase
    .from('empathy_ledger_stories')
    .select('quality_score');
  
  // Get category breakdown
  const { data: categories } = await supabase
    .from('empathy_ledger_stories')
    .select('story_category');
  
  // Get recent sync history
  const { data: syncHistory } = await supabase
    .from('story_sync_analytics')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(5);
  
  // Get top stories by quality
  const { data: topStories } = await supabase
    .from('empathy_ledger_stories')
    .select('title, quality_score, view_count, is_justice_related')
    .order('quality_score', { ascending: false })
    .limit(5);
  
  return { summary, qualityDist, categories, syncHistory, topStories };
}

async function displayAnalytics() {
  const data = await getAnalytics();
  
  if (!data.summary || data.summary.total_stories === 0) {
    console.log('⚠️  No synced stories found.');
    console.log('   Run: node scripts/sync-empathy-ledger-stories.mjs\n');
    return;
  }
  
  // Summary stats
  console.log('📈 OVERVIEW');
  console.log('─'.repeat(50));
  console.log(`Total Stories:       ${data.summary.total_stories}`);
  console.log(`Justice-Related:     ${data.summary.justice_stories} (${Math.round(data.summary.justice_stories/data.summary.total_stories*100)}%)`);
  console.log(`With Images:         ${data.summary.stories_with_images} (${Math.round(data.summary.stories_with_images/data.summary.total_stories*100)}%)`);
  console.log(`Linked to Services:  ${data.summary.linked_to_services}`);
  console.log(`Average Quality:     ${data.summary.avg_quality}/100`);
  console.log(`Last Sync:           ${new Date(data.summary.last_sync).toLocaleString()}`);
  
  // Quality distribution
  if (data.qualityDist) {
    const high = data.qualityDist.filter(s => s.quality_score >= 60).length;
    const medium = data.qualityDist.filter(s => s.quality_score >= 40 && s.quality_score < 60).length;
    const low = data.qualityDist.filter(s => s.quality_score < 40).length;
    
    console.log('\n📊 QUALITY DISTRIBUTION');
    console.log('─'.repeat(50));
    console.log(`🌟 High (60-100):    ${high} stories`);
    console.log(`⭐ Medium (40-59):   ${medium} stories`);
    console.log(`📄 Low (0-39):       ${low} stories`);
  }
  
  // Category breakdown
  if (data.categories && detailed) {
    const catCounts = {};
    data.categories.forEach(s => {
      const cat = s.story_category || 'Uncategorized';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    
    console.log('\n🏷️  CATEGORIES');
    console.log('─'.repeat(50));
    Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
  }
  
  // Top stories
  if (data.topStories) {
    console.log('\n🏆 TOP STORIES BY QUALITY');
    console.log('─'.repeat(50));
    data.topStories.forEach((s, i) => {
      const badge = s.is_justice_related ? '⚖️' : '  ';
      console.log(`  ${i + 1}. ${badge} "${s.title?.substring(0, 40)}..." (${s.quality_score}/100)`);
    });
  }
  
  // Sync history
  if (data.syncHistory && data.syncHistory.length > 0) {
    console.log('\n🔄 RECENT SYNC HISTORY');
    console.log('─'.repeat(50));
    data.syncHistory.forEach(run => {
      const date = new Date(run.run_at).toLocaleDateString();
      const success = run.stories_failed === 0 ? '✅' : '⚠️';
      console.log(`  ${success} ${date}: ${run.stories_synced} synced, ${run.stories_skipped} skipped, ${run.stories_failed} failed`);
    });
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // Export JSON if requested
  if (exportJson) {
    console.log(JSON.stringify(data, null, 2));
  }
}

displayAnalytics()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
