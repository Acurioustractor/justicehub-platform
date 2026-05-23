/**
 * /kiosk/lenses/stories — STORIES lens.
 *
 * Portrait + pull quote + place, one story per screen, swipe for next.
 * Pulls from alma_stories where story_type = 'community_voice' and status =
 * 'published'. Mounty Yarns is REMOVED per project decision (see CLAUDE.md
 * anchor communities). Tap the photo to drill into the full story page.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../components/LensBar';
import { StorySwiper } from './StorySwiper';

export const revalidate = 600;

export interface Story {
  id: string;
  title: string;
  summary: string;
  full_story: string | null;
  media_urls: string[] | null;
  region_slug: string | null;
  linked_organization_ids: string[] | null;
}

async function getStories(): Promise<Story[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('alma_stories')
    .select('id, title, summary, full_story, media_urls, region_slug, linked_organization_ids, story_date, featured')
    .eq('status', 'published')
    .eq('story_type', 'community_voice')
    .not('summary', 'is', null)
    .order('featured', { ascending: false })
    .order('story_date', { ascending: false, nullsFirst: false })
    .limit(40);
  if (error) {
    console.error('getStories failed', error);
    return [];
  }
  // Drop Mounty Yarns per CLAUDE.md anchor-community decision.
  return (data || []).filter((s: Story) => !(s.title || '').toLowerCase().includes('mounty yarns'));
}

export default async function StoriesLensPage() {
  const stories = await getStories();

  return (
    <>
      <LensBar current="stories" />
      <div className="flex-1 bg-[#0A0A0A] text-white">
        {stories.length === 0 ? (
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl font-bold mb-3">Voices coming soon.</h1>
            <p className="text-stone-400">Stories from the work, in their own words.</p>
          </div>
        ) : (
          <StorySwiper stories={stories} />
        )}
      </div>
    </>
  );
}
