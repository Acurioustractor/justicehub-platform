import FirecrawlApp from 'firecrawl';
import pQueue from 'p-queue';
import { createHash } from 'crypto';
import NodeCache from 'node-cache';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class FirecrawlClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Firecrawl API key is required');
    }

    this.firecrawl = new FirecrawlApp({ apiKey });
    
    // Rate limiting queue
    this.queue = new pQueue({
      concurrency: options.concurrency || 2,
      interval: 1000,
      intervalCap: options.rateLimit || 2, // requests per second
    });

    // Caching for duplicate detection
    this.cache = new NodeCache({ 
      stdTTL: options.cacheTTL || 3600, // 1 hour default
      checkperiod: 600 
    });

    // Options
    this.options = {
      respectRobotsTxt: options.respectRobotsTxt !== false,
      userAgent: options.userAgent || 'YouthJusticeServiceFinder/1.0',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      totalBytesProcessed: 0
    };
  }

  /**
   * Generate cache key from URL and options
   */
  generateCacheKey(url, options = {}) {
    const data = JSON.stringify({ url, ...options });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Scrape a single URL with intelligent extraction
   */
  async scrapeUrl(url, extractionSchema = null) {
    const cacheKey = this.generateCacheKey(url, extractionSchema);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cachedResponses++;
      logger.debug({ url }, 'Returning cached response');
      return cached;
    }

    return this.queue.add(async () => {
      this.stats.totalRequests++;
      
      try {
        logger.info({ url }, 'Scraping URL');
        
        const options = {
          formats: ['markdown', 'html', 'links'],
          onlyMainContent: true,
          waitFor: 2000, // Wait for dynamic content
          actions: [], // Can add click actions etc
        };

        // Add extraction schema if provided
        if (extractionSchema) {
          options.extract = {
            schema: extractionSchema,
            systemPrompt: `Extract youth justice services information. Focus on:
              - Service names and descriptions
              - Eligibility criteria (especially age ranges)
              - Contact information
              - Service locations and coverage areas
              - Categories of support provided
              - Indigenous-specific services
              - Operating hours
              Be thorough but only extract factual information present on the page.`
          };
        }

        const result = await this.retryWithBackoff(async () => {
          return await this.firecrawl.scrapeUrl(url, options);
        });

        if (result.success) {
          this.stats.successfulRequests++;
          
          // Process and enhance the result
          const enhanced = {
            ...result,
            metadata: {
              scrapedAt: new Date().toISOString(),
              url,
              contentHash: this.generateContentHash(result.data?.content || ''),
              ...(result.metadata || {})
            }
          };

          // Cache the result
          this.cache.set(cacheKey, enhanced);
          
          // Update stats
          if (result.data?.content) {
            this.stats.totalBytesProcessed += Buffer.byteLength(result.data.content);
          }

          return enhanced;
        } else {
          throw new Error(result.error || 'Scraping failed');
        }
      } catch (error) {
        this.stats.failedRequests++;
        logger.error({ url, error: error.message }, 'Failed to scrape URL');
        throw error;
      }
    });
  }

  /**
   * Crawl an entire website with smart navigation
   */
  async crawlWebsite(startUrl, options = {}) {
    const crawlOptions = {
      url: startUrl,
      maxDepth: options.maxDepth || 3,
      limit: options.limit || 100,
      allowBackwardLinks: false,
      allowExternalLinks: false,
      ignoreSitemap: false,
      scrapeOptions: {
        formats: ['markdown', 'structured_data'],
        onlyMainContent: true
      },
      ...options
    };

    // Define URL patterns to include/exclude
    if (options.includePatterns) {
      crawlOptions.include = options.includePatterns;
    }
    
    if (options.excludePatterns) {
      crawlOptions.exclude = options.excludePatterns;
    }

    logger.info({ startUrl, options: crawlOptions }, 'Starting website crawl');

    try {
      const result = await this.firecrawl.crawlUrl(startUrl, crawlOptions, true);
      
      if (result.success) {
        logger.info({ 
          pagesFound: result.data?.length,
          startUrl 
        }, 'Crawl completed successfully');
        
        return {
          success: true,
          pages: result.data || [],
          metadata: {
            crawledAt: new Date().toISOString(),
            totalPages: result.data?.length || 0,
            startUrl
          }
        };
      } else {
        throw new Error(result.error || 'Crawl failed');
      }
    } catch (error) {
      logger.error({ startUrl, error: error.message }, 'Crawl failed');
      throw error;
    }
  }

  /**
   * Search the web for service directories
   */
  async searchWeb(query, options = {}) {
    const searchOptions = {
      query,
      limit: options.limit || 10,
      ...options
    };

    logger.info({ query, options: searchOptions }, 'Searching web');

    try {
      const result = await this.firecrawl.search(query, searchOptions);
      
      if (result.success) {
        return {
          success: true,
          results: result.data || [],
          metadata: {
            searchedAt: new Date().toISOString(),
            query,
            totalResults: result.data?.length || 0
          }
        };
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (error) {
      logger.error({ query, error: error.message }, 'Search failed');
      throw error;
    }
  }

  /**
   * Map a website to understand its structure
   */
  async mapWebsite(url, options = {}) {
    const mapOptions = {
      search: options.search,
      ignoreSitemap: options.ignoreSitemap || false,
      limit: options.limit || 500,
      ...options
    };

    logger.info({ url, options: mapOptions }, 'Mapping website');

    try {
      const result = await this.firecrawl.mapUrl(url, mapOptions);
      
      if (result.success) {
        // Analyze the sitemap for service-related pages
        const servicePages = this.identifyServicePages(result.data || []);
        
        return {
          success: true,
          links: result.data || [],
          servicePages,
          metadata: {
            mappedAt: new Date().toISOString(),
            totalLinks: result.data?.length || 0,
            url
          }
        };
      } else {
        throw new Error(result.error || 'Mapping failed');
      }
    } catch (error) {
      logger.error({ url, error: error.message }, 'Mapping failed');
      throw error;
    }
  }

  /**
   * Check crawl status for async operations
   */
  async checkCrawlStatus(crawlId) {
    try {
      const result = await this.firecrawl.checkCrawlStatus(crawlId);
      return result;
    } catch (error) {
      logger.error({ crawlId, error: error.message }, 'Failed to check crawl status');
      throw error;
    }
  }

  /**
   * Cancel an ongoing crawl
   */
  async cancelCrawl(crawlId) {
    try {
      const result = await this.firecrawl.cancelCrawl(crawlId);
      return result;
    } catch (error) {
      logger.error({ crawlId, error: error.message }, 'Failed to cancel crawl');
      throw error;
    }
  }

  /**
   * Identify service-related pages from a sitemap
   */
  identifyServicePages(links) {
    const serviceKeywords = [
      'service', 'program', 'support', 'help', 'assistance',
      'youth', 'young', 'teen', 'adolescent',
      'justice', 'legal', 'court', 'diversion',
      'mental-health', 'counseling', 'therapy',
      'education', 'training', 'employment',
      'housing', 'accommodation', 'shelter',
      'family', 'parent', 'carer'
    ];

    const excludePatterns = [
      /\/(about|contact|privacy|terms|cookies|careers|news|blog|press)\//i,
      /\.(pdf|doc|docx|xls|xlsx)$/i,
      /\/(wp-admin|admin|login|register)\//i
    ];

    return links.filter(link => {
      // Exclude non-service pages
      if (excludePatterns.some(pattern => pattern.test(link))) {
        return false;
      }

      // Include if URL contains service keywords
      const urlLower = link.toLowerCase();
      return serviceKeywords.some(keyword => urlLower.includes(keyword));
    });
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.options.maxRetries) {
        throw error;
      }

      const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
      logger.warn({ 
        error: error.message, 
        attempt, 
        nextDelay: delay 
      }, 'Retrying after error');

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.keys().length,
      queueSize: this.queue.size,
      queuePending: this.queue.pending
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Batch scrape multiple URLs efficiently
   */
  async batchScrape(urls, extractionSchema = null) {
    logger.info({ urlCount: urls.length }, 'Starting batch scrape');
    
    const results = await Promise.allSettled(
      urls.map(url => this.scrapeUrl(url, extractionSchema))
    );

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map((r, i) => ({
      url: urls[i],
      error: r.reason.message
    }));

    logger.info({ 
      successful: successful.length, 
      failed: failed.length 
    }, 'Batch scrape completed');

    return { successful, failed };
  }
}

// Extraction schemas for different types of service pages
export const extractionSchemas = {
  serviceDirectory: {
    services: [{
      name: 'string',
      description: 'string',
      eligibility: {
        ageRange: 'string',
        criteria: ['string']
      },
      contact: {
        phone: 'string',
        email: 'string',
        address: 'string',
        website: 'string'
      },
      categories: ['string'],
      location: 'string',
      hours: 'string'
    }]
  },
  
  organizationPage: {
    organization: {
      name: 'string',
      description: 'string',
      services: ['string'],
      contact: {
        phone: 'string',
        email: 'string',
        address: 'string',
        website: 'string'
      },
      locations: [{
        address: 'string',
        services: ['string']
      }]
    }
  },
  
  servicePage: {
    service: {
      name: 'string',
      description: 'string',
      eligibility: {
        age: {
          min: 'number',
          max: 'number'
        },
        requirements: ['string'],
        documentation: ['string']
      },
      process: {
        howToApply: 'string',
        waitTime: 'string',
        cost: 'string'
      },
      contact: {
        phone: ['string'],
        email: 'string',
        address: 'string',
        hours: 'string'
      },
      categories: ['string'],
      languages: ['string'],
      accessibility: {
        wheelchair: 'boolean',
        interpreters: 'boolean'
      }
    }
  }
};

// Singleton instance with environment configuration
let instance;

export function getFirecrawlClient() {
  if (!instance) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }

    instance = new FirecrawlClient(apiKey, {
      concurrency: parseInt(process.env.FIRECRAWL_CONCURRENCY || '2'),
      rateLimit: parseInt(process.env.FIRECRAWL_RATE_LIMIT || '2'),
      cacheTTL: parseInt(process.env.FIRECRAWL_CACHE_TTL || '3600'),
      maxRetries: parseInt(process.env.FIRECRAWL_MAX_RETRIES || '3'),
      timeout: parseInt(process.env.FIRECRAWL_TIMEOUT || '30000')
    });
  }
  
  return instance;
}