import { NextResponse } from 'next/server';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@/lib/supabase/server';

// Channel IDs from syndication_channels table
const CONTAINED_CHANNEL = '31ec3bee-4c2c-4264-a39f-33c421cdf2d6';
const JH_CHANNEL = 'ee99f4c9-68b2-474c-9563-f5a513993aba';

/**
 * GET /api/contained/voices
 * Returns storytellers for display, sourced from Empathy Ledger.
 * Primary: storytellers in "contained" syndication channel
 * Fallback: storytellers in "justicehub" channel
 * Quotes sourced from EL stories (public, consented).
 */
export async function GET() {
  try {
    // Get storyteller IDs from the contained channel
    let channelId = CONTAINED_CHANNEL;
    let { data: members } = await empathyLedgerClient
      .from('storyteller_channels')
      .select('storyteller_id')
      .eq('channel_id', CONTAINED_CHANNEL);

    // Fallback to JH channel if no contained members
    if (!members || members.length === 0) {
      const result = await empathyLedgerClient
        .from('storyteller_channels')
        .select('storyteller_id')
        .eq('channel_id', JH_CHANNEL);
      members = result.data;
      channelId = JH_CHANNEL;
    }

    if (!members || members.length === 0) {
      return NextResponse.json([]);
    }

    const storytellerIds = members.map((m) => m.storyteller_id);

    // Fetch storyteller details
    const { data: storytellers, error } = await empathyLedgerClient
      .from('storytellers')
      .select(
        'id, display_name, public_avatar_url, bio, profiles(avatar_url)'
      )
      .in('id', storytellerIds)
      .eq('is_active', true)
      .order('display_name')
      .limit(50);

    if (error) throw error;
    if (!storytellers || storytellers.length === 0) {
      return NextResponse.json([]);
    }

    // Get public stories for these storytellers (for quotes)
    const activeIds = storytellers.map((s) => s.id);
    const { data: stories } = await empathyLedgerClient
      .from('stories')
      .select('storyteller_id, summary, content, title')
      .in('storyteller_id', activeIds)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .order('published_at', { ascending: false });

    // Build storyteller_id → best quote map
    const quoteMap = new Map<string, string>();
    if (stories) {
      for (const story of stories) {
        if (!story.storyteller_id || quoteMap.has(story.storyteller_id)) continue;

        const raw = story.summary || (story.content ? story.content.substring(0, 300) : '');
        const cleaned = cleanQuote(raw);
        if (cleaned.length > 10) {
          quoteMap.set(story.storyteller_id, cleaned);
        }
      }
    }

    // Get video URLs from JH side (storyteller_videos is JH-local)
    const supabase = await createClient();
    const { data: videos } = await supabase
      .from('storyteller_videos')
      .select('storyteller_id, url, storytellers!inner(full_name)')
      .limit(50);

    const videoMap = new Map<string, string>();
    if (videos) {
      for (const v of videos) {
        const name = (v.storytellers as unknown as { full_name: string })?.full_name;
        if (name && v.url && !videoMap.has(name)) {
          videoMap.set(name, v.url);
        }
      }
    }

    // Build voice entries
    const voices = storytellers
      .map((s: any) => {
        const profile = s.profiles as { avatar_url: string | null } | null;
        const avatarUrl = s.public_avatar_url || profile?.avatar_url;
        const name = (s.display_name || 'Anonymous').trim();
        const quote = quoteMap.get(s.id) || '';

        // Skip SVG placeholders and unsplash stock photos
        if (avatarUrl?.endsWith('.svg') || avatarUrl?.includes('unsplash.com')) return null;
        // Must have a usable quote or bio
        if (!quote && !s.bio) return null;

        return {
          name,
          image_url: avatarUrl || null,
          quote: quote || cleanQuote(s.bio || ''),
          video_url: videoMap.get(name) || undefined,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null && v.quote.length > 10)
      .slice(0, 12);

    return NextResponse.json(voices);
  } catch (error) {
    console.error('Voices GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

/** Clean up a quote — remove transcript artifacts */
function cleanQuote(raw: string): string {
  let q = raw
    .replace(/\*\*Speaker \d+:\*\*/g, '')
    .replace(/\[\d{2}:\d{2}(:\d{2})?\]/g, '')
    .replace(/^[^a-zA-Z"']+/, '')
    .trim();

  if (q.length > 200) q = q.substring(0, 200) + '...';
  return q;
}
