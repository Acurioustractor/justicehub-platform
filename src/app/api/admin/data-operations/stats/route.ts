import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch counts from all major tables in parallel
    const [
      servicesResult,
      organizationsResult,
      registeredServicesResult,
      profilesResult,
      storiesResult,
      evidenceResult,
      interventionsResult,
      discoveredLinksResult,
      ingestionJobsResult,
      scrapedServicesResult,
      dataSourcesResult,
    ] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('registered_services').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
      supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }),
      supabase.from('alma_ingestion_jobs').select('*', { count: 'exact', head: true }),
      supabase.from('scraped_services').select('*', { count: 'exact', head: true }),
      supabase.from('data_sources').select('*', { count: 'exact', head: true }),
    ]);

    // Get services by state
    const { data: servicesByState } = await supabase
      .from('services')
      .select('state')
      .not('state', 'is', null);

    const stateCounts: Record<string, number> = {};
    servicesByState?.forEach((s) => {
      const state = s.state || 'Unknown';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    // Get organizations by type
    const { data: orgsByType } = await supabase
      .from('organizations')
      .select('organization_type')
      .not('organization_type', 'is', null);

    const orgTypeCounts: Record<string, number> = {};
    orgsByType?.forEach((o) => {
      const type = o.organization_type || 'Unknown';
      orgTypeCounts[type] = (orgTypeCounts[type] || 0) + 1;
    });

    // Get evidence by type
    const { data: evidenceByType } = await supabase
      .from('alma_evidence')
      .select('evidence_type')
      .not('evidence_type', 'is', null);

    const evidenceTypeCounts: Record<string, number> = {};
    evidenceByType?.forEach((e) => {
      const type = e.evidence_type || 'Unknown';
      evidenceTypeCounts[type] = (evidenceTypeCounts[type] || 0) + 1;
    });

    // Get discovered links by status
    const { data: linksByStatus } = await supabase
      .from('alma_discovered_links')
      .select('status');

    const linkStatusCounts: Record<string, number> = {};
    linksByStatus?.forEach((l) => {
      const status = l.status || 'pending';
      linkStatusCounts[status] = (linkStatusCounts[status] || 0) + 1;
    });

    // Get ingestion jobs by status
    const { data: jobsByStatus } = await supabase
      .from('alma_ingestion_jobs')
      .select('status');

    const jobStatusCounts: Record<string, number> = {};
    jobsByStatus?.forEach((j) => {
      const status = j.status || 'unknown';
      jobStatusCounts[status] = (jobStatusCounts[status] || 0) + 1;
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: recentOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: recentEvidence } = await supabase
      .from('alma_evidence')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      totals: {
        services: servicesResult.count || 0,
        organizations: organizationsResult.count || 0,
        registeredServices: registeredServicesResult.count || 0,
        profiles: profilesResult.count || 0,
        stories: storiesResult.count || 0,
        evidence: evidenceResult.count || 0,
        interventions: interventionsResult.count || 0,
        discoveredLinks: discoveredLinksResult.count || 0,
        ingestionJobs: ingestionJobsResult.count || 0,
        scrapedServices: scrapedServicesResult.count || 0,
        dataSources: dataSourcesResult.count || 0,
      },
      byState: stateCounts,
      byOrgType: orgTypeCounts,
      byEvidenceType: evidenceTypeCounts,
      linkStatus: linkStatusCounts,
      jobStatus: jobStatusCounts,
      recentActivity: {
        services: recentServices || 0,
        organizations: recentOrgs || 0,
        evidence: recentEvidence || 0,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching data operations stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
