import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGrantHealthByOrg } from '@/lib/bgfit/queries';
import { GrantsView } from './GrantsView';

async function getOrgId(slug: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id ?? null;
}

export default async function GrantsPage({ params }: { params: { 'org-slug': string } }) {
  const orgId = await getOrgId(params['org-slug']);
  if (!orgId) return <p className="text-gray-500">Organization not found.</p>;

  const grants = await getGrantHealthByOrg(orgId);

  return <GrantsView grants={grants} />;
}
