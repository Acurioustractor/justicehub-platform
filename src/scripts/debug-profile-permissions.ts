import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function debugPermissions() {
  console.log('\n🔍 Debugging Profile Edit Permissions\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Check auth user
  const { data: authData } = await supabase.auth.admin.listUsers();
  const testUser = authData?.users.find(u => u.email === 'test@justicehub.au');

  console.log('1️⃣  Auth User:');
  if (testUser) {
    console.log('   ✅ Found:', testUser.id);
    console.log('   Email:', testUser.email);
  } else {
    console.log('   ❌ Not found');
    return;
  }

  // 2. Check users table with correct column name
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, user_role, is_active')
    .eq('id', testUser.id)
    .single();

  console.log('\n2️⃣  Users Table:');
  if (userData) {
    console.log('   ✅ Found');
    console.log('   ID:', userData.id);
    console.log('   Email:', userData.email);
    console.log('   User Role:', userData.user_role);
    console.log('   Active:', userData.is_active);
  } else {
    console.log('   ❌ Not found');
    console.log('   Error:', userError?.message);
  }

  // 3. Check Benjamin's profile
  const { data: profile, error: profileError } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug, user_id, is_public')
    .eq('slug', 'benjamin-knight')
    .single();

  console.log('\n3️⃣  Benjamin\'s Profile:');
  if (profile) {
    console.log('   ✅ Found');
    console.log('   ID:', profile.id);
    console.log('   Name:', profile.full_name);
    console.log('   Slug:', profile.slug);
    console.log('   User ID:', profile.user_id || '❌ NULL');
    console.log('   Is Public:', profile.is_public);
  } else {
    console.log('   ❌ Not found');
    console.log('   Error:', profileError?.message);
  }

  // 4. Check permission logic
  console.log('\n4️⃣  Permission Checks:');
  const isOwner = profile?.user_id === testUser.id;
  const isAdmin = userData?.user_role === 'admin';

  console.log('   User owns profile?', isOwner ? '✅ YES' : '❌ NO');
  console.log('   User is admin?', isAdmin ? '✅ YES' : '❌ NO');
  console.log('   Can edit?', (isOwner || isAdmin) ? '✅ YES' : '❌ NO');

  console.log('\n═══════════════════════════════════════════════════\n');

  if (!isOwner && !isAdmin) {
    console.log('❌ EDIT BUTTON WILL NOT APPEAR\n');
    console.log('Reasons:');
    if (!profile?.user_id) {
      console.log('  - Profile not linked to any user (user_id is NULL)');
      console.log('  - Fix: Run setup-test-user-corrected.sql');
    }
    if (profile?.user_id && profile.user_id !== testUser.id) {
      console.log('  - Profile linked to different user');
      console.log('    Expected:', testUser.id);
      console.log('    Actual:', profile.user_id);
    }
    if (!isAdmin) {
      console.log('  - User is not admin');
      console.log('    Expected: user_role = "admin"');
      console.log('    Actual: user_role =', userData?.user_role || 'NULL');
    }
  } else {
    console.log('✅ EDIT BUTTON SHOULD APPEAR\n');
    console.log('Next step: Fix the page.tsx to use user_role instead of role');
  }

  console.log('');
}

debugPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
