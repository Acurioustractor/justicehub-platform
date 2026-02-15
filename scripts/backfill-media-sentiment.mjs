#!/usr/bin/env node
/**
 * ALMA Media Sentiment Backfill
 * Scrapes and analyzes historical media articles to populate sentiment database
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

// Media sources to backfill
const SOURCES = [
  {
    name: 'The Guardian Australia - Youth Justice',
    url: 'https://www.theguardian.com/australia-news/youth-justice',
    type: 'media',
    consent_level: 'Public Knowledge Commons',
  },
  {
    name: 'ABC News - Youth Justice',
    url: 'https://www.abc.net.au/news/topic/youth-justice',
    type: 'media',
    consent_level: 'Public Knowledge Commons',
  },
];

async function scrapeSource(source) {
  console.log(`\n📥 Scraping: ${source.name}`);
  console.log(`   URL: ${source.url}`);

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
        url: source.url,
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

async function backfillSource(source) {
  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  Backfilling: ${source.name.padEnd(42)} ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);

  // Create ingestion job
  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert({
      source_url: source.url,
      source_type: 'website',
      consent_level: source.consent_level,
      category: 'media',
      status: 'pending',
      started_at: new Date().toISOString(),
      metadata: {
        backfill: true,
        source_name: source.name,
        type: source.type,
      }
    })
    .select()
    .single();

  if (jobError) {
    console.log(`❌ Failed to create job: ${jobError.message}`);
    return { success: false, articles: 0 };
  }

  console.log(`✅ Created job: ${job.id}`);

  // Scrape content
  const markdown = await scrapeSource(source);

  if (!markdown) {
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return { success: false, articles: 0 };
  }

  // Extract sentiment
  console.log(`\n📊 Extracting sentiment with Claude Sonnet 4.5...`);

  try {
    const { articles } = await extractMediaSentiment(markdown, source, job.id, env);

    console.log(`✅ Extracted ${articles.length} articles`);

    if (articles.length === 0) {
      console.log('⚠️  No articles found in content');

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

    // Calculate metrics
    const metrics = calculateSentimentMetrics(articles);

    console.log(`\n📈 Sentiment Metrics:`);
    console.log(`   Avg Sentiment: ${metrics.avgSentiment.toFixed(2)}`);
    console.log(`   Positive: ${metrics.positive}`);
    console.log(`   Negative: ${metrics.negative}`);
    console.log(`   Neutral/Mixed: ${metrics.neutral}`);
    console.log(`   Top Topics: ${metrics.topTopics.slice(0, 5).join(', ')}`);

    // Show sample articles
    console.log(`\n📰 Sample Articles (first 3):`);
    articles.slice(0, 3).forEach((article, idx) => {
      const sentimentEmoji = article.sentiment === 'positive' ? '✅' :
                            article.sentiment === 'negative' ? '❌' : '➖';
      console.log(`   ${idx + 1}. ${sentimentEmoji} ${article.headline}`);
      console.log(`      Sentiment: ${article.sentiment} (${article.sentiment_score?.toFixed(2)})`);
      if (article.topics && article.topics.length > 0) {
        console.log(`      Topics: ${article.topics.slice(0, 3).join(', ')}`);
      }
    });

    // Store in database
    console.log(`\n💾 Storing articles in database...`);

    const { stored } = await storeMediaSentiment(articles, job.id, source.name, supabase);

    console.log(`✅ Stored ${stored} articles`);

    // Update job status
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        interventions_found: 0,
        metadata: {
          ...job.metadata,
          sentiment_articles: stored,
        }
      })
      .eq('id', job.id);

    return { success: true, articles: stored };

  } catch (error) {
    console.log(`❌ Sentiment extraction failed: ${error.message}`);
    console.error(error.stack);

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
  console.log(`║      Populating Historical Sentiment Data                ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`📅 Backfilling last month of media coverage`);
  console.log(`📰 Sources: ${SOURCES.length}`);
  console.log(`🤖 Using Claude Sonnet 4.5 for sentiment analysis`);
  console.log(``);

  const results = {
    total_sources: SOURCES.length,
    successful: 0,
    failed: 0,
    total_articles: 0,
  };

  for (const source of SOURCES) {
    const result = await backfillSource(source);

    if (result.success) {
      results.successful++;
      results.total_articles += result.articles;
    } else {
      results.failed++;
    }

    // Rate limiting - wait 2 seconds between sources
    if (SOURCES.indexOf(source) < SOURCES.length - 1) {
      console.log(`\n⏳ Waiting 2 seconds before next source...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  BACKFILL SUMMARY                                         ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`Sources processed: ${results.total_sources}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total articles extracted: ${results.total_articles}`);
  console.log(``);

  if (results.total_articles > 0) {
    console.log(`📊 Next steps:`);
    console.log(`   1. Refresh analytics: node scripts/refresh-sentiment-views.mjs`);
    console.log(`   2. Generate report: node scripts/generate-sentiment-report.mjs`);
    console.log(`   3. View in Supabase: alma_media_articles table`);
    console.log(``);
    console.log(`💡 Estimated cost: ~$${(results.total_articles * 0.001).toFixed(2)}`);
  }

  console.log(`✅ Backfill completed!`);
}

// Run backfill
backfillAll().catch(err => {
  console.error('❌ Backfill failed:', err);
  console.error(err.stack);
  process.exit(1);
});
