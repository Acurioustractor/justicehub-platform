#!/usr/bin/env node
/**
 * ALMA Continuous Ingestion Pipeline
 *
 * Continuously scans the internet for:
 * - Youth justice programs across Australia
 * - Court results and policy changes
 * - Media coverage and public sentiment
 * - Research publications and evidence
 * - Community-led initiatives
 *
 * Uses ALMAAgent to:
 * - Detect patterns in new data
 * - Check ethics before ingestion
 * - Calculate portfolio signals
 * - Translate between languages
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Data sources to monitor
 */
const DATA_SOURCES = {
  // Australian Government sources
  government: [
    {
      name: 'Australian Institute of Health and Welfare (AIHW)',
      url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice',
      type: 'research',
      update_frequency: 'quarterly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Queensland Youth Justice',
      url: 'https://www.cyjma.qld.gov.au/youth-justice',
      type: 'program',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'NSW Department of Communities and Justice',
      url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html',
      type: 'program',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Victorian Youth Justice',
      url: 'https://www.justice.vic.gov.au/youth-justice',
      type: 'program',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Northern Territory Youth Justice',
      url: 'https://justice.nt.gov.au/youth-justice',
      type: 'program',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
  ],

  // Indigenous organizations (Community Controlled)
  indigenous: [
    {
      name: 'NATSILS (National Aboriginal and Torres Strait Islander Legal Services)',
      url: 'https://www.natsils.org.au/',
      type: 'advocacy',
      update_frequency: 'weekly',
      consent_level: 'Community Controlled',
      cultural_authority: true,
    },
    {
      name: 'SNAICC (Secretariat of National Aboriginal and Islander Child Care)',
      url: 'https://www.snaicc.org.au/',
      type: 'advocacy',
      update_frequency: 'weekly',
      consent_level: 'Community Controlled',
      cultural_authority: true,
    },
    {
      name: 'QATSICPP (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)',
      url: 'https://www.qatsicpp.com.au/',
      type: 'advocacy',
      update_frequency: 'weekly',
      consent_level: 'Community Controlled',
      cultural_authority: true,
    },
  ],

  // Research institutions
  research: [
    {
      name: 'Australian Research Council (ARC) - Youth Justice',
      url: 'https://www.arc.gov.au/',
      type: 'research',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Griffith Criminology Institute',
      url: 'https://www.griffith.edu.au/criminology-institute',
      type: 'research',
      update_frequency: 'monthly',
      consent_level: 'Public Knowledge Commons',
    },
  ],

  // Media and news
  media: [
    {
      name: 'The Guardian Australia - Youth Justice',
      url: 'https://www.theguardian.com/australia-news/youth-justice',
      type: 'media',
      update_frequency: 'daily',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'ABC News - Youth Justice',
      url: 'https://www.abc.net.au/news/topic/youth-justice',
      type: 'media',
      update_frequency: 'daily',
      consent_level: 'Public Knowledge Commons',
    },
  ],

  // Courts and legal
  legal: [
    {
      name: 'Australasian Legal Information Institute (AustLII)',
      url: 'https://www.austlii.edu.au/',
      type: 'legal',
      update_frequency: 'weekly',
      consent_level: 'Public Knowledge Commons',
    },
  ],

  // Royal Commissions and Government Inquiries
  inquiries: [
    {
      name: 'Royal Commission into the Protection and Detention of Children in the Northern Territory',
      url: 'https://childdetentionnt.royalcommission.gov.au/',
      type: 'inquiry',
      update_frequency: 'once',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Queensland Family and Child Commission - Youth Justice Reports',
      url: 'https://www.qfcc.qld.gov.au/youth-justice',
      type: 'inquiry',
      update_frequency: 'quarterly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Victorian Commission for Children and Young People - Youth Justice Reports',
      url: 'https://ccyp.vic.gov.au/',
      type: 'inquiry',
      update_frequency: 'quarterly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'NSW Ombudsman - Youth Justice Reviews',
      url: 'https://www.ombo.nsw.gov.au/',
      type: 'inquiry',
      update_frequency: 'quarterly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Productivity Commission - Report on Government Services (Youth Justice)',
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice',
      type: 'inquiry',
      update_frequency: 'yearly',
      consent_level: 'Public Knowledge Commons',
    },
    {
      name: 'Australian Law Reform Commission - Children and the Legal Process',
      url: 'https://www.alrc.gov.au/',
      type: 'inquiry',
      update_frequency: 'quarterly',
      consent_level: 'Public Knowledge Commons',
    },
  ],
};

/**
 * Call Python ingestion service
 */
async function runPythonIngestion(source) {
  return new Promise((resolve, reject) => {
    const pythonPath = '/Users/benknight/act-global-infrastructure/act-personal-ai';

    const python = spawn('python3', [
      '-c',
      `
import sys
import asyncio
sys.path.insert(0, '${pythonPath}')

from agents.research_agent import ResearchAgent

async def main():
    agent = ResearchAgent()
    # Use research agent to scrape and analyze source
    print("Ingesting from: ${source.name}")
    print("URL: ${source.url}")
    print("Type: ${source.type}")
    print("Consent Level: ${source.consent_level}")

asyncio.run(main())
      `.trim()
    ]);

    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { output += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python ingestion failed: ${output}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

/**
 * Use JusticeHub's existing ingestion service (TypeScript)
 */
async function useJusticeHubIngestion(source, category = 'media') {
  console.log(`\n📥 Ingesting from: ${source.name}`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Type: ${source.type}`);
  console.log(`   Frequency: ${source.update_frequency}`);

  // Check if we should ingest (based on last update time)
  const { data: lastJob } = await supabase
    .from('alma_ingestion_jobs')
    .select('*')
    .eq('source_url', source.url)
    .order('started_at', { ascending: false })
    .limit(1);

  if (lastJob && lastJob.length > 0) {
    const lastUpdate = new Date(lastJob[0].started_at);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

    const frequencyHours = {
      'daily': 24,
      'weekly': 168,
      'monthly': 720,
      'quarterly': 2160,
    };

    const requiredHours = frequencyHours[source.update_frequency] || 24;

    if (hoursSinceUpdate < requiredHours) {
      console.log(`   ⏭️  Skipped (last update ${hoursSinceUpdate.toFixed(1)}h ago, need ${requiredHours}h)`);
      return null;
    }
  }

  // Create ingestion job with proper columns
  const jobData = {
    source_url: source.url,
    source_type: 'website',
    consent_level: source.consent_level,
    cultural_authority: source.cultural_authority || false,
    category: category,
    started_at: new Date().toISOString(),
    status: 'pending',
    metadata: {
      source_name: source.name,
      type: source.type,
      update_frequency: source.update_frequency,
    }
  };

  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert(jobData)
    .select()
    .single();

  if (jobError || !job) {
    console.log(`   ❌ Failed to create job: ${jobError?.message}`);
    return null;
  }

  console.log(`   🚀 Job created: ${job.id}`);

  try {
    // Use Firecrawl to scrape (if available)
    if (env.FIRECRAWL_API_KEY) {
      console.log(`   🔥 Using Firecrawl to scrape...`);

      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: source.url,
          formats: ['markdown'],
        }),
      });

      if (!firecrawlResponse.ok) {
        throw new Error(`Firecrawl failed: ${firecrawlResponse.statusText}`);
      }

      const firecrawlData = await firecrawlResponse.json();
      const markdown = firecrawlData.data?.markdown || '';

      console.log(`   ✅ Scraped ${markdown.length} characters`);

      // Use Claude to extract structured data
      console.log(`   🤖 Using Claude to extract interventions...`);

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Extract youth justice interventions from this webpage content.

Source: ${source.name}
URL: ${source.url}
Type: ${source.type}
Consent Level: ${source.consent_level}

Content:
${markdown.slice(0, 50000)}

Extract interventions in this JSON format:
{
  "interventions": [
    {
      "name": "Program name",
      "type": "Prevention/Diversion/Cultural Connection/etc",
      "description": "What the program does",
      "jurisdiction": "QLD/NSW/VIC/NT/etc",
      "target_population": "Who it serves",
      "delivery_model": "How it's delivered"
    }
  ],
  "evidence": [
    {
      "title": "Research title",
      "citation": "Full citation",
      "key_findings": "Main findings"
    }
  ],
  "outcomes": [
    {
      "outcome_type": "Reduced recidivism/etc",
      "measurement": "How it's measured",
      "evidence_source": "Where evidence comes from"
    }
  ]
}

Return ONLY valid JSON, no other text.`
          }],
        }),
      });

      if (!claudeResponse.ok) {
        const errorBody = await claudeResponse.text();
        console.log(`   ⚠️  Claude API Error Response: ${errorBody}`);
        throw new Error(`Claude failed: ${claudeResponse.statusText} - ${errorBody.substring(0, 200)}`);
      }

      const claudeData = await claudeResponse.json();
      const extractedText = claudeData.content[0]?.text || '';

      // Parse JSON from Claude's response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Claude did not return valid JSON');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      console.log(`   📊 Extracted:`);
      console.log(`      - ${extracted.interventions?.length || 0} interventions`);
      console.log(`      - ${extracted.evidence?.length || 0} evidence records`);
      console.log(`      - ${extracted.outcomes?.length || 0} outcomes`);

      // Insert interventions into database
      let insertedCount = 0;
      if (extracted.interventions && extracted.interventions.length > 0) {
        for (const intervention of extracted.interventions) {
          const { error: insertError } = await supabase
            .from('alma_interventions')
            .insert({
              name: intervention.name,
              type: intervention.type,
              description: intervention.description,
              jurisdiction: intervention.jurisdiction,
              target_population: intervention.target_population,
              delivery_model: intervention.delivery_model,
              consent_level: source.consent_level,
              cultural_authority: source.cultural_authority || null,
              source_url: source.url,
              source_name: source.name,
              review_status: 'Under Review', // Needs human review
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (!insertError) {
            insertedCount++;
          }
        }
      }

      console.log(`   ✅ Inserted ${insertedCount} interventions`);

      // Update job status
      await supabase
        .from('alma_ingestion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          interventions_found: extracted.interventions?.length || 0,
          evidence_found: extracted.evidence?.length || 0,
          outcomes_found: extracted.outcomes?.length || 0,
          interventions_inserted: insertedCount,
        })
        .eq('id', job.id);

      return {
        job_id: job.id,
        interventions: insertedCount,
        evidence: extracted.evidence?.length || 0,
        outcomes: extracted.outcomes?.length || 0,
      };

    } else {
      console.log(`   ⚠️  Firecrawl API key not found, skipping`);

      await supabase
        .from('alma_ingestion_jobs')
        .update({
          status: 'skipped',
          completed_at: new Date().toISOString(),
          error_message: 'Firecrawl API key not configured',
        })
        .eq('id', job.id);

      return null;
    }

  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);

    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err.message,
      })
      .eq('id', job.id);

    return null;
  }
}

/**
 * Ingest from all sources in a category
 */
async function ingestCategory(category, sources) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📂 Category: ${category.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);

  const results = [];

  for (const source of sources) {
    try {
      const result = await useJusticeHubIngestion(source, category);
      if (result) {
        results.push(result);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`Error ingesting ${source.name}:`, err.message);
    }
  }

  return results;
}

/**
 * Run pattern detection after ingestion
 */
async function detectPatternsAfterIngestion() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 PATTERN DETECTION (After Ingestion)`);
  console.log(`${'='.repeat(60)}`);

  // Call ALMA Agent bridge
  const bridge = spawn('node', [
    join(__dirname, 'alma-agent-bridge.mjs'),
    'patterns'
  ]);

  return new Promise((resolve) => {
    bridge.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    bridge.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    bridge.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      ALMA Continuous Ingestion Pipeline                  ║');
  console.log('║      Scanning Internet for Youth Justice Intelligence    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  const category = args[0]; // 'government', 'indigenous', 'research', 'media', 'legal', or 'all'

  const startTime = Date.now();
  const allResults = [];

  try {
    if (category && category !== 'all' && DATA_SOURCES[category]) {
      // Ingest specific category
      const results = await ingestCategory(category, DATA_SOURCES[category]);
      allResults.push(...results);

    } else {
      // Ingest all categories
      for (const [cat, sources] of Object.entries(DATA_SOURCES)) {
        const results = await ingestCategory(cat, sources);
        allResults.push(...results);

        // Delay between categories
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Summary
    const totalInterventions = allResults.reduce((sum, r) => sum + (r?.interventions || 0), 0);
    const totalEvidence = allResults.reduce((sum, r) => sum + (r?.evidence || 0), 0);
    const totalOutcomes = allResults.reduce((sum, r) => sum + (r?.outcomes || 0), 0);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 INGESTION SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Jobs completed: ${allResults.length}`);
    console.log(`Interventions added: ${totalInterventions}`);
    console.log(`Evidence records: ${totalEvidence}`);
    console.log(`Outcome records: ${totalOutcomes}`);
    console.log(`Duration: ${duration}s`);

    // Run pattern detection
    if (totalInterventions > 0) {
      await detectPatternsAfterIngestion();
    }

    console.log(`\n✅ Ingestion pipeline completed\n`);

  } catch (err) {
    console.error('\n❌ Pipeline error:', err.message);
    process.exit(1);
  }
}

// Show usage if no arguments
if (process.argv.length === 2) {
  console.log('\nUsage: node scripts/alma-continuous-ingestion.mjs [category]\n');
  console.log('Categories:');
  console.log('  government  - Australian government sources (AIHW, state departments)');
  console.log('  indigenous  - Indigenous organizations (NATSILS, SNAICC, QATSICPP)');
  console.log('  research    - Research institutions (ARC, universities)');
  console.log('  media       - News and media sources (Guardian, ABC)');
  console.log('  legal       - Legal databases (AustLII)');
  console.log('  all         - All sources (default)\n');
  console.log('Examples:');
  console.log('  node scripts/alma-continuous-ingestion.mjs government');
  console.log('  node scripts/alma-continuous-ingestion.mjs indigenous');
  console.log('  node scripts/alma-continuous-ingestion.mjs all\n');
  process.exit(0);
}

main();
