import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function flagProfiles() {
  console.log('🏴 Flagging test profiles for JusticeHub...\n');

  // Flag AJ Bailey (advocate) and Ade Rizer (youth advocate)
  const profilesToFlag = [
    {
      id: '6d596bf4-278e-441e-9198-866ec1690064', // AJ Bailey
      name: 'AJ Bailey',
      role: 'advocate',
      featured: true
    },
    {
      id: 'dcbdaa70-1871-46e-b77b-9dad0d0a8894', // Ade Rizer
      name: 'Ade Rizer',
      role: 'advocate',
      featured: true
    },
    {
      id: 'e948d0a2-2d77-429d-a538-7d03ace499ad', // Aidan Harris (law student)
      name: 'Aidan Harris',
      role: 'researcher',
      featured: false
    }
  ];

  for (const profile of profilesToFlag) {
    console.log(`Flagging ${profile.name}...`);

    const { error } = await empathyLedgerClient
      .from('profiles')
      .update({
        justicehub_enabled: true,
        justicehub_role: profile.role,
        justicehub_featured: profile.featured
      })
      .eq('id', profile.id);

    if (error) {
      console.error(`  ❌ Failed:`, error.message);
    } else {
      console.log(`  ✅ Flagged as ${profile.role}${profile.featured ? ' (featured)' : ''}`);
    }
  }

  console.log('\n✨ Flagging complete!\n');
  console.log('Now run the sync script:');
  console.log('  npx tsx src/scripts/sync-empathy-ledger-profiles.ts\n');
}

flagProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
