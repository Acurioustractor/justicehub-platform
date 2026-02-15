import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['YJSF_SUPABASE_SERVICE_KEY']!
);

async function fixAllContentAuthors() {
  console.log('🔍 Finding Ben Knight\'s profile...');

  // Get Ben Knight's profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, full_name')
    .eq('id', 'a0eed8bd-28d4-4c95-b203-a17fc7fc897d')
    .single();

  if (!profile) {
    console.error('❌ Ben Knight profile not found');
    return;
  }

  console.log(`✅ Using profile: ${profile.full_name} (${profile.id})\n`);

  // Fix articles
  console.log('📝 Checking articles table...');
  const { data: articlesWithNoAuthor } = await supabase
    .from('articles')
    .select('id, title, author_id')
    .is('author_id', null);

  if (articlesWithNoAuthor && articlesWithNoAuthor.length > 0) {
    console.log(`Found ${articlesWithNoAuthor.length} articles without author`);

    const { data: updatedArticles } = await supabase
      .from('articles')
      .update({ author_id: profile.id })
      .is('author_id', null)
      .select('id, title');

    console.log(`✅ Updated ${updatedArticles?.length || 0} articles\n`);
  } else {
    console.log('✅ All articles have authors\n');
  }

  // Fix blog_posts
  console.log('📝 Checking blog_posts table...');
  const { data: blogsWithNoAuthor } = await supabase
    .from('blog_posts')
    .select('id, title, author_id')
    .is('author_id', null);

  if (blogsWithNoAuthor && blogsWithNoAuthor.length > 0) {
    console.log(`Found ${blogsWithNoAuthor.length} blog posts without author`);

    const { data: updatedBlogs } = await supabase
      .from('blog_posts')
      .update({ author_id: profile.id })
      .is('author_id', null)
      .select('id, title');

    console.log(`✅ Updated ${updatedBlogs?.length || 0} blog posts\n`);
  } else {
    console.log('✅ All blog posts have authors\n');
  }

  // Show summary
  console.log('📊 Final Summary:');
  const { data: allArticles, count: articleCount } = await supabase
    .from('articles')
    .select('id', { count: 'exact' });

  const { data: allBlogs, count: blogCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact' });

  console.log(`  - ${articleCount || 0} total articles`);
  console.log(`  - ${blogCount || 0} total blog posts`);
  console.log(`  - ${(articleCount || 0) + (blogCount || 0)} total content items\n`);

  console.log('✅ All content is now editable by Ben Knight!');
}

fixAllContentAuthors();
