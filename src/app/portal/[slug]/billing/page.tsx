import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { TIERS, type TierKey } from '@/lib/stripe';
import { BillingClient } from './BillingClient';

export default async function BillingPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/' + params.slug + '/billing');

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, type, partner_tier, billing_status, trial_ends_at, stripe_customer_id')
    .eq('slug', params.slug)
    .single();

  if (!organization) redirect('/portal');

  const hasAccess = await checkOrgAccess(supabase, user.id, organization.id);
  if (!hasAccess) redirect('/portal');

  // Count team members
  const { count: memberCount } = await (supabase as any)
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organization.id)
    .eq('status', 'active');

  return (
    <BillingClient
      org={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug || params.slug,
        plan: (organization.plan as TierKey) || 'community',
        type: organization.type,
        partnerTier: organization.partner_tier,
        billingStatus: organization.billing_status || 'none',
        trialEndsAt: organization.trial_ends_at,
        hasStripe: !!organization.stripe_customer_id,
      }}
      memberCount={memberCount || 0}
    />
  );
}
