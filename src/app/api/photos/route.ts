import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/photos — Campaign photo catalog from media_assets
 *
 * Query params:
 *   category: filter by category (hero, people, places, programs, spain, community, data, contained, goods)
 *   tag: filter by tag (real-photo, ai-generated, replace, oonchiumpa, bg-fit, indigenous)
 *   campaign_status: available | nominated | approved | flagged-replace
 *   search: text search on filename/title
 *   page: pagination (default 1)
 *   limit: items per page (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const campaignStatus = searchParams.get('campaign_status');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('media_assets')
    .select('*', { count: 'exact' })
    .eq('uploaded_by', 'import-photos-to-el')
    .order('category')
    .order('filename')
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (campaignStatus) {
    query = query.eq('metadata->>campaign_status', campaignStatus);
  }

  if (search) {
    const sanitized = search.replace(/[,().]/g, '').slice(0, 100);
    query = query.or(`filename.ilike.%${sanitized}%,metadata->>title.ilike.%${sanitized}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Photos API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Category summary
  const { data: catCounts } = await supabase
    .from('media_assets')
    .select('category')
    .eq('uploaded_by', 'import-photos-to-el');

  const categories: Record<string, number> = {};
  for (const row of catCounts || []) {
    categories[row.category] = (categories[row.category] || 0) + 1;
  }

  return NextResponse.json({
    photos: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    categories,
  });
}

/**
 * PATCH /api/photos — Update photo metadata (tags, campaign_status)
 * Requires admin authentication.
 */
export async function PATCH(request: NextRequest) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const { data: profile } = await authSupabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const body = await request.json();

  const { id, tags, campaign_status, campaign_use } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Fetch current record
  const { data: current, error: fetchErr } = await supabase
    .from('media_assets')
    .select('tags, metadata')
    .eq('id', id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (tags !== undefined) {
    updates.tags = tags;
  }

  if (campaign_status !== undefined || campaign_use !== undefined) {
    const metadata = { ...(current.metadata || {}) };
    if (campaign_status !== undefined) metadata.campaign_status = campaign_status;
    if (campaign_use !== undefined) metadata.campaign_use = campaign_use;
    updates.metadata = metadata;
  }

  const { error: updateErr } = await supabase
    .from('media_assets')
    .update(updates)
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
