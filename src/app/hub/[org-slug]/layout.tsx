import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { redirect } from 'next/navigation';
import { HubShell } from './HubShell';

const STANDARD_MODULES = ['dashboard', 'practice', 'profile', 'campaign', 'grants', 'compliance'];
const BASECAMP_MODULES = [...STANDARD_MODULES, 'basecamp', 'site-editor'];

type HubOrganization = {
  id: string;
  name: string;
  slug: string;
  plan?: string | null;
  type?: string | null;
  partner_tier?: string | null;
};

function getModules(organization: HubOrganization) {
  return organization.type === 'basecamp' || organization.partner_tier === 'basecamp'
    ? BASECAMP_MODULES
    : STANDARD_MODULES;
}

export default async function HubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { 'org-slug': string };
}) {
  const isDev = process.env.NODE_ENV === 'development';
  const service = createServiceClient();

  const { data: organization } = await service
    .from('organizations')
    .select('id, name, slug, plan, type, partner_tier')
    .eq('slug', params['org-slug'])
    .single();

  if (!organization) redirect('/');

  if (isDev) {
    return (
      <HubShell
        orgName={organization.name}
        orgSlug={organization.slug}
        orgPlan={organization.plan}
        orgType={organization.type}
        partnerTier={organization.partner_tier}
        modules={getModules(organization)}
      >
        {children}
      </HubShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/hub/${params['org-slug']}/practice`)}`);
  }

  const hasAccess = await checkOrgAccess(supabase, user.id, organization.id);
  if (!hasAccess) redirect('/');

  return (
    <HubShell
      orgName={organization.name}
      orgSlug={organization.slug}
      orgPlan={organization.plan}
      orgType={organization.type}
      partnerTier={organization.partner_tier}
      modules={getModules(organization)}
    >
      {children}
    </HubShell>
  );
}
