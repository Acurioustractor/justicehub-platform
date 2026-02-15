/**
 * Comprehensive article scraper - gets FULL content + ALL images
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  inlineImages?: string[]; // NEW: All images in the article
}

// Articles under 3000 chars need full content
const articlesToRescrape = [
  'rethinking-youth-justice-funding-in-queensland-prioritising-grassroots-solutions-over-bureaucracy',
  'beyond-systems-a-day-with-jackqwann-in-the-heart-of-australia',
  'beyond-cases-and-problems-relationship-based-justice-in-central-australia',
  'navigating-two-worlds-cultural-authority-and-youth-empowerment-in-mparntwe',
  'the-necessity-of-state-government-in-australia-a-queensland-perspective',
  'queensland-government-spending-on-youth-justice-and-community-safety',
  'a-comparative-analysis-of-youth-justice-systems-in-spain-and-australia',
  'diagrama-foundations-impact-on-spains-youth-detention-system',
  'youth-detention-and-youth-justice-models-in-europe-a-comparative-overview',
  'walking-new-paths-reflections-from-bimberi',
  'breaking-bread-breaking-chains-when-two-worlds-collide',
  'connecting-communities-a-network-for-justice-reinvestment',
  'community-at-the-core-empowering-local-solutions-in-youth-justice',
  'the-nature-of-power-how-control-shapes-youth-justice',
  'from-punishment-to-potential-lessons-from-spains-innovative-youth-justice-model---day-1-with-diagrama',
  'the-road-to-hell-when-youth-justice-efforts-backfire',
  'diagrama-youth-justice-spain',
  'the-paradox-of-youth-justice-and-entropy-navigating-the-chaos-towards-hope',
  'from-shadows-to-spotlight-joe-kwons-redemption-and-the-rise-of-confit',
  'confit-pathways',
  'hamiltons-odyssey-igniting-transformation-through-confit-pathways',
  'a-heros-journey-from-addiction-to-inspiration-the-life-of-vic',
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url: string, slug: string, imageIndex: number = 0): Promise<string | null> {
  if (!url || url === '') return null;

  try {
    // Make URL absolute if it's relative
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
      return `/images/articles/${filename}`;
    }

    return new Promise((resolve) => {
      const protocol = absoluteUrl.startsWith('https') ? https : http;

      protocol.get(absoluteUrl, (response) => {
        if (response.statusCode === 200) {
          const fileStream = require('fs').createWriteStream(filepath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve(`/images/articles/${filename}`);
          });
        } else {
          resolve(null);
        }
      }).on('error', () => {
        resolve(null);
      });
    });
  } catch (error) {
    return null;
  }
}

async function scrapeFullArticleWithImages(slug: string): Promise<Article | null> {
  const url = `https://www.justicehub.com.au/article/${slug}`;

  console.log(`\n📄 Scraping: ${slug.substring(0, 60)}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`   ❌ Failed to fetch (${response.status})`);
      return null;
    }

    const html = await response.text();

    // Enhanced prompt for FULL content + ALL images
    const prompt = `Extract the COMPLETE article with ALL images from this webpage.

CRITICAL INSTRUCTIONS:
1. Extract the ENTIRE article body - EVERY paragraph, EVERY section, EVERY word
2. Include ALL headings (use # ## ### for Markdown)
3. Include ALL body paragraphs - DO NOT summarize or shorten anything
4. Find ALL images in the article (featured image + inline images)
5. For each image, extract the full URL
6. Look for the main article content area (classes like "article-body", "post-content", "rich-text", "w-richtext", etc.)
7. Convert to Markdown format with images embedded: ![alt text](image-url)
8. Return ONLY valid JSON

Return JSON:
{
  "title": "Full article title",
  "excerpt": "Brief 1-2 sentence summary",
  "content": "THE COMPLETE FULL ARTICLE TEXT IN MARKDOWN WITH EMBEDDED IMAGES - DO NOT SUMMARIZE",
  "featuredImageUrl": "URL of main header image",
  "allImageUrls": ["url1", "url2", "url3"],
  "category": "seeds|growth|harvest|roots",
  "publishedDate": "YYYY-MM-DD",
  "locationTags": ["Location 1", "Location 2"]
}

HTML:
${html.slice(0, 60000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting COMPLETE article content with ALL images. Always extract the FULL text and ALL images, never summarize. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 16000,
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.log(`   ❌ Could not extract JSON`);
      return null;
    }

    const articleData = JSON.parse(jsonMatch[0]);

    console.log(`   ✅ Extracted content: ${articleData.content?.length || 0} chars`);

    // Download featured image
    let featuredImagePath = null;
    if (articleData.featuredImageUrl) {
      console.log(`   🖼️  Downloading featured image...`);
      featuredImagePath = await downloadImage(articleData.featuredImageUrl, slug, 0);
      if (featuredImagePath) console.log(`      ✅ Featured image saved`);
    }

    // Download ALL inline images
    const inlineImagePaths: string[] = [];
    if (articleData.allImageUrls && Array.isArray(articleData.allImageUrls)) {
      console.log(`   🖼️  Downloading ${articleData.allImageUrls.length} inline images...`);
      for (let i = 0; i < articleData.allImageUrls.length; i++) {
        const imageUrl = articleData.allImageUrls[i];
        const path = await downloadImage(imageUrl, slug, i + 1);
        if (path) {
          inlineImagePaths.push(path);
          // Replace URL in content with local path
          articleData.content = articleData.content.replace(imageUrl, path);
        }
        await delay(500); // Small delay between image downloads
      }
      console.log(`      ✅ Downloaded ${inlineImagePaths.length} inline images`);
    }

    const article: Article = {
      title: articleData.title || 'Untitled',
      slug: slug,
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      featuredImageUrl: featuredImagePath || articleData.featuredImageUrl || '',
      category: articleData.category || 'growth',
      isTrending: false,
      publishedAt: articleData.publishedDate || new Date().toISOString().split('T')[0],
      authorName: 'Benjamin Knight',
      locationTags: articleData.locationTags || [],
      seoTitle: articleData.title,
      seoDescription: articleData.excerpt,
      inlineImages: inlineImagePaths,
    };

    console.log(`   ✅ Complete! ${article.content.length} chars, ${inlineImagePaths.length} inline images`);
    return article;

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔥 Comprehensive Article Scraper - FULL Content + ALL Images\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const dataDir = join(process.cwd(), 'data', 'webflow-migration');
  const articlesPath = join(dataDir, 'articles.json');

  let allArticles: Article[] = [];
  if (existsSync(articlesPath)) {
    allArticles = JSON.parse(readFileSync(articlesPath, 'utf-8'));
    console.log(`📚 Loaded ${allArticles.length} existing articles\n`);
  }

  console.log(`🎯 Re-scraping ${articlesToRescrape.length} articles with FULL content + ALL images...\n`);

  let successCount = 0;
  let errorCount = 0;
  const updatedSlugs: string[] = [];

  for (let i = 0; i < articlesToRescrape.length; i++) {
    const slug = articlesToRescrape[i];
    console.log(`[${i + 1}/${articlesToRescrape.length}]`);

    const newArticle = await scrapeFullArticleWithImages(slug);

    if (newArticle) {
      const existingIndex = allArticles.findIndex(a => a.slug === slug);

      if (existingIndex >= 0) {
        newArticle.publishedAt = allArticles[existingIndex].publishedAt || newArticle.publishedAt;
        allArticles[existingIndex] = newArticle;
      } else {
        allArticles.push(newArticle);
      }

      updatedSlugs.push(slug);
      successCount++;

      writeFileSync(articlesPath, JSON.stringify(allArticles, null, 2));
      console.log(`   💾 Progress saved\n`);
    } else {
      errorCount++;
    }

    if (i < articlesToRescrape.length - 1) {
      console.log(`   ⏳ Waiting 5 seconds...`);
      await delay(5000);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Scraping Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully scraped: ${successCount} articles`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Next: Run update-existing-articles.ts to update database!\n`);
}

main().catch(console.error);
