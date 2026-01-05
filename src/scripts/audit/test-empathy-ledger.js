/**
 * Test Empathy Ledger Connection
 */

const { createClient } = require('@supabase/supabase-js');

// Empathy Ledger connection
const empathyClient = createClient(
  process.env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs'
);

async function test() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         EMPATHY LEDGER CONNECTION TEST                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let connected = true;

  // Test stories
  const { count: storyCount, error: storyErr } = await empathyClient
    .from('stories')
    .select('*', { count: 'exact', head: true });

  if (storyErr) {
    console.log('❌ Stories table error:', storyErr.message);
    connected = false;
  } else {
    console.log('✓ Stories:', storyCount);
  }

  // Test profiles
  const { count: profileCount, error: profileErr } = await empathyClient
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (profileErr) {
    console.log('❌ Profiles table error:', profileErr.message);
    connected = false;
  } else {
    console.log('✓ Profiles:', profileCount);
  }

  // Test organizations
  const { count: orgCount, error: orgErr } = await empathyClient
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  if (orgErr) {
    console.log('❌ Organizations table error:', orgErr.message);
    connected = false;
  } else {
    console.log('✓ Organizations:', orgCount);
  }

  // Test projects
  const { count: projectCount, error: projectErr } = await empathyClient
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (projectErr) {
    console.log('❌ Projects table error:', projectErr.message);
    connected = false;
  } else {
    console.log('✓ Projects:', projectCount);
  }

  // Check JusticeHub-enabled profiles
  const { count: jhProfiles, error: jhErr } = await empathyClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('justicehub_enabled', true);

  if (jhErr) {
    console.log('⚠️  JusticeHub profiles column may not exist:', jhErr.message);
  } else {
    console.log('✓ JusticeHub-enabled profiles:', jhProfiles);
  }

  // Get sample public stories
  const { data: sampleStories, error: sampleErr } = await empathyClient
    .from('stories')
    .select('title, is_public, privacy_level, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (sampleErr) {
    console.log('⚠️  Could not fetch sample stories:', sampleErr.message);
  } else if (sampleStories && sampleStories.length > 0) {
    console.log('\n📖 Sample public stories:');
    sampleStories.forEach(s => console.log('  - ' + s.title));
  } else {
    console.log('\n📖 No public stories found');
  }

  // Get sample organizations
  const { data: sampleOrgs, error: orgSampleErr } = await empathyClient
    .from('organizations')
    .select('name, type, indigenous_controlled')
    .limit(5);

  if (orgSampleErr) {
    console.log('⚠️  Could not fetch sample organizations:', orgSampleErr.message);
  } else if (sampleOrgs && sampleOrgs.length > 0) {
    console.log('\n🏢 Sample organizations:');
    sampleOrgs.forEach(o => {
      const tag = o.indigenous_controlled ? ' [Indigenous-controlled]' : '';
      console.log('  - ' + o.name + tag);
    });
  }

  console.log('\n' + '─'.repeat(60));
  if (connected) {
    console.log('✅ Empathy Ledger connection successful!');
    console.log('\nSummary:');
    console.log('  Stories:       ' + storyCount);
    console.log('  Profiles:      ' + profileCount);
    console.log('  Organizations: ' + orgCount);
    console.log('  Projects:      ' + projectCount);
  } else {
    console.log('❌ Empathy Ledger connection failed');
  }
}

test().catch(err => console.error('Error:', err));
