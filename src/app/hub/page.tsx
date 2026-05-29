import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { PersonalDashboard } from './components/PersonalDashboard';
import { tourStops } from '@/content/campaign';

export default async function HubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/hub');
  }

  const service = createServiceClient();

  // Fetch user's public profile
  const { data: publicProfile } = await service
    .from('public_profiles')
    .select('id, full_name, preferred_name, role_tags, location, current_organization, slug, bio, photo_url')
    .eq('user_id', user.id)
    .single();

  // Fetch user's active org memberships. A person can administer more than one org.
  const { data: memberships } = await service
    .from('organization_members')
    .select('organization_id, role, status, created_at, organizations(id, name, slug, state, city)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const activeMemberships = memberships || [];
  const primaryMembership = activeMemberships[0] || null;
  const orgWorkspaces = activeMemberships
    .map((membership: any) => {
      const organization = membership.organizations as any;
      if (!organization?.slug) return null;
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: membership.role,
        status: membership.status,
        city: organization.city,
        state: organization.state,
      };
    })
    .filter(Boolean);

  const primaryWorkspace = orgWorkspaces[0] as { slug: string } | undefined;
  if (primaryWorkspace?.slug) {
    redirect(`/hub/${primaryWorkspace.slug}/practice`);
  }

  const { data: pendingClaim } = orgWorkspaces.length > 0
    ? { data: null }
    : await (service as any)
      .from('organization_claims')
      .select('id, status, organizations(id, name, slug, state, city)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  // Pending claims still use the personal hub. Verified organizations open their own workspace above.
  const orgSlug = primaryMembership?.status === 'active'
    ? (primaryMembership.organizations as any)?.slug
    : null;
  const orgRecord = primaryMembership?.status === 'active'
    ? (primaryMembership.organizations as any)
    : (pendingClaim?.organizations as any);
  const orgStatus = primaryMembership?.status || pendingClaim?.status || null;

  // Get member type from role_tags
  const roleTags: string[] = publicProfile?.role_tags || [];
  const memberType = roleTags.find(t => t.startsWith('contained_'))?.replace('contained_', '') || null;

  // Match state to tour stop
  const userState = publicProfile?.location || '';
  const matchedStop = tourStops.find(s => s.state === userState);

  // Get tour stop community counts (members by state)
  const { data: communityCountsRaw } = await service
    .from('public_profiles')
    .select('location, role_tags')
    .not('role_tags', 'is', null);

  // Aggregate counts per tour stop state
  const tourStopStates = ['NSW', 'QLD', 'SA', 'WA', 'NT'];
  const communityCounts: Record<string, { total: number; organizations: number; media: number; supporters: number; funders: number; lived_experience: number }> = {};

  for (const state of tourStopStates) {
    communityCounts[state] = { total: 0, organizations: 0, media: 0, supporters: 0, funders: 0, lived_experience: 0 };
  }

  if (communityCountsRaw) {
    for (const profile of communityCountsRaw) {
      const loc = profile.location || '';
      const tags: string[] = profile.role_tags || [];
      const containedTag = tags.find((t: string) => t.startsWith('contained_'));
      if (!containedTag) continue;
      const type = containedTag.replace('contained_', '');
      const matchState = tourStopStates.find(s => s === loc);
      if (matchState && communityCounts[matchState]) {
        communityCounts[matchState].total++;
        if (type in communityCounts[matchState]) {
          (communityCounts[matchState] as any)[type]++;
        }
      }
    }
  }

  // Get regional funding stats for user's state
  let fundingCount = 0;
  if (userState) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', userState);
    fundingCount = count || 0;
  }

  // Fetch user's engagement action counts
  const { data: userActions } = await service
    .from('member_actions')
    .select('action_type')
    .eq('user_id', user.id);

  const actionCounts: Record<string, number> = {};
  if (userActions) {
    for (const a of userActions) {
      actionCounts[(a as any).action_type] = (actionCounts[(a as any).action_type] || 0) + 1;
    }
  }

  // Pipeline-by-city: org claims per state + funding per state
  const { data: orgClaimsRaw } = await (service as any)
    .from('organization_claims')
    .select('organizations(state)')
    .in('status', ['verified', 'pending']);

  const orgClaimsByState: Record<string, number> = {};
  for (const state of tourStopStates) orgClaimsByState[state] = 0;
  if (orgClaimsRaw) {
    for (const claim of orgClaimsRaw) {
      const st = (claim.organizations as any)?.state;
      if (st && st in orgClaimsByState) orgClaimsByState[st]++;
    }
  }

  // Funding counts per tour stop state — parallel count queries
  const fundingByState: Record<string, number> = {};
  const fundingCounts = await Promise.all(
    tourStopStates.map(async (state) => {
      const { count } = await service
        .from('justice_funding')
        .select('id', { count: 'exact', head: true })
        .eq('state', state);
      return { state, count: count || 0 };
    })
  );
  for (const { state, count } of fundingCounts) fundingByState[state] = count;

  const pipelineByCity: Record<string, { members: number; orgsClaimed: number; fundingRecords: number }> = {};
  for (const state of tourStopStates) {
    pipelineByCity[state] = {
      members: communityCounts[state]?.total || 0,
      orgsClaimed: orgClaimsByState[state] || 0,
      fundingRecords: fundingByState[state] || 0,
    };
  }

  return (
    <PersonalDashboard
      userName={publicProfile?.preferred_name || publicProfile?.full_name || user.email || 'Member'}
      memberType={memberType}
      userState={userState}
      matchedStop={matchedStop || null}
      orgSlug={orgSlug}
      orgName={orgRecord?.name || null}
      orgStatus={orgStatus}
      orgWorkspaces={orgWorkspaces as any}
      communityCounts={communityCounts}
      tourStops={tourStops}
      fundingCount={fundingCount}
      pipelineByCity={pipelineByCity}
      profileSlug={publicProfile?.slug || null}
      profileBio={publicProfile?.bio || null}
      profilePhoto={publicProfile?.photo_url || null}
      actionCounts={actionCounts}
    />
  );
}
