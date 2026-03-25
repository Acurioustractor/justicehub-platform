import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * GET /api/hub/search-orgs?q=name&state=NSW
 *
 * Search organizations for the claim flow.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const state = searchParams.get('state');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  let query = supabase
    .from('organizations')
    .select('id, name, slug, state, city')
    .ilike('name', `%${q}%`)
    .eq('is_active', true)
    .order('name')
    .limit(10);

  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data || [] });
}
