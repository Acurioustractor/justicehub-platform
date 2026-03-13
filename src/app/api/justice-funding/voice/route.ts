import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/justice-funding/voice
 * Submit a community voice entry
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      author_name,
      author_role,
      author_anonymous,
      location,
      organization_id,
      organization_name,
      what_is_needed,
      what_is_working,
      what_is_harmful,
      what_success_looks_like,
      priority_areas,
      target_groups,
      consent_level,
    } = body;

    if (!location || !what_is_needed) {
      return NextResponse.json(
        { error: 'location and what_is_needed are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('community_voices')
      .insert({
        author_name: author_anonymous ? null : author_name,
        author_role,
        author_anonymous: !!author_anonymous,
        location,
        state: 'QLD',
        organization_id: organization_id || null,
        organization_name: organization_name || null,
        what_is_needed,
        what_is_working: what_is_working || null,
        what_is_harmful: what_is_harmful || null,
        what_success_looks_like: what_success_looks_like || null,
        priority_areas: priority_areas || [],
        target_groups: target_groups || [],
        consent_level: consent_level || 'public',
        source: 'web_form',
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, status: 'pending' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/justice-funding/voice?location=X or org=UUID
 * Get approved community voices
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const location = params.get('location');
  const orgId = params.get('org');
  const state = params.get('state') || 'QLD';

  let query = supabase
    .from('community_voices')
    .select('id, location, author_role, what_is_needed, what_is_working, what_is_harmful, what_success_looks_like, priority_areas, created_at, organization_name')
    .eq('status', 'approved')
    .eq('consent_level', 'public')
    .eq('state', state)
    .order('created_at', { ascending: false })
    .limit(50);

  if (location) query = query.ilike('location', `%${location}%`);
  if (orgId) query = query.eq('organization_id', orgId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
