const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const results = [];
  // Pages that timed out with networkidle
  const pages = [
    { path: '/youth-scout', name: 'youth-scout' },
    { path: '/flywheel', name: 'flywheel' },
    { path: '/grassroots', name: 'grassroots' },
    { path: '/visuals', name: 'visuals' }
  ];

  const consoleErrors = {};
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const url = page.url();
      const pageName = url.split('/').pop() || 'home';
      if (!consoleErrors[pageName]) {
        consoleErrors[pageName] = [];
      }
      consoleErrors[pageName].push(msg.text());
    }
  });

  for (const p of pages) {
    console.log('Retrying: ' + p.path);
    try {
      // Use domcontentloaded instead of networkidle (faster, less strict)
      const response = await page.goto('http://localhost:3000' + p.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response ? response.status() : 'N/A';

      // Wait a bit for content to render
      await page.waitForTimeout(3000);

      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
      const links = await page.locator('a').count();
      const images = await page.locator('img').count();
      const buttons = await page.locator('button').count();

      // Get more details about the page content
      const bodyText = await page.locator('body').textContent();
      const hasMainContent = bodyText.length > 500;

      // Check for specific elements
      const hasNav = await page.locator('nav').count() > 0;
      const hasFooter = await page.locator('footer').count() > 0;
      const hasForm = await page.locator('form').count() > 0;

      // Take screenshot
      await page.screenshot({
        path: '.playwright-mcp/audit/special-pages/' + p.name + '.png',
        fullPage: true
      });

      results.push({
        page: p.path,
        status: status,
        title: title,
        h1: h1,
        links: links,
        images: images,
        buttons: buttons,
        hasMainContent: hasMainContent,
        contentLength: bodyText.length,
        hasNav: hasNav,
        hasFooter: hasFooter,
        hasForm: hasForm,
        errors: consoleErrors[p.name] || []
      });

      console.log('  Status: ' + status + ', Title: ' + title + ', H1: ' + (h1 || 'none'));
    } catch (e) {
      results.push({
        page: p.path,
        status: 'ERROR',
        error: e.message
      });
      console.log('  ERROR: ' + e.message);
    }
  }

  console.log('\n=== RETRY RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
