#!/usr/bin/env node
/**
 * Fully Automated International Program Discovery and Import System
 *
 * This script uses Claude AI to:
 * 1. Research international youth justice organizations and find their websites
 * 2. Scrape website content intelligently
 * 3. Extract program information automatically
 * 4. Validate and import to database
 *
 * Focuses on INTERNATIONAL programs (non-Australian) to complement existing Australian programs.
 *
 * Usage:
 *   npx tsx src/scripts/auto-discover-and-add-program.ts "Organization Name"
 *   npx tsx src/scripts/auto-discover-and-add-program.ts --batch "org1,org2,org3"
 *   npx tsx src/scripts/auto-discover-and-add-program.ts --country "United States"
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

interface ResearchResult {
  organizationName: string;
  website: string;
  description: string;
  focusAreas: string[];
  location: string;
  confidence: number;
}

interface ProgramData {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  targetAudience: string[];
  location: string;
  websiteUrl: string;
  organizationName: string;
  organizationSlug: string;
  features: string[];
  outcomes: string[];
  eligibility?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

/**
 * Step 1: Use Claude to research the organization and find its website
 */
async function researchOrganization(organizationName: string): Promise<ResearchResult | null> {
  console.log(`\n🔍 Researching: ${organizationName}...`);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Research the INTERNATIONAL youth justice or social justice organization: "${organizationName}"

IMPORTANT: Focus on NON-AUSTRALIAN organizations. We're looking for global/international programs.

Please find:
1. Official website URL
2. Brief description of the organization
3. Their main focus areas (youth justice, rehabilitation, education, etc.)
4. Primary location/service area (Country and City/Region)
5. Your confidence level (0-100) that this is the correct organization

If the organization appears to be Australian, return confidence: 0 (we already have Australian programs).

Return ONLY a JSON object with this structure:
{
  "organizationName": "Official name",
  "website": "https://...",
  "description": "Brief description",
  "focusAreas": ["focus1", "focus2"],
  "location": "City, Country",
  "confidence": 85
}

If you cannot find reliable information or it's an Australian organization, return:
{
  "confidence": 0
}`
      }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', textContent.text);
      return null;
    }

    const result: ResearchResult = JSON.parse(jsonMatch[0]);

    if (result.confidence < 70) {
      console.log(`⚠️  Low confidence (${result.confidence}%) - skipping`);
      return null;
    }

    console.log(`✅ Found: ${result.organizationName}`);
    console.log(`   Website: ${result.website}`);
    console.log(`   Confidence: ${result.confidence}%`);

    return result;
  } catch (error) {
    console.error('Research error:', error);
    return null;
  }
}

/**
 * Step 2: Scrape the organization's website
 */
async function scrapeWebsite(url: string): Promise<string | null> {
  console.log(`\n🕷️  Scraping website: ${url}...`);

  try {
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000,
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.error('Scraping failed or no content returned');
      return null;
    }

    console.log(`✅ Scraped ${scrapeResult.markdown.length} characters`);
    return scrapeResult.markdown;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

/**
 * Step 3: Use Claude to extract program information from scraped content
 */
async function extractProgramData(
  content: string,
  researchData: ResearchResult
): Promise<ProgramData[]> {
  console.log(`\n🤖 Extracting program data with Claude...`);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this website content from ${researchData.organizationName} and extract ALL youth justice or social justice programs they offer.

Website Content:
${content.slice(0, 50000)}

For each program, extract:
- Program name
- Description (detailed, 2-3 paragraphs)
- Short description (1-2 sentences)
- Category (rehabilitation, education, mentoring, art-therapy, employment, housing, etc.)
- Target audience (youth-at-risk, young-offenders, indigenous-youth, etc.)
- Location
- Features/activities offered
- Expected outcomes
- Eligibility criteria (if mentioned)
- Contact information (if available)

Return ONLY a JSON array of programs:
[
  {
    "name": "Program Name",
    "description": "Detailed description...",
    "shortDescription": "Brief summary...",
    "category": "rehabilitation",
    "targetAudience": ["youth-at-risk", "young-offenders"],
    "location": "City, State",
    "features": ["feature1", "feature2"],
    "outcomes": ["outcome1", "outcome2"],
    "eligibility": "Eligibility info if available",
    "contactInfo": {
      "email": "contact@example.com",
      "phone": "123-456-7890"
    }
  }
]

If no programs are found, return an empty array: []`
      }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Extract JSON array from the response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not extract JSON array from response');
      return [];
    }

    const programs: any[] = JSON.parse(jsonMatch[0]);

    // Enrich with research data
    const enrichedPrograms: ProgramData[] = programs.map(p => ({
      ...p,
      websiteUrl: researchData.website,
      organizationName: researchData.organizationName,
      organizationSlug: researchData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    }));

    console.log(`✅ Extracted ${enrichedPrograms.length} programs`);
    return enrichedPrograms;
  } catch (error) {
    console.error('Extraction error:', error);
    return [];
  }
}

/**
 * Step 4: Validate program data
 */
function validateProgram(program: ProgramData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!program.name || program.name.length < 3) {
    errors.push('Program name too short or missing');
  }

  if (!program.description || program.description.length < 50) {
    errors.push('Description too short or missing');
  }

  if (!program.shortDescription || program.shortDescription.length < 20) {
    errors.push('Short description too short or missing');
  }

  if (!program.category) {
    errors.push('Category missing');
  }

  if (!program.targetAudience || program.targetAudience.length === 0) {
    errors.push('Target audience missing');
  }

  if (!program.location) {
    errors.push('Location missing');
  }

  if (!program.websiteUrl) {
    errors.push('Website URL missing');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract country from location string
 */
function extractCountry(location: string): string {
  // Common country names
  const countries = [
    'United States', 'USA', 'US',
    'United Kingdom', 'UK', 'Britain',
    'Canada',
    'New Zealand', 'NZ',
    'South Africa',
    'India',
    'Brazil',
    'Kenya',
    'Uganda',
    'Rwanda',
    'Ghana',
    'Nigeria',
    'Philippines',
    'Thailand',
    'Indonesia',
    'Mexico',
    'Colombia',
    'Argentina',
    'Chile',
  ];

  for (const country of countries) {
    if (location.includes(country)) {
      // Normalize common variations
      if (country === 'USA' || country === 'US') return 'United States';
      if (country === 'UK' || country === 'Britain') return 'United Kingdom';
      if (country === 'NZ') return 'New Zealand';
      return country;
    }
  }

  // Return the location as-is if we can't parse it
  return location;
}

/**
 * Map country to region enum
 * Valid values: north_america, latin_america, europe, africa, asia_pacific, australasia
 */
function getRegionFromCountry(country: string): string {
  const regionMap: { [key: string]: string } = {
    'United States': 'north_america',
    'Canada': 'north_america',
    'Mexico': 'north_america',

    'Brazil': 'latin_america',
    'Colombia': 'latin_america',
    'Argentina': 'latin_america',
    'Chile': 'latin_america',

    'United Kingdom': 'europe',
    'Germany': 'europe',
    'France': 'europe',
    'Spain': 'europe',
    'Italy': 'europe',

    'Kenya': 'africa',
    'Uganda': 'africa',
    'Rwanda': 'africa',
    'Ghana': 'africa',
    'Nigeria': 'africa',
    'South Africa': 'africa',

    'India': 'asia_pacific',
    'Philippines': 'asia_pacific',
    'Thailand': 'asia_pacific',
    'Indonesia': 'asia_pacific',
    'China': 'asia_pacific',
    'Japan': 'asia_pacific',

    'New Zealand': 'australasia',
    'Australia': 'australasia',
  };

  return regionMap[country] || 'north_america'; // Default to North America
}

/**
 * Normalize approach to valid database values
 */
function normalizeApproach(category: string | string[]): string {
  // Handle null/undefined
  if (!category) return 'Community-based';

  // Handle array - use first element
  const categoryStr = Array.isArray(category) ? category[0] : category;

  // Handle non-string
  if (typeof categoryStr !== 'string') return 'Community-based';

  const normalized = categoryStr.toLowerCase();

  // Map common categories to valid approach values
  if (normalized.includes('community') || normalized.includes('grassroots')) {
    return 'Community-based';
  }
  if (normalized.includes('indigenous') || normalized.includes('tribal')) {
    return 'Indigenous-led';
  }
  if (normalized.includes('government') || normalized.includes('state')) {
    return 'Government-led';
  }
  if (normalized.includes('faith') || normalized.includes('religious')) {
    return 'Faith-based';
  }

  // Default to community-based for international programs
  return 'Community-based';
}

/**
 * Map category to valid program_type enum
 * Valid values: community_based, custodial_reform, diversion, education_vocational,
 *               family_therapy, mentoring, policy_initiative, prevention, restorative_justice
 */
function normalizeProgramType(category: string | string[]): string {
  // Handle null/undefined
  if (!category) return 'community_based';

  // Handle array - use first element
  const categoryStr = Array.isArray(category) ? category[0] : category;

  // Handle non-string
  if (typeof categoryStr !== 'string') return 'community_based';

  const normalized = categoryStr.toLowerCase();

  if (normalized.includes('rehabilitation') || normalized.includes('reform')) {
    return 'custodial_reform';
  }
  if (normalized.includes('education') || normalized.includes('vocational') || normalized.includes('training')) {
    return 'education_vocational';
  }
  if (normalized.includes('mentor')) {
    return 'mentoring';
  }
  if (normalized.includes('family') || normalized.includes('therapy')) {
    return 'family_therapy';
  }
  if (normalized.includes('diversion')) {
    return 'diversion';
  }
  if (normalized.includes('restorative') || normalized.includes('justice')) {
    return 'restorative_justice';
  }
  if (normalized.includes('prevention') || normalized.includes('early intervention')) {
    return 'prevention';
  }
  if (normalized.includes('policy') || normalized.includes('advocacy')) {
    return 'policy_initiative';
  }

  // Default to community_based
  return 'community_based';
}

/**
 * Step 5: Import program to database
 */
async function importProgram(program: ProgramData): Promise<boolean> {
  console.log(`\n💾 Importing: ${program.name}...`);

  // Generate unique slug
  const baseSlug = program.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if program already exists by name in international_programs
  const { data: existing } = await supabase
    .from('international_programs')
    .select('id')
    .eq('name', program.name)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Program already exists: ${program.name}`);
    return false;
  }

  const slug = program.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Format key_outcomes as JSON string
  const keyOutcomesJson = JSON.stringify(
    program.outcomes.map((outcome, index) => ({
      metric: `Outcome ${index + 1}`,
      value: outcome,
      timeframe: "Post-program"
    }))
  );

  const country = extractCountry(program.location);

  const programData = {
    name: program.name,
    slug: slug,
    description: program.description,
    country: country,
    region: getRegionFromCountry(country),
    city_location: program.location.split(',')[0].trim(),
    program_type: [normalizeProgramType(program.category)], // Array of enum values
    approach_summary: normalizeApproach(program.category),
    target_population: program.targetAudience.join(', '),
    key_outcomes: keyOutcomesJson, // JSON string format
    website_url: program.websiteUrl,
    contact_email: program.contactInfo?.email,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('international_programs')
    .insert(programData)
    .select()
    .single();

  if (error) {
    console.error('❌ Import failed:', error.message);
    return false;
  }

  console.log(`✅ Successfully imported program ID: ${data.id}`);
  return true;
}

/**
 * Main automation function
 */
async function autoDiscoverAndAddProgram(organizationName: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Starting automated discovery for: ${organizationName}`);
  console.log(`${'='.repeat(60)}`);

  // Step 1: Research
  const research = await researchOrganization(organizationName);
  if (!research) {
    console.log('\n❌ Research failed - aborting');
    return;
  }

  // Step 2: Scrape
  const content = await scrapeWebsite(research.website);
  if (!content) {
    console.log('\n❌ Scraping failed - aborting');
    return;
  }

  // Step 3: Extract
  const programs = await extractProgramData(content, research);
  if (programs.length === 0) {
    console.log('\n⚠️  No programs found');
    return;
  }

  // Step 4 & 5: Validate and Import
  let successCount = 0;
  let failCount = 0;

  for (const program of programs) {
    const validation = validateProgram(program);

    if (!validation.valid) {
      console.log(`\n⚠️  Validation failed for "${program.name}":`);
      validation.errors.forEach(err => console.log(`   - ${err}`));
      failCount++;
      continue;
    }

    const imported = await importProgram(program);
    if (imported) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Complete: ${successCount} imported, ${failCount} failed`);
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Batch processing
 */
async function batchProcess(organizations: string[]): Promise<void> {
  console.log(`\n🔄 Batch processing ${organizations.length} organizations...\n`);

  for (let i = 0; i < organizations.length; i++) {
    console.log(`\n[${i + 1}/${organizations.length}]`);
    await autoDiscoverAndAddProgram(organizations[i]);

    // Rate limiting: wait between organizations
    if (i < organizations.length - 1) {
      console.log('\n⏱️  Waiting 10 seconds before next organization...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Automated Program Discovery and Import System

Usage:
  # Single organization
  npx tsx src/scripts/auto-discover-and-add-program.ts "Organization Name"

  # Batch mode
  npx tsx src/scripts/auto-discover-and-add-program.ts --batch "Org 1,Org 2,Org 3"

Examples:
  npx tsx src/scripts/auto-discover-and-add-program.ts "Jesuit Social Services"
  npx tsx src/scripts/auto-discover-and-add-program.ts --batch "Oonchiumpa,Kristy Muir Foundation"
  `);
  process.exit(0);
}

// Check for required environment variables
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'FIRECRAWL_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'YJSF_SUPABASE_SERVICE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

// Execute
if (args[0] === '--batch') {
  const organizations = args[1].split(',').map(s => s.trim());
  batchProcess(organizations).catch(console.error);
} else {
  const organizationName = args.join(' ');
  autoDiscoverAndAddProgram(organizationName).catch(console.error);
}
