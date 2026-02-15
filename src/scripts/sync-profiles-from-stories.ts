/**
 * Sync Empathy Ledger Profiles to JusticeHub
 *
 * This script:
 * 1. Finds all Empathy Ledger stories with service_id (linked to JusticeHub services)
 * 2. Creates profile_appearances records linking storytellers to services
 * 3. Reports sync statistics
 */

import { syncProfilesFromStories, getAllJusticeStories } from '@/lib/integrations/profile-linking';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';

const justiceHubClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🔄 Starting Empathy Ledger → JusticeHub Profile Sync...\n');

  // Step 1: Get all justice-related stories
  console.log('📚 Fetching justice-related stories from Empathy Ledger...');
  const stories = await getAllJusticeStories(1000);
  console.log(`Found ${stories.length} justice-related stories\n`);

  // Step 2: Categorize stories
  const withServiceId = stories.filter(s => s.service_id);
  const byTheme = stories.filter(s => !s.service_id && s.themes?.some(t =>
    ['youth-justice', 'juvenile-justice', 'incarceration'].includes(t.toLowerCase())
  ));
  const byCategory = stories.filter(s => !s.service_id && s.story_category?.toLowerCase().includes('justice'));

  console.log('📊 Story Breakdown:');
  console.log(`  - With service_id: ${withServiceId.length}`);
  console.log(`  - By justice themes: ${byTheme.length}`);
  console.log(`  - By justice category: ${byCategory.length}\n`);

  // Step 3: Run sync for stories with service_id
  console.log('🔗 Syncing profiles from stories with service_id...');
  const syncResults = await syncProfilesFromStories();

  console.log('\n✅ Sync Complete!\n');
  console.log('📈 Results:');
  console.log(`  - Total profiles synced: ${syncResults.success}`);
  console.log(`  - Failed: ${syncResults.failed}`);
  console.log(`  - Skipped (no service_id): ${syncResults.skipped}`);

  // Step 4: Report unique profiles
  const uniqueProfileIds = new Set(
    withServiceId
      .map(s => s.author_id || s.storyteller_id)
      .filter(Boolean)
  );

  console.log(`\n👥 Unique Profiles: ${uniqueProfileIds.size}`);

  // Step 5: Get sample profile names
  console.log('\n📋 Sample Linked Profiles:');
  const sampleProfiles = await Promise.all(
    Array.from(uniqueProfileIds).slice(0, 5).map(async (profileId) => {
      const { data } = await empathyLedgerClient
        .from('profiles')
        .select('name, preferred_name')
        .eq('id', profileId)
        .single();
      return data;
    })
  );

  sampleProfiles.forEach((profile, i) => {
    if (profile) {
      console.log(`  ${i + 1}. ${profile.preferred_name || profile.name}`);
    }
  });

  // Step 6: Verify profile_appearances table
  console.log('\n🔍 Verifying profile_appearances table...');
  const { count, error } = await justiceHubClient
    .from('profile_appearances')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error checking profile_appearances:', error);
  } else {
    console.log(`✅ Total profile_appearances records: ${count}`);
  }

  // Step 7: Show services with linked profiles
  const { data: servicesWithProfiles } = await justiceHubClient
    .from('profile_appearances')
    .select('appears_on_id, appears_on_type')
    .eq('appears_on_type', 'service');

  const uniqueServices = new Set(servicesWithProfiles?.map(p => p.appears_on_id) || []);
  console.log(`\n🏢 Services with linked profiles: ${uniqueServices.size}`);

  console.log('\n🎉 Profile sync complete!\n');
  console.log('Next steps:');
  console.log('1. Update service pages to display linked profiles');
  console.log('2. Update program pages to show participant stories');
  console.log('3. Add profile cards with Empathy Ledger data\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
