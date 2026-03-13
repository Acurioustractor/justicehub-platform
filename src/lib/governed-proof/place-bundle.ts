import { createServiceClient } from '@/lib/supabase/service';

export interface JusticeHubPlaceBundleContribution {
  subjectType: 'place';
  subjectId: string;
  placeKey: string;
  evidenceContext: {
    organizations: Record<string, unknown>[];
    interventions: Record<string, unknown>[];
  };
  confidence: {
    evidence: number;
  };
}

export async function buildJusticeHubPlaceBundleContribution(
  placeKey: string
): Promise<JusticeHubPlaceBundleContribution> {
  const supabase = createServiceClient() as any;

  const { data: entities, error: entitiesError } = await supabase
    .from('gs_entities')
    .select('id')
    .eq('postcode', placeKey);

  if (entitiesError) throw entitiesError;

  const entityIds = (entities ?? []).map((entity: { id: string }) => entity.id);
  const safeEntityIds =
    entityIds.length > 0 ? entityIds : ['00000000-0000-0000-0000-000000000000'];

  const { data: organizations, error: organizationsError } = await supabase
    .from('organizations')
    .select('id, name, slug, gs_entity_id, empathy_ledger_org_id, postcode')
    .in('gs_entity_id', safeEntityIds);

  if (organizationsError) throw organizationsError;

  const orgIds = (organizations ?? []).map((org: { id: string }) => org.id);
  const safeOrgIds =
    orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'];

  const { data: interventions, error: interventionsError } = await supabase
    .from('alma_interventions')
    .select('id, name, type, operating_organization_id')
    .in('operating_organization_id', safeOrgIds);

  if (interventionsError) throw interventionsError;

  return {
    subjectType: 'place',
    subjectId: placeKey,
    placeKey,
    evidenceContext: {
      organizations: organizations ?? [],
      interventions: interventions ?? [],
    },
    confidence: {
      evidence: orgIds.length > 0 ? 0.8 : 0.5,
    },
  };
}
