import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function fixFlags() {
  console.log('🔧 Fixing flagged profiles...\n');

  // 1. Unflag the Orange Sky volunteers
  console.log('Unflagging Orange Sky volunteers...');
  const { error: unflagError } = await empathyLedgerClient
    .from('profiles')
    .update({
      justicehub_enabled: false,
      justicehub_role: null,
      justicehub_featured: false
    })
    .in('id', [
      'e948d0a2-2d77-429d-a538-7d03ace499ad', // Aidan Harris
      '6d596bf4-278e-441e-9198-866ec1690064'  // AJ Bailey
    ]);

  if (unflagError) {
    console.error('❌ Error unflagging:', unflagError);
  } else {
    console.log('✅ Unflagged Aidan Harris and AJ Bailey\n');
  }

  // 2. Delete them from JusticeHub
  console.log('Removing from JusticeHub...');
  const { error: deleteError } = await supabase
    .from('public_profiles')
    .delete()
    .in('empathy_ledger_profile_id', [
      'e948d0a2-2d77-429d-a538-7d03ace499ad',
      '6d596bf4-278e-441e-9198-866ec1690064'
    ]);

  if (deleteError) {
    console.error('❌ Error deleting:', deleteError);
  } else {
    console.log('✅ Removed from JusticeHub\n');
  }

  // 3. Flag the correct people - Oonchiumpa founders and youth justice advocates
  console.log('Flagging Oonchiumpa founders and youth justice advocates...');

  const correctProfiles = [
    {
      id: 'b59a1f4c-94fd-4805-a2c5-cac0922133e0', // Kristy Bloomfield
      name: 'Kristy Bloomfield',
      role: 'founder',
      featured: true
    },
    {
      id: 'dc85700d-f139-46fa-9074-6afee55ea801', // Tanya Turner
      name: 'Tanya Turner',
      role: 'founder',
      featured: true
    },
    {
      id: '1971d21d-5037-4f7b-90ce-966a4e74d398', // Patricia Ann Miller
      name: 'Patricia Ann Miller',
      role: 'founder',
      featured: true
    },
    {
      id: '1fea409d-bfeb-4ab4-b1a5-ff9090516677', // Benjamin Knight (you!)
      name: 'Benjamin Knight',
      role: 'advocate',
      featured: false
    },
    {
      id: '6383cfcc-1146-40c1-8337-d2e15e487022', // Uncle Dale
      name: 'Uncle Dale',
      role: 'leader',
      featured: true
    }
  ];

  for (const profile of correctProfiles) {
    const { error } = await empathyLedgerClient
      .from('profiles')
      .update({
        justicehub_enabled: true,
        justicehub_role: profile.role,
        justicehub_featured: profile.featured
      })
      .eq('id', profile.id);

    if (error) {
      console.error(`  ❌ Failed to flag ${profile.name}:`, error.message);
    } else {
      console.log(`  ✅ Flagged ${profile.name} as ${profile.role}${profile.featured ? ' (featured)' : ''}`);
    }
  }

  console.log('\n✨ Profile flags fixed!');
  console.log('\nNow run the sync script to update JusticeHub:');
  console.log('  npx tsx src/scripts/sync-empathy-ledger-profiles.ts\n');
}

fixFlags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
