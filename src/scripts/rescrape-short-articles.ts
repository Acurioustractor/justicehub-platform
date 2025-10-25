/**
 * Re-scrape short articles with improved prompts to get FULL content
 * Also download and save featured images
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

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
}

const articlesToFix = [
  'richard-cassidy---our-story',
  'the-diagrama-model-a-transformative-approach-to-youth-justice',
  'resoleution-at-bimberi-youth-justice-centre',
  'inquiry-into-the-making-queensland-safer-bill-2024---submission',
  'spotlight-on-changemaker-brodie-germaine',
  'resoleution',
  'diagrama-youth-justice-spain',
  'kickin-it-with-deadlylabs-igniting-stem-passions-in-youth-detention',
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url: string, slug: string): Promise<string | null> {
  if (!url || url === '') return null;

  try {
    const imagesDir = join(process.cwd(), 'public', 'images', 'articles');
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true });
    }

    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${slug}.${ext}`;
    const filepath = join(imagesDir, filename);

    // Skip if already downloaded
    if (existsSync(filepath)) {
      console.log(`      ✅ Image already downloaded`);
      return `/images/articles/${filename}`;
    }

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = require('fs').createWriteStream(filepath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`      ✅ Downloaded image: ${filename}`);
            resolve(`/images/articles/${filename}`);
          });
        } else {
          console.log(`      ⚠️  Failed to download (${response.statusCode})`);
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`      ❌ Download error: ${err.message}`);
        resolve(null);
      });
    });
  } catch (error: any) {
    console.log(`      ❌ Error: ${error.message}`);
    return null;
  }
}

async function scrapeFullArticle(slug: string): Promise<Article | null> {
  const url = `https://www.justicehub.com.au/article/${slug}`;

  console.log(`\n📄 Re-scraping: ${slug}`);
  console.log(`   🌐 URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`   ❌ Failed to fetch (${response.status})`);
      return null;
    }

    const html = await response.text();

    // Improved prompt that specifically asks for FULL article content
    const prompt = `Extract the COMPLETE article content from this webpage. This is critical - I need the FULL article text, not just a summary.

IMPORTANT INSTRUCTIONS:
1. Extract the ENTIRE article body - every paragraph, every section, every word
2. Include ALL headings (use # ## ### for Markdown headings)
3. Include ALL paragraphs - do not summarize or shorten
4. If there are multiple sections, include ALL of them
5. Look for the main article content area (usually has classes like "article-body", "post-content", "rich-text", etc.)
6. Convert to clean Markdown format
7. Return ONLY valid JSON, no explanatory text

Return JSON with this exact structure:
{
  "title": "Full article title",
  "excerpt": "Brief 1-2 sentence description",
  "content": "THE COMPLETE FULL ARTICLE TEXT IN MARKDOWN - DO NOT SUMMARIZE",
  "featuredImageUrl": "URL of the main featured/header image",
  "category": "seeds|growth|harvest|roots",
  "publishedDate": "YYYY-MM-DD",
  "locationTags": ["Location 1", "Location 2"]
}

HTML:
${html.slice(0, 50000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting COMPLETE article content. Always extract the FULL text, never summarize. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 16000, // Increased for longer articles
      temperature: 0.1, // Lower temperature for more accurate extraction
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`   ❌ Could not extract JSON from response`);
      return null;
    }

    const articleData = JSON.parse(jsonMatch[0]);

    // Download featured image if available
    let localImagePath = null;
    if (articleData.featuredImageUrl) {
      console.log(`   🖼️  Downloading image...`);
      localImagePath = await downloadImage(articleData.featuredImageUrl, slug);
    }

    const article: Article = {
      title: articleData.title || 'Untitled',
      slug: slug,
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      featuredImageUrl: localImagePath || articleData.featuredImageUrl || '',
      category: articleData.category || 'growth',
      isTrending: false,
      publishedAt: articleData.publishedDate || new Date().toISOString().split('T')[0],
      authorName: 'Benjamin Knight',
      locationTags: articleData.locationTags || [],
      seoTitle: articleData.title,
      seoDescription: articleData.excerpt,
    };

    console.log(`   ✅ Scraped successfully`);
    console.log(`   📏 Content length: ${article.content.length} chars`);

    return article;

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔧 Re-scraping Short Articles with Full Content\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load existing articles
  const dataDir = join(process.cwd(), 'data', 'webflow-migration');
  const articlesPath = join(dataDir, 'articles.json');

  let allArticles: Article[] = [];
  if (existsSync(articlesPath)) {
    allArticles = JSON.parse(readFileSync(articlesPath, 'utf-8'));
    console.log(`📚 Loaded ${allArticles.length} existing articles\n`);
  }

  console.log(`🎯 Re-scraping ${articlesToFix.length} articles with improved extraction...\n`);

  let successCount = 0;
  let errorCount = 0;
  const updatedSlugs: string[] = [];

  for (let i = 0; i < articlesToFix.length; i++) {
    const slug = articlesToFix[i];
    console.log(`[${i + 1}/${articlesToFix.length}]`);

    const newArticle = await scrapeFullArticle(slug);

    if (newArticle) {
      // Find and replace the existing article
      const existingIndex = allArticles.findIndex(a => a.slug === slug);

      if (existingIndex >= 0) {
        // Keep the original published date and other metadata
        newArticle.publishedAt = allArticles[existingIndex].publishedAt || newArticle.publishedAt;
        allArticles[existingIndex] = newArticle;
        console.log(`   🔄 Updated existing article`);
      } else {
        allArticles.push(newArticle);
        console.log(`   ➕ Added new article`);
      }

      updatedSlugs.push(slug);
      successCount++;

      // Save progress after each article
      writeFileSync(articlesPath, JSON.stringify(allArticles, null, 2));
      console.log(`   💾 Progress saved`);
    } else {
      errorCount++;
    }

    // Rate limiting - wait 4 seconds between requests
    if (i < articlesToFix.length - 1) {
      console.log(`   ⏳ Waiting 4 seconds...`);
      await delay(4000);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Re-scraping Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully re-scraped: ${successCount} articles`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📚 Total articles: ${allArticles.length}\n`);

  console.log('📝 Updated articles:');
  updatedSlugs.forEach(slug => console.log(`   - ${slug}`));

  console.log(`\n💾 Saved to: ${articlesPath}`);
  console.log('\n🎉 Next step: Run import-articles-to-database.ts to update the database!\n');
}

main().catch(console.error);
