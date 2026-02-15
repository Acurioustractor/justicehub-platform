/**
 * Scrape content from justicehub.com.au (Webflow site)
 * Extract articles, images, and metadata for migration
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
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

interface WebflowScrapeResult {
  articles: Article[];
  aboutPageContent: string;
  contactPageContent: string;
}

async function scrapeWebflowSite(): Promise<WebflowScrapeResult> {
  console.log('🌐 Scraping justicehub.com.au...\n');

  // Articles we know about from documentation
  const knownArticles = [
    'where-fire-meets-country-a-journey-through-mount-isas-naidoc-week',
    'achieving-gold-standard-youth-crime-prevention-designing-programs-that-transform-lives',
    'beyond-shadows-platos-cave-and-the-reimagining-of-youth-justice-in-australia',
    'creating-spaces-for-growth-the-physical-and-emotional-environment-of-transformation',
    'from-control-to-care-reimagining-staff-roles-in-youth-justice',
    'the-courage-to-connect-how-authentic-relationships-transform-youth-in-detention',
    'beyond-walls-what-spanish-youth-detention-centers-taught-me-about-seeing-humanity-first',
    'from-trouble-to-transformation-the-campfire-journey',
    'rethinking-youth-justice-funding-in-queensland-prioritising-grassroots-solutions-over-bureaucracy',
  ];

  const articles: Article[] = [];

  // Scrape the articles index page first to get all articles
  console.log('📄 Fetching articles index page...');

  const indexResponse = await fetch('https://www.justicehub.com.au/articles');
  const indexHtml = await indexResponse.text();

  // Use Claude to extract article information from the index page
  const indexAnalysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Analyze this articles index page HTML and extract:
1. All article URLs/slugs
2. Article titles
3. Excerpts/descriptions if visible
4. Featured image URLs
5. Categories (seeds, growth, harvest, roots)
6. Any other metadata

IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

Return as JSON array with structure:
{
  "articles": [
    {
      "slug": "article-slug",
      "url": "full-url",
      "title": "Article Title",
      "excerpt": "Brief description",
      "featuredImageUrl": "image-url",
      "category": "growth",
      "publishedDate": "2025-03-26"
    }
  ]
}

HTML:
${indexHtml.slice(0, 50000)}`,
      },
    ],
  });

  let indexData: any = { articles: [] };
  try {
    const responseText = indexAnalysis.content[0].type === 'text' ? indexAnalysis.content[0].text : '{}';
    // Try to extract JSON from response (in case Claude adds explanation)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      indexData = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.log('   ⚠️  Could not parse index page JSON, falling back to known articles');
  }

  console.log(`✅ Found ${indexData.articles?.length || 0} articles on index page\n`);

  // Scrape each article
  const articlesToScrape = indexData.articles?.length > 0
    ? indexData.articles
    : knownArticles.map(slug => ({ slug, url: `https://www.justicehub.com.au/articles/${slug}` }));

  for (let i = 0; i < articlesToScrape.length; i++) {
    const articleInfo = articlesToScrape[i];
    // Handle relative URLs
    let url = articleInfo.url || `https://www.justicehub.com.au/articles/${articleInfo.slug}`;
    if (url.startsWith('/')) {
      url = `https://www.justicehub.com.au${url}`;
    }

    console.log(`📖 [${i + 1}/${articlesToScrape.length}] Scraping: ${articleInfo.title || articleInfo.slug}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ⚠️  Failed to fetch (${response.status}), skipping...`);
        continue;
      }

      const html = await response.text();

      // Use Claude to extract article content
      const extraction = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `Extract all content from this article page and convert to clean Markdown format.

Extract:
1. Article title
2. Excerpt/summary (if present)
3. Full article content (converted to Markdown)
4. Featured image URL
5. Author name
6. Published date
7. Category (seeds, growth, harvest, roots)
8. Location tags (cities, regions mentioned)
9. Any inline images with captions

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
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          articleData = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not parse article JSON, skipping...`);
        continue;
      }

      // Generate slug from title if not provided
      const slug = articleInfo.slug ||
        articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const article: Article = {
        title: articleData.title,
        slug,
        excerpt: articleData.excerpt || '',
        content: articleData.content,
        featuredImageUrl: articleData.featuredImageUrl || '',
        category: articleData.category || 'growth',
        isTrending: false, // Can be set manually later
        publishedAt: articleData.publishedAt || '2025-03-01',
        authorName: articleData.authorName || 'Benjamin Knight',
        locationTags: articleData.locationTags || [],
        seoTitle: articleData.seoTitle,
        seoDescription: articleData.seoDescription,
      };

      articles.push(article);
      console.log(`   ✅ Extracted: ${article.title} (${article.content.length} chars)`);

      // Rate limiting - be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error scraping article:`, error);
    }
  }

  console.log(`\n✅ Successfully scraped ${articles.length} articles\n`);

  // Scrape About page
  console.log('📄 Scraping About page...');
  let aboutPageContent = '';
  try {
    const aboutResponse = await fetch('https://www.justicehub.com.au/about');
    const aboutHtml = await aboutResponse.text();

    const aboutExtraction = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Extract the About page content and convert to Markdown.

IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

Return as JSON:
{
  "content": "Full about page content in Markdown"
}

HTML:
${aboutHtml.slice(0, 50000)}`,
        },
      ],
    });

    let aboutData: any = { content: '' };
    try {
      const responseText = aboutExtraction.content[0].type === 'text' ? aboutExtraction.content[0].text : '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aboutData = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('   ⚠️  Could not parse About page JSON');
    }
    aboutPageContent = aboutData.content || '';
    console.log('   ✅ About page extracted\n');
  } catch (error) {
    console.error('   ❌ Error scraping About page:', error);
  }

  // Scrape Contact page
  console.log('📄 Scraping Contact page...');
  let contactPageContent = '';
  try {
    const contactResponse = await fetch('https://www.justicehub.com.au/contact');
    const contactHtml = await contactResponse.text();

    const contactExtraction = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Extract the Contact page content and convert to Markdown.

IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

Return as JSON:
{
  "content": "Full contact page content in Markdown"
}

HTML:
${contactHtml.slice(0, 50000)}`,
        },
      ],
    });

    let contactData: any = { content: '' };
    try {
      const responseText = contactExtraction.content[0].type === 'text' ? contactExtraction.content[0].text : '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contactData = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('   ⚠️  Could not parse Contact page JSON');
    }
    contactPageContent = contactData.content || '';
    console.log('   ✅ Contact page extracted\n');
  } catch (error) {
    console.error('   ❌ Error scraping Contact page:', error);
  }

  return {
    articles,
    aboutPageContent,
    contactPageContent,
  };
}

async function saveScrapedData(data: WebflowScrapeResult) {
  console.log('💾 Saving scraped data...\n');

  // Create output directory
  const outputDir = join(process.cwd(), 'data', 'webflow-migration');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save all articles to JSON
  const articlesPath = join(outputDir, 'articles.json');
  writeFileSync(articlesPath, JSON.stringify(data.articles, null, 2));
  console.log(`✅ Saved articles to: ${articlesPath}`);

  // Save each article as individual Markdown file for easy review
  const articlesDir = join(outputDir, 'articles-markdown');
  if (!existsSync(articlesDir)) {
    mkdirSync(articlesDir, { recursive: true });
  }

  for (const article of data.articles) {
    const frontmatter = `---
title: "${article.title}"
slug: "${article.slug}"
excerpt: "${article.excerpt}"
category: "${article.category}"
publishedAt: "${article.publishedAt}"
author: "${article.authorName}"
featuredImage: "${article.featuredImageUrl}"
locationTags: [${article.locationTags.map(t => `"${t}"`).join(', ')}]
isTrending: ${article.isTrending}
${article.seoTitle ? `seoTitle: "${article.seoTitle}"` : ''}
${article.seoDescription ? `seoDescription: "${article.seoDescription}"` : ''}
---

`;

    const markdownPath = join(articlesDir, `${article.slug}.md`);
    writeFileSync(markdownPath, frontmatter + article.content);
  }

  console.log(`✅ Saved ${data.articles.length} article Markdown files to: ${articlesDir}\n`);

  // Save About page
  const aboutPath = join(outputDir, 'about.md');
  writeFileSync(aboutPath, data.aboutPageContent);
  console.log(`✅ Saved About page to: ${aboutPath}`);

  // Save Contact page
  const contactPath = join(outputDir, 'contact.md');
  writeFileSync(contactPath, data.contactPageContent);
  console.log(`✅ Saved Contact page to: ${contactPath}`);

  // Save summary report
  const summary = {
    scrapedAt: new Date().toISOString(),
    articlesCount: data.articles.length,
    articles: data.articles.map(a => ({
      title: a.title,
      slug: a.slug,
      category: a.category,
      publishedAt: a.publishedAt,
      contentLength: a.content.length,
      locationTags: a.locationTags,
    })),
    aboutPageLength: data.aboutPageContent.length,
    contactPageLength: data.contactPageContent.length,
  };

  const summaryPath = join(outputDir, 'migration-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Saved summary report to: ${summaryPath}\n`);

  console.log('🎉 All data saved successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Articles scraped: ${data.articles.length}`);
  console.log(`   - About page: ${data.aboutPageContent.length} chars`);
  console.log(`   - Contact page: ${data.contactPageContent.length} chars`);
  console.log(`\n📁 Output location: ${outputDir}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Webflow content migration scraper\n');
  console.log('━'.repeat(60));
  console.log('\n');

  try {
    const data = await scrapeWebflowSite();
    await saveScrapedData(data);

    console.log('\n');
    console.log('━'.repeat(60));
    console.log('✅ Migration scraping complete!');
    console.log('━'.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('   1. Review scraped articles in data/webflow-migration/');
    console.log('   2. Run: npm run migrate:import-articles');
    console.log('   3. Verify content in database');
    console.log('   4. Build frontend pages\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
