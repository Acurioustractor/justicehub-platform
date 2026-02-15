import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

// Helper to check admin status
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin === true;
}

// Get service client for write operations
function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

// Initialize Firecrawl
function getFirecrawlClient() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Firecrawl API key');
  }
  return new FirecrawlApp({ apiKey });
}

interface ScrapeResult {
  success: boolean;
  linkId: string;
  url: string;
  status: 'scraped' | 'failed' | 'rejected';
  extractedData?: {
    title?: string;
    content?: string;
    type?: string;
    entities?: number;
    summary?: string;
  };
  error?: string;
  scrapeTimeMs?: number;
}

// Circuit breaker state
const circuitBreakers = new Map<string, { failures: number; lastFailure: number; blocked: boolean }>();
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60 * 60 * 1000; // 1 hour

function checkCircuitBreaker(domain: string): boolean {
  const state = circuitBreakers.get(domain);
  if (!state) return true;
  
  if (state.blocked) {
    if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
      // Reset circuit breaker
      circuitBreakers.delete(domain);
      return true;
    }
    return false;
  }
  return true;
}

function recordFailure(domain: string) {
  const state = circuitBreakers.get(domain) || { failures: 0, lastFailure: 0, blocked: false };
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.blocked = true;
    console.warn(`[Circuit Breaker] Domain ${domain} blocked after ${state.failures} failures`);
  }
  
  circuitBreakers.set(domain, state);
}

function recordSuccess(domain: string) {
  circuitBreakers.delete(domain);
}

// Check URL health before scraping
async function checkUrlHealth(url: string): Promise<{ healthy: boolean; redirectUrl?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'JusticeHub-ALMA-Scraper/1.0 (Research Bot)',
      },
    });
    
    clearTimeout(timeout);
    
    if (response.status === 200) {
      return { healthy: true };
    } else if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      return { healthy: true, redirectUrl: response.headers.get('location') || undefined };
    } else {
      return { healthy: false, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    return { healthy: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// Actual scraping with Firecrawl
async function scrapeUrl(url: string, predictedType: string | null): Promise<{
  success: boolean;
  type?: string;
  entities?: number;
  data?: { title?: string; content?: string; summary?: string };
  error?: string;
  scrapeTimeMs?: number;
}> {
  const startTime = Date.now();
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Check circuit breaker
    if (!checkCircuitBreaker(domain)) {
      return { 
        success: false, 
        error: 'Circuit breaker open - domain temporarily blocked due to repeated failures',
        scrapeTimeMs: Date.now() - startTime
      };
    }
    
    // Check URL health first
    const healthCheck = await checkUrlHealth(url);
    if (!healthCheck.healthy) {
      recordFailure(domain);
      return { 
        success: false, 
        error: `URL health check failed: ${healthCheck.error}`,
        scrapeTimeMs: Date.now() - startTime
      };
    }
    
    // Use actual URL (follow redirect if needed)
    const actualUrl = healthCheck.redirectUrl || url;
    
    // Block certain domains
    const blockedDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'];
    if (blockedDomains.some(d => urlObj.hostname.includes(d))) {
      return { 
        success: false, 
        error: 'Social media URLs not supported',
        scrapeTimeMs: Date.now() - startTime
      };
    }
    
    // Initialize Firecrawl
    const firecrawl = getFirecrawlClient();
    
    // Scrape the URL
    const scrapeResult = await firecrawl.scrapeUrl(actualUrl, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: 30000,
    });
    
    if (!scrapeResult.success) {
      recordFailure(domain);
      return { 
        success: false, 
        error: scrapeResult.error || 'Scraping failed',
        scrapeTimeMs: Date.now() - startTime
      };
    }
    
    // Extract content
    const content = scrapeResult.markdown || scrapeResult.html || '';
    const title = scrapeResult.metadata?.title || urlObj.hostname;
    
    // Validate content quality
    const minLength = 500;
    const hasMeaningfulWords = /youth|justice|program|community|child|young|detention|support/i.test(content);
    
    if (content.length < minLength || !hasMeaningfulWords) {
      recordFailure(domain);
      return { 
        success: false, 
        error: `Content quality check failed: ${content.length < minLength ? 'too short' : 'no relevant keywords'}`,
        scrapeTimeMs: Date.now() - startTime
      };
    }
    
    // Determine type from content if not predicted
    const isGov = urlObj.hostname.includes('.gov.');
    const isEdu = urlObj.hostname.includes('.edu.');
    const detectedType = predictedType || (isGov ? 'government' : isEdu ? 'research' : 'website');
    
    // Count entities (programs, organizations mentioned)
    const entityMatches = content.match(/(?:program|service|initiative|organization|centre|project)/gi);
    const entityCount = entityMatches ? Math.min(entityMatches.length, 10) : 1;
    
    // Generate summary (first 500 chars of content)
    const summary = content.slice(0, 500).replace(/\n/g, ' ').trim() + '...';
    
    recordSuccess(domain);
    
    return {
      success: true,
      type: detectedType,
      entities: entityCount,
      data: {
        title,
        content: content.slice(0, 10000), // Limit stored content
        summary,
      },
      scrapeTimeMs: Date.now() - startTime,
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    // Record failure for circuit breaker
    try {
      const urlObj = new URL(url);
      recordFailure(urlObj.hostname);
    } catch {
      // Invalid URL, ignore
    }
    
    return { 
      success: false, 
      error: errorMessage,
      scrapeTimeMs: Date.now() - startTime
    };
  }
}

// POST - Process a single link or batch from the queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { linkId, batchSize = 1, mode = 'queue' } = body;

    const serviceClient = getServiceClient();
    const results: ScrapeResult[] = [];

    // Get links to process
    let linksToProcess;

    if (linkId) {
      // Process specific link
      const { data, error } = await serviceClient
        .from('alma_discovered_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }
      linksToProcess = [data];
    } else {
      // Get next batch from queue
      const statuses = mode === 'queued' ? ['queued'] : ['pending', 'queued'];

      const { data, error } = await serviceClient
        .from('alma_discovered_links')
        .select('*')
        .in('status', statuses)
        .order('predicted_relevance', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      linksToProcess = data || [];
    }

    if (linksToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Queue is empty',
        processed: 0,
        results: [],
      });
    }

    // Process each link
    for (const link of linksToProcess) {
      const result: ScrapeResult = {
        success: false,
        linkId: link.id,
        url: link.url,
        status: 'failed',
      };

      try {
        // Mark as queued (processing)
        await serviceClient
          .from('alma_discovered_links')
          .update({ status: 'queued' })
          .eq('id', link.id);

        // ACTUAL SCRAPING (not simulated)
        const scrapeData = await scrapeUrl(link.url, link.predicted_type);
        result.scrapeTimeMs = scrapeData.scrapeTimeMs;

        if (scrapeData.success && scrapeData.data) {
          // Store extracted data based on type
          if (scrapeData.type === 'intervention' || scrapeData.type === 'program') {
            await serviceClient.from('alma_interventions').insert({
              name: scrapeData.data.title || link.title || link.url,
              description: scrapeData.data.summary || scrapeData.data.content?.slice(0, 500) || 'Scraped intervention content',
              type: link.predicted_type || scrapeData.type || 'program',
              metadata: { 
                source_url: link.url,
                discovered_link_id: link.id,
                scraped_at: new Date().toISOString(),
                scrape_time_ms: scrapeData.scrapeTimeMs,
                content_length: scrapeData.data.content?.length,
              },
            });
          }

          // Log to scrape history
          await serviceClient.from('alma_scrape_history').insert({
            source_url: link.url,
            status: 'success',
            entities_found: scrapeData.entities || 1,
            relevance_score: link.predicted_relevance,
            novelty_score: 0.5,
            started_at: new Date(Date.now() - (scrapeData.scrapeTimeMs || 0)).toISOString(),
            completed_at: new Date().toISOString(),
            content_length: scrapeData.data.content?.length || null,
            extracted_data: {
              title: scrapeData.data.title,
              summary: scrapeData.data.summary,
            },
            metadata: { 
              type: link.predicted_type,
              detected_type: scrapeData.type,
              scrape_time_ms: scrapeData.scrapeTimeMs,
            },
          });

          // Update link status
          await serviceClient
            .from('alma_discovered_links')
            .update({
              status: 'scraped',
              scraped_at: new Date().toISOString(),
              metadata: {
                ...link.metadata,
                extracted_title: scrapeData.data.title,
                extracted_summary: scrapeData.data.summary,
                scrape_time_ms: scrapeData.scrapeTimeMs,
              },
            })
            .eq('id', link.id);

          result.success = true;
          result.status = 'scraped';
          result.extractedData = {
            title: scrapeData.data.title,
            content: scrapeData.data.content?.slice(0, 200),
            type: scrapeData.type,
            entities: scrapeData.entities,
            summary: scrapeData.data.summary,
          };
        } else {
          // Mark as error
          await serviceClient
            .from('alma_discovered_links')
            .update({
              status: 'error',
              error_message: scrapeData.error,
              metadata: {
                ...link.metadata,
                failed_at: new Date().toISOString(),
                error: scrapeData.error,
                scrape_time_ms: scrapeData.scrapeTimeMs,
              },
            })
            .eq('id', link.id);

          result.error = scrapeData.error;
        }
      } catch (err) {
        // Mark as error on exception
        await serviceClient
          .from('alma_discovered_links')
          .update({
            status: 'error',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            metadata: {
              ...link.metadata,
              failed_at: new Date().toISOString(),
            },
          })
          .eq('id', link.id);

        result.error = err instanceof Error ? err.message : 'Unknown error';
      }

      results.push(result);

      // Rate limiting delay between requests
      if (linksToProcess.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalTime = results.reduce((sum, r) => sum + (r.scrapeTimeMs || 0), 0);
    const avgTime = successCount > 0 ? Math.round(totalTime / successCount) : 0;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} links, ${successCount} successful`,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      avgScrapeTimeMs: avgTime,
      results,
    });
  } catch (error: unknown) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check scraper status and recent activity
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get recent scrape history
    const { data: recentScrapes } = await supabase
      .from('alma_scrape_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get queue stats
    const [
      { count: pendingCount },
      { count: queuedCount },
      { count: scrapedCount },
      { count: rejectedCount },
      { count: errorCount },
    ] = await Promise.all([
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'scraped'),
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'error'),
    ]);

    // Calculate success rate from recent scrapes
    const successfulScrapes = (recentScrapes || []).filter(s => s.status === 'success').length;
    const successRate = recentScrapes?.length ? (successfulScrapes / recentScrapes.length) * 100 : 0;
    
    // Get circuit breaker status
    const blockedDomains = Array.from(circuitBreakers.entries())
      .filter(([_, state]) => state.blocked)
      .map(([domain, state]) => ({ domain, failures: state.failures }));

    return NextResponse.json({
      status: 'ready',
      queue: {
        pending: pendingCount || 0,
        queued: queuedCount || 0,
        scraped: scrapedCount || 0,
        rejected: rejectedCount || 0,
        error: errorCount || 0,
        total: (pendingCount || 0) + (queuedCount || 0) + (scrapedCount || 0) + (rejectedCount || 0) + (errorCount || 0),
      },
      recentActivity: {
        scrapes: recentScrapes?.length || 0,
        successRate: Math.round(successRate),
        lastScrape: recentScrapes?.[0]?.created_at || null,
      },
      circuitBreakers: {
        blockedDomains: blockedDomains.length,
        domains: blockedDomains,
      },
      history: recentScrapes || [],
    });
  } catch (error: unknown) {
    console.error('Scraper status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
