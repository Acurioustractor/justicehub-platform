import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { redirect } from 'next/navigation';
import { HubShell } from './HubShell';

export default async function HubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { 'org-slug': string };
}) {
  const isDev = process.env.NODE_ENV === 'development';

  // In dev, bypass auth and use service client for org lookup
  if (isDev) {
    const service = createServiceClient();
    const { data: organization } = await service
      .from('organizations')
      .select('id, name, slug, type')
      .eq('slug', params['org-slug'])
      .single();

    if (!organization) {
      redirect('/');
    }

    const modules = ['dashboard', 'grants', 'compliance'];
    return (
      <HubShell
        orgName={organization.name}
        orgSlug={organization.slug ?? params['org-slug']}
        modules={modules}
      >
        {children}
      </HubShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/hub/${params['org-slug']}`);
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, type')
    .eq('slug', params['org-slug'])
    .single();

  if (!organization) {
    redirect('/');
  }

  const hasAccess = await checkOrgAccess(supabase, user.id, organization.id);
  if (!hasAccess) {
    redirect('/');
  }

  // All modules enabled for now — can be made configurable later
  const modules = ['dashboard', 'grants', 'compliance'];

  return (
    <HubShell
      orgName={organization.name}
      orgSlug={organization.slug ?? params['org-slug']}
      modules={modules}
    >
      {children}
    </HubShell>
  );
}
