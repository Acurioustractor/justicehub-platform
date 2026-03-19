/**
 * Base Scraper Class
 * 
 * Foundational scraping infrastructure with AI integration and quality controls
 */

import { createFirecrawlClient } from '@/lib/api/config';
import { env } from '@/lib/env';
import { createSupabaseClient } from '@/lib/supabase/client';
import { callBackgroundLLM as callLLM } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { scrapeViaJina, shouldPreferFirecrawl } from '@/lib/scraping/jina-reader';
import type {
  DataSource,
  ProcessingJob,
  AIExtractionRequest,
  AIExtractionResult,
  OrganizationProfile,
  ScrapingConfig,
  QualityFlag,
  JobStatus,
  JobPriority
} from '../types';

export abstract class BaseScraper {
  protected supabase = createSupabaseClient();
  protected dataSource: DataSource;
  protected config: ScrapingConfig;
  
  // Firecrawl client - initialized only when needed
  private firecrawlClient?: any;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.config = dataSource.scraping_config;
  }

  // Abstract methods that implementing classes must define
  abstract extractOrganizationData(url: string): Promise<Partial<OrganizationProfile>>;
  abstract validateExtractedData(data: Partial<OrganizationProfile>): Promise<QualityFlag[]>;
  abstract discoverOrganizationUrls(): Promise<string[]>;

  /**
   * Main scraping workflow entry point
   */
  async scrape(): Promise<ProcessingJob> {
    const job = await this.createJob();
    
    try {
      await this.updateJobStatus(job.id, 'running');
      
      // Discovery phase
      const urls = await this.discoverOrganizationUrls();
      await this.updateJobProgress(job.id, 10, `Discovered ${urls.length} URLs`);
      
      // Extraction phase
      const results: Array<{url: string, data: Partial<OrganizationProfile>, flags: QualityFlag[]}> = [];
      const totalUrls = urls.length;
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        
        try {
          const data = await this.extractOrganizationData(url);
          const flags = await this.validateExtractedData(data);
          
          results.push({ url, data, flags });
          
          // Rate limiting
          await this.respectRateLimit();
          
          // Update progress
          const progress = Math.round(((i + 1) / totalUrls) * 80) + 10; // 10-90%
          await this.updateJobProgress(job.id, progress);
          
        } catch (error) {
          console.error(`Failed to extract data from ${url}:`, error);
          await this.logError(job.id, url, error as Error);
        }
      }
      
      // Processing and storage phase
      await this.updateJobProgress(job.id, 90, 'Processing and storing results');
      const processedCount = await this.storeResults(results);
      
      // Complete job
      await this.updateJobStatus(job.id, 'completed');
      await this.updateJobProgress(job.id, 100, `Completed: ${processedCount} organizations processed`);
      
      return await this.getJob(job.id);
      
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed', (error as Error).message);
      throw error;
    }
  }

  /**
   * Extract content from URL — tries Jina (free) first, falls back to Firecrawl
   */
  protected async extractContentWithFirecrawl(url: string): Promise<{
    content: string;
    metadata: any;
  }> {
    // Try Jina Reader first (free)
    if (!shouldPreferFirecrawl()) {
      const jinaContent = await scrapeViaJina(url);
      if (jinaContent && jinaContent.length >= 200) {
        console.log(`[BaseScraper] Jina success for ${url} (${jinaContent.length} chars, free)`);
        return { content: jinaContent, metadata: { source: 'jina' } };
      }
    }

    // Fall back to Firecrawl (paid)
    if (!this.firecrawlClient) {
      this.firecrawlClient = createFirecrawlClient();
    }

    const response = await this.firecrawlClient.request('/scrape', {
      method: 'POST',
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'p', 'h1', 'h2', 'h3', 'div', 'section', 'article'],
        excludeTags: ['script', 'style', 'nav', 'footer', 'ads'],
        onlyMainContent: true,
        timeout: this.config.timeout_ms || 30000
      })
    }, `firecrawl-${this.dataSource.id}`);

    return {
      content: response.markdown || response.html || '',
      metadata: response.metadata || {}
    };
  }

  /**
   * Use AI to extract structured data from unstructured content.
   * Uses multi-provider rotation (Groq/Gemini free → DeepSeek → OpenAI → Anthropic).
   * modelPreference param kept for API compat but ignored (rotation handles selection).
   */
  protected async extractWithAI(
    content: string,
    extractionGoals: string[],
    _modelPreference: 'openai' | 'anthropic' | 'auto' = 'auto'
  ): Promise<AIExtractionResult> {
    const systemPrompt = this.buildExtractionPrompt(extractionGoals);
    const startTime = Date.now();

    const responseText = await callLLM(
      `Extract organization data from this content and return as JSON:\n\n${content}`,
      {
        systemPrompt,
        temperature: 0.1,
        maxTokens: 4000,
      }
    );

    const processingTime = Date.now() - startTime;
    const extractedData = parseJSON<Record<string, unknown>>(responseText);

    return {
      request_id: crypto.randomUUID(),
      extracted_data: extractedData,
      confidence_scores: this.calculateConfidenceScores(extractedData),
      processing_notes: [`Extracted using multi-provider rotation`],
      flagged_issues: [],
      processing_time_ms: processingTime,
      ai_model_used: 'auto-rotation'
    };
  }

  /**
   * Build extraction prompt based on goals
   */
  private buildExtractionPrompt(goals: string[]): string {
    return `You are an expert data extraction system for youth justice organizations. Extract the following information from web content and return it as structured JSON:

REQUIRED FIELDS:
- name: Organization name
- description: Brief description of services
- website_url: Primary website URL
- email: Contact email
- phone: Contact phone
- address: Physical address details

OPTIONAL FIELDS (extract if available):
- services: Array of service offerings with descriptions
- target_demographics: Who the organization serves
- geographical_coverage: Service area/coverage
- funding_sources: How the organization is funded
- capacity_indicators: Size, staff, caseload metrics

EXTRACTION GUIDELINES:
1. Only extract factual information explicitly stated in the content
2. Do not infer or assume information not clearly present
3. Prioritize official contact information over generic webpage details
4. Focus on youth justice, legal aid, community support, and related services
5. Return confidence scores for each extracted field (0.0-1.0)

Return the data as a JSON object with the structure matching OrganizationProfile type.
Include a confidence_scores object with confidence levels for each extracted field.`;
  }

  /**
   * Calculate confidence scores for extracted data
   */
  private calculateConfidenceScores(data: any): any {
    const scores = {
      overall: 0,
      contact_info: 0,
      services: 0,
      demographics: 0,
      geographical: 0,
      funding: 0
    };

    // Basic scoring logic - can be enhanced with ML models
    if (data.name && data.name.length > 0) scores.contact_info += 0.2;
    if (data.email && data.email.includes('@')) scores.contact_info += 0.3;
    if (data.phone) scores.contact_info += 0.2;
    if (data.address) scores.contact_info += 0.3;

    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      scores.services = Math.min(1.0, data.services.length * 0.2);
    }

    if (data.target_demographics) scores.demographics = 0.7;
    if (data.geographical_coverage) scores.geographical = 0.8;
    if (data.funding_sources) scores.funding = 0.6;

    scores.overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return scores;
  }

  /**
   * Store extraction results in database
   */
  protected async storeResults(
    results: Array<{url: string, data: Partial<OrganizationProfile>, flags: QualityFlag[]}>
  ): Promise<number> {
    let processedCount = 0;

    for (const result of results) {
      try {
        // Check for existing organization
        const existingOrg = await this.findExistingOrganization(result.data);
        
        if (existingOrg) {
          // Update existing organization with new data
          await this.updateOrganization(existingOrg.id, result.data, result.flags);
        } else {
          // Create new organization
          await this.createOrganization(result.data, result.url, result.flags);
        }
        
        processedCount++;
      } catch (error) {
        console.error('Failed to store organization data:', error);
      }
    }

    return processedCount;
  }

  /**
   * Job management utilities
   */
  private async createJob(): Promise<ProcessingJob> {
    const { data, error } = await this.supabase
      .from('processing_jobs')
      .insert({
        type: 'extraction',
        status: 'queued',
        priority: 'medium',
        data_source_id: this.dataSource.id,
        configuration: {
          source_type: this.dataSource.type,
          extraction_method: 'ai_guided',
          ai_models: ['gpt-4', 'claude-3']
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async updateJobStatus(jobId: string, status: JobStatus, errorMessage?: string): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    
    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('processing_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) throw error;
  }

  private async updateJobProgress(jobId: string, percentage: number, message?: string): Promise<void> {
    const updateData: any = {
      progress_percentage: percentage,
      updated_at: new Date().toISOString()
    };

    if (message) {
      updateData.results_summary = { progress_message: message };
    }

    const { error } = await this.supabase
      .from('processing_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) throw error;
  }

  private async getJob(jobId: string): Promise<ProcessingJob> {
    const { data, error } = await this.supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  }

  private async logError(jobId: string, url: string, error: Error): Promise<void> {
    await this.supabase
      .from('ai_processing_logs')
      .insert({
        request_id: jobId,
        ai_model_used: 'error',
        error_message: `${error.message} - URL: ${url}`,
        processing_timestamp: new Date().toISOString()
      });
  }

  /**
   * Rate limiting and politeness
   */
  private async respectRateLimit(): Promise<void> {
    if (this.config.rate_limit_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.rate_limit_ms));
    }
  }

  /**
   * Organization management utilities
   */
  private async findExistingOrganization(data: Partial<OrganizationProfile>): Promise<any> {
    if (!data.name) return null;

    // Try exact name match first
    let { data: existing } = await this.supabase
      .from('organizations')
      .select('id, name, website_url')
      .eq('name', data.name)
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Try website URL match
    if (data.website_url) {
      const { data: urlMatch } = await this.supabase
        .from('organizations')
        .select('id, name, website_url')
        .eq('website_url', data.website_url)
        .limit(1);

      if (urlMatch && urlMatch.length > 0) {
        return urlMatch[0];
      }
    }

    return null;
  }

  private async createOrganization(
    data: Partial<OrganizationProfile>,
    sourceUrl: string,
    flags: QualityFlag[]
  ): Promise<void> {
    // Insert organization
    const { data: org, error: orgError } = await this.supabase
      .from('organizations')
      .insert({
        name: data.name,
        description: data.description,
        website_url: data.website_url,
        email: data.email,
        phone: data.phone,
        address: data.address,
        type: 'community_organization',
        status: 'active'
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Insert scraping metadata
    await this.supabase
      .from('scraping_metadata')
      .insert({
        organization_id: org.id,
        source_type: this.dataSource.type,
        source_url: sourceUrl,
        discovery_method: 'ai_discovery',
        extraction_method: 'ai_guided',
        ai_processing_version: '1.0',
        confidence_scores: data.confidence_scores || {},
        validation_status: flags.length > 0 ? 'flagged' : 'ai_validated',
        quality_flags: flags
      });
  }

  private async updateOrganization(
    orgId: string,
    data: Partial<OrganizationProfile>,
    flags: QualityFlag[]
  ): Promise<void> {
    // Update organization with new data
    const updateData: any = {};
    
    if (data.description && data.description.length > 20) {
      updateData.description = data.description;
    }
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await this.supabase
        .from('organizations')
        .update(updateData)
        .eq('id', orgId);

      if (error) throw error;
    }

    // Store enrichment data
    if (data.services && data.services.length > 0) {
      await this.supabase
        .from('organization_enrichment')
        .insert({
          organization_id: orgId,
          enrichment_type: 'services',
          data: { services: data.services },
          confidence_score: data.confidence_scores?.services || 0.5,
          source_metadata: {
            source_type: this.dataSource.type,
            extraction_timestamp: new Date().toISOString()
          }
        });
    }
  }
}
