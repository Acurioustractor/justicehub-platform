import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ProgramCatalogRecord {
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

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const untypedSupabase = supabase as any;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500);
    const search = searchParams.get('search')?.trim();

    let query = untypedSupabase
      .from('programs_catalog_v')
      .select('*')
      .limit(limit)
      .order('is_featured', { ascending: false })
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,organization_name.ilike.%${search}%`);
    }

    const { data: programs, error } = await query;

    if (error) {
      console.error('Error fetching community programs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalizedPrograms = Array.isArray(programs)
      ? programs
          .map(normalizeProgramRecord)
          .filter((program): program is ProgramCatalogRecord => program !== null)
      : [];

    const compatibilityPrograms = normalizedPrograms.map((program) => ({
      ...program,
      organization: program.organization_name,
    }));

    return NextResponse.json({
      success: true,
      programs: compatibilityPrograms,
    });
  } catch (error: unknown) {
    console.error('Community programs API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
