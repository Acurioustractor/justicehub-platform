import { createServiceClient } from '@/lib/supabase/service-lite';
import { getUpcomingDeadlines } from '@/lib/bgfit/queries';
import { ComplianceView } from './ComplianceView';

async function getOrgId(slug: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id ?? null;
}

export default async function CompliancePage({ params }: { params: { 'org-slug': string } }) {
  const orgId = await getOrgId(params['org-slug']);
  if (!orgId) return <p className="text-gray-500">Organization not found.</p>;

  const deadlines = await getUpcomingDeadlines(orgId);

  return <ComplianceView deadlines={deadlines} />;
}
