import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[id]
 *
 * Fetch a complete organization profile with all enrichment data:
 * - Organization basic info
 * - Partner goals (mission, vision, values)
 * - Partner contacts
 * - Partner videos
 * - Partner photos
 * - Partner stories (from Empathy Ledger)
 * - Partner storytellers
 * - Impact metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (orgError || !organization) {
      // Try by slug instead
      const { data: orgBySlug, error: slugError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', id)
        .eq('is_active', true)
        .single();

      if (slugError || !orgBySlug) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      // Use the org found by slug
      return fetchFullProfile(supabase, orgBySlug);
    }

    return fetchFullProfile(supabase, organization);
  } catch (error) {
    console.error('Organization fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchFullProfile(supabase: any, organization: any) {
  const orgId = organization.id;

  // Fetch all enrichment data in parallel
  const [
    goalsResult,
    contactsResult,
    videosResult,
    photosResult,
    storiesResult,
    storytellersResult,
    metricsResult,
  ] = await Promise.all([
    supabase
      .from('partner_goals')
      .select('*')
      .eq('organization_id', orgId)
      .order('display_order'),

    supabase
      .from('partner_contacts')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_primary', { ascending: false })
      .order('display_order'),

    supabase
      .from('partner_videos')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .order('is_featured', { ascending: false }),

    supabase
      .from('partner_photos')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('display_order'),

    supabase
      .from('partner_stories')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .eq('consent_level', 'public')
      .order('is_featured', { ascending: false }),

    supabase
      .from('partner_storytellers')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .eq('consent_level', 'public')
      .order('is_featured', { ascending: false }),

    supabase
      .from('partner_impact_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_featured', true)
      .order('display_order'),
  ]);

  return NextResponse.json({
    organization,
    goals: goalsResult.data || [],
    contacts: contactsResult.data || [],
    videos: videosResult.data || [],
    photos: photosResult.data || [],
    stories: storiesResult.data || [],
    storytellers: storytellersResult.data || [],
    metrics: metricsResult.data || [],
  });
}
