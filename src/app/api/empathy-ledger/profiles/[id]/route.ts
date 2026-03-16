import { NextRequest, NextResponse } from 'next/server';
import {
  getStorytellers,
  getStories,
  isV2Configured,
} from '@/lib/empathy-ledger/v2-client';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

/**
 * GET /api/empathy-ledger/profiles/[id]
 *
 * Fetches a single storyteller profile from Empathy Ledger v2 API.
 *
 * Query params:
 *   - include_stories: if 'true', include their stories
 *   - include_organization: if 'true', include organization details (still uses Supabase)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeStories = searchParams.get('include_stories') === 'true';
    const includeOrganization = searchParams.get('include_organization') === 'true';

    if (!isV2Configured) {
      return NextResponse.json(
        { success: false, error: 'Empathy Ledger not configured' },
        { status: 503 }
      );
    }

    // Fetch all storytellers and find the one matching this ID
    // (v2 API doesn't have a single-storyteller endpoint yet)
    const result = await getStorytellers({ limit: 200 });
    const profile = result.data.find(s => s.id === id);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found or not linked to this organization',
          consent_info: {
            reason: 'Profile may exist but is not linked to the JusticeHub organization'
          }
        },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = {
      profile: {
        id: profile.id,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        location: profile.location,
        cultural_background: profile.culturalBackground,
        created_at: profile.createdAt,
      },
      consent_info: {
        justicehub_enabled: true,
        description: 'This profile is linked to the JusticeHub organization'
      }
    };

    // Include organization if requested (org data not in v2 API yet)
    if (includeOrganization) {
      const { data: org } = await empathyLedgerClient
        .from('organizations')
        .select('id, name, slug, description, location, website_url, indigenous_controlled, traditional_country')
        .eq('slug', 'justicehub')
        .single();
      response.organization = org;
    }

    // Include stories if requested
    if (includeStories) {
      const storiesResult = await getStories({ storytellerId: id, limit: 10 });
      response.stories = storiesResult.data.map(story => ({
        id: story.id,
        title: story.title,
        summary: story.excerpt,
        story_image_url: story.imageUrl,
        themes: story.themes,
        is_featured: false,
        published_at: story.publishedAt,
        excerpt: story.excerpt || '',
      }));
      response.story_count = storiesResult.data.length;
    }

    return NextResponse.json({
      success: true,
      ...response
    });

  } catch (error: unknown) {
    console.error('Empathy Ledger profile API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
