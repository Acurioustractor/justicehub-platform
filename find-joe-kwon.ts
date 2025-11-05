import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function findJoeKwonStory() {
  console.log('🔍 Searching for Joe Kwon story...\n');

  // Search in articles
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, author_id, status, created_at')
    .ilike('title', '%Joe Kwon%');

  // Search in blog_posts
  const { data: blogs } = await supabase
    .from('blog_posts')
    .select('id, title, author_id, status, created_at')
    .ilike('title', '%Joe Kwon%');

  if (articles && articles.length > 0) {
    console.log('📄 Found in ARTICLES table:');
    articles.forEach(a => {
      console.log('  Title:', a.title);
      console.log('  ID:', a.id);
      console.log('  Author ID:', a.author_id || 'NULL ❌');
      console.log('  Status:', a.status);
      console.log('  Edit URL: http://localhost:3002/admin/stories/' + a.id);
      console.log('');
    });
  }

  if (blogs && blogs.length > 0) {
    console.log('📝 Found in BLOG_POSTS table:');
    blogs.forEach(b => {
      console.log('  Title:', b.title);
      console.log('  ID:', b.id);
      console.log('  Author ID:', b.author_id || 'NULL ❌');
      console.log('  Status:', b.status);
      console.log('  Edit URL: http://localhost:3002/admin/stories/' + b.id);
      console.log('');
    });
  }

  if ((!articles || articles.length === 0) && (!blogs || blogs.length === 0)) {
    console.log('❌ No stories found matching "Joe Kwon"');
    console.log('Searching for "caring"...\n');

    const { data: similar } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', '%caring%');

    const { data: similarBlogs } = await supabase
      .from('blog_posts')
      .select('id, title')
      .ilike('title', '%caring%');

    if (similar && similar.length > 0) {
      console.log('Found in articles:');
      similar.forEach(s => console.log('  -', s.title));
    }

    if (similarBlogs && similarBlogs.length > 0) {
      console.log('Found in blog_posts:');
      similarBlogs.forEach(s => console.log('  -', s.title));
    }
  }
}

findJoeKwonStory();
