import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

const VALID_ROLES = ['attendee', 'volunteer', 'media', 'politician', 'educator', 'other'];

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
 * GET /api/projects/[slug]/reactions
 * Public: returns count, recent reactions, and aggregate stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Total count
    const { count, error: countError } = await supabase
      .from('tour_reactions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (countError) throw countError;

    // Recent 10 reactions
    const { data: recent, error: recentError } = await supabase
      .from('tour_reactions')
      .select('name, role, reaction, rating, would_recommend, created_at')
      .eq('project_id', project.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    // Recommendation rate
    const { data: recData } = await supabase
      .from('tour_reactions')
      .select('would_recommend')
      .eq('project_id', project.id)
      .eq('is_public', true);

    const totalReactions = recData?.length || 0;
    const wouldRecommend = recData?.filter((r: { would_recommend: boolean }) => r.would_recommend).length || 0;
    const recommendRate = totalReactions > 0 ? Math.round((wouldRecommend / totalReactions) * 100) : 0;

    return NextResponse.json({
      count: count || 0,
      recommendRate,
      recent: recent || [],
    });
  } catch (error) {
    console.error('Reactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[slug]/reactions
 * Public: submit a reaction after experiencing CONTAINED. No auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, role, reaction, rating, would_recommend, event_slug } = body;

    if (!name || !reaction) {
      return NextResponse.json(
        { error: 'name and reaction are required' },
        { status: 400 }
      );
    }

    if (reaction.length < 10) {
      return NextResponse.json(
        { error: 'Reaction must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Optionally resolve event
    let eventId = null;
    if (event_slug) {
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('slug', event_slug)
        .single();
      if (event) eventId = event.id;
    }

    const { error } = await supabase.from('tour_reactions').insert({
      project_id: project.id,
      event_id: eventId,
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      role: role || 'attendee',
      reaction: reaction.trim(),
      rating: rating ? Math.min(5, Math.max(1, parseInt(rating))) : null,
      would_recommend: would_recommend !== false,
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
          tags: [GHL_TAGS.CONTAINED_REACTION, GHL_TAGS.CONTAINED_LAUNCH],
          source: 'JusticeHub CONTAINED Reaction',
          customFields: {
            reaction_role: role || 'attendee',
            reaction_rating: rating ? String(rating) : '',
          },
        }).catch(console.error); // fire-and-forget
      }
    }

    const { count } = await supabase
      .from('tour_reactions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    return NextResponse.json({ success: true, count: count || 0 }, { status: 201 });
  } catch (error) {
    console.error('Reactions POST error:', error);
    return NextResponse.json({ error: 'Failed to submit reaction' }, { status: 500 });
  }
}
