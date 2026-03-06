import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

const VALID_CATEGORIES = [
  'politician',
  'justice_official',
  'media',
  'business',
  'community',
  'other',
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
 * GET /api/projects/[slug]/nominations
 * Public: returns count, breakdown by category, and recent nominations
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
      .from('campaign_nominations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (countError) throw countError;

    // Count by category
    const { data: catRows, error: catError } = await supabase
      .from('campaign_nominations')
      .select('category')
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (catError) throw catError;

    const byCategory: Record<string, number> = {};
    for (const row of catRows || []) {
      byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    }

    // Recent 10 nominations (public info only — no nominator details)
    const { data: recent, error: recentError } = await supabase
      .from('campaign_nominations')
      .select('nominee_name, category, reason, created_at')
      .eq('project_id', project.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    const recentNominations = (recent || []).map(
      (n: { nominee_name: string; category: string; reason: string; created_at: string }) => ({
        nominee_name: n.nominee_name,
        category: n.category,
        reason: n.reason.length > 100 ? n.reason.slice(0, 100) + '...' : n.reason,
        created_at: n.created_at,
      })
    );

    return NextResponse.json({
      count: count || 0,
      byCategory,
      recent: recentNominations,
    });
  } catch (error) {
    console.error('Nominations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch nominations' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[slug]/nominations
 * Public: submit a nomination. No auth required.
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
    const { nominee_name, nominee_title, nominee_org, category, reason, nominator_name, nominator_email } = body;

    if (!nominee_name || !category || !reason) {
      return NextResponse.json(
        { error: 'nominee_name, category, and reason are required' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (nominator_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nominator_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabase.from('campaign_nominations').insert({
      project_id: project.id,
      nominee_name: nominee_name.trim(),
      nominee_title: nominee_title?.trim() || null,
      nominee_org: nominee_org?.trim() || null,
      category,
      reason: reason.trim(),
      nominator_name: nominator_name?.trim() || null,
      nominator_email: nominator_email?.trim().toLowerCase() || null,
      is_public: true,
    });

    if (error) throw error;

    // Sync nominator to GHL if they provided email
    if (nominator_email) {
      const ghl = getGHLClient();
      if (ghl.isConfigured()) {
        ghl.upsertContact({
          email: nominator_email.trim().toLowerCase(),
          name: nominator_name?.trim() || '',
          tags: [GHL_TAGS.CONTAINED_NOMINATOR, GHL_TAGS.CONTAINED_LAUNCH],
          source: 'JusticeHub CONTAINED Nomination',
          customFields: {
            nominated: nominee_name.trim(),
            nomination_category: category,
          },
        }).catch(console.error); // fire-and-forget
      }
    }

    // Return updated count
    const { count } = await supabase
      .from('campaign_nominations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    return NextResponse.json({ success: true, count: count || 0 }, { status: 201 });
  } catch (error) {
    console.error('Nominations POST error:', error);
    return NextResponse.json({ error: 'Failed to submit nomination' }, { status: 500 });
  }
}
