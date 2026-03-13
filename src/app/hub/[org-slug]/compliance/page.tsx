import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getUpcomingDeadlines } from '@/lib/bgfit/queries';
import { checkFeatureAccess, getRequiredTier, getFeatureLabel } from '@/lib/org-hub/feature-gates';
import { FeatureGate } from '@/components/ui/feature-gate';
import { ComplianceView } from './ComplianceView';

async function getOrgData(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  return data;
}

export default async function CompliancePage({ params }: { params: { 'org-slug': string } }) {
  const org = await getOrgData(params['org-slug']);
  if (!org) return <p className="text-gray-500">Organization not found.</p>;

  const isDev = process.env.NODE_ENV === 'development';
  let access = { allowed: true, upgradeUrl: null as string | null, trialActive: false };

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      access = await checkFeatureAccess(supabase, user.id, org.id, 'outcome_tracking');
    }
  }

  const feature = 'outcome_tracking' as const;

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

  const deadlines = await getUpcomingDeadlines(org.id);
  return <ComplianceView deadlines={deadlines} />;
}
