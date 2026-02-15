#!/usr/bin/env node
/**
 * ALMA Media Sentiment Backfill - Specific Articles
 * Scrapes specific article URLs to populate historical sentiment data
 */

import { createClient } from '@supabase/supabase-js';
import { extractMediaSentiment, storeMediaSentiment, calculateSentimentMetrics } from './lib/sentiment-extraction.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const envFile = readFileSync(join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
    .map(([key, ...values]) => [key, values.join('=')])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Specific article URLs - recent Guardian and ABC articles about youth justice
const ARTICLE_URLS = [
  // Recent Guardian articles
  'https://www.theguardian.com/australia-news/2024/dec/youth-justice',
  'https://www.theguardian.com/australia-news/2024/nov/indigenous-youth-justice',
  'https://www.theguardian.com/australia-news/queensland/2024/youth-crime',

  // Recent ABC articles
  'https://www.abc.net.au/news/2024-12-15/youth-justice-reforms/103219876',
  'https://www.abc.net.au/news/2024-11-20/indigenous-youth-detention/103156432',
];

async function scrapeArticle(url, sourceName) {
  console.log(`\n📥 Scraping article...`);
  console.log(`   URL: ${url}`);

  if (!env.FIRECRAWL_API_KEY) {
    console.log('   ⏭️  Skipped (no Firecrawl API key)');
    return null;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.log(`   ❌ Scrape failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown;

    if (!markdown) {
      console.log('   ⚠️  No content returned');
      return null;
    }

    console.log(`   ✅ Scraped ${markdown.length.toLocaleString()} characters`);
    return markdown;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function backfillArticle(url, index, total) {
  const sourceName = url.includes('theguardian.com') ? 'The Guardian Australia' : 'ABC News';

  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  Article ${(index + 1).toString().padStart(2)}/${total}: ${sourceName.padEnd(44)} ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);

  // Create ingestion job
  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert({
      source_url: url,
      source_type: 'website',
      consent_level: 'Public Knowledge Commons',
      category: 'media',
      status: 'pending',
      started_at: new Date().toISOString(),
      metadata: {
        backfill: true,
        source_name: sourceName,
        type: 'media',
      }
    })
    .select()
    .single();

  if (jobError) {
    console.log(`❌ Failed to create job: ${jobError.message}`);
    return { success: false, articles: 0 };
  }

  console.log(`✅ Created job: ${job.id}`);

  // Scrape article
  const markdown = await scrapeArticle(url, sourceName);

  if (!markdown || markdown.length < 100) {
    console.log('⚠️  Content too short or missing');

    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          error: 'Content too short',
        }
      })
      .eq('id', job.id);

    return { success: false, articles: 0 };
  }

  // Extract sentiment
  console.log(`\n📊 Extracting sentiment with Claude...`);

  try {
    const source = {
      name: sourceName,
      url: url,
      type: 'media',
      consent_level: 'Public Knowledge Commons',
    };

    const { articles } = await extractMediaSentiment(markdown, source, job.id, env);

    console.log(`✅ Extracted ${articles.length} articles`);

    if (articles.length === 0) {
      console.log('⚠️  No articles found - might be a landing page');

      await supabase
        .from('alma_ingestion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            ...job.metadata,
            sentiment_articles: 0,
          }
        })
        .eq('id', job.id);

      return { success: true, articles: 0 };
    }

    // Show article details
    articles.forEach((article, idx) => {
      const sentimentEmoji = article.sentiment === 'positive' ? '✅' :
                            article.sentiment === 'negative' ? '❌' : '➖';
      console.log(`\n   ${sentimentEmoji} ${article.headline}`);
      console.log(`      Sentiment: ${article.sentiment} (${article.sentiment_score?.toFixed(2)}) | Confidence: ${article.confidence?.toFixed(2)}`);
      if (article.topics && article.topics.length > 0) {
        console.log(`      Topics: ${article.topics.slice(0, 5).join(', ')}`);
      }
      if (article.key_quotes && article.key_quotes.length > 0) {
        console.log(`      Quote: "${article.key_quotes[0].substring(0, 80)}..."`);
      }
    });

    // Store in database
    console.log(`\n💾 Storing articles in database...`);

    const { stored } = await storeMediaSentiment(articles, job.id, sourceName, supabase);

    console.log(`✅ Stored ${stored} articles`);

    // Update job status
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          sentiment_articles: stored,
        }
      })
      .eq('id', job.id);

    return { success: true, articles: stored };

  } catch (error) {
    console.log(`❌ Sentiment extraction failed: ${error.message}`);

    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          error: error.message,
        }
      })
      .eq('id', job.id);

    return { success: false, articles: 0 };
  }
}

async function backfillAll() {
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║      ALMA Media Sentiment Backfill                       ║`);
  console.log(`║      Specific Article URLs                                ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`📰 Articles to scrape: ${ARTICLE_URLS.length}`);
  console.log(`🤖 Using Claude Sonnet 4.5 for sentiment analysis`);
  console.log(``);

  const results = {
    total_urls: ARTICLE_URLS.length,
    successful: 0,
    failed: 0,
    total_articles: 0,
  };

  for (let i = 0; i < ARTICLE_URLS.length; i++) {
    const url = ARTICLE_URLS[i];
    const result = await backfillArticle(url, i, ARTICLE_URLS.length);

    if (result.success) {
      results.successful++;
      results.total_articles += result.articles;
    } else {
      results.failed++;
    }

    // Rate limiting - wait 3 seconds between articles
    if (i < ARTICLE_URLS.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next article...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  BACKFILL SUMMARY                                         ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`URLs processed: ${results.total_urls}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total articles extracted: ${results.total_articles}`);
  console.log(``);

  if (results.total_articles > 0) {
    console.log(`📊 Next steps:`);
    console.log(`   1. Refresh analytics: node scripts/refresh-sentiment-views.mjs`);
    console.log(`   2. Generate report: node scripts/generate-sentiment-report.mjs > report.md`);
    console.log(`   3. View in Supabase: alma_media_articles table`);
    console.log(``);
    console.log(`💡 Estimated cost: ~$${(results.total_articles * 0.001).toFixed(2)}`);
  } else {
    console.log(`💡 Tip: The URLs might be topic pages, not articles.`);
    console.log(`   Try using direct article URLs from recent news.`);
  }

  console.log(``);
  console.log(`✅ Backfill completed!`);
}

// Run backfill
backfillAll().catch(err => {
  console.error('❌ Backfill failed:', err);
  console.error(err.stack);
  process.exit(1);
});
