/**
 * Firecrawl Integration for JusticeHub
 *
 * Provides web scraping and crawling capabilities using Firecrawl API
 * with built-in LLM extraction for structured data.
 */

import FirecrawlApp from '@mendable/firecrawl-js';

if (!process.env.FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY is required. Get one at https://firecrawl.dev');
}

export const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

/**
 * Service data schema for extraction
 */
export interface ServiceData {
  name: string;
  description: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  services?: string[];
  hours?: string;
  eligibility?: string;
  cost?: string;
  categories?: string[];
}

/**
 * Scrape a single service page and extract structured data
 */
export async function scrapeServicePage(url: string): Promise<ServiceData | null> {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['extract'],
      extract: {
        prompt: 'Extract service information from this page',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Service or organization name' },
            description: { type: 'string', description: 'Brief description of services (2-3 sentences)' },
            phone: { type: 'string', description: 'Phone number for contacting the service' },
            email: { type: 'string', description: 'Email address' },
            address: { type: 'string', description: 'Physical address' },
            website: { type: 'string', description: 'Website URL' },
            services: { type: 'array', items: { type: 'string' }, description: 'List of specific services offered' },
            hours: { type: 'string', description: 'Opening hours (e.g., Mon-Fri 9am-5pm)' },
            eligibility: { type: 'string', description: 'Who can access the service (age, location, etc.)' },
            cost: { type: 'string', description: 'Cost information (free, low cost, fee for service)' },
            categories: { type: 'array', items: { type: 'string' }, description: 'Service categories (legal, housing, mental health, etc.)' }
          },
          required: ['name']
        }
      }
    });

    return result.extract as ServiceData;
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Crawl an entire service directory and extract all service pages
 */
export async function crawlServiceDirectory(
  startUrl: string,
  options: {
    maxPages?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
    waitForResults?: boolean;
  } = {}
) {
  try {
    const result = await firecrawl.crawlUrl(startUrl, {
      limit: options.maxPages || 100,
      scrapeOptions: {
        formats: ['markdown', 'extract'],
        extract: {
          schema: {
            services: 'Array of services found on this page, each with name, description, contact details'
          }
        }
      },
      includePaths: options.includePatterns,
      excludePaths: options.excludePatterns,
      waitForResults: options.waitForResults ?? true
    });

    return result;
  } catch (error) {
    console.error(`Failed to crawl ${startUrl}:`, error);
    throw error;
  }
}

/**
 * Search for a service or organization and scrape the first result
 */
export async function searchAndScrape(query: string): Promise<ServiceData | null> {
  try {
    // Use Firecrawl's search capability
    const searchResults = await firecrawl.search(query, {
      limit: 1
    });

    if (searchResults && searchResults.length > 0) {
      const topResult = searchResults[0];
      return await scrapeServicePage(topResult.url);
    }

    return null;
  } catch (error) {
    console.error(`Failed to search for "${query}":`, error);
    return null;
  }
}

/**
 * Enrich an existing service with missing data from its website
 */
export async function enrichService(websiteUrl: string): Promise<Partial<ServiceData>> {
  try {
    const result = await firecrawl.scrapeUrl(websiteUrl, {
      formats: ['extract'],
      extract: {
        schema: {
          phone: 'Main phone number',
          email: 'Contact email address',
          address: 'Physical address',
          hours: 'Opening hours',
          services: 'List of services offered',
          eligibility: 'Eligibility criteria',
          cost: 'Cost information'
        }
      }
    });

    return result.extract as Partial<ServiceData>;
  } catch (error) {
    console.error(`Failed to enrich service from ${websiteUrl}:`, error);
    return {};
  }
}

/**
 * Batch scrape multiple URLs with rate limiting
 */
export async function batchScrape(
  urls: string[],
  options: {
    delayMs?: number;
    onProgress?: (current: number, total: number, result: ServiceData | null) => void;
  } = {}
): Promise<Array<ServiceData | null>> {
  const results: Array<ServiceData | null> = [];
  const delay = options.delayMs || 1000; // Default 1 second between requests

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await scrapeServicePage(url);
    results.push(result);

    if (options.onProgress) {
      options.onProgress(i + 1, urls.length, result);
    }

    // Rate limiting delay
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Map extracted category strings to JusticeHub category IDs
 */
export function mapToJusticeHubCategories(categories: string[] = []): string[] {
  const categoryMap: Record<string, string[]> = {
    'legal': ['legal_aid', 'advocacy'],
    'law': ['legal_aid'],
    'court': ['court_support', 'legal_aid'],
    'housing': ['housing'],
    'accommodation': ['housing'],
    'homeless': ['housing', 'crisis_support'],
    'mental health': ['mental_health'],
    'counseling': ['mental_health'],
    'counselling': ['mental_health'],
    'psychology': ['mental_health'],
    'wellbeing': ['mental_health'],
    'drug': ['substance_abuse'],
    'alcohol': ['substance_abuse'],
    'substance': ['substance_abuse'],
    'addiction': ['substance_abuse'],
    'family': ['family_support'],
    'domestic violence': ['family_support', 'crisis_support'],
    'child protection': ['family_support'],
    'education': ['education_training'],
    'training': ['education_training'],
    'employment': ['education_training'],
    'job': ['education_training'],
    'aboriginal': ['cultural_support'],
    'indigenous': ['cultural_support'],
    'torres strait': ['cultural_support'],
    'crisis': ['crisis_support'],
    'emergency': ['crisis_support'],
    'case management': ['case_management'],
    'support coordination': ['case_management'],
    'youth development': ['youth_development'],
    'mentoring': ['youth_development'],
    'recreation': ['recreation'],
    'sport': ['recreation'],
    'disability': ['disability_support'],
    'multicultural': ['multicultural_support']
  };

  const mappedCategories = new Set<string>();

  for (const category of categories) {
    const lowerCategory = category.toLowerCase();
    for (const [key, values] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key)) {
        values.forEach(v => mappedCategories.add(v));
      }
    }
  }

  return mappedCategories.size > 0 ? Array.from(mappedCategories) : ['support'];
}

/**
 * Test Firecrawl connection and API key
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await firecrawl.scrapeUrl('https://example.com', {
      formats: ['markdown']
    });
    return result.success;
  } catch (error) {
    console.error('Firecrawl connection test failed:', error);
    return false;
  }
}
