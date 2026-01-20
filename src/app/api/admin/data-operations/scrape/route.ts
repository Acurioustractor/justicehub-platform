import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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
  };
  error?: string;
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
      // Status values: 'pending', 'queued', 'scraped', 'rejected', 'error'
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

        // Fetch the URL content
        // In production, this would use Firecrawl MCP or similar
        // For now, we simulate the scrape and mark as processed
        const scrapeData = await simulateScrape(link.url, link.predicted_type);

        if (scrapeData.success) {
          // Store extracted data based on type
          if (scrapeData.type === 'intervention' && scrapeData.data) {
            await serviceClient.from('alma_interventions').insert({
              name: scrapeData.data.title,
              description: scrapeData.data.content?.substring(0, 500),
              source_url: link.url,
              source_id: link.id,
              metadata: { scraped_at: new Date().toISOString() },
            });
          }

          // Log to scrape history
          await serviceClient.from('alma_scrape_history').insert({
            source_id: link.source_url || link.url,
            url: link.url,
            status: 'success',
            items_found: scrapeData.entities || 1,
            relevance_score: link.predicted_relevance,
            novelty_score: 0.5,
            metadata: { type: link.predicted_type },
          });

          // Update link status
          await serviceClient
            .from('alma_discovered_links')
            .update({
              status: 'scraped',
              scraped_at: new Date().toISOString(),
              metadata: {
                ...link.metadata,
                extracted_title: scrapeData.data?.title,
              },
            })
            .eq('id', link.id);

          result.success = true;
          result.status = 'scraped';
          result.extractedData = {
            title: scrapeData.data?.title,
            type: scrapeData.type,
            entities: scrapeData.entities,
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

      // Rate limiting delay
      if (linksToProcess.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} links, ${successCount} successful`,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
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

// Simulate scraping (in production, use Firecrawl MCP)
async function simulateScrape(url: string, predictedType: string | null): Promise<{
  success: boolean;
  type?: string;
  entities?: number;
  data?: { title?: string; content?: string };
  error?: string;
}> {
  // Check if URL is accessible
  try {
    const urlObj = new URL(url);

    // Block certain domains
    const blockedDomains = ['facebook.com', 'twitter.com', 'instagram.com'];
    if (blockedDomains.some(d => urlObj.hostname.includes(d))) {
      return { success: false, error: 'Social media URLs not supported' };
    }

    // In production, this would actually fetch and parse the URL
    // For now, return simulated success based on URL characteristics
    const isGov = urlObj.hostname.includes('.gov.');
    const isEdu = urlObj.hostname.includes('.edu.');
    const isOrg = urlObj.hostname.includes('.org');

    // Higher success rate for government and educational sources
    const successRate = isGov ? 0.9 : isEdu ? 0.85 : isOrg ? 0.8 : 0.7;

    if (Math.random() < successRate) {
      return {
        success: true,
        type: predictedType || (isGov ? 'government' : isEdu ? 'research' : 'website'),
        entities: Math.floor(Math.random() * 5) + 1,
        data: {
          title: `Content from ${urlObj.hostname}`,
          content: `Extracted content from ${url}. This is simulated data that would be replaced by actual scraped content in production.`,
        },
      };
    } else {
      return { success: false, error: 'Simulated scrape failure for testing' };
    }
  } catch {
    return { success: false, error: 'Invalid URL' };
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

    // Get queue stats (status values: pending, queued, scraped, rejected, error)
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
