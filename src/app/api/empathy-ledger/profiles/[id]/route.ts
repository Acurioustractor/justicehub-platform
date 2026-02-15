import { NextRequest, NextResponse } from 'next/server';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

/**
 * GET /api/empathy-ledger/profiles/[id]
 *
 * Fetches a single profile from Empathy Ledger with full consent controls.
 * Only returns profile if:
 * 1. Profile has justicehub_enabled = true (opted in)
 *
 * Query params:
 *   - include_stories: if 'true', include their public stories
 *   - include_organization: if 'true', include organization details
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

    // Fetch profile with consent check
    const { data: profile, error: profileError } = await empathyLedgerClient
      .from('profiles')
      .select(`
        id,
        display_name,
        bio,
        avatar_url,
        justicehub_role,
        justicehub_featured,
        primary_organization_id,
        location,
        created_at
      `)
      .eq('id', id)
      .eq('justicehub_enabled', true) // Must be opted in
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Profile not found or not enabled for JusticeHub',
            consent_info: {
              reason: 'Profile may exist but has not opted in to JusticeHub display'
            }
          },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Build response
    const response: Record<string, unknown> = {
      profile,
      consent_info: {
        justicehub_enabled: true,
        description: 'This profile has opted in to be displayed on JusticeHub'
      }
    };

    // Include organization if requested
    if (includeOrganization && profile.primary_organization_id) {
      const { data: organization } = await empathyLedgerClient
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          location,
          website_url,
          indigenous_controlled,
          traditional_country,
          empathy_ledger_enabled
        `)
        .eq('id', profile.primary_organization_id)
        .single();

      response.organization = organization;
    }

    // Include stories if requested (with consent controls)
    if (includeStories) {
      const { data: stories } = await empathyLedgerClient
        .from('stories')
        .select(`
          id,
          title,
          summary,
          story_image_url,
          story_category,
          themes,
          is_featured,
          cultural_warnings,
          elder_approved_at,
          published_at
        `)
        .or(`storyteller_id.eq.${id},author_id.eq.${id}`)
        // Core consent controls
        .eq('is_public', true)
        .eq('privacy_level', 'public')
        .order('published_at', { ascending: false })
        .limit(10);

      response.stories = (stories || []).map(story => ({
        ...story,
        excerpt: story.summary?.substring(0, 200) || '',
        has_cultural_warnings: story.cultural_warnings && story.cultural_warnings.length > 0,
        is_elder_approved: !!story.elder_approved_at
      }));
      response.story_count = stories?.length || 0;
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
