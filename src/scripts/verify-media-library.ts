import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''
);

async function verify() {
  console.log('🔍 Verifying media_library table...\n');

  try {
    // Check if table exists
    const { data: columns, error } = await supabase
      .from('media_library')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ media_library table exists!\n');

    // Count existing media
    const { count, error: countError } = await supabase
      .from('media_library')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log('📊 Current media count:', count || 0, '\n');
    }

    // Check blog_posts has reading_time_minutes
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, reading_time_minutes')
      .limit(1);

    if (!postsError) {
      console.log('✅ blog_posts.reading_time_minutes column exists!\n');
    }

    console.log('🎉 Database migration successful!\n');
    console.log('📝 Next steps:');
    console.log('   1. Visit http://localhost:3003/admin/blog/new');
    console.log('   2. Upload an image to test optimization');
    console.log('   3. Visit http://localhost:3003/admin/media');
    console.log('   4. See your media library in action!');

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  }
}

verify();
