import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies on blog_posts table\n');

  console.log('🧪 Testing INSERT operation to check RLS policies...\n');

  // Get a test user and profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, user_id, full_name')
    .not('user_id', 'is', null)
    .limit(1)
    .single();

  if (!profile) {
    console.log('❌ No profiles found with user_id');
    return;
  }

  console.log(`Found profile: ${profile.full_name}`);
  console.log(`  Profile ID: ${profile.id}`);
  console.log(`  User ID: ${profile.user_id}\n`);

  const testPost = {
    title: 'RLS Test Post',
    slug: `rls-test-${Date.now()}`,
    excerpt: 'Testing RLS policies',
    content: '<p>Test</p>',
    status: 'draft',
    author_id: profile.id,
    reading_time_minutes: 1,
  };

  console.log('Attempting INSERT with:');
  console.log(`  author_id (profile.id): ${testPost.author_id}`);
  console.log(`  This should match profile.user_id via RLS policy\n`);

  const { data: insertData, error: insertError } = await supabase
    .from('blog_posts')
    .insert([testPost])
    .select()
    .single();

  if (insertError) {
    console.log('❌ INSERT failed:');
    console.log('   Code:', insertError.code);
    console.log('   Message:', insertError.message);
    console.log('   Details:', insertError.details);
    console.log('   Hint:', insertError.hint);

    if (insertError.code === '42501') {
      console.log('\n🔴 Error code 42501 = RLS policy violation');
      console.log('   This means the RLS policies are NOT correctly configured');
      console.log('   The migration may not have been applied successfully');
    } else if (insertError.code === '23505') {
      console.log('\n🟡 Error code 23505 = Unique constraint violation');
      console.log('   This means RLS passed but slug already exists');
      console.log('   RLS policies are working correctly!');
    }
  } else {
    console.log('✅ INSERT succeeded!');
    console.log(`   Post ID: ${insertData.id}`);
    console.log('\n🎉 RLS policies are working correctly!\n');

    // Clean up
    console.log('🧹 Cleaning up test post...');
    await supabase.from('blog_posts').delete().eq('id', insertData.id);
    console.log('✅ Test post deleted\n');
  }
}

checkRLSPolicies().catch(console.error);
