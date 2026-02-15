#!/usr/bin/env node
/**
 * Sync Stories from Empathy Ledger to JusticeHub
 * 
 * Fetches public stories from Empathy Ledger and:
 * 1. Stores them in JusticeHub for display
 * 2. Links them to interventions for narrative scoring
 * 3. Updates intervention story counts
 * 
 * Usage: node scripts/sync-empathy-ledger-stories.mjs [--dry-run] [--limit=50]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

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

// Validate env vars
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EMPATHY_LEDGER_URL',
  'EMPATHY_LEDGER_ANON_KEY'
];

for (const key of required) {
  if (!env[key]) {
    console.error(`❌ Missing: ${key}`);
    process.exit(1);
  }
}

// Create clients
const justiceHub = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const empathyLedger = createClient(
  env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
  env.EMPATHY_LEDGER_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n📚 === Empathy Ledger Story Sync ===\n');
console.log(`📍 JusticeHub: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`📍 Empathy Ledger: ${env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co'}`);
console.log(`📊 Limit: ${limit} stories`);
console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

// Justice keywords for relevance checking
const JUSTICE_KEYWORDS = [
  'justice', 'juvenile', 'incarceration', 'rehabilitation', 'restorative',
  'recidivism', 'court', 'legal', 'prison', 'detention', 'youth crime',
  'youth empowerment', 'youth advocacy', 'at-risk youth', 'youth support',
  'drug and alcohol', 'homelessness', 'mental health', 'family healing',
  'community safety', 'crime prevention', 'indigenous justice', 'cultural healing',
  'police', 'offending', 'diversion', 'support service', 'social worker'
];

function isJusticeRelated(story) {
  const text = `${story.title || ''} ${story.summary || ''} ${story.content || ''}`.toLowerCase();
  return JUSTICE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function calculateQualityScore(story) {
  let score = 0;
  
  // Has image (visual appeal)
  if (story.story_image_url) score += 20;
  
  // Has good summary
  if (story.summary && story.summary.length > 100) score += 15;
  
  // Has substantial content
  const contentLength = story.content?.length || 0;
  if (contentLength > 2000) score += 20;
  else if (contentLength > 1000) score += 10;
  else if (contentLength > 500) score += 5;
  
  // Justice-related (relevant to platform)
  if (isJusticeRelated(story)) score += 25;
  
  // Featured status
  if (story.is_featured) score += 10;
  
  // Has themes
  if (story.themes && story.themes.length > 0) score += 5;
  
  // Linked to service (more specific)
  if (story.service_id) score += 5;
  
  return score;
}

async function syncStories() {
  const startTime = Date.now();
  
  // Fetch stories from Empathy Ledger
  // Support both: justicehub_enabled flag (preferred) OR is_public + privacy_level
  console.log('📥 Fetching stories from Empathy Ledger...');
  
  let stories = [];
  let fetchError = null;
  
  // First try: stories with justicehub_enabled = true (explicit opt-in)
  try {
    const { data: flaggedStories, error } = await empathyLedger
      .from('stories')
      .select(`
        id, title, summary, content, story_image_url, story_category, story_type,
        themes, service_id, organization_id, is_public, privacy_level, is_featured,
        cultural_warnings, cultural_sensitivity_level, published_at, created_at,
        author_id, storyteller_id, justicehub_enabled
      `)
      .eq('justicehub_enabled', true)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (!error && flaggedStories && flaggedStories.length > 0) {
      stories = flaggedStories;
      console.log(`✅ Found ${stories.length} stories with justicehub_enabled=true`);
    } else {
      // Fallback: public stories
      const { data: publicStories, error: pubError } = await empathyLedger
        .from('stories')
        .select(`
          id, title, summary, content, story_image_url, story_category, story_type,
          themes, service_id, organization_id, is_public, privacy_level, is_featured,
          cultural_warnings, cultural_sensitivity_level, published_at, created_at,
          author_id, storyteller_id
        `)
        .eq('is_public', true)
        .eq('privacy_level', 'public')
        .order('published_at', { ascending: false })
        .limit(limit);
      
      stories = publicStories || [];
      fetchError = pubError;
      console.log(`ℹ️  Using fallback: ${stories.length} public stories (no justicehub_enabled flag found)`);
    }
  } catch (e) {
    // Fallback on error
    const { data: publicStories, error: pubError } = await empathyLedger
      .from('stories')
      .select(`
        id, title, summary, content, story_image_url, story_category, story_type,
        themes, service_id, organization_id, is_public, privacy_level, is_featured,
        cultural_warnings, cultural_sensitivity_level, published_at, created_at,
        author_id, storyteller_id
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .order('published_at', { ascending: false })
      .limit(limit);
    
    stories = publicStories || [];
    fetchError = pubError;
  }
  
  if (fetchError) {
    console.error('❌ Error fetching stories:', fetchError.message);
    process.exit(1);
  }
  
  if (!stories || stories.length === 0) {
    console.log('\n⚠️  No stories found in Empathy Ledger');
    console.log('   Stories need: justicehub_enabled=true OR (is_public=true AND privacy_level=public)\n');
    return { synced: 0, skipped: 0, failed: 0, analytics: {} };
  }
  
  console.log(`✅ Found ${stories.length} stories to sync\n`);
  
  // Get existing synced stories
  const { data: existingStories } = await justiceHub
    .from('empathy_ledger_stories')
    .select('story_id');
  
  const existingIds = new Set((existingStories || []).map(s => s.story_id));
  
  // Get organizations map
  const { data: organizations } = await empathyLedger
    .from('organizations')
    .select('id, name, slug');
  
  const orgMap = new Map((organizations || []).map(o => [o.id, o]));
  
  let synced = 0, skipped = 0, failed = 0;
  const qualityScores = [];
  
  for (const story of stories) {
    // Skip if already synced
    if (existingIds.has(story.id)) {
      console.log(`⏭️  Skipped (already synced): "${story.title?.substring(0, 50)}..."`);
      skipped++;
      continue;
    }
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(story);
    qualityScores.push({ title: story.title, score: qualityScore });
    
    // Skip low quality stories (optional - can adjust threshold)
    if (qualityScore < 20) {
      console.log(`⚠️  Low quality (${qualityScore}/100): "${story.title?.substring(0, 50)}..."`);
      skipped++;
      continue;
    }
    
    const org = story.organization_id ? orgMap.get(story.organization_id) : null;
    
    if (dryRun) {
      console.log(`🔍 Would sync: "${story.title?.substring(0, 50)}..." (Quality: ${qualityScore})`);
      synced++;
      continue;
    }
    
    // Insert into JusticeHub
    try {
      const { error: insertError } = await justiceHub
        .from('empathy_ledger_stories')
        .insert({
          story_id: story.id,
          title: story.title,
          summary: story.summary,
          content: story.content,
          story_image_url: story.story_image_url,
          story_category: story.story_category,
          story_type: story.story_type,
          themes: story.themes,
          service_id: story.service_id,
          organization_id: story.organization_id,
          organization_name: org?.name,
          organization_slug: org?.slug,
          is_featured: story.is_featured,
          cultural_warnings: story.cultural_warnings,
          cultural_sensitivity_level: story.cultural_sensitivity_level,
          quality_score: qualityScore,
          is_justice_related: isJusticeRelated(story),
          published_at: story.published_at,
          empathy_ledger_created_at: story.created_at,
          synced_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error(`❌ Failed to sync "${story.title?.substring(0, 40)}...": ${insertError.message}`);
        failed++;
        continue;
      }
      
      console.log(`✅ Synced: "${story.title?.substring(0, 50)}..." (Quality: ${qualityScore})`);
      synced++;
      
    } catch (err) {
      console.error(`❌ Error syncing "${story.title?.substring(0, 40)}...": ${err.message}`);
      failed++;
    }
  }
  
  // Analytics aggregation
  const analytics = {
    total_processed: stories.length,
    synced,
    skipped,
    failed,
    quality_distribution: {
      high: qualityScores.filter(s => s.score >= 60).length,
      medium: qualityScores.filter(s => s.score >= 40 && s.score < 60).length,
      low: qualityScores.filter(s => s.score < 40).length
    },
    avg_quality_score: qualityScores.length > 0 
      ? Math.round(qualityScores.reduce((a, b) => a + b.score, 0) / qualityScores.length)
      : 0,
    justice_related_count: stories.filter(s => isJusticeRelated(s)).length,
    with_images: stories.filter(s => s.story_image_url).length,
    with_service_link: stories.filter(s => s.service_id).length,
    duration_seconds: Math.round((Date.now() - startTime) / 1000)
  };
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Synced: ${synced}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${analytics.duration_seconds}s`);
  
  // Quality breakdown
  if (qualityScores.length > 0) {
    console.log('\n📈 Quality Scores:');
    console.log(`   🌟 High (60-100): ${analytics.quality_distribution.high}`);
    console.log(`   ⭐ Medium (40-59): ${analytics.quality_distribution.medium}`);
    console.log(`   📄 Low (0-39): ${analytics.quality_distribution.low}`);
    console.log(`   📊 Average: ${analytics.avg_quality_score}/100`);
    
    // Top stories
    const topStories = qualityScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    console.log('\n🏆 Top 5 Stories by Quality:');
    topStories.forEach((s, i) => {
      console.log(`   ${i + 1}. "${s.title?.substring(0, 45)}..." (${s.score}/100)`);
    });
  }
  
  // Analytics summary
  console.log('\n📊 ANALYTICS SNAPSHOT');
  console.log(`   Justice-related: ${analytics.justice_related_count}`);
  console.log(`   With images: ${analytics.with_images}`);
  console.log(`   With service links: ${analytics.with_service_link}`);
  
  if (!dryRun && synced > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Review synced stories in database');
    console.log('   2. Run: node scripts/update-narrative-scores.mjs');
    console.log('   3. Check analytics: SELECT * FROM story_sync_analytics ORDER BY synced_at DESC LIMIT 1;');
  }
  
  // Store analytics in database
  if (!dryRun) {
    try {
      await justiceHub.from('story_sync_analytics').insert({
        run_at: new Date().toISOString(),
        stories_processed: analytics.total_processed,
        stories_synced: synced,
        stories_skipped: skipped,
        stories_failed: failed,
        avg_quality_score: analytics.avg_quality_score,
        justice_related_count: analytics.justice_related_count,
        with_images_count: analytics.with_images,
        metadata: { duration_seconds: analytics.duration_seconds }
      });
    } catch (e) {
      // Analytics table might not exist yet, that's ok
    }
  }
  
  return { synced, skipped, failed, analytics };
}

// Main execution
syncStories()
  .then(results => {
    console.log('\n✨ Complete!\n');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
