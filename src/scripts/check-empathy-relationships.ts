import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function checkEmpathySchema() {
  console.log('Checking Empathy Ledger schema and relationships...\n');

  // Check what columns exist in the profiles table
  const { data: sampleProfile } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  console.log('📋 Empathy Ledger profile columns:');
  const columns = Object.keys(sampleProfile || {}).sort();
  columns.forEach(col => console.log(`  - ${col}`));

  // Check for relationship tables
  console.log('\n\n🔗 Checking for relationship tables...\n');

  // Try organizations table
  const { data: orgs, error: orgError } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .limit(1);

  if (orgError) {
    console.log('✗ organizations table:', orgError.message);
  } else {
    console.log('✓ organizations table exists');
    if (orgs && orgs.length > 0) {
      console.log('  Columns:', Object.keys(orgs[0]).join(', '));
    }
  }

  // Try organization_members
  const { data: orgMembers, error: membersError } = await empathyLedgerClient
    .from('organization_members')
    .select('*')
    .limit(1);

  if (membersError) {
    console.log('✗ organization_members table:', membersError.message);
  } else {
    console.log('✓ organization_members table exists');
    if (orgMembers && orgMembers.length > 0) {
      console.log('  Columns:', Object.keys(orgMembers[0]).join(', '));
    }
  }

  // Try stories
  const { data: stories, error: storiesError } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .limit(1);

  if (storiesError) {
    console.log('✗ stories table:', storiesError.message);
  } else {
    console.log('✓ stories table exists');
    if (stories && stories.length > 0) {
      console.log('  Columns:', Object.keys(stories[0]).join(', '));
    }
  }

  // Try transcripts
  const { data: transcripts, error: transcriptsError } = await empathyLedgerClient
    .from('transcripts')
    .select('*')
    .limit(1);

  if (transcriptsError) {
    console.log('✗ transcripts table:', transcriptsError.message);
  } else {
    console.log('✓ transcripts table exists');
    if (transcripts && transcripts.length > 0) {
      console.log('  Columns:', Object.keys(transcripts[0]).join(', '));
    }
  }

  // Try galleries
  const { data: galleries, error: galleriesError } = await empathyLedgerClient
    .from('galleries')
    .select('*')
    .limit(1);

  if (galleriesError) {
    console.log('✗ galleries table:', galleriesError.message);
  } else {
    console.log('✓ galleries table exists');
    if (galleries && galleries.length > 0) {
      console.log('  Columns:', Object.keys(galleries[0]).join(', '));
    }
  }

  // Check for a specific profile's relationships
  console.log('\n\n👤 Checking relationships for Kristy Bloomfield...\n');

  const { data: kristy } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .eq('display_name', 'Kristy Bloomfield')
    .single();

  if (kristy) {
    console.log(`Profile ID: ${kristy.id}`);
    console.log(`Current Org: ${kristy.current_organization || 'none'}`);

    // Try to find organization memberships
    const { data: memberships, error: memError } = await empathyLedgerClient
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('profile_id', kristy.id);

    if (!memError && memberships) {
      console.log(`\nOrganization memberships: ${memberships.length}`);
      memberships.forEach((m: any) => {
        console.log(`  - ${m.organizations?.name || 'Unknown'} (${m.role || 'no role'})`);
      });
    }

    // Try to find stories
    const { data: profileStories, error: storyError } = await empathyLedgerClient
      .from('stories')
      .select('*')
      .eq('profile_id', kristy.id);

    if (!storyError && profileStories) {
      console.log(`\nStories created: ${profileStories.length}`);
      profileStories.forEach((s: any) => {
        console.log(`  - ${s.title || 'Untitled'} (${s.status || 'unknown status'})`);
      });
    }
  }
}

checkEmpathySchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
