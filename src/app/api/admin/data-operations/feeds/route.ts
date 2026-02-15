import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to check admin status
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin === true;
}

export interface DataFeed {
  id: string;
  name: string;
  type: 'directory' | 'programs' | 'alma' | 'sync';
  pipeline?: 'directory' | 'programs' | 'alma' | 'sync';
  lifecycle?: 'canonical' | 'supporting' | 'legacy';
  legacy?: boolean;
  compatibilityOnly?: boolean;
  canonicalPipeline?: 'directory' | 'programs' | 'alma' | 'sync';
  canonicalTable?: string | null;
  source: string;
  table: string;
  recordCount: number;
  lastUpdated: string | null;
  status: 'active' | 'stale' | 'never' | 'healthy';
  description: string;
}

async function fetchAllScrapedServices(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const pageSize = 1000;
  let from = 0;
  const results: Array<{ id: string; source_url: string | null; created_at: string | null }> = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('scraped_services')
      .select('id, source_url, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data || [];
    results.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return results;
}

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const scrapedServices = await fetchAllScrapedServices(supabase);

    // Fetch all data in parallel
    const [
      // Empathy Ledger synced
      { count: empathyProfilesCount },
      { count: empathyStoriesCount },
      { data: empathyProfilesLatest },
      { data: empathyStoriesLatest },
      // Manual entries
      { count: servicesCount },
      { count: organizationsCount },
      { count: programsCount },
      { count: eventsCount },
      { count: articlesCount },
      { count: blogPostsCount },
      { data: servicesLatest },
      { data: orgsLatest },
      { data: programsLatest },
      { data: eventsLatest },
      { data: articlesLatest },
      { data: blogLatest },
      // ALMA data
      { count: almaLinksCount },
      { count: almaInterventionsCount },
      { data: almaLinksLatest },
      { data: almaInterventionsLatest },
      // Data sources (registered scrapers)
      { data: dataSources },
      // Partner media
      { count: photosCount },
      { count: videosCount },
      { data: photosLatest },
      { data: videosLatest },
      // Centre of Excellence
      { count: frameworksCount },
      { count: researchCount },
      { count: intlProgramsCount },
    ] = await Promise.all([
      // Empathy Ledger
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
      supabase.from('profiles').select('updated_at').eq('synced_from_empathy_ledger', true).order('updated_at', { ascending: false }).limit(1),
      supabase.from('blog_posts').select('updated_at').eq('synced_from_empathy_ledger', true).order('updated_at', { ascending: false }).limit(1),
      // Manual entries
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('registered_services').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', false),
      supabase.from('services').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('organizations').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('registered_services').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('events').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('articles').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('blog_posts').select('updated_at').eq('synced_from_empathy_ledger', false).order('updated_at', { ascending: false }).limit(1),
      // ALMA
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
      supabase.from('alma_discovered_links').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabase.from('alma_interventions').select('created_at').order('created_at', { ascending: false }).limit(1),
      // Data sources
      supabase.from('data_sources').select('*'),
      // Partner media
      supabase.from('partner_photos').select('*', { count: 'exact', head: true }),
      supabase.from('partner_videos').select('*', { count: 'exact', head: true }),
      supabase.from('partner_photos').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabase.from('partner_videos').select('created_at').order('created_at', { ascending: false }).limit(1),
      // CoE
      supabase.from('australian_frameworks').select('*', { count: 'exact', head: true }),
      supabase.from('research_items').select('*', { count: 'exact', head: true }),
      supabase.from('international_programs').select('*', { count: 'exact', head: true }),
    ]);

    // Analyze scraped services by source domain
    const scrapedBySource: Record<string, { count: number; lastUpdated: string | null }> = {};
    (scrapedServices || []).forEach(service => {
      if (service.source_url) {
        try {
          const domain = new URL(service.source_url).hostname.replace('www.', '');
          if (!scrapedBySource[domain]) {
            scrapedBySource[domain] = { count: 0, lastUpdated: null };
          }
          scrapedBySource[domain].count++;
          if (service.created_at && (!scrapedBySource[domain].lastUpdated || service.created_at > scrapedBySource[domain].lastUpdated)) {
            scrapedBySource[domain].lastUpdated = service.created_at;
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });

    // Helper to determine status
    const getStatus = (lastUpdated: string | null): DataFeed['status'] => {
      if (!lastUpdated) return 'never';
      if (new Date(lastUpdated) < new Date(thirtyDaysAgo)) return 'stale';
      return 'healthy';
    };

    // Build comprehensive feeds list
    const feeds: DataFeed[] = [];

    // 1. Registered data sources (scrapers)
    (dataSources || []).forEach(source => {
      feeds.push({
        id: `ds-${source.id}`,
        name: source.name,
        type: 'sync',
        source: 'Registered Scraper',
        table: 'data_sources',
        recordCount: 0, // No scrape count tracked
        lastUpdated: source.last_successful_scrape,
        status: getStatus(source.last_successful_scrape),
        description: source.base_url,
      });
    });

    // 2. Inferred scrapers from scraped_services
    Object.entries(scrapedBySource).forEach(([domain, data]) => {
      // Skip if already in registered sources
      const alreadyRegistered = (dataSources || []).some(ds =>
        ds.base_url?.includes(domain)
      );
      if (!alreadyRegistered) {
        feeds.push({
          id: `scraped-${domain}`,
          name: domain,
          type: 'directory',
          source: 'GitHub Actions',
          table: 'scraped_services',
          recordCount: data.count,
          lastUpdated: data.lastUpdated,
          status: getStatus(data.lastUpdated),
          description: `Scraped ${data.count} services from ${domain}`,
        });
      }
    });

    // 3. Empathy Ledger Sync
    feeds.push({
      id: 'empathy-profiles',
      name: 'Empathy Ledger Profiles',
      type: 'sync',
      source: 'Empathy Ledger API',
      table: 'profiles',
      recordCount: empathyProfilesCount || 0,
      lastUpdated: empathyProfilesLatest?.[0]?.updated_at || null,
      status: getStatus(empathyProfilesLatest?.[0]?.updated_at || null),
      description: 'Profiles synced from Empathy Ledger platform',
    });

    feeds.push({
      id: 'empathy-stories',
      name: 'Empathy Ledger Stories',
      type: 'sync',
      source: 'Empathy Ledger API',
      table: 'blog_posts',
      recordCount: empathyStoriesCount || 0,
      lastUpdated: empathyStoriesLatest?.[0]?.updated_at || null,
      status: getStatus(empathyStoriesLatest?.[0]?.updated_at || null),
      description: 'Transcripts synced from Empathy Ledger platform',
    });

    // 4. Manual Content Entries
    feeds.push({
      id: 'manual-services',
      name: 'Services Directory',
      type: 'directory',
      source: 'Admin Entry',
      table: 'services',
      recordCount: servicesCount || 0,
      lastUpdated: servicesLatest?.[0]?.updated_at || null,
      status: getStatus(servicesLatest?.[0]?.updated_at || null),
      description: 'Manually curated service listings',
    });

    feeds.push({
      id: 'manual-orgs',
      name: 'Organizations Directory',
      type: 'directory',
      source: 'Admin Entry',
      table: 'organizations',
      recordCount: organizationsCount || 0,
      lastUpdated: orgsLatest?.[0]?.updated_at || null,
      status: getStatus(orgsLatest?.[0]?.updated_at || null),
      description: 'Partner organizations and stakeholders',
    });

    feeds.push({
      id: 'manual-programs',
      name: 'Programs Catalog',
      type: 'programs',
      source: 'Curation + Sync',
      table: 'registered_services',
      recordCount: programsCount || 0,
      lastUpdated: programsLatest?.[0]?.updated_at || null,
      status: getStatus(programsLatest?.[0]?.updated_at || null),
      description: 'Canonical curated programs',
    });

    feeds.push({
      id: 'manual-events',
      name: 'Events Calendar',
      type: 'sync',
      source: 'Admin Entry',
      table: 'events',
      recordCount: eventsCount || 0,
      lastUpdated: eventsLatest?.[0]?.updated_at || null,
      status: getStatus(eventsLatest?.[0]?.updated_at || null),
      description: 'Upcoming events and conferences',
    });

    feeds.push({
      id: 'manual-articles',
      name: 'Articles & Stories',
      type: 'sync',
      source: 'Admin Entry',
      table: 'articles',
      recordCount: articlesCount || 0,
      lastUpdated: articlesLatest?.[0]?.updated_at || null,
      status: getStatus(articlesLatest?.[0]?.updated_at || null),
      description: 'Editorial content and news',
    });

    feeds.push({
      id: 'manual-blog',
      name: 'Blog Posts',
      type: 'sync',
      source: 'Admin Entry',
      table: 'blog_posts',
      recordCount: blogPostsCount || 0,
      lastUpdated: blogLatest?.[0]?.updated_at || null,
      status: getStatus(blogLatest?.[0]?.updated_at || null),
      description: 'Blog content (non-synced)',
    });

    // 5. ALMA AI Intelligence
    feeds.push({
      id: 'alma-discovery',
      name: 'ALMA Link Discovery',
      type: 'alma',
      source: 'ALMA Agent',
      table: 'alma_discovered_links',
      recordCount: almaLinksCount || 0,
      lastUpdated: almaLinksLatest?.[0]?.created_at || null,
      status: getStatus(almaLinksLatest?.[0]?.created_at || null),
      description: 'AI-discovered links for processing',
    });

    feeds.push({
      id: 'alma-interventions',
      name: 'ALMA Interventions',
      type: 'alma',
      source: 'ALMA Agent',
      table: 'alma_interventions',
      recordCount: almaInterventionsCount || 0,
      lastUpdated: almaInterventionsLatest?.[0]?.created_at || null,
      status: getStatus(almaInterventionsLatest?.[0]?.created_at || null),
      description: 'Evidence-based intervention database',
    });

    // 6. Partner Media
    feeds.push({
      id: 'partner-photos',
      name: 'Partner Photos',
      type: 'sync',
      source: 'Partner Upload',
      table: 'partner_photos',
      recordCount: photosCount || 0,
      lastUpdated: photosLatest?.[0]?.created_at || null,
      status: getStatus(photosLatest?.[0]?.created_at || null),
      description: 'Photos from partner organizations',
    });

    feeds.push({
      id: 'partner-videos',
      name: 'Partner Videos',
      type: 'sync',
      source: 'Partner Upload',
      table: 'partner_videos',
      recordCount: videosCount || 0,
      lastUpdated: videosLatest?.[0]?.created_at || null,
      status: getStatus(videosLatest?.[0]?.created_at || null),
      description: 'Videos from partner organizations',
    });

    // 7. Centre of Excellence
    feeds.push({
      id: 'coe-frameworks',
      name: 'Australian Frameworks',
      type: 'sync',
      source: 'Research Team',
      table: 'australian_frameworks',
      recordCount: frameworksCount || 0,
      lastUpdated: null, // No updated_at on this table
      status: (frameworksCount || 0) > 0 ? 'healthy' : 'never',
      description: 'Legislative and policy frameworks',
    });

    feeds.push({
      id: 'coe-research',
      name: 'Research Items',
      type: 'sync',
      source: 'Research Team',
      table: 'research_items',
      recordCount: researchCount || 0,
      lastUpdated: null,
      status: (researchCount || 0) > 0 ? 'healthy' : 'never',
      description: 'Academic research and studies',
    });

    feeds.push({
      id: 'coe-intl',
      name: 'International Programs',
      type: 'sync',
      source: 'Research Team',
      table: 'international_programs',
      recordCount: intlProgramsCount || 0,
      lastUpdated: null,
      status: (intlProgramsCount || 0) > 0 ? 'healthy' : 'never',
      description: 'Global youth justice programs',
    });

    // Sort by type, then by record count
    const classifiedFeeds = feeds.map((feed) => {
      const isLegacy = feed.table === 'scraped_services' || feed.table === 'data_sources';
      const canonicalPipeline = feed.table === 'scraped_services' ? 'directory' : feed.type;
      const canonicalTable =
        feed.table === 'scraped_services'
          ? 'services'
          : feed.table === 'data_sources'
            ? 'alma_source_registry'
            : feed.table;

      return {
        ...feed,
        pipeline: feed.type,
        lifecycle: isLegacy ? 'legacy' : 'canonical',
        legacy: isLegacy,
        compatibilityOnly: isLegacy,
        canonicalPipeline,
        canonicalTable,
      };
    });

    classifiedFeeds.sort((a, b) => {
      const typeOrder = { directory: 0, programs: 1, alma: 2, sync: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.recordCount - a.recordCount;
    });

    // Summary stats
    const summary = {
      total: classifiedFeeds.length,
      byPipeline: classifiedFeeds.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byLifecycle: classifiedFeeds.reduce((acc, f) => {
        const key = f.lifecycle || 'canonical';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: classifiedFeeds.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalRecords: classifiedFeeds.reduce((sum, f) => sum + f.recordCount, 0),
    };

    return NextResponse.json({
      feeds: classifiedFeeds,
      summary,
    });
  } catch (error: unknown) {
    console.error('Data feeds error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
