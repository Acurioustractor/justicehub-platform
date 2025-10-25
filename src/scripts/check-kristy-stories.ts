import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function checkKristyStories() {
  const kristyId = 'b59a1f4c-94fd-4805-a2c5-cac0922133e0';

  console.log('\n📖 Checking Kristy Bloomfield\'s Stories:\n');

  const { data: stories, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .or(`author_id.eq.${kristyId},storyteller_id.eq.${kristyId}`)
    .eq('is_public', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!stories || stories.length === 0) {
    console.log('No stories found for Kristy.');
    return;
  }

  console.log(`Found ${stories.length} stories:\n`);

  for (const story of stories) {
    console.log(`\n📄 ${story.title || 'Untitled'}`);
    console.log(`   ID: ${story.id}`);
    console.log(`   Published: ${story.published_at || 'Not published'}`);
    console.log(`   Themes: ${story.themes?.join(', ') || 'None'}`);
    console.log(`   Service ID: ${story.service_id || 'Not linked'}`);
    console.log(`   Category: ${story.story_category || 'None'}`);
    if (story.content) {
      console.log(`   Content preview: ${story.content.substring(0, 150)}...`);
    }
  }

  // Check profile data
  const { data: profile } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .eq('id', kristyId)
    .single();

  console.log('\n\n👤 Profile Information:\n');
  console.log(`   Name: ${profile?.preferred_name || profile?.display_name}`);
  console.log(`   Bio: ${profile?.bio?.substring(0, 200)}...`);
  console.log(`   Organization ID: ${profile?.primary_organization_id}`);
}

checkKristyStories().catch(console.error);
