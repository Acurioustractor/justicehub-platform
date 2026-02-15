import { createServiceClient } from '@/lib/supabase/service';
import { CommunityProgramsContent } from './page-content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community Programs - JusticeHub',
  description: 'Evidence-based community programs across Australia. Indigenous-led, diversion, mentoring, and cultural programs that transform lives.',
};

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

async function getCommunityProgramsData() {
  const supabase = createServiceClient();
  const untypedSupabase = supabase as any;

  try {
    const { data: programs, error } = await untypedSupabase
      .from('programs_catalog_v')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching community programs:', error);
      return { programs: [] };
    }

    const normalizedPrograms = Array.isArray(programs)
      ? programs
          .map(normalizeProgramRecord)
          .filter((program): program is ProgramCatalogRecord => program !== null)
      : [];

    return { programs: normalizedPrograms };
  } catch (error) {
    console.error('Error fetching community programs data:', error);
    return { programs: [] };
  }
}

export default async function CommunityProgramsPage() {
  const { programs } = await getCommunityProgramsData();

  return <CommunityProgramsContent initialPrograms={programs} />;
}
