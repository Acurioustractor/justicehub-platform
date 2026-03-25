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

  // Fetch user's org membership (if any)
  const { data: membership } = await service
    .from('organization_members')
    .select('organization_id, role, status, organizations(id, name, slug, state, city)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  // If user has active org membership, offer a link but still show personal hub
  const orgSlug = membership?.status === 'active'
    ? (membership.organizations as any)?.slug
    : null;

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

  return (
    <PersonalDashboard
      userName={publicProfile?.preferred_name || publicProfile?.full_name || user.email || 'Member'}
      memberType={memberType}
      userState={userState}
      matchedStop={matchedStop || null}
      orgSlug={orgSlug}
      orgName={(membership?.organizations as any)?.name || null}
      orgStatus={membership?.status || null}
      communityCounts={communityCounts}
      tourStops={tourStops}
      fundingCount={fundingCount}
      profileSlug={publicProfile?.slug || null}
      profileBio={publicProfile?.bio || null}
      profilePhoto={publicProfile?.photo_url || null}
    />
  );
}
