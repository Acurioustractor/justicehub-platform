import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { OrgSupportHubClient } from '@/app/admin/organizations/[slug]/hub/OrgSupportHubClient';

export default async function OrgHubPage({ params }: { params: { 'org-slug': string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/hub');

  const service = createServiceClient();

  const { data: organization } = await service
    .from('organizations')
    .select('id, name, slug, type, description, location, state, tags')
    .eq('slug', params['org-slug'])
    .single();

  if (!organization) redirect('/hub');

  // Check user's role in this org
  const { data: membership } = await service
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organization.id)
    .single();

  const memberRole = (membership?.role as 'admin' | 'member') || 'member';

  return (
    <OrgSupportHubClient
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type,
        description: organization.description,
        location: organization.location,
        state: organization.state,
        tags: organization.tags,
      }}
      backHref="/hub"
      backLabel="Back to Hub"
      memberRole={memberRole}
    />
  );
}
