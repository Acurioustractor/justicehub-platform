#!/usr/bin/env node
/**
 * ALMA Playwright Scraper - Real browser rendering for JavaScript sites
 *
 * Uses Playwright to render JavaScript-heavy government sites that
 * Firecrawl's waitFor option cannot handle.
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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

/**
 * JavaScript-heavy government sites that need real browser rendering
 */
const JAVASCRIPT_SITES = [
  {
    name: 'NSW Youth Justice Main',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html',
    jurisdiction: 'NSW',
    waitSelector: '.content-main, main, article',
    scrollToLoad: true
  },
  {
    name: 'NSW Youth Justice Conferencing',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/youth-justice-conferencing.html',
    jurisdiction: 'NSW',
    waitSelector: '.content-main, main, article',
    scrollToLoad: true
  },
  {
    name: 'NSW Custody',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/custody.html',
    jurisdiction: 'NSW',
    waitSelector: '.content-main, main, article',
    scrollToLoad: true
  },
  {
    name: 'NSW Youth on Track',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/youth-on-track.html',
    jurisdiction: 'NSW',
    waitSelector: '.content-main, main, article',
    scrollToLoad: true
  },
  {
    name: 'QLD Youth Justice Main',
    url: 'https://www.cyjma.qld.gov.au/youth-justice',
    jurisdiction: 'QLD',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'QLD Youth Justice Programs',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs',
    jurisdiction: 'QLD',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'QLD Transition 2 Success',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs/transition-2-success',
    jurisdiction: 'QLD',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'NT Youth Justice Main',
    url: 'https://justice.nt.gov.au/youth-justice',
    jurisdiction: 'NT',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'NT Youth Diversion',
    url: 'https://justice.nt.gov.au/youth-justice/youth-diversion-program',
    jurisdiction: 'NT',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'SA Youth Justice Main',
    url: 'https://www.childprotection.sa.gov.au/youth-justice',
    jurisdiction: 'SA',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
  {
    name: 'ACT Youth Justice Main',
    url: 'https://www.communityservices.act.gov.au/children-and-families/youth-justice',
    jurisdiction: 'ACT',
    waitSelector: 'main, .content, article',
    scrollToLoad: true
  },
];

/**
 * Scrape a page using Playwright
 */
async function scrapeWithPlaywright(browser, source) {
  console.log(`\n📥 Scraping: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // Navigate and wait for network idle
    await page.goto(source.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for content to appear
    try {
      await page.waitForSelector(source.waitSelector, { timeout: 10000 });
    } catch (e) {
      console.log(`   ⚠️ Selector not found, continuing anyway`);
    }

    // Scroll to trigger lazy loading
    if (source.scrollToLoad) {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait for any lazy-loaded content
      await page.waitForTimeout(2000);
    }

    // Get the full page content
    const content = await page.evaluate(() => {
      // Remove scripts, styles, and navigation
      const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, .navigation, .menu, .sidebar, #cookie-banner');
      elementsToRemove.forEach(el => el.remove());

      // Get main content
      const main = document.querySelector('main, .content-main, .content, article, .page-content') || document.body;
      return main.innerText;
    });

    console.log(`   ✅ Scraped ${content.length} chars (Playwright)`);

    // Also get all links for discovery
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]');
      return Array.from(anchors)
        .map(a => a.href)
        .filter(href => href.startsWith('http') && !href.includes('#'));
    });

    await context.close();

    return {
      content,
      links: [...new Set(links)],
      chars: content.length
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    await context.close();
    return null;
  }
}

/**
 * Extract entities using Claude
 */
async function extractEntities(content, source) {
  // Skip if content is too short
  if (content.length < 200) {
    console.log(`   ⚠️ Content too short (${content.length} chars), skipping extraction`);
    return null;
  }

  const prompt = `Extract youth justice programs and services from this Australian ${source.jurisdiction} government content.

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "interventions": [
    {
      "name": "Program name",
      "type": "Prevention|Diversion|Cultural Connection|Education/Employment|Family Strengthening|Therapeutic|Community-Led|Justice Reinvestment|Wraparound Support|Early Intervention",
      "description": "Brief description",
      "target_cohort": ["Young people aged 10-17"],
      "geography": ["${source.jurisdiction}"]
    }
  ],
  "evidence": [
    {
      "title": "Finding title",
      "summary": "Key finding"
    }
  ],
  "outcomes": [
    {
      "metric": "Outcome name",
      "value": "Value or percentage"
    }
  ],
  "links": ["Relevant program URLs found"]
}

Content:
${content.substring(0, 30000)}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    let jsonText = response.content[0].text;

    // Strip markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.log(`   ❌ Extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Store entities in database
 */
async function storeEntities(entities, source) {
  if (!entities) return 0;

  let inserted = 0;

  for (const intervention of (entities.interventions || [])) {
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('alma_interventions')
        .select('id')
        .ilike('name', intervention.name)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`   ⏭️ Skipping duplicate: ${intervention.name}`);
        continue;
      }

      // Insert new
      const { error } = await supabase.from('alma_interventions').insert({
        name: intervention.name,
        description: intervention.description,
        type: intervention.type,
        geography: intervention.geography || [source.jurisdiction],
        target_cohort: intervention.target_cohort || ['Young people aged 10-17'],
        consent_level: 'Public Knowledge Commons',
        review_status: 'Approved',
        permitted_uses: ['Query (internal)'],
        source_url: source.url,
        source_date: new Date().toISOString()
      });

      if (!error) {
        inserted++;
        console.log(`   ✅ Inserted: ${intervention.name}`);
      } else {
        console.log(`   ❌ Insert error: ${error.message}`);
      }
    } catch (e) {
      // Skip errors silently
    }
  }

  return inserted;
}

/**
 * Store discovered links
 */
async function storeDiscoveredLinks(links, sourceUrl) {
  const relevantDomains = [
    'dcj.nsw.gov.au',
    'cyjma.qld.gov.au',
    'justice.nt.gov.au',
    'childprotection.sa.gov.au',
    'justice.vic.gov.au',
    'wa.gov.au',
    'decyp.tas.gov.au',
    'communityservices.act.gov.au',
    'aihw.gov.au',
    'pc.gov.au'
  ];

  let stored = 0;

  for (const link of links) {
    // Only store links from relevant domains
    const isRelevant = relevantDomains.some(domain => link.includes(domain));
    if (!isRelevant) continue;

    // Check if we already have this link
    const { data: existing } = await supabase
      .from('alma_discovered_links')
      .select('id')
      .eq('url', link)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Store new link
    const { error } = await supabase.from('alma_discovered_links').insert({
      url: link,
      discovered_from: sourceUrl,
      status: 'pending',
      priority: 1
    });

    if (!error) stored++;
  }

  return stored;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       ALMA Playwright Scraper - Real Browser Rendering    ║');
  console.log('║         Extracting from JavaScript-Heavy Gov Sites        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Launch browser
  console.log('\n🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true
  });

  let totalScraped = 0;
  let totalChars = 0;
  let totalInterventions = 0;
  let totalLinks = 0;

  for (const source of JAVASCRIPT_SITES) {
    const result = await scrapeWithPlaywright(browser, source);

    if (result && result.chars > 500) {
      totalScraped++;
      totalChars += result.chars;

      // Extract entities
      const entities = await extractEntities(result.content, source);

      if (entities) {
        console.log(`   📊 Found ${entities.interventions?.length || 0} interventions`);

        // Store entities
        const inserted = await storeEntities(entities, source);
        totalInterventions += inserted;

        // Store discovered links
        const linksStored = await storeDiscoveredLinks(result.links, source.url);
        totalLinks += linksStored;
        if (linksStored > 0) {
          console.log(`   🔗 Stored ${linksStored} new links`);
        }
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  // Summary
  const duration = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 PLAYWRIGHT SCRAPE SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Duration: ${duration} minutes`);
  console.log(`Sites scraped: ${totalScraped}/${JAVASCRIPT_SITES.length}`);
  console.log(`Total characters: ${totalChars.toLocaleString()}`);
  console.log(`New interventions: ${totalInterventions}`);
  console.log(`New links discovered: ${totalLinks}`);

  // Get current totals
  const { count: interventionCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  const { count: linkCount } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total ALMA interventions: ${interventionCount}`);
  console.log(`🔗 Total discovered links: ${linkCount}`);
  console.log('\n✅ Playwright scrape complete!');
}

main().catch(console.error);
