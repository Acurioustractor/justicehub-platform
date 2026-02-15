#!/usr/bin/env node
/**
 * ALMA Media Sentiment - Test Data Seeder
 * Creates realistic test data for last 30 days to demonstrate analytics capabilities
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

// Realistic article templates based on actual youth justice coverage
const ARTICLE_TEMPLATES = [
  {
    headline: "Indigenous youth diversion program shows 40% reduction in reoffending",
    sentiment: "positive",
    sentiment_score: 0.65,
    topics: ["community-led programs", "youth diversion", "reoffending rates", "cultural programs"],
    community_orgs: ["Aboriginal Legal Service", "Indigenous Youth Programs"],
    government_programs: ["NT Youth Diversion Program"],
    quotes: [
      "These programs work because they're designed by community, for community",
      "Cultural connection is key to breaking the cycle"
    ],
    summary: "Community-led youth diversion program in NT reports 40% reduction in reoffending through cultural mentoring and Elder involvement."
  },
  {
    headline: "Queensland announces $80M youth detention center despite evidence",
    sentiment: "negative",
    sentiment_score: -0.55,
    topics: ["detention centers", "government policy", "punitive approach", "evidence-based policy"],
    community_orgs: ["Amnesty International", "Youth Advocacy Centre"],
    government_programs: ["QLD Youth Detention Expansion"],
    quotes: [
      "This flies in the face of all the evidence",
      "We're locking kids up instead of helping them"
    ],
    summary: "Queensland government announces new $80M detention facility despite research showing community programs are more effective and cost-efficient."
  },
  {
    headline: "Elders call for greater cultural authority in youth justice programs",
    sentiment: "mixed",
    sentiment_score: 0.15,
    topics: ["cultural authority", "Indigenous governance", "community control", "elder leadership"],
    community_orgs: ["National Indigenous Youth Justice Network"],
    elders: ["Uncle Bob Anderson", "Aunty Mary Thompson"],
    quotes: [
      "Our young people need cultural healing, not punishment",
      "Let us lead - we know what works for our community"
    ],
    summary: "Indigenous Elders across Australia call for greater control over youth justice programs, citing success of culturally-led initiatives."
  },
  {
    headline: "Royal Commission recommendations ignored, advocates say",
    sentiment: "negative",
    sentiment_score: -0.45,
    topics: ["royal commission", "government accountability", "Indigenous rights", "youth detention"],
    community_orgs: ["Human Rights Law Centre", "Change the Record"],
    quotes: [
      "Five years on and nothing has changed",
      "The government is failing our young people"
    ],
    summary: "Youth justice advocates mark five years since NT Royal Commission, saying key recommendations around community-led programs remain ignored."
  },
  {
    headline: "Cultural camps reduce youth offending by 60%, study finds",
    sentiment: "positive",
    sentiment_score: 0.75,
    topics: ["cultural programs", "cultural camps", "evidence-based practice", "reoffending reduction"],
    community_orgs: ["Clontarf Foundation", "Stars Foundation"],
    government_programs: ["On Country Programs"],
    quotes: [
      "Connection to culture transforms young lives",
      "The evidence is overwhelming - this approach works"
    ],
    summary: "University study shows cultural immersion programs reduce reoffending by 60%, far exceeding traditional detention outcomes."
  },
  {
    headline: "Indigenous incarceration rates hit record high",
    sentiment: "negative",
    sentiment_score: -0.70,
    topics: ["Indigenous incarceration", "systemic racism", "overrepresentation", "criminal justice system"],
    community_orgs: ["Aboriginal Legal Service", "Sisters Inside"],
    quotes: [
      "This is a national crisis that demands immediate action",
      "Our kids are being criminalized for being poor and black"
    ],
    summary: "Latest ABS figures show Indigenous youth detention rates 17 times higher than non-Indigenous youth, prompting calls for urgent reform."
  },
  {
    headline: "Bail reform criticized as 'tough on crime' rhetoric returns",
    sentiment: "negative",
    sentiment_score: -0.60,
    topics: ["bail reform", "law and order", "political rhetoric", "youth crime"],
    community_orgs: ["Youth Advocacy Centre"],
    quotes: [
      "This is politics, not evidence",
      "More kids in detention won't make communities safer"
    ],
    summary: "Government announces stricter bail laws for youth despite evidence showing remand increases likelihood of reoffending."
  },
  {
    headline: "Community Justice program wins international recognition",
    sentiment: "positive",
    sentiment_score: 0.80,
    topics: ["community justice", "best practice", "international recognition", "Indigenous-led"],
    community_orgs: ["Maranguka Justice Reinvestment"],
    elders: ["Uncle Paul Gordon"],
    quotes: [
      "This proves what we've always known - community knows best",
      "Justice reinvestment works when community leads"
    ],
    summary: "Bourke's Maranguka Justice Reinvestment program wins UN award for reducing youth detention by 45% through community-led approach."
  },
  {
    headline: "Youth justice minister announces review of detention conditions",
    sentiment: "neutral",
    sentiment_score: 0.05,
    topics: ["detention conditions", "government review", "human rights", "oversight"],
    government_programs: ["Youth Detention Review"],
    quotes: [
      "We need to ensure young people are safe",
      "But we need action, not another review"
    ],
    summary: "Minister announces review of youth detention conditions following reports of abuse, but advocates question commitment to real reform."
  },
  {
    headline: "Aboriginal-controlled youth service sees 90% completion rate",
    sentiment: "positive",
    sentiment_score: 0.70,
    topics: ["community control", "program success", "cultural programs", "youth engagement"],
    community_orgs: ["Gunawirra Limited"],
    elders: ["Aunty Beryl Van-Oploo"],
    quotes: [
      "When programs are run by us, for us, young people engage",
      "Cultural safety is everything"
    ],
    summary: "Sydney Aboriginal-controlled youth program achieves 90% completion rate compared to 30% for mainstream services."
  }
];

const SOURCES = ['The Guardian Australia', 'ABC News', 'NITV News'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateDateInLastMonth() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function seedData() {
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║      ALMA Media Sentiment - Test Data Seeder             ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`📊 Creating realistic test data for analytics demonstration`);
  console.log(`📅 Date range: Last 30 days`);
  console.log(`📰 Templates: ${ARTICLE_TEMPLATES.length}`);
  console.log(`🔄 Each template will be used 3-5 times with variations`);
  console.log(``);

  // Create a job for the seeding operation
  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert({
      source_url: 'internal://seed-data',
      source_type: 'website',
      consent_level: 'Public Knowledge Commons',
      category: 'media',
      status: 'pending',
      started_at: new Date().toISOString(),
      metadata: {
        seed_data: true,
        purpose: 'test_analytics_capabilities',
      }
    })
    .select()
    .single();

  if (jobError) {
    console.log(`❌ Failed to create job: ${jobError.message}`);
    return;
  }

  console.log(`✅ Created seed job: ${job.id}\n`);

  const articles = [];
  let articlesCreated = 0;

  // Generate 3-5 instances of each template
  for (const template of ARTICLE_TEMPLATES) {
    const instances = 3 + Math.floor(Math.random() * 3); // 3-5 instances

    for (let i = 0; i < instances; i++) {
      const source = getRandomElement(SOURCES);

      const article = {
        job_id: job.id,
        headline: template.headline,
        url: `https://example.com/article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        published_date: generateDateInLastMonth(),
        source_name: source,
        sentiment: template.sentiment,
        sentiment_score: template.sentiment_score + (Math.random() * 0.2 - 0.1), // Add slight variation
        confidence: 0.85 + (Math.random() * 0.1), // 0.85-0.95
        topics: template.topics,
        government_mentions: {
          programs: template.government_programs || [],
          ministers: [],
          departments: getRandomElement([
            ['Australian Institute of Criminology'],
            ['Department of Justice'],
            ['Attorney-General\'s Department'],
            []
          ])
        },
        community_mentions: {
          organizations: template.community_orgs || [],
          elders: template.elders || [],
          advocates: []
        },
        summary: template.summary,
        key_quotes: template.quotes,
        full_text: null,
      };

      articles.push(article);
      articlesCreated++;

      if (articlesCreated % 10 === 0) {
        console.log(`   Created ${articlesCreated} articles...`);
      }
    }
  }

  console.log(`\n💾 Storing ${articles.length} articles in database...`);

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('alma_media_articles')
      .insert(batch)
      .select();

    if (error) {
      console.log(`❌ Error inserting batch: ${error.message}`);
    } else {
      inserted += data.length;
      console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} articles`);
    }
  }

  console.log(`\n✅ Total inserted: ${inserted} articles`);

  // Update job status
  await supabase
    .from('alma_ingestion_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        ...job.metadata,
        sentiment_articles: inserted,
      }
    })
    .eq('id', job.id);

  // Calculate statistics
  const positive = articles.filter(a => a.sentiment === 'positive').length;
  const negative = articles.filter(a => a.sentiment === 'negative').length;
  const neutral = articles.filter(a => a.sentiment === 'neutral' || a.sentiment === 'mixed').length;
  const avgSentiment = articles.reduce((sum, a) => sum + a.sentiment_score, 0) / articles.length;

  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  SEEDING SUMMARY                                          ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`Total articles: ${inserted}`);
  console.log(`Date range: Last 30 days`);
  console.log(`Sources: ${SOURCES.join(', ')}`);
  console.log(``);
  console.log(`📊 Sentiment breakdown:`);
  console.log(`   Positive: ${positive} (${(positive/inserted*100).toFixed(1)}%)`);
  console.log(`   Negative: ${negative} (${(negative/inserted*100).toFixed(1)}%)`);
  console.log(`   Neutral/Mixed: ${neutral} (${(neutral/inserted*100).toFixed(1)}%)`);
  console.log(`   Average sentiment: ${avgSentiment.toFixed(2)}`);
  console.log(``);
  console.log(`📊 Next steps:`);
  console.log(`   1. Refresh views: node scripts/refresh-sentiment-views.mjs`);
  console.log(`   2. Generate report: node scripts/generate-sentiment-report.mjs > report.md`);
  console.log(`   3. View in Supabase: alma_media_articles table`);
  console.log(``);
  console.log(`✅ Seed data created successfully!`);
}

// Run seeder
seedData().catch(err => {
  console.error('❌ Seeding failed:', err);
  console.error(err.stack);
  process.exit(1);
});
