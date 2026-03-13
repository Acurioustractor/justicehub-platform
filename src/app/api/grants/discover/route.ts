import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const openOnly = searchParams.get('openOnly') !== 'false';
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50);
  const offset = Number(searchParams.get('offset') || 0);

  const supabase = createServiceClient();

  let qb = supabase
    .from('grant_opportunities')
    .select('id, name, description, provider, program, amount_min, amount_max, closes_at, status, categories, focus_areas, url, geography, grant_type', { count: 'exact' });

  // Only show grants with future deadlines by default
  if (openOnly) {
    qb = qb.gte('closes_at', new Date().toISOString().split('T')[0]);
  }

  // Text search
  if (query) {
    qb = qb.or(`name.ilike.%${query}%,description.ilike.%${query}%,provider.ilike.%${query}%`);
  }

  // Category filter
  if (category) {
    qb = qb.contains('categories', [category]);
  }

  // Amount filters
  if (minAmount) {
    qb = qb.gte('amount_max', Number(minAmount));
  }
  if (maxAmount) {
    qb = qb.lte('amount_min', Number(maxAmount));
  }

  const { data, count, error } = await qb
    .order('closes_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get summary stats
  const { count: totalOpen } = await supabase
    .from('grant_opportunities')
    .select('*', { count: 'exact', head: true })
    .gte('closes_at', new Date().toISOString().split('T')[0]);

  return NextResponse.json({
    grants: data || [],
    total: count || 0,
    totalOpen: totalOpen || 0,
    limit,
    offset,
  });
}
