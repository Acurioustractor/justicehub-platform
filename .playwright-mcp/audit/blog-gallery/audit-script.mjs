import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/Users/benknight/Code/JusticeHub/.playwright-mcp/audit/blog-gallery';

// Ensure directory exists
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const auditResults = {
  timestamp: new Date().toISOString(),
  pages: [],
  consoleErrors: [],
  metaTags: {}
};

async function auditPage(page, path, name) {
  const url = `${BASE_URL}${path}`;
  const pageResult = {
    path,
    name,
    url,
    status: null,
    title: null,
    metaTags: {},
    content: {},
    consoleErrors: [],
    screenshotPath: null
  };

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`\n=== Auditing ${name} (${path}) ===`);

    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    pageResult.status = response?.status() || 'unknown';

    console.log(`Status: ${pageResult.status}`);

    // Get page title
    pageResult.title = await page.title();
    console.log(`Title: ${pageResult.title}`);

    // Get meta tags
    const metaTags = await page.evaluate(() => {
      const tags = {};
      const title = document.querySelector('title');
      tags['title'] = title?.textContent || 'NOT FOUND';

      const metaDesc = document.querySelector('meta[name="description"]');
      tags['description'] = metaDesc?.getAttribute('content') || 'NOT FOUND';

      const ogTitle = document.querySelector('meta[property="og:title"]');
      tags['og:title'] = ogTitle?.getAttribute('content') || 'NOT FOUND';

      const ogDesc = document.querySelector('meta[property="og:description"]');
      tags['og:description'] = ogDesc?.getAttribute('content') || 'NOT FOUND';

      const ogImage = document.querySelector('meta[property="og:image"]');
      tags['og:image'] = ogImage?.getAttribute('content') || 'NOT FOUND';

      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      tags['twitter:card'] = twitterCard?.getAttribute('content') || 'NOT FOUND';

      const canonical = document.querySelector('link[rel="canonical"]');
      tags['canonical'] = canonical?.getAttribute('href') || 'NOT FOUND';

      return tags;
    });
    pageResult.metaTags = metaTags;
    console.log('Meta tags:', JSON.stringify(metaTags, null, 2));

    // Get page content info
    const content = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const articles = document.querySelectorAll('article');
      const images = document.querySelectorAll('img');
      const links = document.querySelectorAll('a');

      return {
        h1: h1?.textContent?.trim() || 'NOT FOUND',
        articleCount: articles.length,
        imageCount: images.length,
        linkCount: links.length
      };
    });
    pageResult.content = content;
    console.log('Content:', JSON.stringify(content, null, 2));

    // Take screenshot
    const screenshotName = name.toLowerCase().replace(/\s+/g, '-') + '.png';
    const screenshotPath = join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    pageResult.screenshotPath = screenshotPath;
    console.log(`Screenshot saved: ${screenshotPath}`);

    pageResult.consoleErrors = consoleErrors;
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }

  } catch (error) {
    pageResult.error = error.message;
    console.error(`Error auditing ${path}:`, error.message);
  }

  return pageResult;
}

async function findBlogPosts(page) {
  try {
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle', timeout: 30000 });

    // Look for blog post links
    const blogLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => a.href.includes('/blog/') && a.href !== `${window.location.origin}/blog`)
        .map(a => ({
          href: a.href,
          text: a.textContent?.trim()
        }))
        .slice(0, 5); // Limit to 5 posts
    });

    return blogLinks;
  } catch (error) {
    console.error('Error finding blog posts:', error.message);
    return [];
  }
}

async function findGalleryItems(page) {
  try {
    await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle', timeout: 30000 });

    // Look for gallery item links
    const galleryLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => a.href.includes('/gallery/') && a.href !== `${window.location.origin}/gallery`)
        .map(a => ({
          href: a.href,
          text: a.textContent?.trim()
        }))
        .slice(0, 3); // Limit to 3 items
    });

    return galleryLinks;
  } catch (error) {
    console.error('Error finding gallery items:', error.message);
    return [];
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Audit main pages
    auditResults.pages.push(await auditPage(page, '/blog', 'Blog Listing'));
    auditResults.pages.push(await auditPage(page, '/gallery', 'Gallery Listing'));

    // Find and audit blog posts
    console.log('\n=== Finding Blog Posts ===');
    const blogPosts = await findBlogPosts(page);
    console.log(`Found ${blogPosts.length} blog post links`);

    for (const post of blogPosts) {
      const path = new URL(post.href).pathname;
      auditResults.pages.push(await auditPage(page, path, `Blog Post: ${post.text?.substring(0, 30) || path}`));
    }

    // Find and audit gallery items
    console.log('\n=== Finding Gallery Items ===');
    const galleryItems = await findGalleryItems(page);
    console.log(`Found ${galleryItems.length} gallery item links`);

    for (const item of galleryItems) {
      const path = new URL(item.href).pathname;
      auditResults.pages.push(await auditPage(page, path, `Gallery Item: ${item.text?.substring(0, 30) || path}`));
    }

    // Check for filters/pagination on gallery
    console.log('\n=== Checking Gallery Filters ===');
    await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle' });

    const filterInfo = await page.evaluate(() => {
      const filterButtons = document.querySelectorAll('button[data-filter], .filter-btn, [role="tab"]');
      const pagination = document.querySelector('.pagination, [role="navigation"]');

      return {
        hasFilters: filterButtons.length > 0,
        filterCount: filterButtons.length,
        filterLabels: Array.from(filterButtons).map(b => b.textContent?.trim()).filter(Boolean),
        hasPagination: !!pagination
      };
    });
    auditResults.filterInfo = filterInfo;
    console.log('Filter info:', JSON.stringify(filterInfo, null, 2));

    // Save results
    const resultsPath = join(SCREENSHOT_DIR, 'audit-results.json');
    writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n=== Audit results saved to ${resultsPath} ===`);

  } catch (error) {
    console.error('Audit failed:', error);
    auditResults.error = error.message;
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Pages audited: ${auditResults.pages.length}`);
  console.log(`Timestamp: ${auditResults.timestamp}`);

  const passed = auditResults.pages.filter(p => p.status === 200).length;
  const failed = auditResults.pages.filter(p => p.status !== 200).length;
  console.log(`Pages passed (200): ${passed}`);
  console.log(`Pages failed: ${failed}`);

  return auditResults;
}

main().catch(console.error);
