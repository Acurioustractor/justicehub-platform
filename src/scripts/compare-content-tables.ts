import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function compareContentTables() {
  console.log('📊 Comparing blog_posts vs articles tables\n');

  // Check blog_posts
  const { data: blogPosts, error: blogError } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1);

  console.log('blog_posts table:');
  console.log('  Exists:', blogError === null);
  if (blogPosts && blogPosts.length > 0) {
    console.log('  Sample fields:', Object.keys(blogPosts[0]).join(', '));
  }
  if (blogError) console.log('  Error:', blogError.message);

  // Check articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .limit(1);

  console.log('\narticles table:');
  console.log('  Exists:', articlesError === null);
  if (articles && articles.length > 0) {
    console.log('  Sample fields:', Object.keys(articles[0]).join(', '));
  }
  if (articlesError) console.log('  Error:', articlesError.message);

  // Count records
  const { count: blogCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  const { count: articleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  console.log('\n📈 Record counts:');
  console.log('  blog_posts:', blogCount || 0);
  console.log('  articles:', articleCount || 0);

  // Compare schemas
  if (blogPosts && blogPosts.length > 0 && articles && articles.length > 0) {
    console.log('\n🔍 Schema Comparison:');
    const blogFields = new Set(Object.keys(blogPosts[0]));
    const articleFields = new Set(Object.keys(articles[0]));

    const onlyInBlog = Array.from(blogFields).filter(f => !articleFields.has(f));
    const onlyInArticles = Array.from(articleFields).filter(f => !blogFields.has(f));
    const common = Array.from(blogFields).filter(f => articleFields.has(f));

    console.log('\nFields only in blog_posts:', onlyInBlog.length > 0 ? onlyInBlog.join(', ') : 'None');
    console.log('Fields only in articles:', onlyInArticles.length > 0 ? onlyInArticles.join(', ') : 'None');
    console.log('Common fields:', common.join(', '));
  }

  // Check for actual data
  console.log('\n📝 Sample Data:');

  const { data: recentBlog } = await supabase
    .from('blog_posts')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (recentBlog && recentBlog.length > 0) {
    console.log('\nRecent blog_posts:');
    recentBlog.forEach(post => {
      console.log(`  - ${post.title} (${post.slug})`);
    });
  }

  if (recentArticles && recentArticles.length > 0) {
    console.log('\nRecent articles:');
    recentArticles.forEach(article => {
      console.log(`  - ${article.title} (${article.slug})`);
    });
  }

  // Check editors
  console.log('\n📝 Editor Analysis:');
  console.log('Blog Posts Editor: /admin/blog/new');
  console.log('Stories Editor: /stories/new');
  console.log('\n❌ PROBLEM: Two separate editors for essentially the same content type!');
  console.log('\n✅ SOLUTION: Unify into single "Stories" editor using articles table');
}

compareContentTables().catch(console.error);
