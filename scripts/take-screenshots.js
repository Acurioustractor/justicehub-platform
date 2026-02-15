const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:3005',
  screenshotDir: './public/screenshots',
  viewports: {
    desktop: { width: 1920, height: 1080 }
  }
};

// Pages and sections to screenshot - JUST MONEY TRAIL
const screenshotTargets = [
  {
    name: 'money-trail-desktop',
    url: '/transparency',
    description: 'Money Trail - Financial Transparency Dashboard',
    fullPage: true
  }
];

async function createScreenshotDirectory() {
  if (!fs.existsSync(config.screenshotDir)) {
    fs.mkdirSync(config.screenshotDir, { recursive: true });
    console.log(`📁 Created screenshot directory: ${config.screenshotDir}`);
  }
}

async function takeScreenshot(page, target, viewport, device) {
  try {
    console.log(`📸 Taking ${device} screenshot: ${target.name}`);
    
    // Navigate to page
    await page.goto(`${config.baseUrl}${target.url}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Wait a bit for any animations or dynamic content
    await page.waitForTimeout(2000);

    let screenshotOptions = {
      path: path.join(config.screenshotDir, `${target.name}-${device}.png`),
      fullPage: target.fullPage || false
    };

    // Take screenshot of specific element if selector provided
    if (target.selector && !target.fullPage) {
      try {
        await page.waitForSelector(target.selector, { timeout: 10000 });
        const element = await page.locator(target.selector).first();
        await element.screenshot({ path: screenshotOptions.path });
      } catch (error) {
        console.log(`⚠️  Selector not found for ${target.name}, taking full page screenshot instead`);
        await page.screenshot({ ...screenshotOptions, fullPage: true });
      }
    } else {
      // Take full page or viewport screenshot
      await page.screenshot(screenshotOptions);
    }

    console.log(`✅ Screenshot saved: ${target.name}-${device}.png`);
  } catch (error) {
    console.error(`❌ Error taking screenshot for ${target.name} (${device}):`, error.message);
  }
}

async function takeAllScreenshots() {
  console.log('🚀 Starting JusticeHub screenshot capture...\n');

  await createScreenshotDirectory();

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  for (const [deviceName, viewport] of Object.entries(config.viewports)) {
    console.log(`\n📱 Taking ${deviceName} screenshots (${viewport.width}x${viewport.height})`);
    console.log('='.repeat(60));

    const context = await browser.newContext({
      viewport: viewport,
      deviceScaleFactor: deviceName === 'mobile' ? 2 : 1
    });

    const page = await context.newPage();

    // Set longer timeout for slow-loading content
    page.setDefaultTimeout(30000);

    for (const target of screenshotTargets) {
      await takeScreenshot(page, target, viewport, deviceName);
    }

    await context.close();
  }

  await browser.close();
  
  console.log('\n🎉 Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${config.screenshotDir}`);
  
  // Create an index file listing all screenshots
  createScreenshotIndex();
}

function createScreenshotIndex() {
  const indexContent = `# JusticeHub Screenshots

Generated on: ${new Date().toISOString()}

## Screenshots by Page

${screenshotTargets.map(target => `
### ${target.name}
**Description:** ${target.description}  
**URL:** \`${target.url}\`  
**Files:**
- Desktop: \`${target.name}-desktop.png\`
- Tablet: \`${target.name}-tablet.png\`
- Mobile: \`${target.name}-mobile.png\`
`).join('\n')}

## Usage in About Page

To use these screenshots in your About page, update the placeholder sections:

\`\`\`tsx
// Replace placeholder divs like this:
<div className="aspect-video bg-gray-100 flex items-center justify-center">
  <img 
    src="/screenshots/homepage-hero-desktop.png" 
    alt="JusticeHub Homepage Hero"
    className="w-full h-full object-cover"
  />
</div>
\`\`\`
`;

  fs.writeFileSync(path.join(config.screenshotDir, 'README.md'), indexContent);
  console.log('📝 Created screenshot index: screenshots/README.md');
}

// Run the screenshot script
takeAllScreenshots().catch(console.error);