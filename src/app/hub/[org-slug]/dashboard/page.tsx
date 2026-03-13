import { createServiceClient } from '@/lib/supabase/service-lite';
import { getThisWeekSummary } from '@/lib/bgfit/queries';
import { DashboardView } from './DashboardView';

async function getOrgId(slug: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id ?? null;
}

export default async function DashboardPage({ params }: { params: { 'org-slug': string } }) {
  const orgId = await getOrgId(params['org-slug']);
  if (!orgId) return <p className="text-gray-500">Organization not found.</p>;

  const summary = await getThisWeekSummary(orgId);

  return <DashboardView summary={summary} />;
}
