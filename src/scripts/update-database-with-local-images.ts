/**
 * Update database to use downloaded local images instead of external CDN URLs
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

async function updateDatabaseWithLocalImages() {
  console.log('\n🔄 UPDATING DATABASE WITH LOCAL IMAGE PATHS\n');
  console.log('━'.repeat(80));

  // Get all downloaded images
  const imagesDir = join(process.cwd(), 'public', 'images', 'articles');
  const imageFiles = readdirSync(imagesDir);

  console.log(`\n📁 Found ${imageFiles.length} local images in public/images/articles/\n`);

  // Fetch all articles with external featured images
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, featured_image_url')
    .like('featured_image_url', 'https://cdn.prod.website-files.com%');

  if (error) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  console.log(`📚 Found ${articles.length} articles with external featured images\n`);
  console.log('━'.repeat(80));

  let updated = 0;
  let notFound = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.slug}`);

    // Check if we have a local image for this slug
    const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    let localImagePath: string | null = null;

    for (const ext of possibleExtensions) {
      const filename = `${article.slug}.${ext}`;
      if (imageFiles.includes(filename)) {
        localImagePath = `/images/articles/${filename}`;
        break;
      }
    }

    if (localImagePath && existsSync(join(imagesDir, localImagePath.replace('/images/articles/', '')))) {
      console.log(`  ✅ Found local image: ${localImagePath}`);

      // Update database
      const { error: updateError } = await supabase
        .from('articles')
        .update({ featured_image_url: localImagePath })
        .eq('id', article.id);

      if (updateError) {
        console.log(`  ❌ Update error: ${updateError.message}`);
      } else {
        console.log(`  💾 Database updated`);
        updated++;
      }
    } else {
      console.log(`  ⚠️  No local image found`);
      console.log(`     Current URL: ${article.featured_image_url?.substring(0, 70)}...`);
      notFound++;
    }
  }

  console.log('\n');
  console.log('━'.repeat(80));
  console.log('📊 UPDATE COMPLETE!');
  console.log('━'.repeat(80));
  console.log(`\n✅ Statistics:`);
  console.log(`   - Articles updated: ${updated}`);
  console.log(`   - Local images not found: ${notFound}`);
  console.log(`   - Total processed: ${articles.length}`);
  console.log('\n');
}

updateDatabaseWithLocalImages().catch(console.error);
