/**
 * Research and Enrich International Programs
 *
 * Uses Firecrawl + Claude API to research programs and add rich data
 *
 * Usage:
 *   npx tsx src/scripts/research-and-enrich-program.ts "Program Name" "Country"
 *   npx tsx src/scripts/research-and-enrich-program.ts "Halt Program" "Netherlands"
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { firecrawl } from '@/lib/scraping/firecrawl';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

interface ProgramResearchData {
  name: string;
  country: string;
  description: string;
  approach_summary: string;
  website_url?: string;
  recidivism_rate?: number;
  recidivism_comparison?: string;
  evidence_strength: string;
  key_outcomes: Array<{
    metric: string;
    value: string;
    detail?: string;
    comparison?: string;
    timeframe?: string;
  }>;
  key_principles?: string[];
  strengths?: string[];
  challenges?: string[];
  australian_adaptations?: string[];
  year_established?: number;
  scale?: string;
  annual_participants?: number;
  funding_model?: string;
  images?: Array<{
    url: string;
    caption: string;
    credit?: string;
  }>;
  videos?: Array<{
    url: string;
    title: string;
    platform: 'youtube' | 'vimeo' | 'other';
  }>;
  resources?: Array<{
    title: string;
    type: 'research' | 'video' | 'report' | 'policy';
    url: string;
    description: string;
    year?: number;
  }>;
}

async function searchForProgram(programName: string, country: string): Promise<string | null> {
  console.log(`\n🔍 Searching for: ${programName} (${country})`);

  try {
    // Use Firecrawl's search to find the official website
    const searchQuery = `${programName} ${country} youth justice program official website`;
    const results = await firecrawl.search(searchQuery, { limit: 5 });

    if (!results || results.length === 0) {
      console.log('❌ No search results found');
      return null;
    }

    console.log(`✅ Found ${results.length} potential websites:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title}`);
      console.log(`      ${r.url}`);
    });

    // Return the first result (most likely official site)
    return results[0].url;
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

async function scrapeWebsite(url: string): Promise<string> {
  console.log(`\n📄 Scraping website: ${url}`);

  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html']
    });

    if (!result.markdown) {
      throw new Error('No content extracted');
    }

    console.log(`✅ Scraped ${result.markdown.length} characters`);
    return result.markdown;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

async function analyzeWithClaude(
  programName: string,
  country: string,
  websiteContent: string
): Promise<ProgramResearchData> {
  console.log(`\n🤖 Analyzing with Claude AI...`);

  const prompt = `You are a youth justice researcher. Analyze this website content about the "${programName}" program in ${country}.

Website Content:
${websiteContent.slice(0, 50000)} // Limit to avoid token limits

Extract and structure the following information in JSON format:

{
  "name": "Official program name",
  "country": "${country}",
  "description": "Comprehensive 2-3 paragraph description",
  "approach_summary": "1-2 sentence summary of the approach",
  "website_url": "Official website URL if found",
  "recidivism_rate": null or number (percentage),
  "recidivism_comparison": "Comparison to baseline if available",
  "evidence_strength": "rigorous_rct" | "quasi_experimental" | "longitudinal_study" | "evaluation_report" | "promising_practice" | "emerging",
  "key_outcomes": [
    {
      "metric": "Name of metric",
      "value": "Value (with units)",
      "detail": "Additional context",
      "comparison": "Comparison to baseline",
      "timeframe": "Time period"
    }
  ],
  "key_principles": ["Principle 1", "Principle 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "challenges": ["Challenge 1", "Challenge 2", ...],
  "australian_adaptations": ["How it could be adapted to Australia"],
  "year_established": year or null,
  "scale": "Description of scale (e.g., 'National program', '20 sites')",
  "annual_participants": number or null,
  "funding_model": "Description of funding",
  "images": [{"url": "image URL", "caption": "description", "credit": "photographer/source"}],
  "videos": [{"url": "video URL", "title": "title", "platform": "youtube|vimeo|other"}],
  "resources": [
    {
      "title": "Resource title",
      "type": "research" | "video" | "report" | "policy",
      "url": "URL",
      "description": "Brief description",
      "year": year or null
    }
  ]
}

Be thorough but conservative - only include data you can verify from the content. If information is not available, use null or empty arrays.

IMPORTANT: Return ONLY the JSON object, no other text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response (sometimes Claude adds markdown formatting)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const data = JSON.parse(jsonText);
    console.log('✅ Claude analysis complete');

    return data as ProgramResearchData;
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

async function saveToDatabase(data: ProgramResearchData): Promise<string> {
  console.log(`\n💾 Saving to database...`);

  // Create slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Determine region from country
  const regionMap: Record<string, string> = {
    'netherlands': 'europe',
    'germany': 'europe',
    'spain': 'europe',
    'scotland': 'europe',
    'finland': 'europe',
    'norway': 'europe',
    'sweden': 'europe',
    'denmark': 'europe',
    'belgium': 'europe',
    'italy': 'europe',
    'united states': 'north_america',
    'usa': 'north_america',
    'canada': 'north_america',
    'brazil': 'latin_america',
    'chile': 'latin_america',
    'colombia': 'latin_america',
    'argentina': 'latin_america',
    'south africa': 'africa',
    'new zealand': 'asia_pacific',
    'australia': 'australasia',
    'hong kong': 'asia_pacific',
    'japan': 'asia_pacific',
    'singapore': 'asia_pacific',
    'south korea': 'asia_pacific',
  };

  const region = regionMap[data.country.toLowerCase()] || 'europe';

  const programData = {
    name: data.name,
    slug,
    country: data.country,
    region,
    program_type: ['diversion'], // Default, can be updated
    description: data.description,
    approach_summary: data.approach_summary,
    website_url: data.website_url,
    recidivism_rate: data.recidivism_rate,
    recidivism_comparison: data.recidivism_comparison,
    evidence_strength: data.evidence_strength,
    key_outcomes: data.key_outcomes,
    year_established: data.year_established,
    scale: data.scale,
    australian_adaptations: data.australian_adaptations,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if program already exists
  const { data: existing } = await supabase
    .from('international_programs')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.log(`⚠️  Program already exists: ${slug}`);
    console.log(`   Updating instead...`);

    const { error } = await supabase
      .from('international_programs')
      .update(programData)
      .eq('id', existing.id);

    if (error) throw error;
    console.log(`✅ Updated program: ${existing.id}`);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from('international_programs')
      .insert([programData])
      .select('id')
      .single();

    if (error) throw error;
    console.log(`✅ Created new program: ${inserted.id}`);
    return inserted.id;
  }
}

async function enrichExistingProgram(programId: string): Promise<void> {
  console.log(`\n🔄 Enriching existing program: ${programId}`);

  // Get program from database
  const { data: program, error } = await supabase
    .from('international_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error || !program) {
    throw new Error(`Program not found: ${programId}`);
  }

  console.log(`📋 Found: ${program.name} (${program.country})`);

  // Search for website if not already present
  let websiteUrl = program.website_url;
  if (!websiteUrl) {
    websiteUrl = await searchForProgram(program.name, program.country);
    if (!websiteUrl) {
      throw new Error('Could not find program website');
    }
  }

  // Scrape and analyze
  const content = await scrapeWebsite(websiteUrl);
  const enrichedData = await analyzeWithClaude(program.name, program.country, content);

  // Save enriched data
  await saveToDatabase(enrichedData);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  Research new program:
    npx tsx src/scripts/research-and-enrich-program.ts "Program Name" "Country"

  Enrich existing by ID:
    npx tsx src/scripts/research-and-enrich-program.ts --enrich <program-id>

Examples:
  npx tsx src/scripts/research-and-enrich-program.ts "Halt Program" "Netherlands"
  npx tsx src/scripts/research-and-enrich-program.ts --enrich abc-123-def
`);
    process.exit(1);
  }

  try {
    if (args[0] === '--enrich' && args[1]) {
      // Enrich existing program
      await enrichExistingProgram(args[1]);
    } else if (args.length >= 2) {
      // Research new program
      const programName = args[0];
      const country = args[1];

      console.log(`\n🚀 Starting research for: ${programName} (${country})`);
      console.log('='.repeat(60));

      // Step 1: Search for official website
      const websiteUrl = await searchForProgram(programName, country);
      if (!websiteUrl) {
        console.log('\n❌ Could not find program website');
        console.log('💡 Try providing the website URL directly or search manually');
        process.exit(1);
      }

      // Step 2: Scrape website content
      const content = await scrapeWebsite(websiteUrl);

      // Step 3: Analyze with Claude
      const programData = await analyzeWithClaude(programName, country, content);

      // Step 4: Save to database
      const programId = await saveToDatabase(programData);

      console.log('\n' + '='.repeat(60));
      console.log('✅ Research complete!');
      console.log(`📊 Program ID: ${programId}`);
      console.log(`🌐 View at: http://localhost:3003/centre-of-excellence/global-insights`);

    } else {
      console.log('❌ Invalid arguments. Use --help for usage information.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
