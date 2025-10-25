/**
 * Download all external images (from cdn.prod.website-files.com) to local storage
 * and update database with local paths
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  featured_image_url: string | null;
}

async function downloadImage(url: string, slug: string, imageIndex: number = 0): Promise<string | null> {
  if (!url || url === '' || url.startsWith('/images/')) {
    // Already local or empty
    return null;
  }

  try {
    // Make URL absolute if needed
    let absoluteUrl = url;
    if (url.startsWith('/')) {
      absoluteUrl = `https://www.justicehub.com.au${url}`;
    } else if (!url.startsWith('http')) {
      absoluteUrl = `https://www.justicehub.com.au/${url}`;
    }

    const imagesDir = join(process.cwd(), 'public', 'images', 'articles');
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true });
    }

    // Create unique filename
    const urlHash = createHash('md5').update(absoluteUrl).digest('hex').substring(0, 8);
    const ext = absoluteUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = imageIndex === 0
      ? `${slug}.${ext}`
      : `${slug}-${imageIndex}-${urlHash}.${ext}`;

    const filepath = join(imagesDir, filename);

    // Skip if already downloaded
    if (existsSync(filepath)) {
      console.log(`   ✓ Already exists: ${filename}`);
      return `/images/articles/${filename}`;
    }

    console.log(`   ⬇️  Downloading: ${absoluteUrl.substring(0, 60)}...`);

    return new Promise((resolve, reject) => {
      const protocol = absoluteUrl.startsWith('https') ? https : http;

      protocol.get(absoluteUrl, (response) => {
        if (response.statusCode === 200) {
          const fileStream = require('fs').createWriteStream(filepath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`   ✅ Downloaded: ${filename}`);
            resolve(`/images/articles/${filename}`);
          });

          fileStream.on('error', (err: Error) => {
            console.log(`   ❌ Error writing file: ${err.message}`);
            resolve(null);
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          console.log(`   ↪️  Redirect to: ${response.headers.location}`);
          resolve(null);
        } else {
          console.log(`   ❌ HTTP ${response.statusCode}`);
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`   ❌ Network error: ${err.message}`);
        resolve(null);
      });
    });
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadAndUpdateAllImages() {
  console.log('\n🖼️  ARTICLE IMAGE DOWNLOADER & DATABASE UPDATER\n');
  console.log('━'.repeat(80));
  console.log('\n📥 Fetching articles from database...\n');

  // Fetch all articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, featured_image_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  console.log(`✅ Found ${articles.length} articles\n`);
  console.log('━'.repeat(80));

  let featuredImagesDownloaded = 0;
  let inlineImagesDownloaded = 0;
  let articlesUpdated = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.title}`);
    console.log(`Slug: ${article.slug}`);

    let needsUpdate = false;
    let newFeaturedImageUrl = article.featured_image_url;
    let newContent = article.content;

    // 1. Download featured image if external
    if (article.featured_image_url &&
        article.featured_image_url.startsWith('https://cdn.prod.website-files.com')) {
      console.log(`\n📸 Featured Image: ${article.featured_image_url.substring(0, 60)}...`);
      const localPath = await downloadImage(article.featured_image_url, article.slug, 0);

      if (localPath) {
        newFeaturedImageUrl = localPath;
        featuredImagesDownloaded++;
        needsUpdate = true;
      } else {
        errors++;
      }

      await delay(500);
    } else if (article.featured_image_url) {
      console.log(`📸 Featured Image: Already local or external - ${article.featured_image_url.substring(0, 60)}`);
    } else {
      console.log(`📸 Featured Image: None`);
    }

    // 2. Download inline images from content
    const imageRegex = /!\[([^\]]*)\]\((https:\/\/cdn\.prod\.website-files\.com[^)]+)\)/g;
    let match;
    let imageIndex = 1;
    const imagesToReplace: Array<{ original: string; local: string }> = [];

    while ((match = imageRegex.exec(article.content)) !== null) {
      const [fullMatch, alt, imageUrl] = match;
      console.log(`\n🖼️  Inline Image ${imageIndex}: ${imageUrl.substring(0, 60)}...`);

      const localPath = await downloadImage(imageUrl, article.slug, imageIndex);

      if (localPath) {
        imagesToReplace.push({ original: imageUrl, local: localPath });
        inlineImagesDownloaded++;
        needsUpdate = true;
      } else {
        errors++;
      }

      imageIndex++;
      await delay(500);
    }

    // Replace all image URLs in content
    if (imagesToReplace.length > 0) {
      console.log(`\n🔄 Replacing ${imagesToReplace.length} image URLs in content...`);
      imagesToReplace.forEach(({ original, local }) => {
        newContent = newContent.replace(original, local);
      });
    }

    // 3. Update database if changes were made
    if (needsUpdate) {
      console.log(`\n💾 Updating database...`);

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          featured_image_url: newFeaturedImageUrl,
          content: newContent
        })
        .eq('id', article.id);

      if (updateError) {
        console.log(`   ❌ Database update error: ${updateError.message}`);
        errors++;
      } else {
        console.log(`   ✅ Database updated successfully`);
        articlesUpdated++;
      }
    } else {
      console.log(`\n✓ No updates needed for this article`);
    }

    console.log('\n' + '─'.repeat(80));

    // Rate limiting
    if (i < articles.length - 1) {
      await delay(1000);
    }
  }

  // Final summary
  console.log('\n');
  console.log('━'.repeat(80));
  console.log('📊 DOWNLOAD & UPDATE COMPLETE!');
  console.log('━'.repeat(80));
  console.log(`\n✅ Statistics:`);
  console.log(`   - Articles processed: ${articles.length}`);
  console.log(`   - Featured images downloaded: ${featuredImagesDownloaded}`);
  console.log(`   - Inline images downloaded: ${inlineImagesDownloaded}`);
  console.log(`   - Total images downloaded: ${featuredImagesDownloaded + inlineImagesDownloaded}`);
  console.log(`   - Articles updated in database: ${articlesUpdated}`);
  console.log(`   - Errors: ${errors}`);
  console.log(`\n🎉 All images are now stored locally in public/images/articles/`);
  console.log(`📁 Database has been updated with local image paths\n`);
}

downloadAndUpdateAllImages().catch(console.error);
