import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function runMigration() {
  console.log('Adding Empathy Ledger linking columns to JusticeHub database...\n');

  try {
    // 1. Add columns to public_profiles
    console.log('1. Adding columns to public_profiles...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public_profiles
        ADD COLUMN IF NOT EXISTS empathy_ledger_profile_id UUID,
        ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS sync_type TEXT DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
      `
    });
    console.log('✓ public_profiles columns added\n');

    // 2. Add columns to organizations
    console.log('2. Adding columns to organizations...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS empathy_ledger_org_id UUID,
        ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
      `
    });
    console.log('✓ organizations columns added\n');

    // 3. Add columns to community_programs
    console.log('3. Adding columns to community_programs...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE community_programs
        ADD COLUMN IF NOT EXISTS empathy_ledger_project_id UUID,
        ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
      `
    });
    console.log('✓ community_programs columns added\n');

    // 4. Create sync log tables
    console.log('4. Creating sync log tables...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS profile_sync_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
          empathy_ledger_profile_id UUID,
          sync_action TEXT NOT NULL,
          sync_status TEXT NOT NULL,
          sync_details JSONB,
          error_message TEXT,
          synced_at TIMESTAMP DEFAULT now()
        );
      `
    });
    console.log('✓ profile_sync_log table created\n');

    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS organization_sync_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          empathy_ledger_org_id UUID,
          sync_action TEXT NOT NULL,
          sync_status TEXT NOT NULL,
          sync_details JSONB,
          error_message TEXT,
          synced_at TIMESTAMP DEFAULT now()
        );
      `
    });
    console.log('✓ organization_sync_log table created\n');

    // 5. Verify columns exist
    console.log('5. Verifying migration...');
    const { data: profileTest, error: profileError } = await supabase
      .from('public_profiles')
      .select('empathy_ledger_profile_id, synced_from_empathy_ledger, sync_type, last_synced_at')
      .limit(1);

    if (profileError) {
      console.error('❌ Error verifying public_profiles:', profileError);
    } else {
      console.log('✓ public_profiles migration verified');
    }

    const { data: orgTest, error: orgError } = await supabase
      .from('organizations')
      .select('empathy_ledger_org_id, synced_from_empathy_ledger, last_synced_at')
      .limit(1);

    if (orgError) {
      console.error('❌ Error verifying organizations:', orgError);
    } else {
      console.log('✓ organizations migration verified');
    }

    const { data: programTest, error: programError } = await supabase
      .from('community_programs')
      .select('empathy_ledger_project_id, synced_from_empathy_ledger, last_synced_at')
      .limit(1);

    if (programError) {
      console.error('❌ Error verifying community_programs:', programError);
    } else {
      console.log('✓ community_programs migration verified');
    }

    console.log('\n🎉 Migration complete! JusticeHub is ready for Empathy Ledger integration.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration();
