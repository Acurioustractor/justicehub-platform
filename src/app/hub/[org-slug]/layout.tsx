import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { redirect } from 'next/navigation';
import { HubShell } from './HubShell';
import { TrialBanner } from '@/components/ui/feature-gate';

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
      .select('id, name, slug, type, plan, partner_tier, trial_ends_at, billing_status')
      .eq('slug', params['org-slug'])
      .single();

    if (!organization) {
      redirect('/');
    }

    const isBasecamp = organization.type === 'basecamp' || organization.partner_tier === 'basecamp';
    const modules = isBasecamp
      ? ['dashboard', 'campaign', 'grants', 'compliance', 'basecamp', 'site-editor']
      : ['dashboard', 'campaign', 'grants', 'compliance'];
    const trialEndsAt = organization.trial_ends_at;
    const upgradeUrl = `/portal/${organization.slug ?? params['org-slug']}/billing`;

    return (
      <>
        {trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} upgradeUrl={upgradeUrl} />}
        <HubShell
          orgName={organization.name}
          orgSlug={organization.slug ?? params['org-slug']}
          orgPlan={organization.plan || 'community'}
          orgType={organization.type}
          partnerTier={organization.partner_tier}
          modules={modules}
        >
          {children}
        </HubShell>
      </>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/hub/${params['org-slug']}`);
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, type, plan, partner_tier, trial_ends_at, billing_status')
    .eq('slug', params['org-slug'])
    .single();

  if (!organization) {
    redirect('/');
  }

  const hasAccess = await checkOrgAccess(supabase, user.id, organization.id);
  if (!hasAccess) {
    redirect('/');
  }

  const isBasecamp = organization.type === 'basecamp' || organization.partner_tier === 'basecamp';
  const modules = isBasecamp
    ? ['dashboard', 'grants', 'compliance', 'basecamp', 'site-editor']
    : ['dashboard', 'grants', 'compliance'];
  const trialEndsAt = organization.trial_ends_at;
  const upgradeUrl = `/portal/${organization.slug ?? params['org-slug']}/billing`;

  return (
    <>
      {trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} upgradeUrl={upgradeUrl} />}
      <HubShell
        orgName={organization.name}
        orgSlug={organization.slug ?? params['org-slug']}
        orgPlan={organization.plan || 'community'}
        orgType={organization.type}
        partnerTier={organization.partner_tier}
        modules={modules}
      >
        {children}
      </HubShell>
    </>
  );
}
