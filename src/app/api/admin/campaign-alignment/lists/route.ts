import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/admin/campaign-alignment/lists?list=allies_to_activate&limit=50&offset=0&search=...
 * Returns paginated campaign list entities with filtering and sorting.
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
    const city = searchParams.get('city');
    const outreachStatus = searchParams.get('outreach_status');
    const sectorTag = searchParams.get('sector_tag');
    const stateFilter = searchParams.get('state');
    const sortBy = searchParams.get('sort') || 'composite_score';
    const sortDir = searchParams.get('dir') === 'asc' ? true : false;

    const service = createServiceClient();

    // Valid sort columns
    const validSorts = ['composite_score', 'justice_alignment_score', 'reach_influence_score', 'accessibility_score', 'name', 'outreach_status', 'sector_tag', 'passion_score'];
    const sortColumn = validSorts.includes(sortBy) ? sortBy : 'composite_score';

    let query = service
      .from('campaign_alignment_entities')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortDir })
      .range(offset, offset + limit - 1);

    if (list) query = query.eq('campaign_list', list);
    if (category) query = query.eq('alignment_category', category);
    if (entityType) query = query.eq('entity_type', entityType);
    if (outreachStatus === 'hot') {
      query = query.in('outreach_status', ['responded', 'committed', 'active']);
    } else if (outreachStatus === 'warm') {
      query = query.in('outreach_status', ['contacted', 'sent', 'proposal_sent']);
    } else if (outreachStatus === 'cold') {
      query = query.in('outreach_status', ['pending', 'not_started']);
    } else if (outreachStatus) {
      query = query.eq('outreach_status', outreachStatus);
    }
    if (sectorTag) query = query.eq('sector_tag', sectorTag);
    if (search) query = query.or(`name.ilike.%${search}%,organization.ilike.%${search}%,email.ilike.%${search}%`);

    // Location filters — direct column match
    if (city) query = query.eq('city', city);
    if (stateFilter) query = query.eq('state', stateFilter);

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
