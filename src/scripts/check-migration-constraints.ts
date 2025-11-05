import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkConstraints() {
  console.log('🔍 Checking Migration Constraints\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Check category constraint on articles
  console.log('1️⃣ Checking category constraint on articles table...');
  const { data: sampleArticle, error: articleError } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
    .limit(10);

  if (articleError) {
    console.error('Error:', articleError.message);
  } else {
    const categories = [...new Set(sampleArticle?.map(a => a.category))];
    console.log('   Valid categories in use:', categories.join(', '));
  }

  // 2. Check blog_posts categories
  console.log('\n2️⃣ Checking blog_posts categories...');
  const { data: blogPosts, error: blogError } = await supabase
    .from('blog_posts')
    .select('id, title, categories, category');

  if (blogError) {
    console.error('Error:', blogError.message);
  } else {
    console.log('   Blog posts:');
    blogPosts?.forEach(post => {
      console.log(`   - "${post.title}"`);
      console.log(`     Categories: ${JSON.stringify(post.categories)}`);
      console.log(`     Category (single): ${post.category}`);
    });
  }

  // 3. Check author_id references
  console.log('\n3️⃣ Checking author_id references...');

  const { data: blogPost } = await supabase
    .from('blog_posts')
    .select('author_id')
    .limit(1)
    .single();

  console.log('   Blog post author_id:', blogPost?.author_id);

  // Check if authors table exists
  const { data: authorsCheck, error: authorsError } = await supabase
    .from('authors')
    .select('id')
    .limit(1);

  if (authorsError) {
    console.log('   ❌ authors table error:', authorsError.message);
  } else {
    console.log('   ✅ authors table exists');

    // Check if blog post author exists
    const { data: author } = await supabase
      .from('authors')
      .select('id, name')
      .eq('id', blogPost?.author_id)
      .single();

    console.log('   Blog post author in authors table:', author ? `✅ ${author.name}` : '❌ Not found');
  }

  // Check public_profiles
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, name')
    .eq('id', blogPost?.author_id)
    .single();

  console.log('   Blog post author in public_profiles:', profile ? `✅ ${profile.name}` : '❌ Not found');

  // 4. Check what articles table expects
  console.log('\n4️⃣ Checking articles table structure...');
  const { data: article } = await supabase
    .from('articles')
    .select('author_id')
    .not('author_id', 'is', null)
    .limit(1)
    .single();

  if (article) {
    console.log('   Sample article author_id:', article.author_id);

    // Check if it's in authors
    const { data: articleAuthor } = await supabase
      .from('authors')
      .select('id, name')
      .eq('id', article.author_id)
      .single();

    console.log('   Article author in authors table:', articleAuthor ? `✅ ${articleAuthor.name}` : '❌ Not found');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Issues to fix:');
  console.log('1. Category constraint - need to allow blog_posts categories');
  console.log('2. Author reference - need to check which table articles.author_id references');
}

checkConstraints().catch(console.error);
