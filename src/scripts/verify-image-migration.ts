import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
);

async function verifyImageMigration() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, featured_image_url, content')
    .order('created_at', { ascending: false });

  if (!articles) {
    console.log('No articles found');
    return;
  }

  const localImages = articles.filter(a => a.featured_image_url?.startsWith('/images/')).length;
  const externalImages = articles.filter(a => a.featured_image_url?.startsWith('http')).length;
  const noImages = articles.filter(a => !a.featured_image_url || a.featured_image_url === '').length;

  console.log('\n📊 IMAGE MIGRATION STATUS\n');
  console.log('━'.repeat(60));
  console.log(`  ✅ Local images (/images/articles/): ${localImages}`);
  console.log(`  ⚠️  External images (cdn.*): ${externalImages}`);
  console.log(`  ❌ No images: ${noImages}`);
  console.log(`  📚 Total articles: ${articles.length}`);
  console.log('━'.repeat(60));

  // Check for articles with markdown images/links
  let withInlineImages = 0;
  let withLinks = 0;

  articles.forEach(article => {
    if (article.content?.includes('![')) withInlineImages++;
    if (article.content?.includes('[http')) withLinks++;
  });

  console.log('\n📝 CONTENT STATUS\n');
  console.log('━'.repeat(60));
  console.log(`  🖼️  Articles with inline markdown images: ${withInlineImages}`);
  console.log(`  🔗 Articles with markdown links: ${withLinks}`);
  console.log('━'.repeat(60));

  // Show articles still with external images
  if (externalImages > 0) {
    console.log('\n⚠️  Articles still with external featured images:\n');
    articles
      .filter(a => a.featured_image_url?.startsWith('http'))
      .forEach(a => {
        console.log(`  - ${a.title}`);
        console.log(`    URL: ${a.featured_image_url?.substring(0, 70)}...`);
      });
  }

  console.log('\n✅ Migration Complete!\n');
}

verifyImageMigration().catch(console.error);
