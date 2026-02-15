import { createClient } from '@supabase/supabase-js';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function testColumns() {
  console.log('🔍 Testing database columns...\n');

  // Test JusticeHub - try to select empathy_ledger columns
  console.log('📊 Testing JusticeHub database...');
  try {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, full_name, empathy_ledger_profile_id, synced_from_empathy_ledger, sync_type, last_synced_at')
      .limit(1);

    if (error) {
      console.error('❌ JusticeHub columns missing:', error.message);
      console.log('   Column that failed:', error.message.includes('empathy_ledger_profile_id') ? 'empathy_ledger_profile_id' : 'unknown');
    } else {
      console.log('✅ JusticeHub columns exist!');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.error('❌ JusticeHub test failed:', err);
  }

  // Test sync log table
  console.log('\n📊 Testing profile_sync_log table...');
  try {
    const { data, error } = await supabase
      .from('profile_sync_log')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ profile_sync_log table missing:', error.message);
    } else {
      console.log('✅ profile_sync_log table exists!');
    }
  } catch (err) {
    console.error('❌ profile_sync_log test failed:', err);
  }

  // Test Empathy Ledger - try to select justicehub columns
  console.log('\n📊 Testing Empathy Ledger database...');
  try {
    const { data, error } = await empathyLedgerClient
      .from('profiles')
      .select('id, display_name, justicehub_enabled, justicehub_role, justicehub_featured, justicehub_synced_at')
      .limit(1);

    if (error) {
      console.error('❌ Empathy Ledger columns missing:', error.message);
      console.log('   Column that failed:', error.message.includes('justicehub_enabled') ? 'justicehub_enabled' : 'unknown');
    } else {
      console.log('✅ Empathy Ledger columns exist!');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Empathy Ledger test failed:', err);
  }

  // Check for flagged profiles
  console.log('\n🔍 Checking for flagged profiles...');
  try {
    const { data, error } = await empathyLedgerClient
      .from('profiles')
      .select('id, display_name, justicehub_enabled, justicehub_role, justicehub_featured')
      .eq('justicehub_enabled', true);

    if (error) {
      console.error('❌ Error checking flagged profiles:', error.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} profiles flagged for JusticeHub`);
      if (data && data.length > 0) {
        console.log('\nFlagged profiles:');
        data.forEach(p => {
          console.log(`   - ${p.display_name} (${p.justicehub_role || 'no role'})${p.justicehub_featured ? ' ⭐ Featured' : ''}`);
        });
      } else {
        console.log('\n💡 To flag a profile, run this SQL in Empathy Ledger:');
        console.log('   UPDATE profiles SET justicehub_enabled = true, justicehub_role = \'founder\' WHERE id = \'profile-id\';');
      }
    }
  } catch (err) {
    console.error('❌ Flagged profiles test failed:', err);
  }

  console.log('\n✨ Test complete!\n');
}

testColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
