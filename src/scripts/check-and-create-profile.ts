import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfile() {
  console.log('🔍 Checking for test user profile...');

  // Get the current user (test@justicehub.au based on logs)
  const { data: authData } = await supabase.auth.admin.listUsers();
  const testUser = authData.users.find(u => u.email === 'test@justicehub.au');

  if (!testUser) {
    console.log('❌ Test user not found');
    return;
  }

  console.log('✅ User ID:', testUser.id);
  console.log('   Email:', testUser.email);

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('user_id', testUser.id)
    .single();

  if (profile) {
    console.log('\n✅ Profile exists:');
    console.log('   Profile ID:', profile.id);
    console.log('   Full Name:', profile.full_name);
    console.log('   Slug:', profile.slug);
  } else {
    console.log('\n❌ No profile found for user');
    console.log('   Error:', profileError?.message);

    // Create profile
    console.log('\n📝 Creating profile...');
    const { data: newProfile, error } = await supabase
      .from('public_profiles')
      .insert({
        user_id: testUser.id,
        email: testUser.email,
        full_name: 'Test User',
        slug: 'test-user-' + Date.now()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error);
    } else {
      console.log('✅ Created profile:');
      console.log('   Profile ID:', newProfile.id);
      console.log('   Full Name:', newProfile.full_name);
      console.log('   Slug:', newProfile.slug);
    }
  }
}

checkProfile();
