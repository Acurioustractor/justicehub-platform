/**
 * Comprehensive scraper for ALL articles from justicehub.com.au with pagination support
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllArticleSlugs(): Promise<Set<string>> {
  console.log('🔍 Discovering all article URLs with pagination...\n');

  const allSlugs = new Set<string>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1
      ? 'https://www.justicehub.com.au/articles'
      : `https://www.justicehub.com.au/articles?7a69ba69_page=${page}`;

    console.log(`📄 Fetching page ${page}...`);

    try {
      const response = await fetch(url);
      const html = await response.text();

      // Extract article URLs using regex
      const articlePattern = /\/article\/([a-z0-9-]+)/g;
      const matches = [...html.matchAll(articlePattern)];

      let newArticlesFound = 0;
      matches.forEach(match => {
        const slug = match[1];
        if (!allSlugs.has(slug)) {
          allSlugs.add(slug);
          newArticlesFound++;
        }
      });

      console.log(`   Found ${newArticlesFound} new articles (total: ${allSlugs.size})`);

      // Check if there's a "Next" button or more pages
      hasMore = html.includes('?7a69ba69_page=' + (page + 1)) ||
                html.includes('>Next<') ||
                newArticlesFound > 0;

      if (!hasMore || newArticlesFound === 0) {
        console.log(`   No more pages found.\n`);
        break;
      }

      page++;
      await delay(1000); // Be respectful to the server

    } catch (error) {
      console.error(`   Error fetching page ${page}:`, error);
      break;
    }
  }

  console.log(`✅ Discovered ${allSlugs.size} total articles\n`);
  return allSlugs;
}

async function scrapeArticle(slug: string): Promise<Article | null> {
  const url = `https://www.justicehub.com.au/article/${slug}`;

  console.log(`📄 Scraping: ${slug}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`   ❌ Failed to fetch (${response.status})`);
      return null;
    }

    const html = await response.text();

    // Use Claude to extract and convert content
    const extraction = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `Extract all content from this article page and convert to clean Markdown format.

IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

Return JSON with this structure:
{
  "title": "Article title",
  "excerpt": "Brief excerpt or description",
  "content": "Full article content in Markdown format",
  "featuredImageUrl": "URL of featured image",
  "category": "seeds|growth|harvest|roots",
  "publishedDate": "YYYY-MM-DD",
  "locationTags": ["Location 1", "Location 2"]
}

HTML:
${html.slice(0, 30000)}`,
        },
      ],
    });

    const responseText = extraction.content[0].type === 'text' ? extraction.content[0].text : '{}';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`   ❌ Could not extract JSON from response`);
      return null;
    }

    const articleData = JSON.parse(jsonMatch[0]);

    const article: Article = {
      title: articleData.title || 'Untitled',
      slug: slug,
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      featuredImageUrl: articleData.featuredImageUrl || '',
      category: articleData.category || 'growth',
      isTrending: false,
      publishedAt: articleData.publishedDate || new Date().toISOString().split('T')[0],
      authorName: 'Benjamin Knight',
      locationTags: articleData.locationTags || [],
      seoTitle: articleData.title,
      seoDescription: articleData.excerpt,
    };

    console.log(`   ✅ Scraped successfully`);
    return article;

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🌐 Starting comprehensive article scraper for justicehub.com.au\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load existing articles if any
  const dataDir = join(process.cwd(), 'data', 'webflow-migration');
  const articlesPath = join(dataDir, 'articles.json');

  let existingArticles: Article[] = [];
  if (existsSync(articlesPath)) {
    existingArticles = JSON.parse(readFileSync(articlesPath, 'utf-8'));
    console.log(`📚 Found ${existingArticles.length} existing articles\n`);
  }

  const existingSlugs = new Set(existingArticles.map(a => a.slug));

  // Discover all article URLs
  const allSlugs = await getAllArticleSlugs();

  // Filter to only new articles
  const newSlugs = Array.from(allSlugs).filter(slug => !existingSlugs.has(slug));

  console.log(`📊 Status:`);
  console.log(`   Already scraped: ${existingArticles.length}`);
  console.log(`   New to scrape: ${newSlugs.length}`);
  console.log(`   Total: ${allSlugs.size}\n`);

  if (newSlugs.length === 0) {
    console.log('✅ All articles already scraped!\n');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`🚀 Scraping ${newSlugs.length} new articles...\n`);

  const newArticles: Article[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < newSlugs.length; i++) {
    const slug = newSlugs[i];
    console.log(`[${i + 1}/${newSlugs.length}]`);

    const article = await scrapeArticle(slug);

    if (article) {
      newArticles.push(article);
      successCount++;
    } else {
      errorCount++;
    }

    // Rate limiting - wait 3 seconds between requests
    if (i < newSlugs.length - 1) {
      await delay(3000);
    }
  }

  // Combine with existing articles
  const allArticles = [...existingArticles, ...newArticles];

  // Save to JSON
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  writeFileSync(articlesPath, JSON.stringify(allArticles, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Scraping Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully scraped: ${successCount} new articles`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📚 Total articles in database: ${allArticles.length}`);
  console.log(`💾 Saved to: ${articlesPath}\n`);

  // Save individual markdown files
  const markdownDir = join(dataDir, 'articles-markdown');
  if (!existsSync(markdownDir)) {
    mkdirSync(markdownDir, { recursive: true });
  }

  newArticles.forEach(article => {
    const mdPath = join(markdownDir, `${article.slug}.md`);
    const frontmatter = `---
title: ${article.title}
slug: ${article.slug}
category: ${article.category}
publishedAt: ${article.publishedAt}
author: ${article.authorName}
locations: ${article.locationTags.join(', ')}
---

${article.excerpt}

---

${article.content}`;

    writeFileSync(mdPath, frontmatter);
  });

  console.log(`📝 Saved ${newArticles.length} markdown files to: ${markdownDir}\n`);
  console.log('🎉 Ready to import to database!\n');
}

main().catch(console.error);
