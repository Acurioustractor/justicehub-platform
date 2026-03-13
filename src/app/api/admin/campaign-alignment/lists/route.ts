import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/admin/campaign-alignment/lists?list=allies_to_activate&limit=50&offset=0&search=...
 * Returns paginated campaign list entities ordered by composite_score.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const list = searchParams.get('list');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const entityType = searchParams.get('entity_type');

    const service = createServiceClient();

    let query = service
      .from('campaign_alignment_entities')
      .select('*', { count: 'exact' })
      .order('composite_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (list) query = query.eq('campaign_list', list);
    if (category) query = query.eq('alignment_category', category);
    if (entityType) query = query.eq('entity_type', entityType);
    if (search) query = query.or(`name.ilike.%${search}%,organization.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      entities: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Campaign lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}
