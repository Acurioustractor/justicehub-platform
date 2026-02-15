/**
 * Analyze justice stories that need manual linking to services/programs
 */

import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { isJusticeRelated } from '@/lib/integrations/profile-linking';

async function analyzeStories() {
  console.log('🔍 Analyzing Justice Stories for Manual Linking...\n');

  // Get all public stories
  const { data: allStories } = await empathyLedgerClient
    .from('stories')
    .select('id, title, themes, service_id, author_id, storyteller_id, summary, story_category, content')
    .eq('is_public', true)
    .eq('privacy_level', 'public');

  const justiceStories = allStories?.filter(isJusticeRelated) || [];

  const withServiceId = justiceStories.filter(s => s.service_id);
  const withoutServiceId = justiceStories.filter(s => !s.service_id);

  console.log('📊 Summary:\n');
  console.log(`Total justice stories: ${justiceStories.length}`);
  console.log(`✅ Already linked (with service_id): ${withServiceId.length}`);
  console.log(`📝 Need manual linking: ${withoutServiceId.length}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 HIGH-VALUE STORIES TO LINK (Top 20):\n');

  // Categorize by theme
  const categorized: { [key: string]: any[] } = {
    'Youth Justice': [],
    'Homelessness Support': [],
    'Mental Health': [],
    'Drug & Alcohol': [],
    'Family Support': [],
    'Community Programs': [],
    'Other': []
  };

  withoutServiceId.forEach(story => {
    const themes = story.themes || [];
    if (themes.some(t => ['recidivism_reduction', 'community_safety', 'youth_empowerment'].includes(t))) {
      categorized['Youth Justice'].push(story);
    } else if (themes.includes('homelessness support') || themes.includes('Homelessness')) {
      categorized['Homelessness Support'].push(story);
    } else if (themes.includes('mental_health')) {
      categorized['Mental Health'].push(story);
    } else if (themes.includes('Drug and Alcohol')) {
      categorized['Drug & Alcohol'].push(story);
    } else if (themes.some(t => t.includes('family'))) {
      categorized['Family Support'].push(story);
    } else if (themes.includes('community')) {
      categorized['Community Programs'].push(story);
    } else {
      categorized['Other'].push(story);
    }
  });

  // Display by category
  Object.entries(categorized).forEach(([category, stories]) => {
    if (stories.length > 0) {
      console.log(`\n📁 ${category} (${stories.length} stories)\n`);
      stories.slice(0, 5).forEach((story, i) => {
        const themes = story.themes?.slice(0, 3).join(', ') || 'No themes';
        const excerpt = story.summary || story.content?.substring(0, 100) || 'No summary';

        console.log(`${i + 1}. "${story.title}"`);
        console.log(`   ID: ${story.id}`);
        console.log(`   Profile: ${story.author_id || story.storyteller_id || 'No profile'}`);
        console.log(`   Themes: ${themes}`);
        console.log(`   Preview: ${excerpt.substring(0, 120)}...`);
        console.log('');
      });
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 NEXT STEPS:\n');
  console.log('1. Review stories by category');
  console.log('2. Match stories to appropriate JusticeHub services');
  console.log('3. Use link-story-to-service script to create connections');
  console.log('4. Mark best stories as featured\n');

  // Export for manual review
  const exportData = withoutServiceId.map(s => ({
    id: s.id,
    title: s.title,
    themes: s.themes?.join(', '),
    summary: s.summary || s.content?.substring(0, 150),
    profile_id: s.author_id || s.storyteller_id
  }));

  console.log(`\n📄 Full list: ${withoutServiceId.length} stories ready for linking\n`);

  return {
    total: justiceStories.length,
    linked: withServiceId.length,
    needsLinking: withoutServiceId.length,
    categorized,
    exportData
  };
}

analyzeStories()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
