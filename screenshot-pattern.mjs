#!/usr/bin/env node
import { chromium } from 'playwright';

async function captureScrollytelling() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[Browser ${msg.type()}]:`, text);
  });

  page.on('pageerror', err => {
    console.error('[Page Error]:', err.message);
  });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3003/stories/the-pattern');

  // Wait for the page to load
  await page.waitForTimeout(3000);

  // Capture hero section
  console.log('📸 Capturing hero section...');
  await page.screenshot({ path: '/tmp/pattern-hero.png', fullPage: false });

  // Scroll to first section
  console.log('📸 Scrolling to Step 1...');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/pattern-step1.png', fullPage: false });

  // Scroll to second section
  console.log('📸 Scrolling to Step 2...');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/pattern-step2.png', fullPage: false });

  // Scroll to third section
  console.log('📸 Scrolling to Step 3...');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/pattern-step3.png', fullPage: false });

  // Get current step from debug display
  const currentStep = await page.textContent('.fixed.top-4.right-4');
  console.log('\n📊 Debug info:', currentStep);

  await browser.close();

  console.log('\n✅ Screenshots saved to /tmp/');
  console.log('   - pattern-hero.png (Hero section)');
  console.log('   - pattern-step1.png (Step 1: Crisis)');
  console.log('   - pattern-step2.png (Step 2: Evidence)');
  console.log('   - pattern-step3.png (Step 3: Community Wisdom)');
}

captureScrollytelling().catch(console.error);
