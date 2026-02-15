/**
 * Setup Test User for Profile Editing
 *
 * This script:
 * 1. Checks for existing auth users
 * 2. Creates a test user if needed
 * 3. Links the user to Benjamin's profile
 * 4. Shows you how to log in
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupTestUser() {
  console.log('\n🔐 Setting Up Test User for Profile Editing\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Step 1: Check existing auth users
  console.log('Step 1: Checking for existing auth users...\n');

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Error fetching users:', authError.message);
    console.log('\nManual steps:');
    console.log('1. Go to Supabase Dashboard → Authentication → Users');
    console.log('2. Create a user manually');
    console.log('3. Come back and run this script again\n');
    return;
  }

  console.log(`Found ${authUsers.users.length} existing auth users:\n`);

  authUsers.users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email || 'No email'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}\n`);
  });

  let userId: string;

  if (authUsers.users.length === 0) {
    // No users exist, create one
    console.log('No users found. Creating test user...\n');

    const testEmail = 'test@justicehub.au';
    const testPassword = 'TestPassword123!';

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm email
    });

    if (createError) {
      console.log('❌ Error creating user:', createError.message);
      return;
    }

    userId = newUser.user.id;

    console.log('✅ Test user created!\n');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${userId}\n`);
    console.log('⚠️  SAVE THESE CREDENTIALS - You\'ll need them to log in!\n');

  } else {
    // Use first existing user
    userId = authUsers.users[0].id;
    console.log(`Using existing user: ${authUsers.users[0].email || 'No email'}`);
    console.log(`   ID: ${userId}\n`);
  }

  // Step 2: Check if user already exists in users table
  console.log('Step 2: Checking if user exists in users table...\n');

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (!existingUser) {
    console.log('Creating user record in users table...\n');

    // Create user record with platform_admin role for testing
    const { error: userCreateError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: authUsers.users[0]?.email || 'test@justicehub.au',
        role: 'platform_admin', // Make them admin for testing
        is_active: true,
        profile_completed: true
      });

    if (userCreateError) {
      console.log('❌ Error creating user record:', userCreateError.message);
      console.log('\nManual SQL to run in Supabase Dashboard:\n');
      console.log(`INSERT INTO users (id, email, role, is_active, profile_completed)`);
      console.log(`VALUES ('${userId}', 'test@justicehub.au', 'platform_admin', true, true);\n`);
      return;
    }

    console.log('✅ User record created with platform_admin role\n');
  } else {
    console.log(`✅ User exists: ${existingUser.email} (${existingUser.role})\n`);
  }

  // Step 3: Link user to Benjamin's profile
  console.log('Step 3: Linking user to Benjamin Knight profile...\n');

  const { data: profile, error: profileError } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug, user_id')
    .eq('slug', 'benjamin-knight')
    .single();

  if (profileError || !profile) {
    console.log('❌ Could not find Benjamin Knight profile');
    return;
  }

  if (profile.user_id) {
    console.log(`⚠️  Profile already linked to user: ${profile.user_id}\n`);
    console.log('Updating to new user...\n');
  }

  const { error: updateError } = await supabase
    .from('public_profiles')
    .update({ user_id: userId })
    .eq('slug', 'benjamin-knight');

  if (updateError) {
    console.log('❌ Error linking profile:', updateError.message);
    console.log('\nManual SQL to run:\n');
    console.log(`UPDATE public_profiles SET user_id = '${userId}' WHERE slug = 'benjamin-knight';\n`);
    return;
  }

  console.log('✅ Profile linked successfully!\n');

  // Step 4: Verify everything
  console.log('═══════════════════════════════════════════════════\n');
  console.log('🎉 Setup Complete!\n');
  console.log('Profile: Benjamin Knight');
  console.log(`Linked to User ID: ${userId}`);
  console.log(`User Email: ${authUsers.users[0]?.email || 'test@justicehub.au'}\n`);

  console.log('═══════════════════════════════════════════════════\n');
  console.log('🎯 Next Steps:\n');
  console.log('1. Make sure your dev server is running:');
  console.log('   npm run dev\n');
  console.log('2. Visit Benjamin\'s profile:');
  console.log('   http://localhost:3003/people/benjamin-knight\n');
  console.log('3. You should see the "Edit Profile" button in the top-right!\n');
  console.log('4. Click it to test editing!\n');

  console.log('═══════════════════════════════════════════════════\n');
  console.log('⚠️  IMPORTANT: Authentication Note\n');
  console.log('The "Edit Profile" button only shows if:');
  console.log('  - You are logged in as this user');
  console.log('  - OR you are a platform_admin\n');
  console.log('Since the user is now a platform_admin, the button should');
  console.log('appear on ALL profile pages when logged in!\n');

  // Check if dev server is running
  console.log('Checking if dev server is running...\n');
  try {
    const response = await fetch('http://localhost:3003');
    if (response.ok) {
      console.log('✅ Dev server is running!\n');
    }
  } catch (error) {
    console.log('⚠️  Dev server not detected. Run: npm run dev\n');
  }

  console.log('═══════════════════════════════════════════════════\n');
}

setupTestUser()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
