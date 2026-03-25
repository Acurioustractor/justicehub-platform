import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { MediaHubDashboard } from './MediaHubDashboard';

export default async function MediaHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/media');

  const service = createServiceClient();

  const { data: profile } = await service
    .from('public_profiles')
    .select('preferred_name, full_name, role_tags, location')
    .eq('user_id', user.id)
    .single();

  const userName = profile?.preferred_name || profile?.full_name || 'Member';
  const userState = profile?.location || '';

  // Latest media articles (real journalism about youth justice)
  const { data: latestMedia } = await service
    .from('alma_media_articles')
    .select('id, headline, source_name, published_date, url, state, sentiment')
    .order('published_date', { ascending: false })
    .limit(10);

  // Media by state (for user's region)
  const { data: stateMedia } = userState
    ? await service
        .from('alma_media_articles')
        .select('id, headline, source_name, published_date, url')
        .eq('state', userState)
        .order('published_date', { ascending: false })
        .limit(5)
    : { data: [] };

  // Key stats for data briefings
  const { count: totalMedia } = await service
    .from('alma_media_articles')
    .select('id', { count: 'exact', head: true });

  const { count: totalEvidence } = await service
    .from('alma_evidence')
    .select('id', { count: 'exact', head: true });

  const { count: totalInterventions } = await service
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .neq('verification_status', 'ai_generated');

  // Sentiment breakdown
  const { data: sentimentData } = await service
    .from('alma_media_articles')
    .select('sentiment')
    .not('sentiment', 'is', null);

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  for (const s of (sentimentData || [])) {
    const key = s.sentiment?.toLowerCase();
    if (key && key in sentimentCounts) {
      sentimentCounts[key as keyof typeof sentimentCounts]++;
    }
  }

  return (
    <MediaHubDashboard
      userName={userName}
      userState={userState}
      latestMedia={latestMedia || []}
      stateMedia={stateMedia || []}
      totalMedia={totalMedia || 0}
      totalEvidence={totalEvidence || 0}
      totalInterventions={totalInterventions || 0}
      sentimentCounts={sentimentCounts}
    />
  );
}
