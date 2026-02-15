const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const results = [];
  const pages = [
    { path: '/contained', name: 'contained' },
    { path: '/art-innovation', name: 'art-innovation' },
    { path: '/youth-scout', name: 'youth-scout' },
    { path: '/talent-scout', name: 'talent-scout' },
    { path: '/flywheel', name: 'flywheel' },
    { path: '/roadmap', name: 'roadmap' },
    { path: '/grassroots', name: 'grassroots' },
    { path: '/transparency', name: 'transparency' },
    { path: '/visuals', name: 'visuals' }
  ];

  // Collect console errors
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
    console.log('Auditing: ' + p.path);
    try {
      const response = await page.goto('http://localhost:3000' + p.path, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response ? response.status() : 'N/A';

      // Wait for CSS
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Get page title and content info
      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
      const links = await page.locator('a').count();
      const images = await page.locator('img').count();
      const buttons = await page.locator('button').count();

      // Check for key content
      const bodyText = await page.locator('body').textContent();
      const hasContent = bodyText.length > 100;

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
        hasContent: hasContent,
        contentLength: bodyText.length,
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

  // Check for visuals subpages
  console.log('\nChecking for /visuals subpages...');
  try {
    await page.goto('http://localhost:3000/visuals', { waitUntil: 'networkidle' });
    const visualLinks = await page.locator('a[href*="/visuals/"]').all();
    const subpages = [];
    for (const link of visualLinks) {
      const href = await link.getAttribute('href');
      if (href && href.includes('/visuals/')) {
        subpages.push(href);
      }
    }
    const uniqueSubpages = [...new Set(subpages)];
    console.log('Found subpages:', uniqueSubpages);

    // Audit each subpage
    for (const sp of uniqueSubpages.slice(0, 5)) {
      const subName = sp.replace('/visuals/', 'visuals-');
      console.log('Auditing subpage: ' + sp);
      try {
        const resp = await page.goto('http://localhost:3000' + sp, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: '.playwright-mcp/audit/special-pages/' + subName + '.png',
          fullPage: true
        });
        const subTitle = await page.title();
        results.push({
          page: sp,
          status: resp ? resp.status() : 'N/A',
          title: subTitle,
          isSubpage: true
        });
        console.log('  Status: ' + (resp ? resp.status() : 'N/A'));
      } catch (e) {
        console.log('  Subpage ERROR: ' + e.message);
      }
    }
  } catch (e) {
    console.log('Error checking subpages: ' + e.message);
  }

  // Output JSON results
  console.log('\n=== AUDIT RESULTS JSON ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('\n=== CONSOLE ERRORS ===');
  console.log(JSON.stringify(consoleErrors, null, 2));

  await browser.close();
})();
