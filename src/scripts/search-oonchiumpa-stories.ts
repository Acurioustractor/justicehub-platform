/**
 * Search for stories related to Oonchiumpa programs in Empathy Ledger
 */

import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function searchStories() {
  console.log('\n📖 Searching for Oonchiumpa Stories in Empathy Ledger\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Search for stories from Kristy or Tanya
  const { data: stories, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      id,
      title,
      summary,
      storyteller_id,
      organization_id,
      is_public,
      privacy_level,
      profiles:storyteller_id (
        display_name
      )
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${stories?.length || 0} public stories\n`);

  if (stories && stories.length > 0) {
    // Look for Kristy or Tanya stories
    const relevantStories = stories.filter((story) => {
      const name = story.profiles?.display_name?.toLowerCase() || '';
      const title = story.title?.toLowerCase() || '';
      const summary = story.summary?.toLowerCase() || '';

      return (
        name.includes('kristy') ||
        name.includes('bloomfield') ||
        name.includes('tanya') ||
        name.includes('turner') ||
        title.includes('oonchiumpa') ||
        summary?.includes('oonchiumpa') ||
        title.includes('alice springs') ||
        title.includes('youth') ||
        title.includes('mentorship')
      );
    });

    console.log(`Potentially relevant stories: ${relevantStories.length}\n`);

    relevantStories.forEach((story) => {
      console.log(`📄 ${story.title}`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Storyteller: ${story.profiles?.display_name || 'Unknown'}`);
      if (story.summary) {
        console.log(`   Summary: ${story.summary.substring(0, 100)}...`);
      }
      console.log('');
    });

    if (relevantStories.length === 0) {
      console.log('No directly relevant stories found.');
      console.log('Stories may need to be created in Empathy Ledger first.\n');
    }
  } else {
    console.log('No public stories found in Empathy Ledger.');
    console.log('Stories for Kristy and Tanya may need to be created.\n');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('\nNext Steps:');
  console.log('  1. Create stories in Empathy Ledger for Kristy and Tanya');
  console.log('  2. Link stories to programs using story_program_links table');
  console.log('  3. Stories will then appear on program pages\n');
}

searchStories().catch(console.error);
