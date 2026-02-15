import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function listProfiles() {
  console.log('📋 Listing profiles from Empathy Ledger...\n');

  const { data: profiles, error } = await empathyLedgerClient
    .from('profiles')
    .select('id, display_name, bio')
    .order('display_name')
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found.');
    return;
  }

  console.log(`Found ${profiles.length} profiles:\n`);

  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.display_name}`);
    console.log(`   ID: ${profile.id}`);
    if (profile.bio) {
      console.log(`   Bio: ${profile.bio.substring(0, 80)}${profile.bio.length > 80 ? '...' : ''}`);
    }
    console.log('');
  });

  console.log('💡 To flag a profile for JusticeHub, run this in Empathy Ledger SQL Editor:');
  console.log('');
  console.log('UPDATE profiles');
  console.log('SET');
  console.log("  justicehub_enabled = true,");
  console.log("  justicehub_role = 'founder',  -- Options: founder, leader, advocate, practitioner, researcher");
  console.log('  justicehub_featured = true');
  console.log("WHERE id = 'paste-id-here';");
  console.log('');
}

listProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
