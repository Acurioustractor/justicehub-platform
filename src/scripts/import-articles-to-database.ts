/**
 * Import articles from scraped data to Supabase database
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

async function importArticles() {
  console.log('📚 Importing articles to Supabase...\n');

  // Load articles from JSON
  const articlesPath = join(process.cwd(), 'data', 'webflow-migration', 'articles.json');
  const articles: Article[] = JSON.parse(readFileSync(articlesPath, 'utf-8'));

  console.log(`Found ${articles.length} articles to import\n`);

  // Get Benjamin Knight's author ID
  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id')
    .eq('slug', 'benjamin-knight')
    .single();

  if (authorError || !author) {
    console.error('❌ Could not find Benjamin Knight author record');
    console.error('   Make sure you ran the database migration first!');
    process.exit(1);
  }

  console.log(`✅ Found author: Benjamin Knight (${author.id})\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    console.log(`📄 Importing: ${article.title}`);

    try {
      // Check if article already exists
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', article.slug)
        .single();

      if (existing) {
        console.log(`   ⚠️  Already exists, skipping...`);
        skipped++;
        continue;
      }

      // Insert article
      const { data, error } = await supabase
        .from('articles')
        .insert({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          featured_image_url: article.featuredImageUrl,
          author_id: author.id,
          category: article.category,
          is_trending: article.isTrending,
          published_at: article.publishedAt,
          status: 'published',
          location_tags: article.locationTags,
          seo_title: article.seoTitle || article.title,
          seo_description: article.seoDescription || article.excerpt,
          metadata: {
            source: 'webflow_migration',
            migrated_at: new Date().toISOString(),
            original_author: article.authorName,
          },
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errors++;
        continue;
      }

      console.log(`   ✅ Imported successfully (ID: ${data.id})`);
      console.log(`   📍 Locations: ${article.locationTags.join(', ')}`);
      console.log(`   🏷️  Category: ${article.category}`);
      console.log(`   📏 Content: ${article.content.length} chars`);

      imported++;

      // Add article locations if they have coordinates
      if (article.locationTags.length > 0) {
        console.log(`   📍 Adding location data...`);

        // Common Australian locations with coordinates
        const locationCoords: Record<string, { lat: number; lng: number; state: string }> = {
          'Mount Isa': { lat: -20.7256, lng: 139.4927, state: 'QLD' },
          'Brisbane': { lat: -27.4705, lng: 153.0260, state: 'QLD' },
          'Queensland': { lat: -20.9176, lng: 142.7028, state: 'QLD' },
          'Palm Island': { lat: -18.7556, lng: 146.5811, state: 'QLD' },
          'Cairns': { lat: -16.9186, lng: 145.7781, state: 'QLD' },
          'Gold Coast': { lat: -28.0167, lng: 153.4000, state: 'QLD' },
          'Townsville': { lat: -19.2590, lng: 146.8169, state: 'QLD' },
          'Spain': { lat: 40.4637, lng: -3.7492, state: 'International' },
          'Athens': { lat: 37.9838, lng: 23.7275, state: 'International' },
          'Australia': { lat: -25.2744, lng: 133.7751, state: 'National' },
        };

        for (const locationName of article.locationTags) {
          const coords = locationCoords[locationName];
          if (coords) {
            const { error: locError } = await supabase
              .from('article_locations')
              .insert({
                article_id: data.id,
                location_name: locationName,
                location_city: locationName === 'Queensland' || locationName === 'Australia' ? null : locationName,
                location_state: coords.state,
                latitude: coords.lat,
                longitude: coords.lng,
              });

            if (!locError) {
              console.log(`      ✅ Added location: ${locationName} (${coords.lat}, ${coords.lng})`);
            }
          } else {
            console.log(`      ⚠️  No coordinates for: ${locationName}`);
          }
        }
      }

      console.log('');

    } catch (error: any) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      errors++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Import Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Imported: ${imported} articles`);
  console.log(`⚠️  Skipped: ${skipped} articles (already exist)`);
  console.log(`❌ Errors: ${errors} articles`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (imported > 0) {
    console.log('🎉 Success! Articles are now live in the database.\n');
    console.log('📋 Next steps:');
    console.log('   1. Build frontend pages to display articles');
    console.log('   2. Test at: https://yoursite.com/stories');
    console.log('   3. Integrate with Justice Map\n');
  }

  // Verify import
  console.log('🔍 Verifying import...');
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  console.log(`✅ Total published articles in database: ${count}\n`);

  // Show articles by category
  const { data: byCat } = await supabase
    .from('articles')
    .select('category')
    .eq('status', 'published');

  if (byCat) {
    const categoryCounts = byCat.reduce((acc: any, article: any) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Articles by category:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      const emoji = cat === 'seeds' ? '🌱' : cat === 'growth' ? '🌿' : cat === 'harvest' ? '🌾' : '🌳';
      console.log(`   ${emoji} ${cat}: ${count}`);
    });
  }
}

importArticles().catch(console.error);
