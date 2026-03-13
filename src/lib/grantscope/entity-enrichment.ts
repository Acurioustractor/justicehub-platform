import { createServiceClient } from '@/lib/supabase/service';

export interface EntityEnrichment {
  entityId: string;
  canonicalName: string;
  entityType: string;
  abn: string | null;
  seifaDecile: number | null;
  remoteness: string | null;
  isCommunityControlled: boolean;
  latestRevenue: number | null;
  latestAssets: number | null;
  financialYear: string | null;
  sector: string | null;
  subSector: string | null;
  lgaName: string | null;
  sourceDatasets: string[] | null;
  sourceCount: number | null;
  relationshipSummary: {
    totalRelationships: number;
    topFundingSources: { name: string; amount: number; year: number | null }[];
    topFundingTargets: { name: string; amount: number; year: number | null }[];
  };
}

/**
 * Get enrichment data from the GS entity graph for a given gs_entity_id.
 * All data lives in the same Supabase DB — just different tables.
 */
export async function getEntityEnrichment(
  gsEntityId: string,
): Promise<EntityEnrichment | null> {
  const supabase = createServiceClient() as any;

  // Fetch entity core data
  const { data: entity, error } = await supabase
    .from('gs_entities')
    .select(
      'id, canonical_name, entity_type, abn, seifa_irsd_decile, remoteness, is_community_controlled, latest_revenue, latest_assets, financial_year, sector, sub_sector, lga_name, source_datasets, source_count',
    )
    .eq('id', gsEntityId)
    .single();

  if (error || !entity) return null;

  // Fetch top funding sources (who funds this entity)
  const { data: inbound } = await supabase
    .from('gs_relationships')
    .select('amount, year, source_entity_id')
    .eq('target_entity_id', gsEntityId)
    .eq('relationship_type', 'funded')
    .not('amount', 'is', null)
    .order('amount', { ascending: false })
    .limit(5);

  // Fetch top funding targets (who this entity funds)
  const { data: outbound } = await supabase
    .from('gs_relationships')
    .select('amount, year, target_entity_id')
    .eq('source_entity_id', gsEntityId)
    .eq('relationship_type', 'funded')
    .not('amount', 'is', null)
    .order('amount', { ascending: false })
    .limit(5);

  // Resolve entity names for relationships
  const sourceIds = (inbound || []).map((r: any) => r.source_entity_id);
  const targetIds = (outbound || []).map((r: any) => r.target_entity_id);
  const allIds = [...new Set([...sourceIds, ...targetIds])];

  let nameMap: Record<string, string> = {};
  if (allIds.length > 0) {
    const { data: entities } = await supabase
      .from('gs_entities')
      .select('id, canonical_name')
      .in('id', allIds);
    if (entities) {
      for (const e of entities) {
        nameMap[e.id] = e.canonical_name;
      }
    }
  }

  // Count total relationships
  const { count: totalRels } = await supabase
    .from('gs_relationships')
    .select('id', { count: 'exact', head: true })
    .or(`source_entity_id.eq.${gsEntityId},target_entity_id.eq.${gsEntityId}`);

  return {
    entityId: entity.id,
    canonicalName: entity.canonical_name,
    entityType: entity.entity_type,
    abn: entity.abn,
    seifaDecile: entity.seifa_irsd_decile,
    remoteness: entity.remoteness,
    isCommunityControlled: entity.is_community_controlled ?? false,
    latestRevenue: entity.latest_revenue ? Number(entity.latest_revenue) : null,
    latestAssets: entity.latest_assets ? Number(entity.latest_assets) : null,
    financialYear: entity.financial_year,
    sector: entity.sector,
    subSector: entity.sub_sector,
    lgaName: entity.lga_name,
    sourceDatasets: entity.source_datasets,
    sourceCount: entity.source_count,
    relationshipSummary: {
      totalRelationships: totalRels ?? 0,
      topFundingSources: (inbound || []).map((r: any) => ({
        name: nameMap[r.source_entity_id] || 'Unknown',
        amount: Number(r.amount),
        year: r.year,
      })),
      topFundingTargets: (outbound || []).map((r: any) => ({
        name: nameMap[r.target_entity_id] || 'Unknown',
        amount: Number(r.amount),
        year: r.year,
      })),
    },
  };
}
