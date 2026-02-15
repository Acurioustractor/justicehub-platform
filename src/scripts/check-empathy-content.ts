import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function checkContent() {
  console.log('Checking Empathy Ledger content for JusticeHub profiles...\n');

  // Get all flagged profiles
  const { data: profiles } = await empathyLedgerClient
    .from('profiles')
    .select('id, display_name')
    .eq('justicehub_enabled', true);

  console.log(`Found ${profiles?.length || 0} profiles flagged for JusticeHub\n`);

  let totalStories = 0;
  let totalTranscripts = 0;
  let totalGalleries = 0;
  let totalOrgMemberships = 0;

  for (const profile of profiles || []) {
    // Check stories
    const { data: stories, count: storyCount } = await empathyLedgerClient
      .from('stories')
      .select('id, title, status', { count: 'exact' })
      .eq('storyteller_id', profile.id);

    // Check transcripts
    const { data: transcripts, count: transcriptCount } = await empathyLedgerClient
      .from('transcripts')
      .select('id, title, status', { count: 'exact' })
      .eq('storyteller_id', profile.id);

    // Check galleries
    const { data: galleries, count: galleryCount } = await empathyLedgerClient
      .from('galleries')
      .select('id, title, status', { count: 'exact' })
      .eq('created_by', profile.id);

    // Check organization memberships
    const { data: orgMembers, count: memberCount } = await empathyLedgerClient
      .from('organization_members')
      .select('id, role, organization_id', { count: 'exact' })
      .eq('profile_id', profile.id);

    const hasContent = (storyCount || 0) > 0 || (transcriptCount || 0) > 0 || (galleryCount || 0) > 0 || (memberCount || 0) > 0;

    if (hasContent) {
      console.log(`\n👤 ${profile.display_name}:`);

      if (storyCount && storyCount > 0) {
        console.log(`   📖 Stories: ${storyCount}`);
        stories?.slice(0, 3).forEach(s => {
          console.log(`      - ${s.title || 'Untitled'} (${s.status || 'unknown'})`);
        });
        totalStories += storyCount;
      }

      if (transcriptCount && transcriptCount > 0) {
        console.log(`   🎙️  Transcripts: ${transcriptCount}`);
        transcripts?.slice(0, 3).forEach(t => {
          console.log(`      - ${t.title || 'Untitled'} (${t.status || 'unknown'})`);
        });
        totalTranscripts += transcriptCount;
      }

      if (galleryCount && galleryCount > 0) {
        console.log(`   🖼️  Galleries: ${galleryCount}`);
        galleries?.slice(0, 3).forEach(g => {
          console.log(`      - ${g.title || 'Untitled'} (${g.status || 'unknown'})`);
        });
        totalGalleries += galleryCount;
      }

      if (memberCount && memberCount > 0) {
        console.log(`   🏢 Organization memberships: ${memberCount}`);
        totalOrgMemberships += memberCount;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TOTAL CONTENT AVAILABLE TO SYNC:');
  console.log('='.repeat(60));
  console.log(`Stories: ${totalStories}`);
  console.log(`Transcripts: ${totalTranscripts}`);
  console.log(`Galleries: ${totalGalleries}`);
  console.log(`Organization memberships: ${totalOrgMemberships}`);
  console.log('\n⚠️  Currently NOT being synced to JusticeHub!');
}

checkContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
