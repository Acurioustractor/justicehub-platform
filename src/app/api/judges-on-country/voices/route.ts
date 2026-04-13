import { NextResponse } from 'next/server';
import {
  getStorytellers,
  getStories,
  getMedia,
  getGalleries,
  isV2Configured,
} from '@/lib/empathy-ledger/v2-client';

export const dynamic = 'force-dynamic';

const VOICE_STORYTELLER_IDS = [
  'b59a1f4c-94fd-4805-a2c5-cac0922133e0', // Kristy
  'dc85700d-f139-46fa-9074-6afee55ea801', // Tanya
  '6a86acf2-1701-41a9-96ef-d3bae49d91b3', // Jackquann
  '8dab91aa-3a1f-4128-b41d-b89e532be1fa', // Nigel (primary)
  '7a0cd28a-ad12-4f70-b900-d869b42c9f88', // Laquisha
  '4b35b1af-9815-4b66-89ed-84ac0f5b3a2b', // Fred
];

export async function GET() {
  if (!isV2Configured) {
    return NextResponse.json({
      storytellers: [],
      stories: [],
      media: [],
      galleries: [],
      configured: false,
    });
  }

  try {
    const [storytellerResult, storyResult, mediaResult, galleryResult] =
      await Promise.all([
        getStorytellers({ limit: 200 }),
        getStories({ limit: 50 }),
        getMedia({ limit: 30, type: 'image' }),
        getGalleries({ limit: 10 }),
      ]);

    const storytellers = storytellerResult.data
      .filter((s) => VOICE_STORYTELLER_IDS.includes(s.id))
      .map((s) => ({
        id: s.id,
        displayName: s.displayName,
        bio: s.bio,
        avatarUrl: s.avatarUrl,
        location: s.location,
        culturalBackground: s.culturalBackground,
        isElder: s.isElder,
        storyCount: s.storyCount,
      }));

    const stories = storyResult.data
      .filter(
        (s) => s.storyteller && VOICE_STORYTELLER_IDS.includes(s.storyteller.id)
      )
      .map((s) => ({
        id: s.id,
        title: s.title,
        excerpt: s.excerpt,
        imageUrl: s.imageUrl,
        publishedAt: s.publishedAt,
        themes: s.themes,
        storytellerId: s.storyteller?.id,
        storytellerName: s.storyteller?.displayName,
        detailUrl: s.detailUrl,
      }));

    const media = mediaResult.data
      .filter((m) => m.url)
      .map((m) => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        altText: m.altText,
        location: m.location,
        galleryId: m.galleryId,
        contentType: m.contentType,
      }));

    const galleries = galleryResult.data.map((g) => ({
      id: g.id,
      title: g.title,
      coverImage: g.coverImage,
      photoCount: g.photoCount,
    }));

    return NextResponse.json({
      storytellers,
      stories,
      media,
      galleries,
      configured: true,
    });
  } catch {
    return NextResponse.json(
      { storytellers: [], stories: [], media: [], galleries: [], configured: false },
      { status: 500 }
    );
  }
}
