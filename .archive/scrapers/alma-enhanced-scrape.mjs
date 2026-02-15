#!/usr/bin/env node
/**
 * ALMA Enhanced Scrape - JavaScript rendering + PDF extraction + Funding data
 *
 * Improvements over basic scrape:
 * 1. JavaScript rendering with waitFor for government sites
 * 2. PDF extraction for reports
 * 3. Chunking for large pages
 * 4. Funding data extraction
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';

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
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

/**
 * Sites that need JavaScript rendering
 */
const JAVASCRIPT_SITES = [
  {
    name: 'NSW Youth Justice Main',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html',
    wait: 5000,
    jurisdiction: 'NSW'
  },
  {
    name: 'NSW Youth Justice Conferencing',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/youth-justice-conferencing.html',
    wait: 5000,
    jurisdiction: 'NSW'
  },
  {
    name: 'NSW Custody',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/custody.html',
    wait: 5000,
    jurisdiction: 'NSW'
  },
  {
    name: 'QLD Youth Justice Main',
    url: 'https://www.cyjma.qld.gov.au/youth-justice',
    wait: 5000,
    jurisdiction: 'QLD'
  },
  {
    name: 'QLD Youth Justice Programs',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs',
    wait: 5000,
    jurisdiction: 'QLD'
  },
  {
    name: 'NT Youth Justice Main',
    url: 'https://justice.nt.gov.au/youth-justice',
    wait: 5000,
    jurisdiction: 'NT'
  },
  {
    name: 'NT Youth Diversion',
    url: 'https://justice.nt.gov.au/youth-justice/youth-diversion-program',
    wait: 5000,
    jurisdiction: 'NT'
  },
  {
    name: 'SA Youth Justice Main',
    url: 'https://www.childprotection.sa.gov.au/youth-justice',
    wait: 3000,
    jurisdiction: 'SA'
  },
];

/**
 * PDF sources for extraction (funding reports, research)
 */
const PDF_SOURCES = [
  {
    name: 'AIHW Youth Justice 2023-24',
    url: 'https://www.aihw.gov.au/getmedia/52c8911b-7258-4553-9e3c-fcdb021187f6/Youth-justice-in-Australia-2023-24.pdf',
    type: 'research',
    extractFunding: true
  },
  {
    name: 'Productivity Commission ROGS 2025 Youth Justice',
    url: 'https://assets.pc.gov.au/ongoing/report-on-government-services/2025/community-services/rogs-2025-partf-overview-and-sections.pdf',
    type: 'government',
    extractFunding: true
  },
  // Note: Some PDFs may be blocked - we'll handle errors gracefully
];

/**
 * Scrape with JavaScript rendering
 */
async function scrapeWithJavaScript(source) {
  console.log(`\n📥 Scraping (JS): ${source.name}`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Wait: ${source.wait}ms`);

  try {
    const result = await firecrawl.scrapeUrl(source.url, {
      waitFor: source.wait,
      timeout: 30000,
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    });

    if (!result || !result.markdown) {
      console.log(`   ❌ No content returned`);
      return null;
    }

    console.log(`   ✅ Scraped ${result.markdown.length} chars (with JS wait)`);

    // Extract entities
    const entities = await extractEntities(result.markdown, source);

    // Store in database
    const inserted = await storeEntities(entities, source);

    return {
      chars: result.markdown.length,
      entities,
      inserted
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Extract content from PDF
 */
async function extractPdf(source) {
  console.log(`\n📄 Extracting PDF: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  try {
    // Firecrawl can parse PDFs
    const result = await firecrawl.scrapeUrl(source.url, {
      timeout: 60000,
      formats: ['markdown'],
    });

    if (!result || !result.markdown) {
      console.log(`   ❌ No content returned from PDF`);
      return null;
    }

    console.log(`   ✅ Extracted ${result.markdown.length} chars from PDF`);

    // Extract funding data if applicable
    let fundingData = null;
    if (source.extractFunding) {
      fundingData = await extractFundingData(result.markdown, source);
    }

    // Extract entities
    const entities = await extractEntities(result.markdown, source);

    return {
      chars: result.markdown.length,
      entities,
      funding: fundingData
    };

  } catch (error) {
    console.log(`   ❌ PDF Error: ${error.message}`);
    return null;
  }
}

/**
 * Extract funding data using Claude
 */
async function extractFundingData(content, source) {
  console.log(`   💰 Extracting funding data...`);

  // Chunk if too large
  const maxChars = 40000;
  const textToProcess = content.length > maxChars
    ? content.substring(0, maxChars)
    : content;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Extract all funding and expenditure data from this Australian youth justice document.

Return ONLY valid JSON with this structure:
{
  "nationalExpenditure": {
    "total": number or null,
    "detentionTotal": number or null,
    "communityTotal": number or null,
    "year": "string"
  },
  "costPerDay": {
    "detention": number or null,
    "community": number or null
  },
  "stateData": [
    {
      "state": "VIC|QLD|NSW|NT|SA|WA|TAS|ACT",
      "expenditure": number or null,
      "detentionPercent": number or null
    }
  ],
  "keyFindings": ["string"]
}

If data is not found, use null. Extract only what is explicitly stated.

Document content:
${textToProcess}`
      }]
    });

    const jsonText = response.content[0].text;
    const funding = JSON.parse(jsonText);

    console.log(`   ✅ Funding data extracted`);
    if (funding.nationalExpenditure?.total) {
      console.log(`      National total: $${(funding.nationalExpenditure.total / 1000000000).toFixed(2)}B`);
    }
    if (funding.costPerDay?.detention) {
      console.log(`      Detention cost/day: $${funding.costPerDay.detention}`);
    }

    return funding;

  } catch (error) {
    console.log(`   ❌ Funding extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Extract entities from content (with chunking for large pages)
 */
async function extractEntities(content, source) {
  const MAX_CHUNK_SIZE = 30000;

  // If content is small enough, process directly
  if (content.length <= MAX_CHUNK_SIZE) {
    return await extractEntitiesFromChunk(content, source);
  }

  // Chunk large content
  console.log(`   📦 Chunking large content (${content.length} chars)...`);

  const chunks = [];
  for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
    chunks.push(content.substring(i, i + MAX_CHUNK_SIZE));
  }

  const allEntities = {
    interventions: [],
    evidence: [],
    outcomes: [],
    organizations: [],
    links: []
  };

  for (let i = 0; i < chunks.length; i++) {
    console.log(`   Processing chunk ${i + 1}/${chunks.length}...`);
    const entities = await extractEntitiesFromChunk(chunks[i], source);

    if (entities) {
      allEntities.interventions.push(...(entities.interventions || []));
      allEntities.evidence.push(...(entities.evidence || []));
      allEntities.outcomes.push(...(entities.outcomes || []));
      allEntities.organizations.push(...(entities.organizations || []));
      allEntities.links.push(...(entities.links || []));
    }
  }

  // Deduplicate by name
  allEntities.interventions = deduplicateByName(allEntities.interventions);
  allEntities.evidence = deduplicateByName(allEntities.evidence);
  allEntities.organizations = deduplicateByName(allEntities.organizations);

  return allEntities;
}

/**
 * Extract entities from a single chunk
 */
async function extractEntitiesFromChunk(content, source) {
  const prompt = `Extract youth justice information from this Australian ${source.jurisdiction || 'government'} content.

Return ONLY valid JSON with:
{
  "interventions": [
    {
      "name": "Program name",
      "type": "Prevention|Diversion|Cultural Connection|Education/Employment|Family Strengthening|Therapeutic|Community-Led|Justice Reinvestment|Wraparound Support|Early Intervention",
      "description": "Brief description",
      "target_cohort": ["Young people aged 10-17"],
      "geography": ["${source.jurisdiction || 'Australia'}"]
    }
  ],
  "evidence": [
    {
      "title": "Finding title",
      "summary": "Key finding",
      "methodology": "Study type if mentioned"
    }
  ],
  "outcomes": [
    {
      "metric": "Outcome name",
      "value": "Value or percentage",
      "context": "Context"
    }
  ],
  "organizations": [
    {
      "name": "Organization name",
      "type": "government|indigenous|research|advocacy"
    }
  ],
  "links": ["Relevant URLs found"]
}

Content:
${content}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.log(`   ❌ Extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Deduplicate entities by name
 */
function deduplicateByName(entities) {
  const seen = new Set();
  return entities.filter(e => {
    const key = e.name?.toLowerCase() || e.title?.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Store entities in database
 */
async function storeEntities(entities, source) {
  if (!entities) return 0;

  let inserted = 0;

  for (const intervention of (entities.interventions || [])) {
    try {
      // Check for duplicate by name
      const { data: existing } = await supabase
        .from('alma_interventions')
        .select('id')
        .ilike('name', intervention.name)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert new intervention
      const { error } = await supabase.from('alma_interventions').insert({
        name: intervention.name,
        description: intervention.description,
        type: intervention.type,
        geography: intervention.geography || [source.jurisdiction || 'Australia'],
        target_cohort: intervention.target_cohort || ['Young people aged 10-17'],
        consent_level: source.cultural_authority ? 'Community Controlled' : 'Public Knowledge Commons',
        review_status: 'Approved',
        permitted_uses: ['Query (internal)'],
        source_url: source.url,
        source_date: new Date().toISOString()
      });

      if (!error) {
        inserted++;
      }
    } catch (e) {
      // Silently skip duplicates
    }
  }

  return inserted;
}

/**
 * Store funding data
 */
async function storeFundingData(fundingData, source) {
  if (!fundingData) return;

  try {
    // Store national data
    if (fundingData.nationalExpenditure?.total) {
      await supabase.from('alma_funding_data').upsert({
        source_url: source.url,
        source_name: source.name,
        source_type: source.type,
        report_year: fundingData.nationalExpenditure.year || '2023-24',
        jurisdiction: 'National',
        total_expenditure: fundingData.nationalExpenditure.total,
        detention_expenditure: fundingData.nationalExpenditure.detentionTotal,
        community_expenditure: fundingData.nationalExpenditure.communityTotal,
        cost_per_day_detention: fundingData.costPerDay?.detention,
        cost_per_day_community: fundingData.costPerDay?.community,
        raw_data: fundingData
      }, { onConflict: 'source_url,jurisdiction' });
    }

    // Store state data
    for (const state of (fundingData.stateData || [])) {
      if (state.expenditure) {
        await supabase.from('alma_funding_data').upsert({
          source_url: source.url,
          source_name: source.name,
          source_type: source.type,
          report_year: fundingData.nationalExpenditure?.year || '2023-24',
          jurisdiction: state.state,
          total_expenditure: state.expenditure,
          raw_data: state
        }, { onConflict: 'source_url,jurisdiction' });
      }
    }

    console.log(`   💾 Funding data stored`);
  } catch (error) {
    console.log(`   ❌ Funding storage error: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        ALMA Enhanced Scrape - JavaScript + PDF Mode       ║');
  console.log('║           Building Comprehensive Youth Justice Data       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();
  let totalJsScraped = 0;
  let totalPdfExtracted = 0;
  let totalInterventions = 0;
  let totalFundingPoints = 0;

  // Phase 1: JavaScript-rendered sites
  console.log('\n\n═══ PHASE 1: JavaScript-Rendered Sites ═══\n');

  for (const source of JAVASCRIPT_SITES) {
    const result = await scrapeWithJavaScript(source);

    if (result) {
      totalJsScraped++;
      totalInterventions += result.inserted;

      console.log(`   📊 Found ${result.entities?.interventions?.length || 0} interventions`);
      console.log(`   ✅ Inserted ${result.inserted} new`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 3000));
  }

  // Phase 2: PDF extraction
  console.log('\n\n═══ PHASE 2: PDF Extraction ═══\n');

  for (const source of PDF_SOURCES) {
    const result = await extractPdf(source);

    if (result) {
      totalPdfExtracted++;

      if (result.funding) {
        await storeFundingData(result.funding, source);
        totalFundingPoints++;
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 5000));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 ENHANCED SCRAPE SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Duration: ${duration} minutes`);
  console.log(`JavaScript sites scraped: ${totalJsScraped}/${JAVASCRIPT_SITES.length}`);
  console.log(`PDFs extracted: ${totalPdfExtracted}/${PDF_SOURCES.length}`);
  console.log(`New interventions: ${totalInterventions}`);
  console.log(`Funding data points: ${totalFundingPoints}`);

  // Get current totals
  const { count: interventionCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total ALMA interventions: ${interventionCount}`);
  console.log('\n✅ Enhanced scrape complete!');
}

main().catch(console.error);
