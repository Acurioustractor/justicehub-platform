import { createClient } from '@supabase/supabase-js';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function verifySchemas() {
  console.log('🔍 Verifying database schemas...\n');

  // Check JusticeHub columns
  console.log('📊 Checking JusticeHub database...');
  const { data: jhColumns, error: jhError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'public_profiles')
    .like('column_name', '%empathy%');

  if (jhError) {
    console.error('❌ Error checking JusticeHub:', jhError);
  } else {
    console.log('✅ JusticeHub public_profiles columns:', jhColumns);
  }

  // Check for sync log table
  const { data: syncLog, error: syncLogError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'profile_sync_log')
    .single();

  if (syncLogError) {
    console.log('❌ profile_sync_log table not found');
  } else {
    console.log('✅ profile_sync_log table exists');
  }

  // Check Empathy Ledger columns
  console.log('\n📊 Checking Empathy Ledger database...');
  const { data: elColumns, error: elError } = await empathyLedgerClient
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'profiles')
    .like('column_name', '%justicehub%');

  if (elError) {
    console.error('❌ Error checking Empathy Ledger:', elError);
  } else {
    console.log('✅ Empathy Ledger profiles columns:', elColumns);
  }

  // Check for flagged profiles
  console.log('\n🔍 Checking for flagged profiles...');
  const { data: flaggedProfiles, error: flaggedError } = await empathyLedgerClient
    .from('profiles')
    .select('id, display_name, justicehub_enabled, justicehub_role, justicehub_featured')
    .eq('justicehub_enabled', true);

  if (flaggedError) {
    console.error('❌ Error checking flagged profiles:', flaggedError);
  } else {
    console.log(`✅ Found ${flaggedProfiles?.length || 0} profiles flagged for JusticeHub`);
    if (flaggedProfiles && flaggedProfiles.length > 0) {
      flaggedProfiles.forEach(p => {
        console.log(`   - ${p.display_name} (${p.justicehub_role || 'no role'})`);
      });
    }
  }

  console.log('\n✨ Verification complete!\n');
}

verifySchemas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
