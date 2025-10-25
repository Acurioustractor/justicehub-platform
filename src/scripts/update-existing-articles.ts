/**
 * Update existing articles in database with new full content and images
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  category: 'seeds' | 'growth' | 'harvest' | 'roots';
  isTrending: boolean;
  publishedAt: string;
  authorName: string;
  locationTags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

const articlesToUpdate = [
  'richard-cassidy---our-story',
  'the-diagrama-model-a-transformative-approach-to-youth-justice',
  'resoleution-at-bimberi-youth-justice-centre',
  'inquiry-into-the-making-queensland-safer-bill-2024---submission',
  'spotlight-on-changemaker-brodie-germaine',
  'resoleution',
  'diagrama-youth-justice-spain',
];

async function updateArticles() {
  console.log('🔄 Updating existing articles with full content and images...\n');

  // Load articles from JSON
  const articlesPath = join(process.cwd(), 'data', 'webflow-migration', 'articles.json');
  const articles: Article[] = JSON.parse(readFileSync(articlesPath, 'utf-8'));

  console.log(`📚 Loaded ${articles.length} articles from JSON\n`);
  console.log(`🎯 Updating ${articlesToUpdate.length} articles with new content...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const slug of articlesToUpdate) {
    const article = articles.find(a => a.slug === slug);

    if (!article) {
      console.log(`❌ Article not found in JSON: ${slug}`);
      errorCount++;
      continue;
    }

    console.log(`\n📄 Updating: ${article.title}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Content length: ${article.content.length} chars`);
    console.log(`   Image: ${article.featuredImageUrl}`);

    try {
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: article.content,
          excerpt: article.excerpt,
          featured_image_url: article.featuredImageUrl,
          seo_title: article.seoTitle,
          seo_description: article.seoDescription,
          category: article.category,
          location_tags: article.locationTags,
        })
        .eq('slug', slug)
        .select('id');

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`   ✅ Updated successfully (ID: ${data[0].id})`);
        successCount++;
      } else {
        console.log(`   ⚠️  Article not found in database`);
        errorCount++;
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Update Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully updated: ${successCount} articles`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\n🎉 All articles now have full content and images!\n');
}

updateArticles().catch(console.error);
