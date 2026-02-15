/**
 * Force update all article images using SERVICE_ROLE key (has full permissions)
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Use SERVICE_ROLE key for full permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''  // Service role key bypasses RLS
);

async function forceUpdateAllImages() {
  console.log('\n🔧 FORCE UPDATE - Using Service Role Key\n');
  console.log('━'.repeat(80));

  // Get all downloaded images
  const imagesDir = join(process.cwd(), 'public', 'images', 'articles');
  const imageFiles = readdirSync(imagesDir);

  console.log(`\n📁 Found ${imageFiles.length} local images\n`);

  // Fetch ALL articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, featured_image_url');

  if (error) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  console.log(`📚 Found ${articles.length} articles total\n`);
  console.log('━'.repeat(80));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.slug.substring(0, 60)}`);

    // Skip if already local
    if (article.featured_image_url && article.featured_image_url.startsWith('/images/')) {
      console.log(`  ✓ Already local: ${article.featured_image_url}`);
      skipped++;
      continue;
    }

    // Find matching local image
    const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    let localImagePath: string | null = null;

    for (const ext of possibleExtensions) {
      const filename = `${article.slug}.${ext}`;
      if (imageFiles.includes(filename)) {
        localImagePath = `/images/articles/${filename}`;
        break;
      }
    }

    if (localImagePath) {
      console.log(`  🎯 Updating to: ${localImagePath}`);

      // Force update using service role
      const { error: updateError } = await supabase
        .from('articles')
        .update({ featured_image_url: localImagePath })
        .eq('id', article.id);

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`);
        errors++;
      } else {
        console.log(`  ✅ Updated successfully!`);
        updated++;
      }
    } else {
      console.log(`  ⚠️  No local image found`);
      if (article.featured_image_url) {
        console.log(`     Current: ${article.featured_image_url.substring(0, 70)}...`);
      }
      skipped++;
    }
  }

  console.log('\n');
  console.log('━'.repeat(80));
  console.log('🎉 FORCE UPDATE COMPLETE!');
  console.log('━'.repeat(80));
  console.log(`\n✅ Statistics:`);
  console.log(`   - Successfully updated: ${updated}`);
  console.log(`   - Already local (skipped): ${skipped}`);
  console.log(`   - Errors: ${errors}`);
  console.log(`   - Total processed: ${articles.length}`);
  console.log('\n');

  // Verify final status
  const { data: verify } = await supabase
    .from('articles')
    .select('featured_image_url');

  if (verify) {
    const localCount = verify.filter(a => a.featured_image_url && a.featured_image_url.startsWith('/images/')).length;
    const externalCount = verify.filter(a => a.featured_image_url && a.featured_image_url.startsWith('http')).length;

    console.log('📊 Final Status:');
    console.log(`   - Local images: ${localCount}`);
    console.log(`   - External images: ${externalCount}`);
    console.log(`   - Total: ${verify.length}`);
    console.log('\n');
  }
}

forceUpdateAllImages().catch(console.error);
