#!/usr/bin/env node
/**
 * Test ALMA Media Sentiment Extraction
 * Tests sentiment extraction on a sample Guardian article
 */

import { extractMediaSentiment, storeMediaSentiment, calculateSentimentMetrics } from './lib/sentiment-extraction.mjs';
import { createClient } from '@supabase/supabase-js';
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

async function testSentimentExtraction() {
  console.log('🧪 Testing ALMA Media Sentiment Extraction\n');

  // Sample markdown content (simulating scraped article)
  const sampleMarkdown = `
# Youth justice reforms backed by evidence, says Indigenous advocate

## New community-led programs show promising results in Northern Territory

**Published**: January 1, 2026
**Source**: The Guardian Australia

Indigenous-led youth justice programs in the Northern Territory are showing early signs of success, with reoffending rates dropping by 35% in communities where cultural mentoring has been implemented.

"These programs work because they're designed by community, for community," says Aunty Margaret Wilson, a Yolngu elder who helped establish the Arnhem Land Youth Diversion Program.

The programs involve:
- Cultural camps on country
- Elder mentorship
- Language and ceremony programs
- Family group conferencing

However, government officials have announced new detention facilities despite evidence suggesting community-based alternatives are more effective.

The Queensland government recently announced a $50 million youth detention center, drawing criticism from Indigenous advocates who argue the funding should support community programs instead.

"We've seen this pattern before," says Dr. Sarah Martinez from the Aboriginal Legal Service. "Government announces punitive measures, community voices are ignored, and the cycle continues."

Recent statistics from the Australian Institute of Health and Welfare show:
- Indigenous youth are 17 times more likely to be detained
- Community-led programs reduce reoffending by 40-60%
- Detention increases likelihood of adult incarceration by 300%

The federal government has yet to respond to calls for increased funding for community-controlled justice programs.
`;

  const source = {
    name: 'The Guardian Australia - Youth Justice',
    url: 'https://www.theguardian.com/australia-news/youth-justice',
    type: 'media',
    consent_level: 'Public Knowledge Commons',
  };

  // Create test job
  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert({
      source_url: source.url,
      source_type: 'website',
      consent_level: source.consent_level,
      category: 'media',
      status: 'pending',
      started_at: new Date().toISOString(),
      metadata: { test: true, source_name: source.name }
    })
    .select()
    .single();

  if (jobError) {
    console.error('❌ Failed to create test job:', jobError.message);
    process.exit(1);
  }

  console.log(`✅ Created test job: ${job.id}\n`);

  // Extract sentiment
  console.log('📊 Extracting sentiment from sample article...\n');

  const { articles } = await extractMediaSentiment(sampleMarkdown, source, job.id, env);

  console.log(`✅ Extracted ${articles.length} articles\n`);

  if (articles.length > 0) {
    // Debug: check article structure
    console.log('🔍 Debug - First article structure:');
    console.log(JSON.stringify(articles[0], null, 2));
    console.log('');

    // Calculate metrics
    const metrics = calculateSentimentMetrics(articles);

    console.log('📈 Sentiment Metrics:');
    console.log(`   Avg Sentiment: ${typeof metrics.avgSentiment === 'number' ? metrics.avgSentiment.toFixed(2) : metrics.avgSentiment}`);
    console.log(`   Positive: ${metrics.positive}`);
    console.log(`   Negative: ${metrics.negative}`);
    console.log(`   Neutral: ${metrics.neutral}`);
    console.log(`   Top Topics: ${metrics.topTopics.slice(0, 5).join(', ')}\n`);

    // Display each article
    articles.forEach((article, idx) => {
      console.log(`📰 Article ${idx + 1}:`);
      console.log(`   Headline: ${article.headline}`);
      console.log(`   Sentiment: ${article.sentiment} (${article.sentiment_score?.toFixed(2)})`);
      console.log(`   Confidence: ${article.confidence?.toFixed(2)}`);
      console.log(`   Topics: ${article.topics?.join(', ')}`);
      if (article.government_mentions) {
        console.log(`   Government Mentions:`);
        if (article.government_mentions.programs?.length > 0) {
          console.log(`      Programs: ${article.government_mentions.programs.join(', ')}`);
        }
        if (article.government_mentions.departments?.length > 0) {
          console.log(`      Departments: ${article.government_mentions.departments.join(', ')}`);
        }
      }
      if (article.community_mentions) {
        console.log(`   Community Mentions:`);
        if (article.community_mentions.organizations?.length > 0) {
          console.log(`      Organizations: ${article.community_mentions.organizations.join(', ')}`);
        }
        if (article.community_mentions.elders?.length > 0) {
          console.log(`      Elders: ${article.community_mentions.elders.join(', ')}`);
        }
      }
      if (article.key_quotes && article.key_quotes.length > 0) {
        console.log(`   Key Quotes:`);
        article.key_quotes.forEach(quote => {
          console.log(`      - "${quote}"`);
        });
      }
      console.log('');
    });

    // Store in database
    console.log('💾 Storing articles in database...\n');

    const { stored } = await storeMediaSentiment(articles, job.id, source.name, supabase);

    console.log(`✅ Stored ${stored} articles\n`);

    // Update job status
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          sentiment_articles: stored,
          test: true,
        }
      })
      .eq('id', job.id);

    console.log('✅ Test completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Check Supabase: alma_media_articles table');
    console.log('   2. Run: node scripts/refresh-sentiment-views.mjs');
    console.log('   3. Run: node scripts/generate-sentiment-report.mjs');

  } else {
    console.log('⚠️  No articles extracted\n');
  }
}

testSentimentExtraction().catch(err => {
  console.error('❌ Test failed:', err);
  console.error(err.stack);
  process.exit(1);
});
