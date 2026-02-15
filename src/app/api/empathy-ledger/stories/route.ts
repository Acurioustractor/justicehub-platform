import { NextRequest, NextResponse } from 'next/server';
import {
  empathyLedgerClient,
  isEmpathyLedgerConfigured,
} from '@/lib/supabase/empathy-ledger';

/**
 * GET /api/empathy-ledger/stories
 *
 * Fetches public stories from Empathy Ledger for JusticeHub display.
 *
 * Consent Model:
 * - Only returns stories where: is_public = true AND privacy_level = 'public'
 * - For JusticeHub featured: justicehub_featured = true
 *
 * Query params:
 *   - limit: number of stories to return (default: 10)
 *   - featured: if 'true', only return justicehub_featured stories
 *   - storyteller_id: filter by storyteller
 */
export async function GET(request: NextRequest) {
  try {
    if (!isEmpathyLedgerConfigured) {
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
    const featured = searchParams.get('featured') === 'true';
    const storytellerId = searchParams.get('storyteller_id');

    // Build query for stories (avoiding storytellers join due to RLS recursion)
    let query = empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_type,
        themes,
        is_featured,
        justicehub_featured,
        cultural_sensitivity_level,
        is_public,
        privacy_level,
        published_at,
        created_at,
        storyteller_id,
        organization_id
      `)
      // Core consent controls - only public stories
      .eq('is_public', true)
      .eq('privacy_level', 'public');

    // For JusticeHub featured, filter by justicehub_featured
    if (featured) {
      query = query.eq('justicehub_featured', true);
    }

    // Filter by storyteller
    if (storytellerId) {
      query = query.eq('storyteller_id', storytellerId);
    }

    // Order and limit
    query = query
      .order('justicehub_featured', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    const { data: stories, error } = await query;

    if (error) {
      console.error('Error fetching stories from Empathy Ledger:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

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

    // Enrich stories with excerpt and category (storyteller join removed due to RLS recursion)
    const enrichedStories = (stories || []).map(story => {
      return {
        ...story,
        excerpt: story.summary || (story.content ? story.content.substring(0, 200) + '...' : ''),
        // Map story_type to story_category for display
        story_category: story.story_type ? storyTypeLabels[story.story_type] || story.story_type : null,
        // Storyteller info not available due to RLS - would need separate query
        storyteller_name: null,
      };
    });

    return NextResponse.json({
      success: true,
      stories: enrichedStories,
      count: enrichedStories.length,
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
