import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export interface ProgramCatalogRecord {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  organization_name: string | null;
  state: string | null;
  location: string | null;
  approach: string | null;
  impact_summary: string | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  alma_intervention_id: string | null;
  linked_service_id: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asStringArrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeProgramRecord(row: unknown): ProgramCatalogRecord | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const record = row as Record<string, unknown>;
  const id = asNullableString(record.id);
  const name = asNullableString(record.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    description: asNullableString(record.description),
    organization_id: asNullableString(record.organization_id),
    organization_name: asNullableString(record.organization_name),
    state: asNullableString(record.state),
    location: asNullableString(record.location),
    approach: asNullableString(record.approach),
    impact_summary: asNullableString(record.impact_summary),
    tags: asStringArrayOrNull(record.tags),
    latitude: asNullableNumber(record.latitude),
    longitude: asNullableNumber(record.longitude),
    alma_intervention_id: asNullableString(record.alma_intervention_id),
    linked_service_id: asNullableString(record.linked_service_id),
    is_featured: asNullableBoolean(record.is_featured),
    created_at: asNullableString(record.created_at),
    updated_at: asNullableString(record.updated_at),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const untypedSupabase = supabase as any;
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10), 1), 200);
    const search = searchParams.get('search')?.trim();
    const state = searchParams.get('state')?.trim();
    const approach = searchParams.get('approach')?.trim();
    const featured = searchParams.get('featured');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = untypedSupabase
      .from('programs_catalog_v')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,organization_name.ilike.%${search}%`);
    }

    if (state && state.toLowerCase() !== 'all') {
      query = query.eq('state', state);
    }

    if (approach && approach.toLowerCase() !== 'all') {
      query = query.eq('approach', approach);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Programs API error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const programs = Array.isArray(data)
      ? data
          .map(normalizeProgramRecord)
          .filter((program): program is ProgramCatalogRecord => program !== null)
      : [];

    return NextResponse.json({
      success: true,
      programs,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Programs API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
