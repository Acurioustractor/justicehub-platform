/**
 * Enrich International Program from URL
 *
 * Simpler version that takes a direct URL and enriches the program data
 *
 * Usage:
 *   npx tsx src/scripts/enrich-program-from-url.ts <program-name> <country> <website-url>
 *   npx tsx src/scripts/enrich-program-from-url.ts "Halt Program" "Netherlands" "https://www.halt.nl/"
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

async function scrapeWebsite(url: string): Promise<string> {
  console.log(`📄 Scraping: ${url}`);

  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown']
  });

  if (!result.markdown) {
    throw new Error('No content extracted');
  }

  console.log(`✅ Scraped ${result.markdown.length} characters`);
  return result.markdown;
}

async function analyzeWithClaude(
  programName: string,
  country: string,
  websiteUrl: string,
  content: string
): Promise<ProgramData> {
  console.log(`🤖 Analyzing with Claude...`);

  const prompt = `Analyze this youth justice program website and extract structured data.

Program: ${programName}
Country: ${country}
Website: ${websiteUrl}

Content:
${content.slice(0, 40000)}

Extract the following in JSON format:
{
  "name": "Official program name",
  "country": "${country}",
  "description": "Comprehensive 3-4 paragraph description of the program, its history, and approach",
  "approach_summary": "1-2 sentence summary",
  "website_url": "${websiteUrl}",
  "recidivism_rate": null or number (percentage only, no % sign),
  "recidivism_comparison": "How it compares to baseline/alternatives",
  "evidence_strength": "rigorous_rct" | "quasi_experimental" | "longitudinal_study" | "evaluation_report" | "promising_practice" | "emerging",
  "key_outcomes": [
    {
      "metric": "Outcome measure name",
      "value": "Value with units",
      "detail": "Additional context",
      "comparison": "Comparison to baseline"
    }
  ],
  "australian_adaptations": ["How this could work in Australia"],
  "year_established": year as number or null,
  "scale": "Scale description (e.g., 'National program', '50 locations')"
}

Only include information you can verify from the content. Use null for missing data.
Return ONLY valid JSON, no markdown formatting.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Clean JSON from response
  let jsonText = responseText.trim();
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonText);
}

async function saveToDatabase(data: ProgramData): Promise<string> {
  console.log(`💾 Saving to database...`);

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const regionMap: Record<string, string> = {
    'netherlands': 'europe', 'germany': 'europe', 'spain': 'europe',
    'scotland': 'europe', 'finland': 'europe', 'belgium': 'europe',
    'italy': 'europe', 'united states': 'north_america', 'usa': 'north_america',
    'canada': 'north_america', 'brazil': 'latin_america',
    'south africa': 'africa', 'new zealand': 'asia_pacific',
    'australia': 'australasia', 'hong kong': 'asia_pacific',
  };

  const region = regionMap[data.country.toLowerCase()] || 'europe';

  const programData = {
    ...data,
    slug,
    region,
    program_type: ['diversion'],
    status: 'published',
    updated_at: new Date().toISOString()
  };

  // Check if exists
  const { data: existing } = await supabase
    .from('international_programs')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    await supabase
      .from('international_programs')
      .update(programData)
      .eq('id', existing.id);
    console.log(`✅ Updated: ${existing.id}`);
    return existing.id;
  } else {
    const { data: inserted } = await supabase
      .from('international_programs')
      .insert([{ ...programData, created_at: new Date().toISOString() }])
      .select('id')
      .single();
    console.log(`✅ Created: ${inserted!.id}`);
    return inserted!.id;
  }
}

async function main() {
  const [programName, country, websiteUrl] = process.argv.slice(2);

  if (!programName || !country || !websiteUrl) {
    console.log(`
Usage:
  npx tsx src/scripts/enrich-program-from-url.ts <name> <country> <url>

Example:
  npx tsx src/scripts/enrich-program-from-url.ts "Halt Program" "Netherlands" "https://www.halt.nl/"
`);
    process.exit(1);
  }

  console.log(`\n🚀 Enriching: ${programName} (${country})`);
  console.log('='.repeat(60));

  try {
    const content = await scrapeWebsite(websiteUrl);
    const data = await analyzeWithClaude(programName, country, websiteUrl, content);
    await saveToDatabase(data);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Complete!');
    console.log(`🌐 View: http://localhost:3003/centre-of-excellence/global-insights`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
