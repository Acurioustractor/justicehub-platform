import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function compareArticles() {
  console.log('🔍 Comparing Webflow Articles with Database\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get webflow articles
  const webflowPath = join(process.cwd(), 'data/webflow-migration/articles.json');
  const webflowArticles = JSON.parse(readFileSync(webflowPath, 'utf-8'));
  const webflowSlugs = new Set(webflowArticles.map((a: any) => a.slug));

  console.log(`📁 Webflow articles: ${webflowSlugs.size}`);

  // Get database articles
  const { data: dbArticles, error } = await supabase
    .from('articles')
    .select('slug, title');

  if (error) {
    console.error('Error fetching database articles:', error.message);
    return;
  }

  const dbSlugs = new Set(dbArticles?.map(a => a.slug) || []);

  console.log(`💾 Database articles: ${dbSlugs.size}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('=== CHECKING FOR MISSING ARTICLES ===\n');

  let missingCount = 0;
  const missingArticles: any[] = [];

  webflowArticles.forEach((article: any) => {
    if (!dbSlugs.has(article.slug)) {
      missingCount++;
      missingArticles.push(article);
      console.log(`❌ ${missingCount}. ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Category: ${article.category || 'N/A'}`);
      console.log(`   Published: ${article.publishedAt || 'N/A'}\n`);
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missingCount === 0) {
    console.log('✅ ALL WEBFLOW ARTICLES ARE IN THE DATABASE!');
    console.log(`\n📊 Summary:`);
    console.log(`   Webflow: ${webflowSlugs.size} articles`);
    console.log(`   Database: ${dbSlugs.size} articles`);
    console.log(`   Missing: 0 articles`);
    console.log(`   Extra in DB: ${dbSlugs.size - webflowSlugs.size} articles`);
  } else {
    console.log(`⚠️  MISSING ARTICLES: ${missingCount}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Webflow: ${webflowSlugs.size} articles`);
    console.log(`   Database: ${dbSlugs.size} articles`);
    console.log(`   Missing: ${missingCount} articles`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Check if these articles were intentionally excluded`);
    console.log(`   2. Or run migration to import missing articles`);
  }
}

compareArticles().catch(console.error);
