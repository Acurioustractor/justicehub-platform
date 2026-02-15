import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

interface DataSource {
  id: string;
  name: string;
  type: 'directory' | 'programs' | 'alma' | 'sync'; // Backward-compatible alias for pipeline
  pipeline: 'directory' | 'programs' | 'alma' | 'sync';
  lifecycle: 'canonical' | 'supporting' | 'legacy';
  legacy: boolean;
  compatibilityOnly: boolean;
  canonicalPipeline: 'directory' | 'programs' | 'alma' | 'sync';
  canonicalTable: string | null;
  table: string;
  count: number;
  lastUpdated: string | null;
  status: 'healthy' | 'stale' | 'empty';
  description: string;
}

async function isAdmin(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin === true;
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!(await isAdmin(authClient, user.id))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || null;

    // Define all data sources in the system
    const sources: DataSource[] = [];

    // 1. Services Directory
    const { count: servicesCount, data: servicesLatest } = await supabase
      .from('services')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'services',
      name: 'Services Directory',
      type: 'directory',
      pipeline: 'directory',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'directory',
      canonicalTable: 'services',
      table: 'services',
      count: servicesCount || 0,
      lastUpdated: servicesLatest?.[0]?.created_at || null,
      status: servicesCount && servicesCount > 0 ? 'healthy' : 'empty',
      description: 'Main services directory with 500+ indexed entries from AskIzzy and other sources',
    });

    // 2. Organizations
    const { count: orgsCount, data: orgsLatest } = await supabase
      .from('organizations')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'organizations',
      name: 'Organizations',
      type: 'directory',
      pipeline: 'directory',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'directory',
      canonicalTable: 'organizations',
      table: 'organizations',
      count: orgsCount || 0,
      lastUpdated: orgsLatest?.[0]?.created_at || null,
      status: orgsCount && orgsCount > 0 ? 'healthy' : 'empty',
      description: 'Partner organizations, basecamps, and community groups',
    });

    // 3. Registered Services (Curated Programs)
    const { count: programsCount, data: programsLatest } = await supabase
      .from('registered_services')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'registered_services',
      name: 'Community Programs',
      type: 'programs',
      pipeline: 'programs',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'programs',
      canonicalTable: 'registered_services',
      table: 'registered_services',
      count: programsCount || 0,
      lastUpdated: programsLatest?.[0]?.created_at || null,
      status: programsCount && programsCount > 0 ? 'healthy' : 'empty',
      description: 'Canonical curated program records',
    });

    // 4. ALMA Evidence
    const { count: evidenceCount, data: evidenceLatest } = await supabase
      .from('alma_evidence')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'alma_evidence',
      name: 'Research & Evidence',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_evidence',
      table: 'alma_evidence',
      count: evidenceCount || 0,
      lastUpdated: evidenceLatest?.[0]?.created_at || null,
      status: evidenceCount && evidenceCount > 0 ? 'healthy' : 'empty',
      description: 'ALMA evidence corpus',
    });

    // 5. ALMA Interventions
    const { count: interventionsCount, data: interventionsLatest } = await supabase
      .from('alma_interventions')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'alma_interventions',
      name: 'Interventions Library',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_interventions',
      table: 'alma_interventions',
      count: interventionsCount || 0,
      lastUpdated: interventionsLatest?.[0]?.created_at || null,
      status: interventionsCount && interventionsCount > 0 ? 'healthy' : 'empty',
      description: 'ALMA interventions knowledge base',
    });

    // 6. Profiles
    const { count: profilesCount, data: profilesLatest } = await supabase
      .from('profiles')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'profiles',
      name: 'People Profiles',
      type: 'sync',
      pipeline: 'sync',
      lifecycle: 'supporting',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'sync',
      canonicalTable: 'profiles',
      table: 'profiles',
      count: profilesCount || 0,
      lastUpdated: profilesLatest?.[0]?.created_at || null,
      status: profilesCount && profilesCount > 0 ? 'healthy' : 'empty',
      description: 'Profiles from sync + manual curation',
    });

    // 7. Stories
    const { count: storiesCount, data: storiesLatest } = await supabase
      .from('stories')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'stories',
      name: 'Youth Stories',
      type: 'sync',
      pipeline: 'sync',
      lifecycle: 'supporting',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'sync',
      canonicalTable: 'stories',
      table: 'stories',
      count: storiesCount || 0,
      lastUpdated: storiesLatest?.[0]?.created_at || null,
      status: storiesCount && storiesCount > 0 ? 'healthy' : 'empty',
      description: 'Stories from sync + editorial workflows',
    });

    // 8. Discovered Links (ALMA queue)
    const { count: linksCount, data: linksLatest } = await supabase
      .from('alma_discovered_links')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'alma_discovered_links',
      name: 'Link Discovery Queue',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'supporting',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_discovered_links',
      table: 'alma_discovered_links',
      count: linksCount || 0,
      lastUpdated: linksLatest?.[0]?.created_at || null,
      status: linksCount && linksCount > 0 ? 'healthy' : 'empty',
      description: 'URLs discovered by ALMA for potential scraping',
    });

    // 9. Ingestion Jobs
    const { count: jobsCount, data: jobsLatest } = await supabase
      .from('alma_ingestion_jobs')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'alma_ingestion_jobs',
      name: 'Ingestion Jobs',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'supporting',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_ingestion_jobs',
      table: 'alma_ingestion_jobs',
      count: jobsCount || 0,
      lastUpdated: jobsLatest?.[0]?.created_at || null,
      status: jobsCount && jobsCount > 0 ? 'healthy' : 'empty',
      description: 'Bulk data ingestion job tracking',
    });

    // 10. Data Sources (legacy compatibility registry)
    const { count: dsCount, data: dsLatest } = await supabase
      .from('data_sources')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    
    sources.push({
      id: 'data_sources',
      name: 'Legacy Data Sources',
      type: 'sync',
      pipeline: 'sync',
      lifecycle: 'legacy',
      legacy: true,
      compatibilityOnly: true,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_source_registry',
      table: 'data_sources',
      count: dsCount || 0,
      lastUpdated: dsLatest?.[0]?.created_at || null,
      status: dsCount && dsCount > 0 ? 'healthy' : 'stale',
      description: 'Original data source tracking (deprecated)',
    });

    // 11. Scraped Services staging (legacy compatibility)
    const { count: scrapedCount, data: scrapedLatest } = await supabase
      .from('scraped_services')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'scraped_services',
      name: 'Legacy Scraped Services',
      type: 'directory',
      pipeline: 'directory',
      lifecycle: 'legacy',
      legacy: true,
      compatibilityOnly: true,
      canonicalPipeline: 'directory',
      canonicalTable: 'services',
      table: 'scraped_services',
      count: scrapedCount || 0,
      lastUpdated: scrapedLatest?.[0]?.created_at || null,
      status: scrapedCount && scrapedCount > 0 ? 'healthy' : 'stale',
      description: 'Legacy staging table retained for compatibility surfaces only',
    });

    // Filter by type if specified
    let filteredSources = sources;
    if (type) {
      filteredSources = sources.filter(s => s.type === type);
    }

    // Sort by count descending
    filteredSources.sort((a, b) => b.count - a.count);

    // Paginate
    const start = (page - 1) * limit;
    const paginatedSources = filteredSources.slice(start, start + limit);

    return NextResponse.json({
      sources: paginatedSources,
      pagination: {
        page,
        limit,
        total: filteredSources.length,
        hasMore: start + limit < filteredSources.length,
      },
      types: ['directory', 'programs', 'alma', 'sync'],
      lifecycle: ['canonical', 'supporting', 'legacy'],
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
