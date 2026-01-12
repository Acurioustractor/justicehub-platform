#!/usr/bin/env node
/**
 * Generate ALMA Media Sentiment Report
 * Creates markdown report of sentiment trends and correlations
 */

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

async function generateReport() {
  const today = new Date().toISOString().split('T')[0];

  console.log(`# ALMA Media Sentiment Report`);
  console.log(`**Generated**: ${today}\n`);
  console.log(`---\n`);

  // Daily Sentiment Overview
  console.log(`## 📊 Daily Sentiment Trends\n`);

  const { data: dailySentiment } = await supabase
    .from('alma_daily_sentiment')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  if (dailySentiment && dailySentiment.length > 0) {
    console.log(`| Date | Source | Articles | Avg Sentiment | Positive | Negative | Neutral |`);
    console.log(`|------|--------|----------|---------------|----------|----------|---------|`);

    dailySentiment.forEach(row => {
      const date = new Date(row.date).toLocaleDateString();
      const sentiment = row.avg_sentiment?.toFixed(2) || 'N/A';
      console.log(`| ${date} | ${row.source_name} | ${row.article_count} | ${sentiment} | ${row.positive_count} | ${row.negative_count} | ${row.neutral_count} |`);
    });

    console.log(`\n`);

    // Calculate weekly average
    const weeklyAvg = dailySentiment.slice(0, 7).reduce((sum, row) => sum + (row.avg_sentiment || 0), 0) / Math.min(7, dailySentiment.length);
    console.log(`**7-Day Average Sentiment**: ${weeklyAvg.toFixed(2)}\n`);
  } else {
    console.log(`*No sentiment data available yet.*\n`);
  }

  // Recent Articles
  console.log(`## 📰 Recent Articles\n`);

  const { data: recentArticles } = await supabase
    .from('alma_media_articles')
    .select('headline, source_name, published_date, sentiment, sentiment_score, topics')
    .order('published_date', { ascending: false })
    .limit(10);

  if (recentArticles && recentArticles.length > 0) {
    recentArticles.forEach(article => {
      const date = article.published_date ? new Date(article.published_date).toLocaleDateString() : 'Unknown';
      const sentimentEmoji = article.sentiment === 'positive' ? '✅' : article.sentiment === 'negative' ? '❌' : '➖';
      console.log(`### ${sentimentEmoji} ${article.headline}`);
      console.log(`**Source**: ${article.source_name} | **Date**: ${date} | **Sentiment**: ${article.sentiment} (${article.sentiment_score?.toFixed(2) || 'N/A'})`);
      if (article.topics && article.topics.length > 0) {
        console.log(`**Topics**: ${article.topics.slice(0, 5).join(', ')}`);
      }
      console.log(``);
    });
  } else {
    console.log(`*No articles found.*\n`);
  }

  // Government Program Correlation
  console.log(`## 🏛️ Government Program Sentiment Correlation\n`);

  const { data: programCorrelation } = await supabase
    .from('alma_sentiment_program_correlation')
    .select('*')
    .order('sentiment_shift', { ascending: false })
    .limit(10);

  if (programCorrelation && programCorrelation.length > 0) {
    console.log(`| Program | Announced | Community-Led | Before | After | Shift |`);
    console.log(`|---------|-----------|---------------|--------|-------|-------|`);

    programCorrelation.forEach(row => {
      const date = row.announced_date ? new Date(row.announced_date).toLocaleDateString() : 'Unknown';
      const before = row.sentiment_before?.toFixed(2) || 'N/A';
      const after = row.sentiment_after?.toFixed(2) || 'N/A';
      const shift = row.sentiment_shift?.toFixed(2) || 'N/A';
      const communityLed = row.community_led ? '✅' : '❌';
      console.log(`| ${row.program_name} | ${date} | ${communityLed} | ${before} | ${after} | ${shift} |`);
    });

    console.log(`\n`);

    // Insights
    const communityLedPrograms = programCorrelation.filter(p => p.community_led);
    const nonCommunityPrograms = programCorrelation.filter(p => !p.community_led);

    if (communityLedPrograms.length > 0) {
      const avgShiftCommunity = communityLedPrograms.reduce((sum, p) => sum + (p.sentiment_shift || 0), 0) / communityLedPrograms.length;
      console.log(`**Community-Led Programs** (${communityLedPrograms.length}): Avg sentiment shift = ${avgShiftCommunity.toFixed(2)}\n`);
    }

    if (nonCommunityPrograms.length > 0) {
      const avgShiftNonCommunity = nonCommunityPrograms.reduce((sum, p) => sum + (p.sentiment_shift || 0), 0) / nonCommunityPrograms.length;
      console.log(`**Non-Community Programs** (${nonCommunityPrograms.length}): Avg sentiment shift = ${avgShiftNonCommunity.toFixed(2)}\n`);
    }
  } else {
    console.log(`*No program correlation data available yet.*\n`);
  }

  // Top Topics
  console.log(`## 🏷️ Trending Topics\n`);

  const { data: allArticles } = await supabase
    .from('alma_media_articles')
    .select('topics')
    .gte('published_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (allArticles && allArticles.length > 0) {
    const topicCounts = {};
    allArticles.forEach(article => {
      if (article.topics) {
        article.topics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    sortedTopics.forEach(([topic, count]) => {
      console.log(`- **${topic}**: ${count} mentions`);
    });

    console.log(`\n`);
  }

  console.log(`---\n`);
  console.log(`*Report generated by ALMA Continuous Intelligence System*`);
  console.log(`*Respecting Indigenous Data Sovereignty | Community Authority Prioritized*`);
}

generateReport().catch(console.error);
