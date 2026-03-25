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
    const city = searchParams.get('city');
    const outreachStatus = searchParams.get('outreach_status');

    const service = createServiceClient();

    let query = service
      .from('campaign_alignment_entities')
      .select('*', { count: 'exact' })
      .order('composite_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (list) query = query.eq('campaign_list', list);
    if (category) query = query.eq('alignment_category', category);
    if (entityType) query = query.eq('entity_type', entityType);
    if (outreachStatus) query = query.eq('outreach_status', outreachStatus);
    if (search) query = query.or(`name.ilike.%${search}%,organization.ilike.%${search}%,email.ilike.%${search}%`);

    // City filter — matches against alignment_signals, warm_paths, recommended_approach, and organization
    if (city) {
      const cityPatterns: Record<string, string> = {
        sydney: '%sydney%,%nsw%,%mount druitt%',
        brisbane: '%brisbane%,%queensland%,%qld%',
        adelaide: '%adelaide%,%south australia%',
        perth: '%perth%,%western australia%,%uwa%',
        alice_springs: '%alice springs%,%oonchiumpa%,%tennant creek%,%northern territory%',
        canberra: '%canberra%,%act%',
        melbourne: '%melbourne%,%victoria%',
        tasmania: '%tasmania%,%tassie%,%hobart%',
      };
      const patterns = cityPatterns[city];
      if (patterns) {
        const terms = patterns.split(',');
        const orClauses = terms.flatMap(t => [
          `recommended_approach.ilike.${t}`,
          `organization.ilike.${t}`,
          `alignment_signals::text.ilike.${t}`,
          `warm_paths::text.ilike.${t}`,
        ]);
        query = query.or(orClauses.join(','));
      }
    }

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
