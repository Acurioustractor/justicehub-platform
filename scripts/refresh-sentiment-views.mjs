#!/usr/bin/env node
/**
 * Refresh ALMA Sentiment Analytics Materialized Views
 * Runs after media ingestion to update sentiment aggregations
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

async function refreshViews() {
  console.log('🔄 Refreshing sentiment analytics views...\n');

  try {
    // Call the refresh function created in migration
    const { data, error } = await supabase.rpc('refresh_sentiment_analytics');

    if (error) {
      console.error('❌ Failed to refresh views:', error.message);
      process.exit(1);
    }

    console.log('✅ Materialized views refreshed successfully');
    console.log('   ✓ alma_daily_sentiment');
    console.log('   ✓ alma_sentiment_program_correlation\n');

    // Get latest stats
    const { data: stats } = await supabase
      .from('alma_daily_sentiment')
      .select('date, article_count, avg_sentiment, positive_count, negative_count, neutral_count')
      .order('date', { ascending: false })
      .limit(7);

    if (stats && stats.length > 0) {
      console.log('📊 Last 7 days sentiment:');
      stats.forEach(day => {
        const date = new Date(day.date).toLocaleDateString();
        const sentiment = day.avg_sentiment?.toFixed(2) || 'N/A';
        console.log(`   ${date}: ${sentiment} (${day.positive_count}+ ${day.negative_count}- ${day.neutral_count}=) [${day.article_count} articles]`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

refreshViews();
