import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkStatus() {
  console.log('\n🔍 Checking Test User Setup Status\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Check if test user already exists in auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  const testUser = authUsers?.users.find(u => u.email === 'test@justicehub.au');

  console.log('1️⃣  Auth User (Supabase Auth):');
  console.log('   Status:', testUser ? '✅ EXISTS' : '❌ NOT FOUND');
  if (testUser) {
    console.log('   User ID:', testUser.id);
    console.log('   Email:', testUser.email);
  }

  // Check users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'test@justicehub.au')
    .maybeSingle();

  console.log('\n2️⃣  Users Table Record:');
  console.log('   Status:', userData ? '✅ EXISTS' : '❌ NOT FOUND');
  if (userData) {
    console.log('   ID:', userData.id);
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.role);
    console.log('   Active:', userData.is_active);
  }

  // Check Benjamin's profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug, user_id')
    .eq('slug', 'benjamin-knight')
    .single();

  console.log('\n3️⃣  Benjamin\'s Profile:');
  console.log('   Profile ID:', profile?.id);
  console.log('   Full Name:', profile?.full_name);
  console.log('   Linked User ID:', profile?.user_id || '❌ NULL (not linked)');

  console.log('\n═══════════════════════════════════════════════════\n');

  // Summary
  const authExists = !!testUser;
  const userTableExists = !!userData;
  const profileLinked = !!profile?.user_id;

  if (authExists && userTableExists && profileLinked) {
    console.log('✅ READY TO TEST!');
    console.log('\nNext steps:');
    console.log('1. Visit: http://localhost:3003/login');
    console.log('2. Log in with: test@justicehub.au / TestPassword123!');
    console.log('3. You should see the "Edit Profile" button');
  } else {
    console.log('⚠️  SETUP INCOMPLETE\n');
    console.log('Missing:');
    if (!authExists) console.log('  - Auth user (need to run setup)');
    if (!userTableExists) console.log('  - Users table record (run setup-test-user.sql)');
    if (!profileLinked) console.log('  - Profile link (run setup-test-user.sql)');
  }

  console.log('');
}

checkStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
