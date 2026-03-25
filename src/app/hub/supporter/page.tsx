import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { SupporterHubDashboard } from './SupporterHubDashboard';
import { tourStops } from '@/content/campaign';

export default async function SupporterHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/supporter');

  const service = createServiceClient();

  const { data: profile } = await service
    .from('public_profiles')
    .select('preferred_name, full_name, role_tags, location')
    .eq('user_id', user.id)
    .single();

  const userName = profile?.preferred_name || profile?.full_name || 'Member';
  const userState = profile?.location || '';
  const matchedStop = tourStops.find(s => s.state === userState) || null;

  // Network growth — count members by role
  const { data: allMembers } = await service
    .from('public_profiles')
    .select('role_tags, location')
    .not('role_tags', 'is', null);

  let totalMembers = 0;
  let totalOrgs = 0;
  let totalSupporters = 0;
  const stateCounts: Record<string, number> = {};
  for (const m of (allMembers || [])) {
    const tags: string[] = m.role_tags || [];
    const containedTag = tags.find(t => t.startsWith('contained_'));
    if (!containedTag) continue;
    totalMembers++;
    if (containedTag === 'contained_organization') totalOrgs++;
    if (containedTag === 'contained_supporter') totalSupporters++;
    if (m.location) {
      stateCounts[m.location] = (stateCounts[m.location] || 0) + 1;
    }
  }

  // Key impact numbers from the platform
  const { count: fundingRecords } = await service
    .from('justice_funding')
    .select('id', { count: 'exact', head: true });

  const { count: interventions } = await service
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .neq('verification_status', 'ai_generated');

  return (
    <SupporterHubDashboard
      userName={userName}
      userState={userState}
      matchedStop={matchedStop}
      tourStops={tourStops}
      totalMembers={totalMembers}
      totalOrgs={totalOrgs}
      totalSupporters={totalSupporters}
      stateCounts={stateCounts}
      fundingRecords={fundingRecords || 0}
      interventions={interventions || 0}
    />
  );
}
