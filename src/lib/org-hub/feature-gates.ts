import { SupabaseClient } from '@supabase/supabase-js';
import { TierKey } from '@/lib/stripe';

/**
 * Feature gate definitions — maps features to the minimum tier required.
 * Basecamps always bypass gates.
 */
export type Feature =
  | 'grant_management'
  | 'outcome_tracking'
  | 'alma_full_detail'
  | 'alma_data_export'
  | 'governed_proof'
  | 'api_access'
  | 'custom_reports';

const TIER_RANK: Record<string, number> = {
  community: 0,
  organisation: 1,
  institution: 2,
  enterprise: 3,
};

const FEATURE_MIN_TIER: Record<Feature, TierKey> = {
  grant_management: 'organisation',
  outcome_tracking: 'organisation',
  alma_full_detail: 'organisation',
  alma_data_export: 'institution',
  governed_proof: 'institution',
  api_access: 'institution',
  custom_reports: 'enterprise',
};

export interface FeatureAccessResult {
  allowed: boolean;
  reason: string;
  plan: string | null;
  orgType: string | null;
  trialActive: boolean;
  upgradeUrl: string | null;
}

/**
 * Check if a user+org combination can access a gated feature.
 *
 * Access logic:
 * 1. Basecamps always have full access (community orgs doing the work)
 * 2. Active trial grants access as if on the trial tier
 * 3. Org plan must meet or exceed feature minimum tier
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  feature: Feature
): Promise<FeatureAccessResult> {
  // Fetch org details
  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, plan, type, partner_tier, trial_ends_at, billing_status')
    .eq('id', orgId)
    .single();

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
      plan: null,
      orgType: null,
      trialActive: false,
      upgradeUrl: null,
    };
  }

  const upgradeUrl = `/portal/${org.slug}/billing`;

  // Basecamps always get full access
  if (org.type === 'basecamp' || org.partner_tier === 'basecamp') {
    return {
      allowed: true,
      reason: 'Basecamp — full access',
      plan: org.plan || 'community',
      orgType: org.type,
      trialActive: false,
      upgradeUrl: null,
    };
  }

  const plan = (org.plan as TierKey) || 'community';
  const trialActive = org.trial_ends_at ? new Date(org.trial_ends_at) > new Date() : false;

  // During active trial, grant access as if on 'organisation' tier
  const effectivePlan = trialActive && plan === 'community' ? 'organisation' : plan;
  const requiredTier = FEATURE_MIN_TIER[feature];
  const hasAccess = (TIER_RANK[effectivePlan] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);

  if (hasAccess) {
    return {
      allowed: true,
      reason: trialActive ? 'Trial access' : `${effectivePlan} plan`,
      plan: effectivePlan,
      orgType: org.type,
      trialActive,
      upgradeUrl: null,
    };
  }

  return {
    allowed: false,
    reason: `Requires ${requiredTier} plan or above`,
    plan,
    orgType: org.type,
    trialActive,
    upgradeUrl,
  };
}

/**
 * Lightweight check for API routes — returns tier info without full org lookup.
 * Uses the request's auth token to determine access.
 */
export async function checkApiFeatureAccess(
  supabase: SupabaseClient,
  feature: Feature
): Promise<FeatureAccessResult> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
      plan: null,
      orgType: null,
      trialActive: false,
      upgradeUrl: '/login',
    };
  }

  // Check admin — admins bypass all gates
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') {
    return {
      allowed: true,
      reason: 'Admin access',
      plan: 'enterprise',
      orgType: null,
      trialActive: false,
      upgradeUrl: null,
    };
  }

  // Find user's best org membership
  const { data: memberships } = await (supabase as any)
    .from('organization_members')
    .select('organization_id, organizations(plan, type, partner_tier, trial_ends_at)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) {
    return {
      allowed: false,
      reason: 'No active organization membership',
      plan: null,
      orgType: null,
      trialActive: false,
      upgradeUrl: '/pricing',
    };
  }

  // Find the highest-tier org the user belongs to
  const requiredTier = FEATURE_MIN_TIER[feature];
  const requiredRank = TIER_RANK[requiredTier] ?? 0;

  for (const m of memberships) {
    const org = m.organizations;
    if (!org) continue;

    // Basecamps bypass
    if (org.type === 'basecamp' || org.partner_tier === 'basecamp') {
      return {
        allowed: true,
        reason: 'Basecamp — full access',
        plan: org.plan || 'community',
        orgType: org.type,
        trialActive: false,
        upgradeUrl: null,
      };
    }

    const plan = org.plan || 'community';
    const trialActive = org.trial_ends_at ? new Date(org.trial_ends_at) > new Date() : false;
    const effectivePlan = trialActive && plan === 'community' ? 'organisation' : plan;

    if ((TIER_RANK[effectivePlan] ?? 0) >= requiredRank) {
      return {
        allowed: true,
        reason: trialActive ? 'Trial access' : `${effectivePlan} plan`,
        plan: effectivePlan,
        orgType: org.type,
        trialActive,
        upgradeUrl: null,
      };
    }
  }

  return {
    allowed: false,
    reason: `Requires ${requiredTier} plan or above`,
    plan: memberships[0]?.organizations?.plan || 'community',
    orgType: memberships[0]?.organizations?.type || null,
    trialActive: false,
    upgradeUrl: '/pricing',
  };
}

/** Get the minimum required tier for a feature */
export function getRequiredTier(feature: Feature): TierKey {
  return FEATURE_MIN_TIER[feature];
}

/** Get human-readable feature name */
export function getFeatureLabel(feature: Feature): string {
  const labels: Record<Feature, string> = {
    grant_management: 'Grant Management',
    outcome_tracking: 'Outcome Tracking',
    alma_full_detail: 'Full Intervention Details',
    alma_data_export: 'Data Export',
    governed_proof: 'Governed Proof Reports',
    api_access: 'API Access',
    custom_reports: 'Custom Reports',
  };
  return labels[feature];
}
