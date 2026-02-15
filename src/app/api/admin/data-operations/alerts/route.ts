import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing required env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key);
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: string;
  message: string;
  detail: string | null;
  count: number | null;
  table: string | null;
  createdAt: string;
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const alerts: Alert[] = [];
    const now = new Date();

    // Check for empty/low data tables
    const [
      profilesCount,
      storiesCount,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
    ]);

    if ((profilesCount.count || 0) < 10) {
      alerts.push({
        id: 'low-profiles',
        type: 'warning',
        category: 'Data Gap',
        message: 'Low profile count',
        detail: `Only ${profilesCount.count} profiles in the system. Consider adding more expert profiles.`,
        count: profilesCount.count,
        table: 'profiles',
        createdAt: now.toISOString(),
      });
    }

    if ((storiesCount.count || 0) < 5) {
      alerts.push({
        id: 'low-stories',
        type: 'warning',
        category: 'Data Gap',
        message: 'Low story count',
        detail: `Only ${storiesCount.count} stories published. Youth voices need amplification.`,
        count: storiesCount.count,
        table: 'stories',
        createdAt: now.toISOString(),
      });
    }

    // Check for stale link queue
    const { count: pendingLinksCount } = await supabase
      .from('alma_discovered_links')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingLinksCount && pendingLinksCount > 1000) {
      alerts.push({
        id: 'large-queue',
        type: 'info',
        category: 'Queue',
        message: 'Large link queue',
        detail: `${pendingLinksCount} links pending processing. Consider running a batch scrape.`,
        count: pendingLinksCount,
        table: 'alma_discovered_links',
        createdAt: now.toISOString(),
      });
    }

    // Check for failed ingestion jobs
    const { count: failedCount } = await supabase
      .from('alma_ingestion_jobs')
      .select('*', { count: 'exact' })
      .eq('status', 'failed')
      .limit(5);

    if (failedCount && failedCount > 0) {
      alerts.push({
        id: 'failed-jobs',
        type: 'error',
        category: 'Ingestion',
        message: 'Failed ingestion jobs',
        detail: `${failedCount} jobs have failed. Review and retry or clear.`,
        count: failedCount,
        table: 'alma_ingestion_jobs',
        createdAt: now.toISOString(),
      });
    }

    // Check for services without locations
    const { count: noLocationServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .is('location_state', null);

    if (noLocationServices && noLocationServices > 50) {
      alerts.push({
        id: 'no-location-services',
        type: 'warning',
        category: 'Data Quality',
        message: 'Services missing location',
        detail: `${noLocationServices} services have no state/location. Affects map visibility.`,
        count: noLocationServices,
        table: 'services',
        createdAt: now.toISOString(),
      });
    }

    // Check for organizations without type
    const { count: noTypeOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .is('type', null);

    if (noTypeOrgs && noTypeOrgs > 100) {
      alerts.push({
        id: 'no-type-orgs',
        type: 'warning',
        category: 'Data Quality',
        message: 'Organizations missing type',
        detail: `${noTypeOrgs} organizations have no type classification.`,
        count: noTypeOrgs,
        table: 'organizations',
        createdAt: now.toISOString(),
      });
    }

    // Check for programs without organization_id links
    const { count: unlinkedPrograms } = await supabase
      .from('registered_services')
      .select('*', { count: 'exact', head: true })
      .is('organization_id', null);

    if (unlinkedPrograms && unlinkedPrograms > 0) {
      alerts.push({
        id: 'unlinked-programs',
        type: 'info',
        category: 'Data Linking',
        message: 'Programs not linked to organizations',
        detail: `${unlinkedPrograms} programs have no organization_id foreign key.`,
        count: unlinkedPrograms,
        table: 'registered_services',
        createdAt: now.toISOString(),
      });
    }

    // Sort by severity (error > warning > info)
    const severityOrder = { error: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        errors: alerts.filter(a => a.type === 'error').length,
        warnings: alerts.filter(a => a.type === 'warning').length,
        info: alerts.filter(a => a.type === 'info').length,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
