import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/Users/benknight/Code/JusticeHub/.playwright-mcp/audit/wiki';

const consoleErrors = [];
const auditResults = {
  pages: [],
  navigation: [],
  contentGaps: [],
  strategicOpportunities: []
};

async function auditPage(page, url, name) {
  console.log(`\n=== Auditing: ${name} (${url}) ===`);

  const result = {
    name,
    url,
    status: 'pending',
    loadTime: 0,
    consoleErrors: [],
    content: {},
    screenshots: []
  };

  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = msg.text();
      pageErrors.push(error);
      consoleErrors.push({ page: name, url, error });
    }
  });

  try {
    const startTime = Date.now();
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    result.loadTime = Date.now() - startTime;

    // Take full page screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshots.push(screenshotPath);
    console.log(`Screenshot saved: ${screenshotPath}`);

    // Get page title
    result.content.title = await page.title();

    // Get main heading
    const h1 = await page.$('h1');
    if (h1) {
      result.content.h1 = await h1.textContent();
    }

    // Check for wiki-specific elements
    result.content.hasWikiNav = await page.$('.wiki-nav, [class*="wiki-nav"], aside, nav[class*="wiki"]') !== null;
    result.content.hasTableOfContents = await page.$('[class*="toc"], [class*="table-of-contents"], .contents') !== null;
    result.content.hasSidebar = await page.$('aside, [class*="sidebar"]') !== null;

    // Get all links on the page
    const links = await page.$$eval('a[href]', anchors =>
      anchors.map(a => ({ href: a.href, text: a.textContent?.trim() }))
    );
    result.content.links = links.filter(l => l.href.includes('/wiki'));

    // Get article content sections
    const sections = await page.$$eval('h2, h3', headers =>
      headers.map(h => ({ level: h.tagName, text: h.textContent?.trim() }))
    );
    result.content.sections = sections;

    // Check for wiki article cards or listings
    const articleCards = await page.$$('[class*="card"], [class*="article"], article');
    result.content.articleCount = articleCards.length;

    // Get wiki categories if present
    const categories = await page.$$eval('[class*="category"], [class*="tag"]', els =>
      els.map(el => el.textContent?.trim())
    );
    result.content.categories = [...new Set(categories.filter(c => c))];

    result.consoleErrors = pageErrors;
    result.status = 'success';

  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    console.error(`Error auditing ${name}:`, error.message);

    // Try to take error screenshot
    try {
      const errorScreenshotPath = path.join(SCREENSHOT_DIR, `${name.replace(/[^a-zA-Z0-9]/g, '-')}-error.png`);
      await page.screenshot({ path: errorScreenshotPath });
      result.screenshots.push(errorScreenshotPath);
    } catch (e) {}
  }

  return result;
}

async function discoverWikiPages(page, baseUrl) {
  console.log('\n=== Discovering Wiki Pages ===');
  const wikiPages = new Set();

  try {
    await page.goto(`${baseUrl}/wiki`, { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Find all wiki links
    const links = await page.$$eval('a[href*="/wiki"]', anchors =>
      anchors.map(a => a.href)
    );

    links.forEach(link => {
      const url = new URL(link);
      if (url.pathname.startsWith('/wiki')) {
        wikiPages.add(url.pathname);
      }
    });

    // Also check navigation/sidebar for wiki links
    const navLinks = await page.$$eval('nav a[href], aside a[href]', anchors =>
      anchors.map(a => a.href)
    );

    navLinks.forEach(link => {
      try {
        const url = new URL(link);
        if (url.pathname.startsWith('/wiki')) {
          wikiPages.add(url.pathname);
        }
      } catch (e) {}
    });

  } catch (error) {
    console.error('Error discovering wiki pages:', error.message);
  }

  return Array.from(wikiPages);
}

async function main() {
  console.log('=== JusticeHub Wiki Audit ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot Dir: ${SCREENSHOT_DIR}`);

  // Ensure directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Audit main wiki index
    const wikiIndexResult = await auditPage(page, `${BASE_URL}/wiki`, 'wiki-index');
    auditResults.pages.push(wikiIndexResult);

    // 2. Discover all wiki pages
    const discoveredPages = await discoverWikiPages(page, BASE_URL);
    console.log(`\nDiscovered ${discoveredPages.length} wiki pages:`, discoveredPages);

    // 3. Audit each discovered wiki page (limit to prevent infinite loops)
    const pagesToAudit = discoveredPages.filter(p => p !== '/wiki').slice(0, 10);
    for (const pagePath of pagesToAudit) {
      const pageName = pagePath.replace('/wiki/', '').replace(/\//g, '-') || 'wiki-subpage';
      const result = await auditPage(page, `${BASE_URL}${pagePath}`, pageName);
      auditResults.pages.push(result);
    }

    // 4. Test navigation functionality
    console.log('\n=== Testing Navigation ===');
    await page.goto(`${BASE_URL}/wiki`, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Check sidebar navigation
    const sidebarExists = await page.$('aside, [class*="sidebar"], nav[class*="wiki"]');
    auditResults.navigation.push({
      test: 'Sidebar exists',
      passed: !!sidebarExists
    });

    // Check if wiki links are clickable
    const firstWikiLink = await page.$('a[href*="/wiki/"]:not([href="/wiki"])');
    if (firstWikiLink) {
      const linkHref = await firstWikiLink.getAttribute('href');
      await firstWikiLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      const currentUrl = page.url();
      auditResults.navigation.push({
        test: 'Wiki link navigation works',
        passed: currentUrl.includes('/wiki'),
        details: `Navigated to ${currentUrl}`
      });
    } else {
      auditResults.navigation.push({
        test: 'Wiki link navigation works',
        passed: false,
        details: 'No wiki article links found to test'
      });
    }

    // Check breadcrumb navigation
    const breadcrumb = await page.$('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]');
    auditResults.navigation.push({
      test: 'Breadcrumb navigation exists',
      passed: !!breadcrumb
    });

    // Check search functionality
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], [class*="search-input"]');
    auditResults.navigation.push({
      test: 'Search functionality exists',
      passed: !!searchInput
    });

  } catch (error) {
    console.error('Audit error:', error);
  } finally {
    await browser.close();
  }

  // Analyze content gaps
  analyzeContentGaps();

  // Generate strategic opportunities
  generateStrategicOpportunities();

  // Save results
  const resultsPath = path.join(SCREENSHOT_DIR, 'audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  // Print summary
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Pages audited: ${auditResults.pages.length}`);
  console.log(`Successful: ${auditResults.pages.filter(p => p.status === 'success').length}`);
  console.log(`Errors: ${auditResults.pages.filter(p => p.status === 'error').length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Navigation tests: ${auditResults.navigation.length}`);
  console.log(`Content gaps identified: ${auditResults.contentGaps.length}`);
  console.log(`Strategic opportunities: ${auditResults.strategicOpportunities.length}`);
}

function analyzeContentGaps() {
  // Check for common wiki content that should exist
  const expectedContent = [
    'Glossary of terms',
    'Getting started guide',
    'FAQ section',
    'Methodology documentation',
    'Research references',
    'Case studies',
    'Best practices',
    'Policy resources',
    'Data sources',
    'Partner information'
  ];

  const existingContent = auditResults.pages.flatMap(p =>
    [p.content?.h1, ...(p.content?.sections?.map(s => s.text) || [])].filter(Boolean)
  ).map(c => c.toLowerCase());

  expectedContent.forEach(expected => {
    const found = existingContent.some(c => c.includes(expected.toLowerCase()));
    if (!found) {
      auditResults.contentGaps.push({
        type: 'missing-content',
        description: expected,
        recommendation: `Consider adding ${expected} to the wiki`
      });
    }
  });

  // Check for structural gaps
  const hasIndex = auditResults.pages.some(p => p.name === 'wiki-index' && p.status === 'success');
  if (!hasIndex) {
    auditResults.contentGaps.push({
      type: 'structural',
      description: 'Wiki index page not working',
      recommendation: 'Ensure wiki index page loads correctly'
    });
  }

  const hasNavigation = auditResults.navigation.some(n => n.test === 'Sidebar exists' && n.passed);
  if (!hasNavigation) {
    auditResults.contentGaps.push({
      type: 'navigation',
      description: 'No sidebar navigation found',
      recommendation: 'Add sidebar navigation for better wiki usability'
    });
  }

  const hasSearch = auditResults.navigation.some(n => n.test === 'Search functionality exists' && n.passed);
  if (!hasSearch) {
    auditResults.contentGaps.push({
      type: 'navigation',
      description: 'No search functionality found',
      recommendation: 'Add search functionality for wiki content discovery'
    });
  }
}

function generateStrategicOpportunities() {
  // For funders
  auditResults.strategicOpportunities = [
    {
      category: 'Evidence Repository',
      opportunity: 'Transform wiki into comprehensive evidence repository',
      funderValue: 'Demonstrates research depth and evidence-based approach',
      implementation: 'Create structured sections for academic research, policy analysis, and case studies'
    },
    {
      category: 'Knowledge Management',
      opportunity: 'Develop youth justice knowledge base',
      funderValue: 'Shows sector leadership and thought leadership position',
      implementation: 'Add comprehensive glossary, methodology documentation, and best practice guides'
    },
    {
      category: 'Stakeholder Resources',
      opportunity: 'Create funder-specific resource sections',
      funderValue: 'Direct value demonstration to funding bodies',
      implementation: 'Add dedicated sections for different stakeholder types with relevant resources'
    },
    {
      category: 'Impact Documentation',
      opportunity: 'Document intervention outcomes and learnings',
      funderValue: 'Evidence of impact and continuous learning',
      implementation: 'Create intervention case studies with measured outcomes'
    },
    {
      category: 'Training Materials',
      opportunity: 'Develop professional development resources',
      funderValue: 'Capacity building and sector development',
      implementation: 'Add training guides, webinar archives, and certification pathways'
    }
  ];
}

main().catch(console.error);
