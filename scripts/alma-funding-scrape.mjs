#!/usr/bin/env node

/**
 * ALMA Funding Intelligence Scraper
 *
 * Scrapes funding opportunities from government, philanthropy, and corporate sources.
 * Designed to run weekly via GitHub Actions or manually via CLI.
 *
 * Usage:
 *   node scripts/alma-funding-scrape.mjs [options]
 *
 * Options:
 *   --source <name>    Scrape only a specific source
 *   --dry-run          Preview without inserting to database
 *   --verbose          Enable detailed logging
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  source: null,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

const sourceIndex = args.indexOf('--source');
if (sourceIndex !== -1 && args[sourceIndex + 1]) {
  options.source = args[sourceIndex + 1];
}

// Relevance keywords for scoring
const RELEVANCE_KEYWORDS = [
  'youth',
  'young people',
  'juvenile',
  'justice',
  'rehabilitation',
  'indigenous',
  'first nations',
  'aboriginal',
  'torres strait',
  'community',
  'diversion',
  'early intervention',
  'crime prevention',
  'recidivism',
  'mental health',
  'family services',
  'child protection',
  'education',
  'employment',
  'housing',
  'disadvantaged',
];

// Logging helpers
const log = (msg) => console.log(`[ALMA] ${msg}`);
const logVerbose = (msg) => options.verbose && console.log(`[DEBUG] ${msg}`);
const logError = (msg) => console.error(`[ERROR] ${msg}`);

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ALMA/1.0; +https://justicehub.org.au)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    logError(`Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Calculate relevance score based on content matching
 */
function calculateRelevanceScore(opportunity) {
  let score = 0;
  const textToSearch = [
    opportunity.name,
    opportunity.description,
    ...(opportunity.focus_areas || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check keyword matches
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (textToSearch.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // Bonus for category
  if (opportunity.category === 'youth_justice') score += 30;
  else if (opportunity.category === 'indigenous_programs') score += 25;
  else if (['mental_health', 'family_services'].includes(opportunity.category))
    score += 15;

  // Bonus for national or priority jurisdictions
  const jurisdictions = opportunity.jurisdictions || [];
  if (jurisdictions.includes('National')) score += 15;
  else if (jurisdictions.some((j) => ['NT', 'QLD', 'WA'].includes(j)))
    score += 10;

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Determine category from content
 */
function categorizeOpportunity(text) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes('youth') &&
    (lowerText.includes('justice') || lowerText.includes('diversion'))
  ) {
    return 'youth_justice';
  }
  if (
    lowerText.includes('indigenous') ||
    lowerText.includes('aboriginal') ||
    lowerText.includes('first nations')
  ) {
    return 'indigenous_programs';
  }
  if (lowerText.includes('mental health')) {
    return 'mental_health';
  }
  if (lowerText.includes('education') || lowerText.includes('training')) {
    return 'education';
  }
  if (lowerText.includes('employment') || lowerText.includes('jobs')) {
    return 'employment';
  }
  if (lowerText.includes('housing') || lowerText.includes('homelessness')) {
    return 'housing';
  }
  if (lowerText.includes('family') || lowerText.includes('parent')) {
    return 'family_services';
  }
  if (lowerText.includes('community')) {
    return 'community_development';
  }
  return 'general';
}

/**
 * Parse amount from text (e.g., "$100,000", "up to $500K")
 */
function parseAmount(text) {
  if (!text) return null;

  const match = text.match(/\$?([\d,]+)(?:\s*([kmb]))?/i);
  if (!match) return null;

  let amount = parseInt(match[1].replace(/,/g, ''), 10);
  const suffix = (match[2] || '').toLowerCase();

  if (suffix === 'k') amount *= 1000;
  else if (suffix === 'm') amount *= 1000000;
  else if (suffix === 'b') amount *= 1000000000;

  return amount;
}

/**
 * Parse date from various formats
 */
function parseDate(text) {
  if (!text) return null;

  // Try common formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i, // DD Month YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
  ];

  for (const format of formats) {
    const match = text.match(format);
    if (match) {
      try {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

// ============================================================================
// SCRAPERS
// ============================================================================

/**
 * Scraper for GrantConnect (grants.gov.au)
 */
async function scrapeGrantConnect() {
  log('Scraping GrantConnect (grants.gov.au)...');

  const opportunities = [];

  // GrantConnect requires API access or specific search URLs
  // For now, we'll use the RSS feed approach
  const feedUrl =
    'https://www.grants.gov.au/RSSFeed?SelectedIndustries=community-services&SelectedIndustries=health-medical';

  try {
    const response = await fetch(feedUrl);
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $('item').each((_, item) => {
      const $item = $(item);
      const title = $item.find('title').text().trim();
      const description = $item.find('description').text().trim();
      const link = $item.find('link').text().trim();
      const pubDate = $item.find('pubDate').text().trim();

      // Extract deadline from description if present
      const deadlineMatch = description.match(
        /closing\s+date[:\s]+([^<]+)/i
      );
      const deadline = deadlineMatch ? parseDate(deadlineMatch[1]) : null;

      // Extract amount if present
      const amountMatch = description.match(
        /(?:up to|max|maximum|funding)[\s:]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|m)?/i
      );
      const maxAmount = amountMatch ? parseAmount(amountMatch[0]) : null;

      const searchText = `${title} ${description}`;

      opportunities.push({
        name: title,
        description: description.substring(0, 1000),
        funder_name: 'Australian Government',
        source_type: 'government',
        category: categorizeOpportunity(searchText),
        max_grant_amount: maxAmount,
        deadline: deadline,
        status: 'open',
        jurisdictions: ['National'],
        focus_areas: extractFocusAreas(searchText),
        source_url: link,
        application_url: link,
        source_id: link.split('/').pop(),
        scrape_source: 'grants.gov.au',
        scraped_at: new Date().toISOString(),
      });
    });

    logVerbose(`Found ${opportunities.length} opportunities from GrantConnect`);
  } catch (error) {
    logError(`Failed to scrape GrantConnect: ${error.message}`);
  }

  return opportunities;
}

/**
 * Scraper for Business.gov.au
 */
async function scrapeBusinessGovAu() {
  log('Scraping Business.gov.au...');

  const opportunities = [];
  const url = 'https://business.gov.au/grants-and-programs';

  try {
    const html = await fetchPage(url);
    if (!html) return opportunities;

    const $ = cheerio.load(html);

    // Look for grant listings - structure may vary
    $('.card, .grant-item, [data-grant]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h3, .card-title, .grant-title').first().text().trim();
      const description = $el
        .find('p, .card-text, .grant-description')
        .first()
        .text()
        .trim();
      const link = $el.find('a').first().attr('href');

      if (title && link) {
        const fullUrl = link.startsWith('http')
          ? link
          : `https://business.gov.au${link}`;

        opportunities.push({
          name: title,
          description: description.substring(0, 1000),
          funder_name: 'Business.gov.au',
          source_type: 'government',
          category: categorizeOpportunity(`${title} ${description}`),
          status: 'open',
          jurisdictions: ['National'],
          focus_areas: extractFocusAreas(`${title} ${description}`),
          source_url: fullUrl,
          application_url: fullUrl,
          scrape_source: 'business.gov.au',
          scraped_at: new Date().toISOString(),
        });
      }
    });

    logVerbose(
      `Found ${opportunities.length} opportunities from Business.gov.au`
    );
  } catch (error) {
    logError(`Failed to scrape Business.gov.au: ${error.message}`);
  }

  return opportunities;
}

/**
 * Scraper for Paul Ramsay Foundation
 */
async function scrapePaulRamsayFoundation() {
  log('Scraping Paul Ramsay Foundation...');

  const opportunities = [];
  const url = 'https://paulramsayfoundation.org.au/how-we-work/';

  try {
    const html = await fetchPage(url);
    if (!html) return opportunities;

    const $ = cheerio.load(html);

    // PRF typically announces open rounds periodically
    // We'll capture their program areas as ongoing opportunities
    const programAreas = [
      'Breaking Cycles of Disadvantage',
      'Young People Learning & Earning',
      'Stronger Families and Communities',
    ];

    for (const area of programAreas) {
      opportunities.push({
        name: `Paul Ramsay Foundation - ${area}`,
        description: `Major philanthropic funding for programs addressing ${area.toLowerCase()}. Contact PRF for current funding rounds.`,
        funder_name: 'Paul Ramsay Foundation',
        source_type: 'philanthropy',
        category: area.includes('Young')
          ? 'youth_justice'
          : 'community_development',
        min_grant_amount: 100000,
        max_grant_amount: 5000000,
        status: 'recurring',
        jurisdictions: ['National'],
        focus_areas: ['disadvantage', 'youth', 'indigenous', 'community'],
        source_url: 'https://paulramsayfoundation.org.au/',
        scrape_source: 'paulramsayfoundation',
        scraped_at: new Date().toISOString(),
      });
    }

    logVerbose(
      `Created ${opportunities.length} opportunities from Paul Ramsay Foundation`
    );
  } catch (error) {
    logError(`Failed to scrape Paul Ramsay Foundation: ${error.message}`);
  }

  return opportunities;
}

/**
 * Extract focus areas from text
 */
function extractFocusAreas(text) {
  const lowerText = text.toLowerCase();
  const areas = [];

  const mapping = {
    youth: ['youth', 'young people', 'juvenile', 'teen'],
    indigenous: ['indigenous', 'aboriginal', 'first nations', 'torres strait'],
    justice: ['justice', 'legal', 'court', 'diversion'],
    mental_health: ['mental health', 'wellbeing', 'psychological'],
    education: ['education', 'school', 'training', 'learning'],
    employment: ['employment', 'job', 'career', 'workforce'],
    housing: ['housing', 'accommodation', 'homelessness'],
    family: ['family', 'parent', 'carer', 'kinship'],
    community: ['community', 'place-based', 'local'],
  };

  for (const [area, keywords] of Object.entries(mapping)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      areas.push(area);
    }
  }

  return areas;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('Starting ALMA Funding Intelligence Scraper');
  log(`Options: ${JSON.stringify(options)}`);

  const allOpportunities = [];

  // Run scrapers
  const scrapers = [
    { name: 'grants.gov.au', fn: scrapeGrantConnect },
    { name: 'business.gov.au', fn: scrapeBusinessGovAu },
    { name: 'paulramsayfoundation', fn: scrapePaulRamsayFoundation },
  ];

  for (const scraper of scrapers) {
    if (options.source && options.source !== scraper.name) {
      logVerbose(`Skipping ${scraper.name} (not selected)`);
      continue;
    }

    try {
      const opportunities = await scraper.fn();
      allOpportunities.push(...opportunities);
    } catch (error) {
      logError(`Scraper ${scraper.name} failed: ${error.message}`);
    }

    // Brief pause between scrapers to be polite
    await new Promise((r) => setTimeout(r, 1000));
  }

  log(`Total opportunities found: ${allOpportunities.length}`);

  // Calculate relevance scores
  for (const opp of allOpportunities) {
    opp.relevance_score = calculateRelevanceScore(opp);
  }

  // Filter by relevance (only keep those with score >= 20)
  const relevantOpportunities = allOpportunities.filter(
    (o) => o.relevance_score >= 20
  );
  log(`Relevant opportunities (score >= 20): ${relevantOpportunities.length}`);

  if (options.dryRun) {
    log('DRY RUN - Not inserting to database');
    console.log('\nOpportunities found:');
    for (const opp of relevantOpportunities) {
      console.log(
        `  - [${opp.relevance_score}] ${opp.name} (${opp.funder_name})`
      );
    }
    return;
  }

  // Insert/update opportunities in database
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const opp of relevantOpportunities) {
    try {
      // Check if already exists by source_url or source_id
      const { data: existing } = await supabase
        .from('alma_funding_opportunities')
        .select('id')
        .or(`source_url.eq.${opp.source_url},and(scrape_source.eq.${opp.scrape_source},source_id.eq.${opp.source_id})`)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('alma_funding_opportunities')
          .update({
            ...opp,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
        updated++;
      } else {
        // Insert new
        const { error } = await supabase
          .from('alma_funding_opportunities')
          .insert([opp]);

        if (error) throw error;
        inserted++;
      }
    } catch (error) {
      logError(`Failed to save opportunity "${opp.name}": ${error.message}`);
      errors++;
    }
  }

  log(`\nResults:`);
  log(`  Inserted: ${inserted}`);
  log(`  Updated: ${updated}`);
  log(`  Errors: ${errors}`);

  // Create ingestion job record
  const { error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert([
      {
        job_type: 'funding_scrape',
        status: 'completed',
        stats: {
          total_found: allOpportunities.length,
          relevant: relevantOpportunities.length,
          inserted,
          updated,
          errors,
        },
        completed_at: new Date().toISOString(),
      },
    ]);

  if (jobError) {
    logError(`Failed to record job: ${jobError.message}`);
  }

  log('ALMA Funding Scraper completed');
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
