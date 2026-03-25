import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { LivedExperienceHubDashboard } from './LivedExperienceHubDashboard';
import { tourStops } from '@/content/campaign';

export default async function LivedExperienceHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/lived-experience');

  const service = createServiceClient();

  const { data: profile } = await service
    .from('public_profiles')
    .select('preferred_name, full_name, role_tags, location, is_public')
    .eq('user_id', user.id)
    .single();

  const userName = profile?.preferred_name || profile?.full_name || 'Member';
  const userState = profile?.location || '';
  const isPublic = profile?.is_public || false;
  const matchedStop = tourStops.find(s => s.state === userState) || null;

  // Peer count — other lived experience members
  const { data: peerMembers } = await service
    .from('public_profiles')
    .select('preferred_name, location, is_public')
    .contains('role_tags', ['contained_lived_experience']);

  const totalPeers = (peerMembers || []).length;
  const publicPeers = (peerMembers || []).filter(p => p.is_public);
  const peersByState: Record<string, number> = {};
  for (const p of (peerMembers || [])) {
    if (p.location) peersByState[p.location] = (peersByState[p.location] || 0) + 1;
  }

  // Stories that exist (community voices)
  const { count: storyCount } = await service
    .from('alma_media_articles')
    .select('id', { count: 'exact', head: true });

  // Interventions that serve youth
  const { data: youthProgramsRaw } = await service
    .from('alma_interventions')
    .select('id, name, evidence_level, organizations(name)')
    .neq('verification_status', 'ai_generated')
    .limit(8);

  const youthPrograms = (youthProgramsRaw || []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    evidence_level: i.evidence_level as string | null,
    organizations: i.organizations as { name: string } | null,
  }));

  return (
    <LivedExperienceHubDashboard
      userName={userName}
      userState={userState}
      isPublic={isPublic}
      matchedStop={matchedStop}
      tourStops={tourStops}
      totalPeers={totalPeers}
      publicPeers={publicPeers}
      peersByState={peersByState}
      storyCount={storyCount || 0}
      youthPrograms={youthPrograms || []}
    />
  );
}
