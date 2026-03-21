import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

interface DataSource {
  id: string;
  name: string;
  type: 'directory' | 'programs' | 'alma' | 'sync' | 'funding' | 'reference';
  pipeline: 'directory' | 'programs' | 'alma' | 'sync' | 'funding' | 'reference';
  lifecycle: 'canonical' | 'supporting' | 'legacy';
  legacy: boolean;
  compatibilityOnly: boolean;
  canonicalPipeline: 'directory' | 'programs' | 'alma' | 'sync' | 'funding' | 'reference';
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
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
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

    // Use the authenticated client (already verified admin above)
    const supabase = authClient;
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

    // 6. People Profiles
    const { count: profilesCount, data: profilesLatest } = await supabase
      .from('public_profiles')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'public_profiles',
      name: 'People Profiles',
      type: 'sync',
      pipeline: 'sync',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'sync',
      canonicalTable: 'public_profiles',
      table: 'public_profiles',
      count: profilesCount || 0,
      lastUpdated: profilesLatest?.[0]?.created_at || null,
      status: profilesCount && profilesCount > 0 ? 'healthy' : 'empty',
      description: 'Public-facing people profiles',
    });

    // 7. Stories (articles table)
    const { count: storiesCount, data: storiesLatest } = await supabase
      .from('articles')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'articles',
      name: 'Stories',
      type: 'sync',
      pipeline: 'sync',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'sync',
      canonicalTable: 'articles',
      table: 'articles',
      count: storiesCount || 0,
      lastUpdated: storiesLatest?.[0]?.created_at || null,
      status: storiesCount && storiesCount > 0 ? 'healthy' : 'empty',
      description: 'Stories and articles from editorial workflows',
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

    // 12. Justice Funding
    const { count: fundingCount, data: fundingLatest } = await supabase
      .from('justice_funding')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'justice_funding',
      name: 'Justice Funding',
      type: 'funding',
      pipeline: 'funding',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'funding',
      canonicalTable: 'justice_funding',
      table: 'justice_funding',
      count: fundingCount || 0,
      lastUpdated: fundingLatest?.[0]?.created_at || null,
      status: fundingCount && fundingCount > 0 ? 'healthy' : 'empty',
      description: 'National youth justice funding records from QGIP, AusTender, NIAA, state budgets',
    });

    // 13. ACNC Charities (reference)
    const { count: acncCount, data: acncLatest } = await supabase
      .from('acnc_charities')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'acnc_charities',
      name: 'ACNC Charities',
      type: 'reference',
      pipeline: 'reference',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'reference',
      canonicalTable: 'acnc_charities',
      table: 'acnc_charities',
      count: acncCount || 0,
      lastUpdated: acncLatest?.[0]?.created_at || null,
      status: acncCount && acncCount > 0 ? 'healthy' : 'empty',
      description: 'Australian Charities and Not-for-profits Commission registry',
    });

    // 14. ROGS Justice Spending (reference)
    const { count: rogsCount, data: rogsLatest } = await supabase
      .from('rogs_justice_spending')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'rogs_justice_spending',
      name: 'ROGS Justice Spending',
      type: 'reference',
      pipeline: 'reference',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'reference',
      canonicalTable: 'rogs_justice_spending',
      table: 'rogs_justice_spending',
      count: rogsCount || 0,
      lastUpdated: rogsLatest?.[0]?.created_at || null,
      status: rogsCount && rogsCount > 0 ? 'healthy' : 'empty',
      description: 'Report on Government Services justice expenditure data by state',
    });

    // 15. ORIC Corporations (reference)
    const { count: oricCount, data: oricLatest } = await supabase
      .from('oric_corporations')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'oric_corporations',
      name: 'ORIC Corporations',
      type: 'reference',
      pipeline: 'reference',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'reference',
      canonicalTable: 'oric_corporations',
      table: 'oric_corporations',
      count: oricCount || 0,
      lastUpdated: oricLatest?.[0]?.created_at || null,
      status: oricCount && oricCount > 0 ? 'healthy' : 'empty',
      description: 'Office of the Registrar of Indigenous Corporations registry',
    });

    // 16. ALMA Research Findings
    const { count: findingsCount, data: findingsLatest } = await supabase
      .from('alma_research_findings')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'alma_research_findings',
      name: 'Research Findings',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_research_findings',
      table: 'alma_research_findings',
      count: findingsCount || 0,
      lastUpdated: findingsLatest?.[0]?.created_at || null,
      status: findingsCount && findingsCount > 0 ? 'healthy' : 'empty',
      description: 'ALMA research findings with structured content and sources',
    });

    // 17. ALMA Media Articles
    const { count: mediaCount, data: mediaLatest } = await supabase
      .from('alma_media_articles')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'alma_media_articles',
      name: 'Media Articles',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'alma_media_articles',
      table: 'alma_media_articles',
      count: mediaCount || 0,
      lastUpdated: mediaLatest?.[0]?.created_at || null,
      status: mediaCount && mediaCount > 0 ? 'healthy' : 'empty',
      description: 'News articles and media coverage related to youth justice',
    });

    // 18. Justice Matrix Cases
    const { count: casesCount, data: casesLatest } = await supabase
      .from('justice_matrix_cases')
      .select('created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);

    sources.push({
      id: 'justice_matrix_cases',
      name: 'Legal Cases',
      type: 'alma',
      pipeline: 'alma',
      lifecycle: 'canonical',
      legacy: false,
      compatibilityOnly: false,
      canonicalPipeline: 'alma',
      canonicalTable: 'justice_matrix_cases',
      table: 'justice_matrix_cases',
      count: casesCount || 0,
      lastUpdated: casesLatest?.[0]?.created_at || null,
      status: casesCount && casesCount > 0 ? 'healthy' : 'empty',
      description: 'Legal precedents and case law for youth justice advocacy',
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
      types: ['directory', 'programs', 'alma', 'sync', 'funding', 'reference'],
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
