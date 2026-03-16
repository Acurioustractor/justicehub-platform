import { NextRequest, NextResponse } from 'next/server';
import { getStories, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/stories
 *
 * Fetches public stories from Empathy Ledger v2 API for JusticeHub display.
 *
 * Query params:
 *   - limit: number of stories to return (default: 10)
 *   - featured: if 'true', only return featured stories (NYI in v2 — returns all)
 *   - storyteller_id: filter by storyteller
 */
export async function GET(request: NextRequest) {
  try {
    if (!isV2Configured) {
      return NextResponse.json({
        success: true,
        stories: [],
        count: 0,
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
        consent_info: {
          is_public: true,
          privacy_level: 'public',
          description: 'Empathy Ledger is not configured in this environment',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const storytellerId = searchParams.get('storyteller_id') || undefined;

    const result = await getStories({
      limit,
      storytellerId,
    });

    // Map story_type to human-readable category
    const storyTypeLabels: Record<string, string> = {
      'personal_narrative': 'Personal Story',
      'traditional_knowledge': 'Traditional Knowledge',
      'impact_story': 'Impact Story',
      'community_story': 'Community Story',
      'healing_journey': 'Healing Journey',
      'advocacy': 'Advocacy',
      'cultural_practice': 'Cultural Practice',
    };

    // Map v2 response to legacy format expected by JusticeHub frontend
    const enrichedStories = result.data.map(story => ({
      id: story.id,
      title: story.title,
      summary: story.excerpt,
      content: null, // List view doesn't need full content
      story_image_url: story.imageUrl,
      story_type: null,
      themes: story.themes,
      is_featured: false,
      justicehub_featured: false,
      cultural_sensitivity_level: story.culturalLevel,
      is_public: true,
      privacy_level: 'public',
      published_at: story.publishedAt,
      created_at: story.createdAt,
      storyteller_id: story.storyteller?.id || null,
      organization_id: null,
      excerpt: story.excerpt || '',
      story_category: null,
      storyteller_name: story.storyteller?.displayName || null,
    }));

    return NextResponse.json({
      success: true,
      stories: enrichedStories,
      count: result.pagination.total,
      consent_info: {
        is_public: true,
        privacy_level: 'public',
        description: 'All stories are public with explicit consent'
      }
    });

  } catch (error: unknown) {
    console.error('Empathy Ledger stories API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stories';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
