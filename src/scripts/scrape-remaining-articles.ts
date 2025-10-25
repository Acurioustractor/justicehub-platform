/**
 * Scrape the 3 remaining articles from justicehub.com.au
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const remainingArticles = [
  'beyond-walls-what-spanish-youth-detention-centers-taught-me-about-seeing-humanity-first',
  'from-trouble-to-transformation-the-campfire-journey',
  'rethinking-youth-justice-funding-in-queensland-prioritising-grassroots-solutions-over-bureaucracy',
];

async function scrapeRemainingArticles() {
  console.log('🌐 Scraping 3 remaining articles...\n');

  // Load existing articles
  const existingPath = join(process.cwd(), 'data', 'webflow-migration', 'articles.json');
  const existing = JSON.parse(readFileSync(existingPath, 'utf-8'));

  for (let i = 0; i < remainingArticles.length; i++) {
    const slug = remainingArticles[i];
    const url = `https://www.justicehub.com.au/article/${slug}`;

    console.log(`📖 [${i + 1}/3] Scraping: ${slug}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ⚠️  Failed to fetch (${response.status}), skipping...`);
        continue;
      }

      const html = await response.text();

      const extraction = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `Extract all content from this article page and convert to clean Markdown format.

IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

Return as JSON:
{
  "title": "Article Title",
  "excerpt": "Brief summary",
  "content": "Full article in Markdown format with ## headings, **bold**, *italic*, etc.",
  "featuredImageUrl": "image-url",
  "authorName": "Benjamin Knight",
  "publishedAt": "2025-03-26",
  "category": "growth",
  "locationTags": ["Mount Isa", "Brisbane"],
  "seoTitle": "SEO title if different from title",
  "seoDescription": "Meta description"
}

HTML:
${html.slice(0, 100000)}`,
          },
        ],
      });

      let articleData: any = {};
      try {
        const responseText = extraction.content[0].type === 'text' ? extraction.content[0].text : '{}';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          articleData = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not parse article JSON, skipping...`);
        continue;
      }

      const article = {
        title: articleData.title,
        slug,
        excerpt: articleData.excerpt || '',
        content: articleData.content,
        featuredImageUrl: articleData.featuredImageUrl || '',
        category: articleData.category || 'growth',
        isTrending: false,
        publishedAt: articleData.publishedAt || '2025-03-01',
        authorName: articleData.authorName || 'Benjamin Knight',
        locationTags: articleData.locationTags || [],
        seoTitle: articleData.seoTitle,
        seoDescription: articleData.seoDescription,
      };

      existing.push(article);
      console.log(`   ✅ Extracted: ${article.title} (${article.content.length} chars)`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error scraping article:`, error);
    }
  }

  // Save updated articles
  writeFileSync(existingPath, JSON.stringify(existing, null, 2));
  console.log(`\n✅ Updated articles.json with ${existing.length} total articles`);

  // Save individual markdown files
  const articlesDir = join(process.cwd(), 'data', 'webflow-migration', 'articles-markdown');
  for (const article of existing) {
    const frontmatter = `---
title: "${article.title}"
slug: "${article.slug}"
excerpt: "${article.excerpt}"
category: "${article.category}"
publishedAt: "${article.publishedAt}"
author: "${article.authorName}"
featuredImage: "${article.featuredImageUrl}"
locationTags: [${article.locationTags.map((t: string) => `"${t}"`).join(', ')}]
isTrending: ${article.isTrending}
${article.seoTitle ? `seoTitle: "${article.seoTitle}"` : ''}
${article.seoDescription ? `seoDescription: "${article.seoDescription}"` : ''}
---

`;

    const markdownPath = join(articlesDir, `${article.slug}.md`);
    writeFileSync(markdownPath, frontmatter + article.content);
  }

  console.log(`\n🎉 Complete! All ${existing.length} articles scraped.`);
}

scrapeRemainingArticles();
