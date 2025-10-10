/**
 * Web scraper using Playwright for browser automation
 */

import { chromium, Browser, Page } from 'playwright';
import { AIExtractor } from './ai-extractor';
import { ScraperConfig, ScrapeResult } from './types';

export class WebScraper {
  private browser: Browser | null = null;
  private aiExtractor: AIExtractor;

  constructor() {
    this.aiExtractor = new AIExtractor();
  }

  /**
   * Initialize browser
   */
  async init(headless: boolean = true) {
    this.browser = await chromium.launch({ headless });
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape a website and extract services using AI
   */
  async scrape(config: ScraperConfig): Promise<ScrapeResult> {
    if (!this.browser) {
      await this.init(config.headless);
    }

    const page = await this.browser!.newPage();

    try {
      console.log(`🌐 Navigating to: ${config.url}`);

      // Navigate to page
      await page.goto(config.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      console.log('📄 Extracting page content...');

      // Get page content
      const html = await page.content();
      const title = await page.title();

      console.log(`📝 Page title: ${title}`);
      console.log(`📏 HTML length: ${html.length} characters`);

      // Extract services using AI
      console.log('🤖 Using Claude AI to extract services...');
      const services = await this.aiExtractor.extractServices(html, config.url);

      console.log(`✅ Extracted ${services.length} services`);

      return {
        success: true,
        services,
        metadata: {
          source_url: config.url,
          scraped_at: new Date().toISOString(),
          total_found: services.length,
          total_extracted: services.length,
        },
      };
    } catch (error) {
      console.error('❌ Scraping error:', error);

      return {
        success: false,
        services: [],
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          source_url: config.url,
          scraped_at: new Date().toISOString(),
          total_found: 0,
          total_extracted: 0,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeMultiple(configs: ScraperConfig[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const config of configs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Scraping: ${config.name}`);
      console.log('='.repeat(60));

      const result = await this.scrape(config);
      results.push(result);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}
