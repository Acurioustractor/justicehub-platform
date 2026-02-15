#!/usr/bin/env node
/**
 * ALMA PDF Extractor - Download and parse PDFs locally
 *
 * Downloads PDFs to local disk then uses pdf-parse for extraction.
 * This bypasses Firecrawl timeout issues with large government PDFs.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pdfDir = join(root, 'data', 'pdfs');

// Ensure PDF directory exists
if (!existsSync(pdfDir)) {
  mkdirSync(pdfDir, { recursive: true });
}

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

/**
 * PDF sources with funding and program data
 */
const PDF_SOURCES = [
  {
    name: 'AIHW Youth Justice 2023-24',
    url: 'https://www.aihw.gov.au/getmedia/52c8911b-7258-4553-9e3c-fcdb021187f6/Youth-justice-in-Australia-2023-24.pdf',
    type: 'research',
    extractFunding: true,
    extractPrograms: true
  },
  {
    name: 'AIHW Youth Detention Population 2024',
    url: 'https://www.aihw.gov.au/getmedia/db6b39a2-58d4-4572-beb8-fa16a0a88c88/Youth-detention-population-in-Australia-2024.pdf',
    type: 'research',
    extractFunding: true,
    extractPrograms: false
  },
  {
    name: 'Productivity Commission ROGS 2025',
    url: 'https://assets.pc.gov.au/ongoing/report-on-government-services/2025/community-services/rogs-2025-partf-overview-and-sections.pdf',
    type: 'government',
    extractFunding: true,
    extractPrograms: false
  },
  // AIHW state-specific youth justice data tables
  {
    name: 'AIHW Youth Justice Data Tables 2023-24',
    url: 'https://www.aihw.gov.au/getmedia/8b6aa37a-e5d7-4f2f-a2de-0b3e8e53c4f3/Youth-justice-in-Australia-2023-24-data-tables.xlsx',
    type: 'research',
    extractFunding: true,
    extractPrograms: false
  },
  // Productivity Commission detailed chapter
  {
    name: 'ROGS 2025 Youth Justice Chapter 17',
    url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/rogs-2025-partf-section17.pdf',
    type: 'government',
    extractFunding: true,
    extractPrograms: false
  },
  // NSW Youth Justice Reports
  {
    name: 'NSW Bureau of Crime Stats Youth Justice 2023',
    url: 'https://www.bocsar.nsw.gov.au/Publications/YJ/Youth-Justice-NSW-2023.pdf',
    type: 'research',
    extractFunding: true,
    extractPrograms: true
  },
  // Justice Reinvestment research
  {
    name: 'Justice Reinvestment Australia Research',
    url: 'https://www.justicereinvestment.net.au/wp-content/uploads/2023/10/JRA-Research-Report.pdf',
    type: 'research',
    extractFunding: true,
    extractPrograms: true
  },
  // Australian Institute of Criminology
  {
    name: 'AIC Youth Justice Trends 2024',
    url: 'https://www.aic.gov.au/sites/default/files/2024-03/statistical_report_44.pdf',
    type: 'research',
    extractFunding: false,
    extractPrograms: true
  }
];

/**
 * Download PDF from URL
 */
async function downloadPdf(source) {
  const filename = source.name.replace(/[^a-z0-9]/gi, '_') + '.pdf';
  const filepath = join(pdfDir, filename);

  // Check if already downloaded
  if (existsSync(filepath)) {
    console.log(`   📁 Using cached: ${filename}`);
    return filepath;
  }

  console.log(`   📥 Downloading: ${source.url}`);

  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));

    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(1);
    console.log(`   ✅ Downloaded: ${sizeMB} MB`);

    return filepath;
  } catch (error) {
    console.log(`   ❌ Download error: ${error.message}`);
    return null;
  }
}

/**
 * Parse PDF and extract text
 */
async function parsePdf(filepath) {
  console.log(`   📄 Parsing PDF...`);

  try {
    const buffer = readFileSync(filepath);
    const uint8Array = new Uint8Array(buffer);

    // Load PDF document
    const loadingTask = getDocument({
      data: uint8Array,
      useSystemFonts: true
    });
    const doc = await loadingTask.promise;

    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log(`   ✅ Extracted ${fullText.length} chars from ${doc.numPages} pages`);

    return {
      text: fullText,
      pages: doc.numPages,
      info: doc.documentInfo
    };
  } catch (error) {
    console.log(`   ❌ Parse error: ${error.message}`);
    return null;
  }
}

/**
 * Extract funding data using Claude
 */
async function extractFundingData(text, source) {
  console.log(`   💰 Extracting funding data...`);

  // Take first 50K chars for funding extraction (usually in early sections)
  const excerpt = text.substring(0, 50000);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Extract all funding and expenditure data from this Australian youth justice document.

Return ONLY valid JSON (no markdown, no code blocks):
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
  "costPerYoungPerson": number or null,
  "stateData": [
    {
      "state": "VIC|QLD|NSW|NT|SA|WA|TAS|ACT",
      "expenditure": number or null,
      "detentionCostPerDay": number or null,
      "communityCostPerDay": number or null
    }
  ],
  "keyFindings": ["string"]
}

All amounts should be in dollars (not millions/billions notation).
If data is not found, use null.

Document excerpt:
${excerpt}`
      }]
    });

    let jsonText = response.content[0].text;
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const funding = JSON.parse(jsonText);
    console.log(`   ✅ Funding data extracted`);

    return funding;
  } catch (error) {
    console.log(`   ❌ Funding extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Extract programs/interventions using Claude
 */
async function extractPrograms(text, source) {
  console.log(`   📋 Extracting programs...`);

  // Programs might be throughout document, sample multiple sections
  const sections = [
    text.substring(0, 30000),
    text.substring(Math.floor(text.length / 3), Math.floor(text.length / 3) + 30000),
    text.substring(Math.floor(text.length * 2 / 3), Math.floor(text.length * 2 / 3) + 30000)
  ];

  const allPrograms = [];

  for (const section of sections) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Extract youth justice programs, interventions, and services mentioned in this Australian government document.

Return ONLY valid JSON (no markdown):
{
  "interventions": [
    {
      "name": "Program name",
      "type": "Prevention|Diversion|Cultural Connection|Education/Employment|Family Strengthening|Therapeutic|Community-Led|Justice Reinvestment|Wraparound Support|Early Intervention",
      "description": "Brief description",
      "jurisdiction": "VIC|QLD|NSW|NT|SA|WA|TAS|ACT|National",
      "effectiveness": "Description of outcomes if mentioned"
    }
  ],
  "evidence": [
    {
      "finding": "Key research finding",
      "source": "Source if mentioned"
    }
  ]
}

Document excerpt:
${section}`
        }]
      });

      let jsonText = response.content[0].text;
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

      const data = JSON.parse(jsonText);
      if (data.interventions) {
        allPrograms.push(...data.interventions);
      }
    } catch (e) {
      // Continue with other sections
    }
  }

  // Deduplicate by name
  const unique = [];
  const seen = new Set();
  for (const prog of allPrograms) {
    const key = prog.name?.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(prog);
    }
  }

  console.log(`   ✅ Found ${unique.length} unique programs`);
  return unique;
}

/**
 * Store funding data in database
 */
async function storeFundingData(funding, source) {
  if (!funding) return;

  try {
    // Store national data
    if (funding.nationalExpenditure?.total) {
      await supabase.from('alma_funding_data').upsert({
        source_url: source.url,
        source_name: source.name,
        source_type: source.type,
        report_year: funding.nationalExpenditure.year || '2023-24',
        jurisdiction: 'National',
        total_expenditure: funding.nationalExpenditure.total,
        detention_expenditure: funding.nationalExpenditure.detentionTotal,
        community_expenditure: funding.nationalExpenditure.communityTotal,
        cost_per_day_detention: funding.costPerDay?.detention,
        cost_per_day_community: funding.costPerDay?.community,
        cost_per_participant: funding.costPerYoungPerson,
        raw_data: funding
      }, { onConflict: 'source_url,jurisdiction' });

      console.log(`   💾 Stored national funding data`);
    }

    // Store state data
    for (const state of (funding.stateData || [])) {
      if (state.expenditure || state.detentionCostPerDay) {
        await supabase.from('alma_funding_data').upsert({
          source_url: source.url,
          source_name: source.name,
          source_type: source.type,
          report_year: funding.nationalExpenditure?.year || '2023-24',
          jurisdiction: state.state,
          total_expenditure: state.expenditure,
          cost_per_day_detention: state.detentionCostPerDay,
          cost_per_day_community: state.communityCostPerDay,
          raw_data: state
        }, { onConflict: 'source_url,jurisdiction' });
      }
    }

    console.log(`   💾 Stored ${funding.stateData?.length || 0} state records`);
  } catch (error) {
    console.log(`   ❌ Storage error: ${error.message}`);
  }
}

/**
 * Store programs in database
 */
async function storePrograms(programs, source) {
  let inserted = 0;

  for (const prog of programs) {
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('alma_interventions')
        .select('id')
        .ilike('name', prog.name)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert
      const { error } = await supabase.from('alma_interventions').insert({
        name: prog.name,
        description: prog.description,
        type: prog.type,
        geography: [prog.jurisdiction || 'National'],
        target_cohort: ['Young people aged 10-17'],
        consent_level: 'Public Knowledge Commons',
        review_status: 'Approved',
        permitted_uses: ['Query (internal)'],
        source_url: source.url,
        source_date: new Date().toISOString()
      });

      if (!error) inserted++;
    } catch (e) {
      // Skip errors
    }
  }

  if (inserted > 0) {
    console.log(`   ✅ Inserted ${inserted} new programs`);
  }

  return inserted;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          ALMA PDF Extractor - Local Processing            ║');
  console.log('║        Downloading and parsing government PDFs            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();
  let totalParsed = 0;
  let totalFunding = 0;
  let totalPrograms = 0;

  for (const source of PDF_SOURCES) {
    console.log(`\n\n📄 Processing: ${source.name}`);

    // Download PDF
    const filepath = await downloadPdf(source);
    if (!filepath) continue;

    // Parse PDF
    const parsed = await parsePdf(filepath);
    if (!parsed) continue;

    totalParsed++;

    // Extract funding data
    if (source.extractFunding) {
      const funding = await extractFundingData(parsed.text, source);
      if (funding) {
        await storeFundingData(funding, source);
        totalFunding++;
      }
    }

    // Extract programs
    if (source.extractPrograms) {
      const programs = await extractPrograms(parsed.text, source);
      const inserted = await storePrograms(programs, source);
      totalPrograms += inserted;
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 PDF EXTRACTION SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Duration: ${duration} minutes`);
  console.log(`PDFs processed: ${totalParsed}/${PDF_SOURCES.length}`);
  console.log(`Funding sources extracted: ${totalFunding}`);
  console.log(`New programs inserted: ${totalPrograms}`);

  // Get current totals
  const { count: interventionCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  const { count: fundingCount } = await supabase
    .from('alma_funding_data')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total ALMA interventions: ${interventionCount}`);
  console.log(`💰 Total funding records: ${fundingCount}`);

  // Show cost analysis
  console.log('\n📈 Cost Analysis:');
  const { data: analysis } = await supabase
    .from('alma_cost_analysis')
    .select('*')
    .order('jurisdiction');

  if (analysis) {
    for (const row of analysis) {
      console.log(`   ${row.jurisdiction}: $${(row.total_expenditure / 1000000000).toFixed(2)}B total, ${row.detention_percent}% detention`);
    }
  }

  console.log('\n✅ PDF extraction complete!');
}

main().catch(console.error);
