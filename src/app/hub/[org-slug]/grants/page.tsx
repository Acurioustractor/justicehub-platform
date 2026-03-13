import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGrantHealthByOrg } from '@/lib/bgfit/queries';
import { checkFeatureAccess, getRequiredTier, getFeatureLabel } from '@/lib/org-hub/feature-gates';
import { FeatureGate } from '@/components/ui/feature-gate';
import { GrantsView } from './GrantsView';
import { GrantDiscovery } from './GrantDiscovery';
import { GrantsTabs } from './GrantsTabs';

async function getOrgData(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  return data;
}

export default async function GrantsPage({ params }: { params: { 'org-slug': string } }) {
  const org = await getOrgData(params['org-slug']);
  if (!org) return <p className="text-gray-500">Organization not found.</p>;

  const isDev = process.env.NODE_ENV === 'development';
  let access = { allowed: true, upgradeUrl: null as string | null, trialActive: false };

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      access = await checkFeatureAccess(supabase, user.id, org.id, 'grant_management');
    }
  }

  const feature = 'grant_management' as const;

  if (!access.allowed) {
    return (
      <FeatureGate
        allowed={false}
        featureLabel={getFeatureLabel(feature)}
        requiredTier={getRequiredTier(feature)}
        upgradeUrl={access.upgradeUrl}
      >
        {null}
      </FeatureGate>
    );
  }

  const grants = await getGrantHealthByOrg(org.id);

  return (
    <GrantsTabs
      yourGrants={<GrantsView grants={grants} />}
      discover={<GrantDiscovery />}
    />
  );
}
