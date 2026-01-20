#!/usr/bin/env node

/**
 * ALMA Research & Evidence Scraper
 *
 * Scrapes academic research, government reports, and parliamentary inquiries
 * for the evidence library. Uses research-prd.json for source configuration.
 *
 * Usage:
 *   node scripts/alma-research-scrape.mjs [options]
 *
 * Options:
 *   --feature <id>     Scrape only a specific feature from PRD
 *   --dry-run          Preview without inserting to database
 *   --verbose          Enable detailed logging
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  feature: null,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

const featureIndex = args.indexOf('--feature');
if (featureIndex !== -1 && args[featureIndex + 1]) {
  options.feature = args[featureIndex + 1];
}

// Load PRD
const prdPath = join(__dirname, '..', 'ralph', 'research-prd.json');
const prd = JSON.parse(readFileSync(prdPath, 'utf-8'));

// Logging helpers
const log = (msg) => console.log(`[ALMA Research] ${msg}`);
const logVerbose = (msg) => options.verbose && console.log(`[DEBUG] ${msg}`);
const logError = (msg) => console.error(`[ERROR] ${msg}`);

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ALMA/1.0; +https://justicehub.org.au)',
        Accept: 'text/html,application/xhtml+xml,application/xml',
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
 * Map source type to evidence_type enum
 */
function mapEvidenceType(sourceType) {
  const mapping = {
    royal_commission: 'Policy analysis',
    parliamentary_inquiry: 'Policy analysis',
    government_review: 'Policy analysis',
    government_strategy: 'Policy analysis',
    law_reform: 'Policy analysis',
    statistical_report: 'Longitudinal study',
    academic: 'Program evaluation',
    advocacy: 'Policy analysis',
    policy: 'Policy analysis',
  };
  return mapping[sourceType] || 'Policy analysis';
}

/**
 * Determine evidence quality based on source
 */
function determineQuality(sourceType) {
  const highQuality = ['royal_commission', 'law_reform', 'statistical_report'];
  const mediumQuality = ['parliamentary_inquiry', 'government_review', 'academic'];

  if (highQuality.includes(sourceType)) return 'High';
  if (mediumQuality.includes(sourceType)) return 'Medium';
  return 'Low';
}

/**
 * Extract key findings from text (simplified)
 */
function extractKeyFindings(text, maxLength = 500) {
  if (!text) return 'See source document for detailed findings.';

  // Clean and truncate
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;

  // Try to cut at sentence boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('. ');

  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  }

  return truncated + '...';
}

/**
 * Extract jurisdictions from text
 */
function extractJurisdictions(text) {
  const jurisdictions = [];
  const lowerText = text.toLowerCase();

  const mapping = {
    NSW: ['new south wales', 'nsw', 'sydney'],
    VIC: ['victoria', 'vic', 'melbourne'],
    QLD: ['queensland', 'qld', 'brisbane'],
    WA: ['western australia', 'wa', 'perth'],
    SA: ['south australia', 'sa', 'adelaide'],
    TAS: ['tasmania', 'tas', 'hobart'],
    NT: ['northern territory', 'nt', 'darwin', 'alice springs'],
    ACT: ['australian capital territory', 'act', 'canberra'],
    National: ['australia', 'national', 'federal', 'commonwealth'],
  };

  for (const [code, keywords] of Object.entries(mapping)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      jurisdictions.push(code);
    }
  }

  return jurisdictions.length > 0 ? jurisdictions : ['National'];
}

/**
 * Extract topics from text
 */
function extractTopics(text) {
  const topics = [];
  const lowerText = text.toLowerCase();

  const topicKeywords = {
    'youth_justice': ['youth justice', 'juvenile justice', 'young offender'],
    'detention': ['detention', 'custody', 'incarceration', 'prison'],
    'diversion': ['diversion', 'alternative', 'restorative'],
    'indigenous': ['indigenous', 'aboriginal', 'first nations', 'torres strait'],
    'recidivism': ['recidivism', 'reoffending', 'repeat offend'],
    'mental_health': ['mental health', 'wellbeing', 'psychological'],
    'family': ['family', 'parent', 'kinship', 'care'],
    'education': ['education', 'school', 'training'],
    'employment': ['employment', 'job', 'workforce'],
    'housing': ['housing', 'homelessness', 'accommodation'],
    'child_protection': ['child protection', 'out of home care', 'oohc'],
    'policy': ['policy', 'reform', 'legislation'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      topics.push(topic);
    }
  }

  return topics;
}

// ============================================================================
// SCRAPERS
// ============================================================================

/**
 * Scrape AIHW Reports
 */
async function scrapeAIHW(sources) {
  log('Scraping AIHW reports...');
  const evidence = [];

  for (const source of sources) {
    try {
      const html = await fetchPage(source.url);
      if (!html) continue;

      const $ = cheerio.load(html);

      // AIHW has structured report pages
      const title = $('h1').first().text().trim() || source.name;
      const description = $('meta[name="description"]').attr('content') ||
                         $('.lead, .summary, .abstract').first().text().trim();

      // Try to find publication date
      const dateText = $('.date, .published, time').first().text().trim();
      const pubDate = dateText ? new Date(dateText).toISOString().split('T')[0] : null;

      // Try to find PDF link
      const pdfLink = $('a[href$=".pdf"]').first().attr('href');
      const docUrl = pdfLink ?
        (pdfLink.startsWith('http') ? pdfLink : `https://www.aihw.gov.au${pdfLink}`) :
        null;

      evidence.push({
        title,
        evidence_type: mapEvidenceType(source.type),
        findings: extractKeyFindings(description),
        author: 'Australian Institute of Health and Welfare',
        organization: 'AIHW',
        publication_date: pubDate,
        source_url: source.url,
        source_document_url: docUrl,
        consent_level: 'Public Knowledge Commons',
        metadata: {
          scrape_source: 'aihw',
          scraped_at: new Date().toISOString(),
          evidence_quality: determineQuality(source.type),
          jurisdictions: extractJurisdictions(title + ' ' + description),
          topics: extractTopics(title + ' ' + description),
          source_type: source.type,
        },
      });

      logVerbose(`Scraped: ${title}`);
    } catch (error) {
      logError(`Failed to scrape ${source.name}: ${error.message}`);
    }

    // Polite delay
    await new Promise((r) => setTimeout(r, 1000));
  }

  return evidence;
}

/**
 * Scrape Parliamentary Inquiries
 */
async function scrapeParliamentaryInquiries(sources) {
  log('Scraping parliamentary inquiries...');
  const evidence = [];

  for (const source of sources) {
    try {
      const html = await fetchPage(source.url);
      if (!html) continue;

      const $ = cheerio.load(html);

      // Try to extract inquiry details
      const title = $('h1').first().text().trim() || source.name;
      const description = $('meta[name="description"]').attr('content') ||
                         $('.content, .body, article').first().text().substring(0, 1000);

      // Look for submissions or reports
      const reportLinks = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase();
        if (text.includes('report') || text.includes('submission') || href.includes('.pdf')) {
          reportLinks.push({
            text: $(el).text().trim(),
            href: href.startsWith('http') ? href : `${new URL(source.url).origin}${href}`,
          });
        }
      });

      evidence.push({
        title,
        evidence_type: mapEvidenceType(source.type),
        findings: extractKeyFindings(description) || `Parliamentary inquiry: ${title}. See source for detailed findings and submissions.`,
        organization: source.name.includes('QLD') ? 'Queensland Parliament' :
                     source.name.includes('NSW') ? 'NSW Parliament' :
                     source.name.includes('VIC') ? 'Victorian Parliament' :
                     source.name.includes('SA') ? 'SA Parliament' :
                     source.name.includes('TAS') ? 'Tasmanian Parliament' :
                     'Australian Parliament',
        source_url: source.url,
        consent_level: 'Public Knowledge Commons',
        metadata: {
          scrape_source: 'parliamentary',
          scraped_at: new Date().toISOString(),
          evidence_quality: determineQuality(source.type),
          jurisdictions: extractJurisdictions(source.name + ' ' + title),
          topics: extractTopics(title + ' ' + description),
          source_type: source.type,
          related_documents: reportLinks.slice(0, 10),
        },
      });

      logVerbose(`Scraped: ${title}`);
    } catch (error) {
      logError(`Failed to scrape ${source.name}: ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return evidence;
}

/**
 * Scrape Advocacy Submissions
 */
async function scrapeAdvocacy(sources) {
  log('Scraping advocacy submissions...');
  const evidence = [];

  for (const source of sources) {
    try {
      const html = await fetchPage(source.url);
      if (!html) continue;

      const $ = cheerio.load(html);

      // Look for publication listings
      const publications = [];

      // Try various common patterns
      $('.publication, .resource, .submission, article, .card').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, .title').first().text().trim();
        const link = $el.find('a').first().attr('href');
        const desc = $el.find('p, .description, .excerpt').first().text().trim();

        if (title && link) {
          publications.push({ title, link, desc });
        }
      });

      // Also try simple link lists
      if (publications.length === 0) {
        $('a').each((_, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          const href = $el.attr('href') || '';

          if (text.length > 20 && (href.includes('.pdf') || href.includes('submission') || href.includes('report'))) {
            publications.push({
              title: text,
              link: href.startsWith('http') ? href : `${new URL(source.url).origin}${href}`,
              desc: '',
            });
          }
        });
      }

      // Create evidence records for top publications
      for (const pub of publications.slice(0, 5)) {
        const searchText = pub.title + ' ' + pub.desc;

        // Only include if relevant to youth justice
        const topics = extractTopics(searchText);
        if (topics.length === 0 || !topics.some(t =>
          ['youth_justice', 'detention', 'diversion', 'indigenous', 'child_protection'].includes(t)
        )) {
          continue;
        }

        evidence.push({
          title: pub.title,
          evidence_type: 'Policy analysis',
          findings: pub.desc || `See source document: ${pub.title}`,
          organization: source.name,
          source_url: pub.link || source.url,
          consent_level: 'Public Knowledge Commons',
          metadata: {
            scrape_source: 'advocacy',
            scraped_at: new Date().toISOString(),
            evidence_quality: determineQuality('advocacy'),
            jurisdictions: extractJurisdictions(searchText),
            topics,
            source_type: 'advocacy',
          },
        });
      }

      logVerbose(`Found ${publications.length} publications from ${source.name}`);
    } catch (error) {
      logError(`Failed to scrape ${source.name}: ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return evidence;
}

/**
 * Generic scraper for other sources
 */
async function scrapeGeneric(sources) {
  log('Scraping generic sources...');
  const evidence = [];

  for (const source of sources) {
    try {
      const html = await fetchPage(source.url);
      if (!html) continue;

      const $ = cheerio.load(html);

      const title = $('h1').first().text().trim() || source.name;
      const description = $('meta[name="description"]').attr('content') ||
                         $('p').first().text().trim();

      evidence.push({
        title: source.name,
        evidence_type: mapEvidenceType(source.type),
        findings: extractKeyFindings(description) || `Source: ${source.name}. See URL for detailed content.`,
        source_url: source.url,
        consent_level: 'Public Knowledge Commons',
        metadata: {
          scrape_source: 'generic',
          scraped_at: new Date().toISOString(),
          evidence_quality: determineQuality(source.type),
          jurisdictions: extractJurisdictions(title + ' ' + description),
          topics: extractTopics(title + ' ' + description),
          source_type: source.type,
        },
      });

      logVerbose(`Scraped: ${source.name}`);
    } catch (error) {
      logError(`Failed to scrape ${source.name}: ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return evidence;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('Starting ALMA Research & Evidence Scraper');
  log(`PRD: ${prd.name}`);
  log(`Features: ${prd.features.length}`);
  log(`Options: ${JSON.stringify(options)}`);

  const allEvidence = [];

  // Process each feature in the PRD
  for (const feature of prd.features) {
    if (options.feature && options.feature !== feature.id) {
      logVerbose(`Skipping feature: ${feature.id}`);
      continue;
    }

    log(`\nProcessing: ${feature.title} (${feature.sources.length} sources)`);

    // Route to appropriate scraper based on source types
    const aihwSources = feature.sources.filter((s) =>
      s.url.includes('aihw.gov.au') || s.type === 'statistical_report'
    );
    const parliamentarySources = feature.sources.filter((s) =>
      s.type === 'parliamentary_inquiry' || s.type === 'royal_commission' || s.url.includes('parliament')
    );
    const advocacySources = feature.sources.filter((s) =>
      s.type === 'advocacy' || s.url.includes('humanrights') || s.url.includes('snaicc') || s.url.includes('natsils')
    );
    const otherSources = feature.sources.filter((s) =>
      !aihwSources.includes(s) && !parliamentarySources.includes(s) && !advocacySources.includes(s)
    );

    // Run scrapers
    if (aihwSources.length > 0) {
      const results = await scrapeAIHW(aihwSources);
      allEvidence.push(...results);
    }

    if (parliamentarySources.length > 0) {
      const results = await scrapeParliamentaryInquiries(parliamentarySources);
      allEvidence.push(...results);
    }

    if (advocacySources.length > 0) {
      const results = await scrapeAdvocacy(advocacySources);
      allEvidence.push(...results);
    }

    if (otherSources.length > 0) {
      const results = await scrapeGeneric(otherSources);
      allEvidence.push(...results);
    }
  }

  log(`\nTotal evidence items collected: ${allEvidence.length}`);

  if (options.dryRun) {
    log('\nDRY RUN - Not inserting to database');
    console.log('\nEvidence items:');
    for (const item of allEvidence) {
      console.log(`  - ${item.title} (${item.evidence_type})`);
    }
    return;
  }

  // Insert/update evidence in database
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of allEvidence) {
    try {
      // Check if already exists by source_url
      const { data: existing } = await supabase
        .from('alma_evidence')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('alma_evidence')
          .update({
            ...item,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
        updated++;
      } else {
        // Check for similar title to avoid duplicates
        const { data: similar } = await supabase
          .from('alma_evidence')
          .select('id')
          .ilike('title', `%${item.title.substring(0, 50)}%`)
          .limit(1);

        if (similar && similar.length > 0) {
          logVerbose(`Skipping similar: ${item.title}`);
          skipped++;
          continue;
        }

        // Insert new
        const { error } = await supabase
          .from('alma_evidence')
          .insert([item]);

        if (error) throw error;
        inserted++;
      }
    } catch (error) {
      logError(`Failed to save "${item.title}": ${error.message}`);
      errors++;
    }
  }

  log('\nResults:');
  log(`  Inserted: ${inserted}`);
  log(`  Updated: ${updated}`);
  log(`  Skipped (duplicates): ${skipped}`);
  log(`  Errors: ${errors}`);

  // Create ingestion job record
  const { error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert([{
      job_type: 'research_scrape',
      status: 'completed',
      stats: {
        total_collected: allEvidence.length,
        inserted,
        updated,
        skipped,
        errors,
        features_processed: options.feature ? 1 : prd.features.length,
      },
      completed_at: new Date().toISOString(),
    }]);

  if (jobError) {
    logError(`Failed to record job: ${jobError.message}`);
  }

  log('\nALMA Research Scraper completed');
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
