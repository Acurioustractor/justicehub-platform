import { createClient } from '@supabase/supabase-js';

async function checkArticleContent() {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
  );

  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, featured_image_url, content')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('\n=== DATABASE ARTICLE CONTENT ANALYSIS ===\n');

  data.forEach((article, index) => {
    console.log(`\n[${index + 1}] ${article.title}`);
    console.log(`Slug: ${article.slug}`);
    console.log(`Featured Image: ${article.featured_image_url || 'NONE'}`);
    console.log(`Content Length: ${article.content?.length || 0} chars`);
    console.log(`Has Markdown Images: ${article.content?.includes('![') || false}`);
    console.log(`Has Markdown Links: ${article.content?.includes('[http') || false}`);
    console.log(`Has <img> tags: ${article.content?.includes('<img') || false}`);
    console.log(`Has <a> tags: ${article.content?.includes('<a') || false}`);

    // Count images
    const mdImages = (article.content?.match(/!\[/g) || []).length;
    const htmlImages = (article.content?.match(/<img/g) || []).length;
    console.log(`Markdown Images Count: ${mdImages}`);
    console.log(`HTML Images Count: ${htmlImages}`);

    // Sample content
    console.log(`\nFirst 300 chars:`);
    console.log(article.content?.substring(0, 300) + '...\n');
    console.log('─'.repeat(80));
  });
}

checkArticleContent().catch(console.error);
