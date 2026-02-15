import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface ProgramCatalogRecord {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  organization_name: string | null;
  organization: string | null;
  organization_slug: string | null;
  state: string | null;
  location: string | null;
  approach: string | null;
  impact_summary: string | null;
  success_rate: number | null;
  participants_served: number | null;
  years_operating: number | null;
  founded_year: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  indigenous_knowledge: boolean | null;
  community_connection_score: number | null;
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
    organization: asNullableString(record.organization),
    organization_slug: asNullableString(record.organization_slug),
    state: asNullableString(record.state),
    location: asNullableString(record.location),
    approach: asNullableString(record.approach),
    impact_summary: asNullableString(record.impact_summary),
    success_rate: asNullableNumber(record.success_rate),
    participants_served: asNullableNumber(record.participants_served),
    years_operating: asNullableNumber(record.years_operating),
    founded_year: asNullableNumber(record.founded_year),
    contact_phone: asNullableString(record.contact_phone),
    contact_email: asNullableString(record.contact_email),
    website: asNullableString(record.website),
    indigenous_knowledge: asNullableBoolean(record.indigenous_knowledge),
    community_connection_score: asNullableNumber(record.community_connection_score),
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;
    if (!programId) {
      return NextResponse.json({ success: false, error: 'Program ID is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const untypedSupabase = supabase as any;
    const { data, error } = await untypedSupabase
      .from('programs_catalog_v')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
      }
      console.error('Program detail API error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const normalizedProgram = normalizeProgramRecord(data);
    if (!normalizedProgram) {
      return NextResponse.json({ success: false, error: 'Program record is invalid' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      program: normalizedProgram,
    });
  } catch (error: unknown) {
    console.error('Program detail API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
