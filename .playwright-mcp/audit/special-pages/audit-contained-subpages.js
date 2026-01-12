const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const results = [];
  const pages = [
    { path: '/contained/about', name: 'contained-about' },
    { path: '/contained/launch', name: 'contained-launch' },
    { path: '/contained/register', name: 'contained-register' }
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
    console.log('Auditing: ' + p.path);
    try {
      const response = await page.goto('http://localhost:3000' + p.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response ? response.status() : 'N/A';

      await page.waitForTimeout(2000);

      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
      const bodyText = await page.locator('body').textContent();

      await page.screenshot({
        path: '.playwright-mcp/audit/special-pages/' + p.name + '.png',
        fullPage: true
      });

      results.push({
        page: p.path,
        status: status,
        title: title,
        h1: h1,
        contentLength: bodyText.length
      });

      console.log('  Status: ' + status + ', Title: ' + title);
    } catch (e) {
      results.push({
        page: p.path,
        status: 'ERROR',
        error: e.message
      });
      console.log('  ERROR: ' + e.message);
    }
  }

  console.log('\n=== CONTAINED SUBPAGES RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
