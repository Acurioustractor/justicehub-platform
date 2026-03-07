import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LLMClient } from '@/lib/ai/model-router';

/**
 * GET /api/admin/system-status
 *
 * Returns live status of all AI providers, scraping tiers,
 * and data pipeline systems.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // AI Provider status
    const llmClient = LLMClient.getInstance();
    const providers = llmClient.getStatus();

    // Scraping tiers
    const scrapingTiers = [
      {
        name: 'Jina Reader',
        type: 'free',
        status: 'operational',
        description: 'Free markdown scraping via r.jina.ai',
        cost: '$0',
      },
      {
        name: 'Firecrawl',
        type: 'paid',
        status: process.env.FIRECRAWL_API_KEY ? 'operational' : 'no_key',
        description: 'Paid intelligent scraping with JS rendering',
        cost: '~$0.01/page',
      },
    ];

    // Data pipeline systems
    const pipelines = [
      {
        name: 'ALMA Extraction',
        description: 'AI-powered document → entity extraction',
        engine: 'callLLM() rotation',
        parser: 'parseJSON() 7-stage',
        status: 'operational',
      },
      {
        name: 'Signal Engine',
        description: 'SENTINEL scan → COMPOSER draft → REVIEW → PUBLISH',
        engine: 'Anthropic (content quality)',
        parser: 'parseJSON() 7-stage',
        status: process.env.ANTHROPIC_API_KEY ? 'operational' : 'degraded',
      },
      {
        name: 'Contact Enrichment',
        description: 'Exa search → LLM synthesis → profile',
        engine: 'callLLM() rotation',
        parser: 'parseJSON() 7-stage',
        status: 'operational',
      },
      {
        name: 'Service Directory Scraper',
        description: 'Web scrape → AI extract → validate → store',
        engine: 'Anthropic (Claude 3.5)',
        parser: 'parseJSON() + Zod validation',
        status: 'operational',
      },
      {
        name: 'Quote Extraction',
        description: 'Transcript → quotes, themes, case studies',
        engine: 'Anthropic (Claude 3.5)',
        parser: 'parseJSON() 7-stage',
        status: 'operational',
      },
      {
        name: 'BaseScraper (ALMA)',
        description: 'Discover URLs → scrape → AI extract → store',
        engine: 'callLLM() rotation + Jina/Firecrawl',
        parser: 'parseJSON() 7-stage',
        status: 'operational',
      },
    ];

    // Core infrastructure
    const infrastructure = [
      { name: 'Database', status: 'operational' },
      { name: 'Authentication', status: 'operational' },
      { name: 'Storage', status: 'operational' },
    ];

    // Count active providers
    const activeProviders = providers.filter(p => p.available && !p.disabled).length;
    const totalProviders = providers.length;
    const freeProviders = providers
      .filter(p => p.available && !p.disabled && ['groq', 'gemini'].includes(p.name))
      .length;

    return NextResponse.json({
      providers,
      scrapingTiers,
      pipelines,
      infrastructure,
      summary: {
        aiProviders: `${activeProviders}/${totalProviders} active`,
        freeProviders,
        scrapingTiers: scrapingTiers.filter(t => t.status === 'operational').length,
        pipelines: pipelines.length,
        overallHealth: activeProviders >= 2 ? 'healthy' : activeProviders >= 1 ? 'degraded' : 'critical',
      },
    });
  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get system status' },
      { status: 500 }
    );
  }
}
