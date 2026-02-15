import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function listFlagged() {
  const { data, error } = await empathyLedgerClient
    .from('profiles')
    .select('id, display_name, bio, current_organization, justicehub_role, justicehub_featured, justicehub_synced_at')
    .eq('justicehub_enabled', true)
    .order('display_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📋 Profiles Flagged for JusticeHub in Empathy Ledger');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total: ${data?.length || 0} profiles`);
  console.log('');

  if (!data || data.length === 0) {
    console.log('No profiles flagged.');
    return;
  }

  // Group by featured status
  const featured = data.filter(p => p.justicehub_featured);
  const notFeatured = data.filter(p => !p.justicehub_featured);

  if (featured.length > 0) {
    console.log(`⭐ FEATURED PROFILES (${featured.length}):`);
    console.log('');
    featured.forEach((p, i) => {
      console.log(`${i + 1}. ${p.display_name}`);
      console.log(`   Role: ${p.justicehub_role || 'Not set'}`);
      console.log(`   Organization: ${p.current_organization || 'N/A'}`);
      console.log(`   Last synced: ${p.justicehub_synced_at ? new Date(p.justicehub_synced_at).toLocaleString() : 'Never'}`);
      if (p.bio) {
        console.log(`   Bio: ${p.bio.substring(0, 100)}...`);
      }
      console.log('');
    });
  }

  if (notFeatured.length > 0) {
    console.log('');
    console.log(`📌 OTHER PROFILES (${notFeatured.length}):`);
    console.log('');
    notFeatured.forEach((p, i) => {
      console.log(`${i + 1}. ${p.display_name}`);
      console.log(`   Role: ${p.justicehub_role || 'Not set'}`);
      console.log(`   Organization: ${p.current_organization || 'N/A'}`);
      console.log(`   Last synced: ${p.justicehub_synced_at ? new Date(p.justicehub_synced_at).toLocaleString() : 'Never'}`);
      if (p.bio) {
        console.log(`   Bio: ${p.bio.substring(0, 100)}...`);
      }
      console.log('');
    });
  }

  // Summary by role
  console.log('');
  console.log('📊 SUMMARY BY ROLE:');
  console.log('');
  const roleCount: Record<string, number> = {};
  data.forEach(p => {
    const role = p.justicehub_role || 'No role set';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });

  console.log('');
  console.log('📊 SUMMARY BY ORGANIZATION:');
  console.log('');
  const orgCount: Record<string, number> = {};
  data.forEach(p => {
    const org = p.current_organization || 'No organization';
    orgCount[org] = (orgCount[org] || 0) + 1;
  });

  Object.entries(orgCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([org, count]) => {
      console.log(`   ${org}: ${count}`);
    });
}

listFlagged()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
