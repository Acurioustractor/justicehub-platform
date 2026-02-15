/**
 * Fully Automated Program Research
 *
 * Uses Claude AI to research, find website, scrape, and add programs automatically
 *
 * Usage:
 *   npx tsx src/scripts/auto-research-program.ts "Program Name" "Country"
 *   npx tsx src/scripts/auto-research-program.ts "Jugendstrafvollzug" "Germany"
 *
 * Or batch process from a list:
 *   npx tsx src/scripts/auto-research-program.ts --batch programs.txt
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { firecrawl } from '@/lib/scraping/firecrawl';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface ResearchResult {
  programName: string;
  country: string;
  officialWebsite: string;
  alternativeWebsites: string[];
  keyFacts: string[];
  evidenceLevel: string;
  recidivismRate?: number;
}

interface ProgramData {
  name: string;
  country: string;
  description: string;
  approach_summary: string;
  website_url: string;
  recidivism_rate?: number | null;
  recidivism_comparison?: string | null;
  evidence_strength: string;
  key_outcomes: Array<{
    metric: string;
    value: string;
    detail?: string;
    comparison?: string;
  }>;
  australian_adaptations?: string[];
  year_established?: number | null;
  scale?: string | null;
}

/**
 * Step 1: Use Claude to research the program and find official website
 */
async function researchProgram(programName: string, country: string): Promise<ResearchResult> {
  console.log(`\n🔬 Step 1: Researching "${programName}" in ${country}...`);

  const prompt = `You are a youth justice researcher. Research the following program:

Program: ${programName}
Country: ${country}

Please provide:
1. The official website URL (government or official program site)
2. Alternative credible sources (2-3 URLs)
3. Key facts about the program (5-7 bullet points)
4. Evidence quality level
5. Recidivism rate if known

Format your response as JSON:
{
  "programName": "Official program name",
  "country": "${country}",
  "officialWebsite": "https://official-site.com",
  "alternativeWebsites": ["https://alt1.com", "https://alt2.com"],
  "keyFacts": [
    "Founded in XXXX",
    "Serves X youth per year",
    "Key approach: ...",
    "Evidence: ...",
    "Outcomes: ..."
  ],
  "evidenceLevel": "rigorous_rct|longitudinal_study|evaluation_report|promising_practice|emerging",
  "recidivismRate": null or number
}

Be thorough in finding the official website. Look for:
- Government ministry sites
- Official program sites
- Academic institution sites
- NGO sites if they run the program

Return ONLY the JSON object.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Clean JSON
  let jsonText = responseText.trim();
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const result = JSON.parse(jsonText) as ResearchResult;

  console.log(`✅ Found official website: ${result.officialWebsite}`);
  console.log(`📚 Key facts: ${result.keyFacts.length} points`);

  return result;
}

/**
 * Step 2: Use GPT-4 with web search to verify and find additional info
 */
async function verifyWithWebSearch(programName: string, country: string): Promise<string[]> {
  console.log(`\n🌐 Step 2: Verifying with web search...`);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `Find the official website for the "${programName}" youth justice program in ${country}.

Also find:
- Any government pages about this program
- Academic research papers
- News articles or reports

Provide 3-5 credible URLs, starting with the most official source.`
      }
    ],
    max_tokens: 500
  });

  const response = completion.choices[0].message.content || '';

  // Extract URLs from response
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = response.match(urlRegex) || [];

  console.log(`✅ Found ${urls.length} additional sources`);
  urls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));

  return urls;
}

/**
 * Step 3: Scrape the website
 */
async function scrapeWebsite(url: string): Promise<string> {
  console.log(`\n📄 Step 3: Scraping ${url}...`);

  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown']
    });

    if (!result.markdown) {
      throw new Error('No content extracted');
    }

    console.log(`✅ Scraped ${result.markdown.length} characters`);
    return result.markdown;
  } catch (error) {
    console.error(`⚠️  Scraping failed: ${error}`);
    return '';
  }
}

/**
 * Step 4: Analyze with Claude and extract structured data
 */
async function analyzeContent(
  programName: string,
  country: string,
  websiteUrl: string,
  content: string,
  researchContext: ResearchResult
): Promise<ProgramData> {
  console.log(`\n🤖 Step 4: Analyzing content with Claude...`);

  const prompt = `Analyze this youth justice program and extract comprehensive data.

Program: ${programName}
Country: ${country}
Website: ${websiteUrl}

Research Context:
${researchContext.keyFacts.join('\n')}

Website Content:
${content.slice(0, 40000)}

Extract detailed program information in JSON format:
{
  "name": "Official program name",
  "country": "${country}",
  "description": "Comprehensive 4-5 paragraph description covering history, philosophy, approach, implementation, and impact",
  "approach_summary": "2-3 sentence summary of core approach",
  "website_url": "${websiteUrl}",
  "recidivism_rate": null or number (percentage, no % sign),
  "recidivism_comparison": "Comparison to baseline/alternatives",
  "evidence_strength": "rigorous_rct|quasi_experimental|longitudinal_study|evaluation_report|promising_practice|emerging",
  "key_outcomes": [
    {
      "metric": "Outcome name",
      "value": "Value with units",
      "detail": "Context",
      "comparison": "Baseline comparison"
    }
  ],
  "australian_adaptations": [
    "How this approach could work in Australian context",
    "What would need to change",
    "Which states/territories might benefit most"
  ],
  "year_established": year or null,
  "scale": "Description of scale (national, regional, number of sites, youth served annually)"
}

Be comprehensive. Include:
- Historical context
- Philosophical approach
- Key components
- Implementation details
- Evidence of effectiveness
- Challenges and limitations
- Applicability to Australia

Return ONLY valid JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  let jsonText = responseText.trim();
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const data = JSON.parse(jsonText);
  console.log(`✅ Extracted comprehensive program data`);

  return data;
}

/**
 * Step 5: Save to database
 */
async function saveToDatabase(data: ProgramData): Promise<string> {
  console.log(`\n💾 Step 5: Saving to database...`);

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const regionMap: Record<string, string> = {
    'netherlands': 'europe', 'germany': 'europe', 'spain': 'europe',
    'scotland': 'europe', 'finland': 'europe', 'belgium': 'europe',
    'italy': 'europe', 'norway': 'europe', 'sweden': 'europe', 'denmark': 'europe',
    'france': 'europe', 'austria': 'europe', 'switzerland': 'europe',
    'united states': 'north_america', 'usa': 'north_america',
    'canada': 'north_america', 'brazil': 'latin_america',
    'chile': 'latin_america', 'colombia': 'latin_america', 'argentina': 'latin_america',
    'south africa': 'africa', 'kenya': 'africa', 'uganda': 'africa',
    'new zealand': 'asia_pacific', 'australia': 'australasia',
    'hong kong': 'asia_pacific', 'japan': 'asia_pacific',
    'singapore': 'asia_pacific', 'south korea': 'asia_pacific',
  };

  const region = regionMap[data.country.toLowerCase()] || 'europe';

  const programData = {
    ...data,
    slug,
    region,
    program_type: ['evidence_based'], // Will be refined later
    status: 'published',
    updated_at: new Date().toISOString()
  };

  // Check if exists
  const { data: existing } = await supabase
    .from('international_programs')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (existing) {
    await supabase
      .from('international_programs')
      .update(programData)
      .eq('id', existing.id);
    console.log(`✅ Updated existing: ${existing.name}`);
    return existing.id;
  } else {
    const { data: inserted } = await supabase
      .from('international_programs')
      .insert([{ ...programData, created_at: new Date().toISOString() }])
      .select('id')
      .single();
    console.log(`✅ Created new program: ${data.name}`);
    return inserted!.id;
  }
}

/**
 * Main automated workflow
 */
async function autoResearchAndAdd(programName: string, country: string): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 AUTOMATED RESEARCH: ${programName} (${country})`);
  console.log('='.repeat(70));

  try {
    // Step 1: Research with Claude
    const research = await researchProgram(programName, country);

    // Step 2: Verify with GPT-4 web search (optional, for additional sources)
    const additionalUrls = await verifyWithWebSearch(programName, country);

    // Step 3: Scrape official website
    let content = await scrapeWebsite(research.officialWebsite);

    // If official site fails, try alternatives
    if (!content && research.alternativeWebsites.length > 0) {
      console.log(`⚠️  Official site failed, trying alternatives...`);
      for (const altUrl of research.alternativeWebsites) {
        content = await scrapeWebsite(altUrl);
        if (content) {
          research.officialWebsite = altUrl;
          break;
        }
      }
    }

    if (!content) {
      throw new Error('Could not scrape any website for this program');
    }

    // Step 4: Analyze and extract data
    const programData = await analyzeContent(
      programName,
      country,
      research.officialWebsite,
      content,
      research
    );

    // Step 5: Save to database
    const programId = await saveToDatabase(programData);

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Program added to database');
    console.log('='.repeat(70));
    console.log(`📋 Program ID: ${programId}`);
    console.log(`📝 Name: ${programData.name}`);
    console.log(`🌍 Country: ${programData.country}`);
    console.log(`🔗 Website: ${programData.website_url}`);
    console.log(`📊 Evidence: ${programData.evidence_strength}`);
    console.log(`🌐 View: http://localhost:3003/centre-of-excellence/global-insights`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error during automated research:', error);
    throw error;
  }
}

/**
 * Batch process from file
 */
async function batchProcess(filePath: string): Promise<void> {
  const fs = require('fs');
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

  console.log(`\n📋 Batch processing ${lines.length} programs...\n`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const [programName, country] = line.split('|').map(s => s.trim());
    if (!programName || !country) {
      console.log(`⚠️  Skipping invalid line: ${line}`);
      continue;
    }

    console.log(`\n[${i + 1}/${lines.length}] Processing: ${programName} (${country})`);

    try {
      await autoResearchAndAdd(programName, country);

      // Rate limiting - wait between requests
      if (i < lines.length - 1) {
        console.log('\n⏳ Waiting 30 seconds before next program...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      console.error(`❌ Failed to add ${programName}:`, error);
      console.log('⏭️  Continuing with next program...\n');
    }
  }

  console.log('\n✅ Batch processing complete!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔬 Automated Program Research

Usage:
  Single program:
    npx tsx src/scripts/auto-research-program.ts "Program Name" "Country"

  Batch from file:
    npx tsx src/scripts/auto-research-program.ts --batch programs.txt

File format (one per line):
    Program Name | Country
    Jugendstrafvollzug | Germany
    Juvenile Training Schools | Japan
    # Comments start with #

Examples:
  npx tsx src/scripts/auto-research-program.ts "Jugendstrafvollzug" "Germany"
  npx tsx src/scripts/auto-research-program.ts "Youth Welfare System" "Norway"
  npx tsx src/scripts/auto-research-program.ts --batch my-programs.txt
`);
    process.exit(0);
  }

  try {
    if (args[0] === '--batch' && args[1]) {
      await batchProcess(args[1]);
    } else if (args.length >= 2) {
      const [programName, country] = args;
      await autoResearchAndAdd(programName, country);
    } else {
      console.log('❌ Invalid arguments. Use --help for usage.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
