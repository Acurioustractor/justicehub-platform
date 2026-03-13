import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * Resolve art_innovation project by slug
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProject(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from('art_innovation')
    .select('id, title, slug')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * Privacy helper: "First L." from full name
 */
function toDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return parts[0];
}

/**
 * GET /api/projects/[slug]/backers
 * Public: returns count, recent first names, and featured backers with avatars
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get count
    const { count, error: countError } = await supabase
      .from('project_backers')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (countError) throw countError;

    // Get recent 5 names (first name + last initial only)
    const { data: recent, error: recentError } = await supabase
      .from('project_backers')
      .select('name, created_at')
      .eq('project_id', project.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const recentNames = (recent || []).map((b: { name: string }) =>
      toDisplayName(b.name)
    );

    // Get featured backers (public, with avatar/message, up to 20)
    const { data: featuredRaw, error: featuredError } = await supabase
      .from('project_backers')
      .select('name, avatar_url, message')
      .eq('project_id', project.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (featuredError) throw featuredError;

    const featured = (featuredRaw || []).map(
      (b: { name: string; avatar_url: string | null; message: string | null }) => ({
        name: toDisplayName(b.name),
        avatar_url: b.avatar_url || undefined,
        message: b.message || undefined,
      })
    );

    return NextResponse.json({
      count: count || 0,
      recentNames,
      featured,
    });
  } catch (error) {
    console.error('Backers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch backers' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[slug]/backers
 * Public: add a backer (name, email, optional message). No auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabase
      .from('project_backers')
      .upsert(
        {
          project_id: project.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: message?.trim() || null,
          is_public: true,
        },
        { onConflict: 'project_id,email' }
      );

    if (error) throw error;

    // Sync backer to GHL
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      ghl.upsertContact({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        tags: [GHL_TAGS.CONTAINED_TOUR_BACKER, GHL_TAGS.CONTAINED_LAUNCH],
        source: `JusticeHub CONTAINED Backer`,
        customFields: {
          backer_message: message?.trim() || '',
        },
      }).catch(console.error); // fire-and-forget
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Backers POST error:', error);
    return NextResponse.json({ error: 'Failed to add backer' }, { status: 500 });
  }
}
