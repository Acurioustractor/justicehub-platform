#!/usr/bin/env node
/**
 * Update Narrative Scores for ALMA Interventions
 * 
 * Calculates narrative scores based on linked stories and updates:
 * 1. intervention.story_count
 * 2. intervention.narrative_score (0-10)
 * 3. Alpha signal calculations
 * 
 * Usage: node scripts/update-narrative-scores.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Load environment
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

console.log('\n📝 === Update Narrative Scores ===\n');
console.log(`🔍 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

// Calculate narrative score based on story count
function calculateNarrativeScore(storyCount) {
  if (storyCount >= 10) return 10;
  if (storyCount >= 6) return 9;
  if (storyCount >= 4) return 8;
  if (storyCount >= 3) return 6;
  if (storyCount >= 2) return 5;
  if (storyCount >= 1) return 3;
  return 0;
}

// Calculate alpha score (same logic as API)
function calculateAlpha(evidenceLevel, narrativeScore, authorityScore) {
  let evScore = 3;
  if (evidenceLevel?.includes('Proven')) evScore = 10;
  else if (evidenceLevel?.includes('Effective')) evScore = 8;
  else if (evidenceLevel?.includes('Indigenous-led')) evScore = 8;
  else if (evidenceLevel?.includes('Promising')) evScore = 6;
  else if (evidenceLevel?.includes('Untested')) evScore = 2;
  
  return ((evScore * 0.4) + (narrativeScore * 0.3) + (authorityScore * 0.3)).toFixed(1);
}

async function autoLinkStories() {
  console.log('🔗 Auto-linking stories to interventions...\n');
  
  // Get unlinked justice-related stories
  const { data: unlinkedStories, error: storyError } = await supabase
    .from('empathy_ledger_stories')
    .select('story_id, title, summary, content, themes, organization_name')
    .eq('is_justice_related', true)
    .not('story_id', 'in', supabase
      .from('story_intervention_links')
      .select('story_id')
    );
  
  if (storyError) {
    console.error('❌ Error fetching unlinked stories:', storyError.message);
    return 0;
  }
  
  if (!unlinkedStories || unlinkedStories.length === 0) {
    console.log('✅ All stories are already linked\n');
    return 0;
  }
  
  console.log(`Found ${unlinkedStories.length} unlinked stories\n`);
  
  // Get all interventions
  const { data: interventions, error: intError } = await supabase
    .from('alma_interventions')
    .select('id, name, description, type, geography');
  
  if (intError || !interventions) {
    console.error('❌ Error fetching interventions:', intError?.message);
    return 0;
  }
  
  let linked = 0;
  
  for (const story of unlinkedStories.slice(0, 50)) { // Limit to prevent overload
    const storyText = `${story.title} ${story.summary} ${story.content}`.toLowerCase();
    
    // Find matching interventions
    const matches = [];
    
    for (const intervention of interventions) {
      let score = 0;
      const interventionText = `${intervention.name} ${intervention.description || ''}`.toLowerCase();
      
      // Direct name match (high confidence)
      if (storyText.includes(intervention.name.toLowerCase())) {
        score += 50;
      }
      
      // Organization name match
      if (story.organization_name && 
          interventionText.includes(story.organization_name.toLowerCase())) {
        score += 30;
      }
      
      // Type match
      if (story.themes && intervention.type) {
        const themeMatch = story.themes.some(t => 
          interventionText.includes(t.toLowerCase()) ||
          intervention.type.toLowerCase().includes(t.toLowerCase())
        );
        if (themeMatch) score += 20;
      }
      
      // Location match
      if (story.organization_name && intervention.geography) {
        const locationMatch = intervention.geography.some(g =>
          story.organization_name.toLowerCase().includes(g.toLowerCase())
        );
        if (locationMatch) score += 15;
      }
      
      if (score >= 40) {
        matches.push({ intervention, score });
      }
    }
    
    // Link to best match if confident
    if (matches.length > 0) {
      matches.sort((a, b) => b.score - a.score);
      const bestMatch = matches[0];
      
      if (dryRun) {
        console.log(`🔍 Would link: "${story.title?.substring(0, 40)}..." → "${bestMatch.intervention.name}" (score: ${bestMatch.score})`);
        linked++;
        continue;
      }
      
      const { error: linkError } = await supabase
        .from('story_intervention_links')
        .insert({
          story_id: story.story_id,
          intervention_id: bestMatch.intervention.id,
          link_type: 'mentions'
        });
      
      if (linkError) {
        console.log(`❌ Failed to link "${story.title?.substring(0, 40)}...": ${linkError.message}`);
      } else {
        console.log(`✅ Linked: "${story.title?.substring(0, 40)}..." → "${bestMatch.intervention.name}"`);
        linked++;
      }
    }
  }
  
  console.log(`\n✅ Auto-linked ${linked} stories\n`);
  return linked;
}

async function updateNarrativeScores() {
  console.log('📊 Updating narrative scores...\n');
  
  // Get all interventions with their story counts
  const { data: interventions, error } = await supabase
    .from('alma_interventions')
    .select(`
      id,
      name,
      evidence_level,
      story_count,
      narrative_score,
      consent_level,
      cultural_authority
    `);
  
  if (error) {
    console.error('❌ Error fetching interventions:', error.message);
    return;
  }
  
  console.log(`Processing ${interventions.length} interventions\n`);
  
  let updated = 0;
  const beforeAfter = [];
  
  for (const intervention of interventions) {
    // Calculate authority score
    let authScore = 4;
    if (intervention.consent_level === 'Community Controlled') authScore = 10;
    else if (intervention.cultural_authority) authScore = 8;
    else if (intervention.consent_level === 'Public Knowledge Commons') authScore = 6;
    
    // Calculate narrative score
    const newNarrativeScore = calculateNarrativeScore(intervention.story_count || 0);
    
    // Calculate alpha
    const alpha = calculateAlpha(
      intervention.evidence_level,
      newNarrativeScore,
      authScore
    );
    
    // Track changes
    if (newNarrativeScore !== (intervention.narrative_score || 0)) {
      beforeAfter.push({
        name: intervention.name,
        before: intervention.narrative_score || 0,
        after: newNarrativeScore,
        stories: intervention.story_count || 0
      });
    }
    
    if (dryRun) {
      if (newNarrativeScore !== (intervention.narrative_score || 0)) {
        console.log(`🔍 Would update: "${intervention.name?.substring(0, 40)}..."`);
        console.log(`   Narrative: ${intervention.narrative_score || 0} → ${newNarrativeScore}`);
        console.log(`   Alpha: ${alpha}`);
        updated++;
      }
      continue;
    }
    
    // Update intervention
    const { error: updateError } = await supabase
      .from('alma_interventions')
      .update({
        narrative_score: newNarrativeScore
      })
      .eq('id', intervention.id);
    
    if (updateError) {
      console.log(`❌ Failed to update "${intervention.name?.substring(0, 40)}...": ${updateError.message}`);
    } else if (newNarrativeScore !== (intervention.narrative_score || 0)) {
      console.log(`✅ Updated: "${intervention.name?.substring(0, 40)}..." (Narrative: ${intervention.narrative_score || 0} → ${newNarrativeScore})`);
      updated++;
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📈 NARRATIVE SCORE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Updated: ${updated} interventions`);
  
  if (beforeAfter.length > 0) {
    console.log('\n📊 Score Changes:');
    
    // Group by score
    const improved = beforeAfter.filter(x => x.after > x.before);
    const same = beforeAfter.filter(x => x.after === x.before);
    
    console.log(`   📈 Improved: ${improved.length}`);
    console.log(`   ➡️  Same: ${same.length}`);
    
    if (improved.length > 0) {
      console.log('\n🏆 Top Improvements:');
      improved
        .sort((a, b) => (b.after - b.before) - (a.after - a.before))
        .slice(0, 5)
        .forEach((item, i) => {
          console.log(`   ${i + 1}. "${item.name?.substring(0, 40)}...": ${item.before} → ${item.after} (${item.stories} stories)`);
        });
    }
  }
  
  // Distribution
  const scoreDistribution = {};
  for (let i = 0; i <= 10; i++) scoreDistribution[i] = 0;
  
  const { data: allInterventions } = await supabase
    .from('alma_interventions')
    .select('narrative_score');
  
  (allInterventions || []).forEach(int => {
    const score = Math.round(int.narrative_score || 0);
    scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
  });
  
  console.log('\n📊 Score Distribution:');
  Object.entries(scoreDistribution)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([score, count]) => {
      if (count > 0) {
        const bar = '█'.repeat(Math.min(count / 10, 20));
        console.log(`   ${score.toString().padStart(2)}: ${bar} ${count}`);
      }
    });
}

// Main execution
async function main() {
  // Step 1: Auto-link stories
  const linked = await autoLinkStories();
  
  // Step 2: Update narrative scores
  await updateNarrativeScores();
  
  console.log('\n✨ Complete!\n');
  console.log('💡 Next steps:');
  console.log('   1. Check /intelligence/dashboard for updated alpha signals');
  console.log('   2. Review story-intervention links for accuracy');
  console.log('   3. Run this script daily to keep scores current');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
