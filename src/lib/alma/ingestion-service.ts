/**
 * ALMA Ingestion Service
 *
 * Automated document collection from web sources using best-in-class tools:
 * - Firecrawl: Web scraping and crawling
 * - Jina AI Reader: Clean markdown from any URL
 * - Tavily: Research-grade search
 * - Supabase Storage: Document storage
 * - Claude: Extraction and structuring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import { extractionService } from './extraction-service';

// Lazy-initialized Supabase client (avoids build-time errors)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    _supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabase;
}

// Lazy-initialized Firecrawl client
let _firecrawl: FirecrawlApp | null = null;

function getFirecrawl(): FirecrawlApp {
  if (!_firecrawl) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Firecrawl API key');
    }
    _firecrawl = new FirecrawlApp({ apiKey });
  }
  return _firecrawl;
}

/**
 * Source types for ingestion
 */
export type SourceType =
  | 'url'           // Single URL
  | 'website'       // Entire website crawl
  | 'pdf'           // PDF document
  | 'search'        // Search query results
  | 'rss'           // RSS feed
  | 'api';          // API endpoint

/**
 * Ingestion job status
 */
interface IngestionJob {
  id: string;
  source_type: SourceType;
  source_url: string;
  status: 'pending' | 'crawling' | 'extracting' | 'completed' | 'failed';
  documents_found: number;
  entities_created: number;
  started_at: string;
  completed_at?: string;
  error?: string;
  metadata: any;
}

/**
 * Australian Youth Justice Data Sources
 */
export const ALMA_DATA_SOURCES = {
  // Government reports and research
  government: [
    {
      name: 'AIHW - Youth Justice',
      url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice',
      crawl: true,
      patterns: ['*/reports/*', '*/data/*'],
    },
    {
      name: 'Productivity Commission',
      url: 'https://www.pc.gov.au/research/completed/youth-justice',
      crawl: true,
    },
    {
      name: 'Australian Institute of Criminology',
      url: 'https://www.aic.gov.au/publications/youth-justice',
      crawl: true,
    },
  ],

  // State/Territory youth justice departments
  states: [
    {
      name: 'Youth Justice NSW',
      url: 'https://www.dcj.nsw.gov.au/service-providers/young-offenders.html',
      crawl: true,
    },
    {
      name: 'Youth Justice Victoria',
      url: 'https://www.justice.vic.gov.au/youth-justice',
      crawl: true,
    },
    {
      name: 'Queensland Youth Justice',
      url: 'https://www.cyjma.qld.gov.au/youth-justice',
      crawl: true,
    },
  ],

  // Indigenous-led organizations
  indigenous: [
    {
      name: 'National Aboriginal and Torres Strait Islander Legal Services',
      url: 'https://www.natsils.org.au/publications',
      crawl: true,
    },
    {
      name: 'Aboriginal Legal Service NSW/ACT',
      url: 'https://www.alsnswact.org.au/resources',
      crawl: true,
    },
  ],

  // Research institutions
  research: [
    {
      name: 'Jesuit Social Services - Youth Justice',
      url: 'https://jss.org.au/what-we-do/youth-justice/',
      crawl: true,
    },
    {
      name: 'Griffith University - Youth Justice Research',
      url: 'https://www.griffith.edu.au/criminology-institute/research/youth-justice',
      crawl: true,
    },
  ],

  // Program evaluations
  evaluations: [
    {
      name: 'What Works for Children Social Care',
      url: 'https://whatworks-csc.org.uk/category/youth-justice/',
      crawl: true,
    },
  ],
};

/**
 * Ingestion Service - Automated document collection and processing
 */
export class IngestionService {
  /**
   * Scrape a single URL using Firecrawl
   */
  async scrapeUrl(url: string, userId: string): Promise<{
    success: boolean;
    markdown?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      console.log(`🔍 Scraping: ${url}`);

      const scrapeResult = await getFirecrawl().scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000,
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          error: 'Firecrawl scrape failed',
        };
      }

      // Store in Supabase Storage
      const filename = this.generateFilename(url, 'md');
      const storagePath = `ingestion/${filename}`;

      await getSupabase().storage
        .from('documents')
        .upload(storagePath, scrapeResult.markdown || '', {
          contentType: 'text/markdown',
          upsert: true,
        });

      return {
        success: true,
        markdown: scrapeResult.markdown,
        metadata: scrapeResult.metadata,
      };
    } catch (err) {
      console.error('Scrape error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Crawl an entire website using Firecrawl
   */
  async crawlWebsite(
    url: string,
    userId: string,
    options: {
      maxPages?: number;
      allowedDomains?: string[];
      excludePaths?: string[];
      includePaths?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    try {
      console.log(`🕷️  Crawling website: ${url}`);

      const crawlResult = await getFirecrawl().crawlUrl(url, {
        limit: options.maxPages || 50,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
        excludePaths: options.excludePaths,
        includePaths: options.includePaths,
      });

      if (!crawlResult.success) {
        return {
          success: false,
          error: 'Firecrawl crawl failed',
        };
      }

      // Store job ID for tracking
      const jobId = crawlResult.id || `crawl-${Date.now()}`;

      // Create ingestion job record
      await this.createIngestionJob({
        source_type: 'website',
        source_url: url,
        status: 'crawling',
        metadata: {
          firecrawl_job_id: crawlResult.id,
          max_pages: options.maxPages,
          user_id: userId,
        },
      });

      return {
        success: true,
        jobId,
      };
    } catch (err) {
      console.error('Crawl error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Use Jina AI Reader for clean markdown extraction
   */
  async readWithJina(url: string): Promise<{
    success: boolean;
    markdown?: string;
    error?: string;
  }> {
    try {
      console.log(`📖 Reading with Jina: ${url}`);

      // Jina Reader API: https://r.jina.ai/{url}
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
          'X-Return-Format': 'markdown',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Jina API error: ${response.status}`,
        };
      }

      const markdown = await response.text();

      return {
        success: true,
        markdown,
      };
    } catch (err) {
      console.error('Jina read error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for youth justice research using Tavily
   */
  async searchResearch(
    query: string,
    options: {
      maxResults?: number;
      domains?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    results?: Array<{
      url: string;
      title: string;
      content: string;
      score: number;
    }>;
    error?: string;
  }> {
    try {
      console.log(`🔎 Searching: ${query}`);

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          max_results: options.maxResults || 10,
          search_depth: 'advanced',
          include_domains: options.domains,
          include_answer: false,
          include_raw_content: true,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Tavily API error: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        results: data.results,
      };
    } catch (err) {
      console.error('Search error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Ingest and extract from a single document
   */
  async ingestDocument(
    url: string,
    userId: string,
    options: {
      source_type?: SourceType;
      use_jina?: boolean;
      extract_immediately?: boolean;
      consent_level?: string;
      cultural_authority?: string;
    } = {}
  ): Promise<{
    success: boolean;
    entities_created?: number;
    errors?: string[];
    jobId?: string;
  }> {
    try {
      // Step 1: Fetch content
      let markdown: string | undefined;

      if (options.use_jina) {
        const jinaResult = await this.readWithJina(url);
        if (!jinaResult.success) {
          throw new Error(`Jina read failed: ${jinaResult.error}`);
        }
        markdown = jinaResult.markdown;
      } else {
        const scrapeResult = await this.scrapeUrl(url, userId);
        if (!scrapeResult.success) {
          throw new Error(`Scrape failed: ${scrapeResult.error}`);
        }
        markdown = scrapeResult.markdown;
      }

      if (!markdown) {
        throw new Error('No content extracted');
      }

      // Step 2: Extract ALMA entities using Claude
      if (options.extract_immediately) {
        const extraction = await extractionService.extractFromText(
          markdown,
          url,
          userId
        );

        const created = await extractionService.createEntitiesFromExtraction(
          extraction,
          userId,
          {
            default_consent_level: options.consent_level as any,
            cultural_authority: options.cultural_authority,
            auto_publish: false,
          }
        );

        const total =
          created.created_interventions.length +
          created.created_evidence.length +
          created.created_outcomes.length +
          created.created_contexts.length;

        return {
          success: true,
          entities_created: total,
          errors: created.errors,
        };
      }

      // Store for later processing
      const jobId = await this.createIngestionJob({
        source_type: options.source_type || 'url',
        source_url: url,
        status: 'pending',
        metadata: {
          user_id: userId,
          content_length: markdown.length,
        },
      });

      return {
        success: true,
        jobId,
      };
    } catch (err) {
      console.error('Ingest error:', err);
      return {
        success: false,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      };
    }
  }

  /**
   * Ingest all documents from a curated source
   */
  async ingestSource(
    source: {
      name: string;
      url: string;
      crawl?: boolean;
      patterns?: string[];
    },
    userId: string
  ): Promise<{
    success: boolean;
    jobId?: string;
    documentsFound?: number;
    error?: string;
  }> {
    try {
      console.log(`📚 Ingesting source: ${source.name}`);

      if (source.crawl) {
        // Crawl entire site
        return await this.crawlWebsite(source.url, userId, {
          maxPages: 100,
          includePaths: source.patterns,
        });
      } else {
        // Single document
        const result = await this.ingestDocument(source.url, userId, {
          extract_immediately: false,
        });

        return {
          success: result.success,
          jobId: result.jobId,
          documentsFound: 1,
          error: result.errors?.[0],
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Ingest all curated ALMA data sources
   */
  async ingestAllSources(
    userId: string,
    categories: Array<keyof typeof ALMA_DATA_SOURCES> = [
      'government',
      'states',
      'indigenous',
      'research',
      'evaluations',
    ]
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    jobs: string[];
  }> {
    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      jobs: [] as string[],
    };

    for (const category of categories) {
      const sources = ALMA_DATA_SOURCES[category];

      for (const source of sources) {
        results.total++;

        const result = await this.ingestSource(source, userId);

        if (result.success && result.jobId) {
          results.successful++;
          results.jobs.push(result.jobId);
        } else {
          results.failed++;
          console.error(`Failed to ingest ${source.name}:`, result.error);
        }

        // Rate limiting - wait 2 seconds between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Search and ingest research on specific topics
   */
  async ingestTopicResearch(
    topic: string,
    userId: string,
    options: {
      maxDocuments?: number;
      domains?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    documentsIngested: number;
    errors: string[];
  }> {
    try {
      // Search for research
      const searchResult = await this.searchResearch(
        `Australian youth justice ${topic}`,
        {
          maxResults: options.maxDocuments || 10,
          domains: options.domains,
        }
      );

      if (!searchResult.success || !searchResult.results) {
        return {
          success: false,
          documentsIngested: 0,
          errors: [searchResult.error || 'Search failed'],
        };
      }

      const errors: string[] = [];
      let ingested = 0;

      // Ingest each result
      for (const result of searchResult.results) {
        const ingestResult = await this.ingestDocument(result.url, userId, {
          extract_immediately: true,
          consent_level: 'Public Knowledge Commons',
        });

        if (ingestResult.success) {
          ingested++;
        } else {
          errors.push(
            `${result.url}: ${ingestResult.errors?.join(', ') || 'Unknown error'}`
          );
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      return {
        success: true,
        documentsIngested: ingested,
        errors,
      };
    } catch (err) {
      return {
        success: false,
        documentsIngested: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      };
    }
  }

  /**
   * Process a crawl job (check status and extract entities)
   */
  async processCrawlJob(jobId: string, userId: string): Promise<{
    success: boolean;
    status?: string;
    documentsProcessed?: number;
    entitiesCreated?: number;
    error?: string;
  }> {
    try {
      // Check Firecrawl job status
      const status = await getFirecrawl().checkCrawlStatus(jobId);

      if (status.status === 'completed' && status.data) {
        // Process all crawled pages
        let totalEntities = 0;

        for (const page of status.data) {
          if (page.markdown) {
            const extraction = await extractionService.extractFromText(
              page.markdown,
              page.metadata?.sourceURL || jobId,
              userId
            );

            const created = await extractionService.createEntitiesFromExtraction(
              extraction,
              userId,
              {
                default_consent_level: 'Public Knowledge Commons',
              }
            );

            const count =
              created.created_interventions.length +
              created.created_evidence.length +
              created.created_outcomes.length +
              created.created_contexts.length;

            totalEntities += count;
          }
        }

        // Update job record
        await this.updateIngestionJob(jobId, {
          status: 'completed',
          documents_found: status.data.length,
          entities_created: totalEntities,
        });

        return {
          success: true,
          status: 'completed',
          documentsProcessed: status.data.length,
          entitiesCreated: totalEntities,
        };
      }

      return {
        success: true,
        status: status.status,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Create ingestion job record
   */
  private async createIngestionJob(job: Partial<IngestionJob>): Promise<string> {
    const { data, error } = await getSupabase()
      .from('alma_ingestion_jobs')
      .insert({
        ...job,
        started_at: new Date().toISOString(),
        documents_found: 0,
        entities_created: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create ingestion job:', error);
      return `job-${Date.now()}`;
    }

    return data.id;
  }

  /**
   * Update ingestion job record
   */
  private async updateIngestionJob(
    jobId: string,
    updates: Partial<IngestionJob>
  ): Promise<void> {
    await getSupabase()
      .from('alma_ingestion_jobs')
      .update({
        ...updates,
        completed_at: updates.status === 'completed' ? new Date().toISOString() : undefined,
      })
      .eq('id', jobId);
  }

  /**
   * Generate filename from URL
   */
  private generateFilename(url: string, extension: string): string {
    const urlObj = new URL(url);
    const slug = urlObj.pathname
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .substring(0, 100);
    const timestamp = Date.now();
    return `${timestamp}-${slug}.${extension}`;
  }
}

// Export singleton
export const ingestionService = new IngestionService();
