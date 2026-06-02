import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkFeatureAccess } from '@/lib/org-hub/feature-gates';
import { getPracticeReflexState } from '@/lib/org-hub/practice-reflex';
import { PracticeReflexClient } from './PracticeReflexClient';

type HubOrganization = {
  id: string;
  slug: string;
};

async function getOrg(slug: string): Promise<HubOrganization | null> {
  const service = createServiceClient();
  const { data } = await service
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  return (data as HubOrganization | null) ?? null;
}

export default async function PracticeReflexPage({ params }: { params: { 'org-slug': string } }) {
  const org = await getOrg(params['org-slug']);
  if (!org) redirect('/');

  const state = await getPracticeReflexState(org.id);
  const isDev = process.env.NODE_ENV === 'development';
  let grantManagement = isDev;
  let outcomeTracking = isDev;
  let upgradeUrl: string | null = null;
  let trialActive = false;

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [grantAccess, outcomeAccess] = await Promise.all([
        checkFeatureAccess(supabase, user.id, org.id, 'grant_management'),
        checkFeatureAccess(supabase, user.id, org.id, 'outcome_tracking'),
      ]);
      grantManagement = grantAccess.allowed;
      outcomeTracking = outcomeAccess.allowed;
      upgradeUrl = grantAccess.upgradeUrl || outcomeAccess.upgradeUrl;
      trialActive = grantAccess.trialActive || outcomeAccess.trialActive;
    }
  }

  return (
    <PracticeReflexClient
      state={state}
      advancedAccess={{
        grantManagement,
        outcomeTracking,
        upgradeUrl,
        trialActive,
      }}
    />
  );
}
