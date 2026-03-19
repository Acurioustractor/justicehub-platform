import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

const VALID_TOUR_STOPS = [
  'Mount Druitt',
  'Adelaide',
  'Perth',
  'Tennant Creek',
];

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
 * GET /api/projects/[slug]/tour-stories
 * Public: returns approved public tour stories
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('tour_stories')
      .select('id, name, tour_stop, story, created_at', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('status', 'approved')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      stories: data || [],
      total: count || 0,
      page,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Tour stories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[slug]/tour-stories
 * Public: submit a tour story. No auth required.
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
    const { name, email, tour_stop, story } = body;

    if (!name || !tour_stop || !story) {
      return NextResponse.json(
        { error: 'name, tour_stop, and story are required' },
        { status: 400 }
      );
    }

    if (!VALID_TOUR_STOPS.includes(tour_stop)) {
      return NextResponse.json(
        { error: `Invalid tour stop. Must be one of: ${VALID_TOUR_STOPS.join(', ')}` },
        { status: 400 }
      );
    }

    if (story.length < 20) {
      return NextResponse.json(
        { error: 'Story must be at least 20 characters' },
        { status: 400 }
      );
    }

    if (story.length > 2000) {
      return NextResponse.json(
        { error: 'Story must be 2000 characters or less' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabase.from('tour_stories').insert({
      project_id: project.id,
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      tour_stop,
      story: story.trim(),
      status: 'pending',
      is_public: true,
    });

    if (error) throw error;

    // Sync to GHL if email provided
    if (email) {
      const ghl = getGHLClient();
      if (ghl.isConfigured()) {
        ghl.upsertContact({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          tags: [GHL_TAGS.REACTED, GHL_TAGS.CONTAINED, GHL_TAGS.JUSTICEHUB],
          source: 'JusticeHub CONTAINED Story',
          customFields: {
            tour_stop,
          },
        }).catch(console.error); // fire-and-forget
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Tour stories POST error:', error);
    return NextResponse.json({ error: 'Failed to submit story' }, { status: 500 });
  }
}
