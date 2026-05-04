import { createServiceClient } from '@/lib/supabase/service';

export type DossierEntity = {
  id: string;
  gsId: string | null;
  canonicalName: string;
  entityType: string;
  abn: string | null;
  acn: string | null;
  description: string | null;
  website: string | null;
  state: string | null;
  postcode: string | null;
  sector: string | null;
  subSector: string | null;
  tags: string[];
  sourceDatasets: string[];
  sourceCount: number | null;
  confidence: string | null;
  latestRevenue: number | null;
  latestAssets: number | null;
  latestTaxPayable: number | null;
  financialYear: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  seifaDecile: number | null;
  remoteness: string | null;
  isCommunityControlled: boolean;
  lgaName: string | null;
};

export type DossierFundingRecord = {
  id: string;
  source: string;
  sourceUrl: string | null;
  recipientName: string;
  programName: string;
  programRound: string | null;
  amount: number | null;
  state: string | null;
  location: string | null;
  fundingType: string | null;
  sector: string | null;
  projectDescription: string | null;
  announcementDate: string | null;
  financialYear: string | null;
};

export type DossierContract = {
  id: string;
  title: string | null;
  description: string | null;
  contractValue: number | null;
  procurementMethod: string | null;
  category: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  buyerName: string | null;
  sourceUrl: string | null;
};

export type DossierRelationship = {
  id: string;
  type: string;
  direction: 'incoming' | 'outgoing';
  otherEntityId: string | null;
  otherName: string;
  otherType: string | null;
  otherAbn: string | null;
  amount: number | null;
  currency: string | null;
  year: number | null;
  dataset: string;
  sourceUrl: string | null;
  confidence: string | null;
};

export type DossierPersonRole = {
  id: string;
  personName: string;
  roleType: string;
  companyName: string | null;
  companyAbn: string | null;
  appointmentDate: string | null;
  cessationDate: string | null;
  source: string;
  confidence: string | null;
};

export type DossierIntervention = {
  id: string;
  name: string;
  type: string | null;
  serviceRole: string | null;
  evidenceLevel: string | null;
  geography: string | null;
  estimatedAnnualCapacity: number | null;
  costPerYoungPerson: number | null;
  currentFunding: unknown;
};

export type DossierCentrePartnership = {
  id: string;
  centreId: string | null;
  centreName: string;
  centreSlug: string | null;
  centreState: string | null;
  centreCity: string | null;
  partnerType: string;
  partnershipType: string;
  description: string | null;
  participantsServed: number | null;
};

export type OrganizationDossier = {
  entity: DossierEntity | null;
  justiceFunding: DossierFundingRecord[];
  contracts: DossierContract[];
  relationships: DossierRelationship[];
  fundingReceived: DossierRelationship[];
  fundingProvided: DossierRelationship[];
  networkLinks: DossierRelationship[];
  boardRoles: DossierPersonRole[];
  interventions: DossierIntervention[];
  centrePartnerships: DossierCentrePartnership[];
  summary: {
    knownFundingTotal: number;
    justiceFundingTotal: number;
    contractTotal: number;
    relationshipFundingTotal: number;
    fundingRecordCount: number;
    relationshipCount: number;
    boardRoleCount: number;
    centreCount: number;
    interventionCount: number;
  };
};

type DossierInput = {
  orgId: string;
  orgName: string;
  gsEntityId?: string | null;
  abn?: string | null;
};

const FUNDING_RELATIONSHIP_TYPES = new Set(['grant', 'contract', 'donation', 'program_funding']);
const NETWORK_RELATIONSHIP_TYPES = new Set([
  'ownership',
  'charity_link',
  'registered_as',
  'listed_as',
  'subsidiary_of',
  'member_of',
  'lobbies_for',
]);

function cleanAbn(abn: string | null | undefined) {
  const sanitized = String(abn || '').replace(/\D/g, '');
  return /^\d{11}$/.test(sanitized) ? sanitized : null;
}

function numeric(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function resolveEntityId(service: any, gsEntityId: string | null | undefined, abn: string | null) {
  if (gsEntityId) return gsEntityId;
  if (!abn) return null;

  const { data } = await service
    .from('gs_entities')
    .select('id')
    .eq('abn', abn)
    .order('source_count', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data?.id || null;
}

async function fetchEntity(service: any, entityId: string | null): Promise<DossierEntity | null> {
  if (!entityId) return null;

  const { data, error } = await service
    .from('gs_entities')
    .select(
      'id, gs_id, canonical_name, entity_type, abn, acn, description, website, state, postcode, sector, sub_sector, tags, source_datasets, source_count, confidence, latest_revenue, latest_assets, latest_tax_payable, financial_year, first_seen, last_seen, seifa_irsd_decile, remoteness, is_community_controlled, lga_name',
    )
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching CivicScope entity dossier:', error);
    return null;
  }

  return {
    id: data.id,
    gsId: data.gs_id || null,
    canonicalName: data.canonical_name,
    entityType: data.entity_type,
    abn: data.abn || null,
    acn: data.acn || null,
    description: data.description || null,
    website: data.website || null,
    state: data.state || null,
    postcode: data.postcode || null,
    sector: data.sector || null,
    subSector: data.sub_sector || null,
    tags: data.tags || [],
    sourceDatasets: data.source_datasets || [],
    sourceCount: data.source_count ?? null,
    confidence: data.confidence || null,
    latestRevenue: numeric(data.latest_revenue),
    latestAssets: numeric(data.latest_assets),
    latestTaxPayable: numeric(data.latest_tax_payable),
    financialYear: data.financial_year || null,
    firstSeen: data.first_seen || null,
    lastSeen: data.last_seen || null,
    seifaDecile: data.seifa_irsd_decile ?? null,
    remoteness: data.remoteness || null,
    isCommunityControlled: Boolean(data.is_community_controlled),
    lgaName: data.lga_name || null,
  };
}

async function fetchJusticeFunding(
  service: any,
  orgId: string,
  orgName: string,
  abn: string | null,
): Promise<DossierFundingRecord[]> {
  const queries: Promise<{ data: any[] | null; error: unknown }>[] = [
    service
      .from('justice_funding')
      .select(
        'id, source, source_url, recipient_name, program_name, program_round, amount_dollars, state, location, funding_type, sector, project_description, announcement_date, financial_year',
      )
      .eq('alma_organization_id', orgId)
      .order('amount_dollars', { ascending: false, nullsFirst: false })
      .limit(50),
  ];

  if (abn) {
    queries.push(
      service
        .from('justice_funding')
        .select(
          'id, source, source_url, recipient_name, program_name, program_round, amount_dollars, state, location, funding_type, sector, project_description, announcement_date, financial_year',
        )
        .eq('recipient_abn', abn)
        .order('amount_dollars', { ascending: false, nullsFirst: false })
        .limit(50),
    );
  }

  if (orgName.trim().length > 3) {
    queries.push(
      service
        .from('justice_funding')
        .select(
          'id, source, source_url, recipient_name, program_name, program_round, amount_dollars, state, location, funding_type, sector, project_description, announcement_date, financial_year',
        )
        .ilike('recipient_name', orgName.trim())
        .order('amount_dollars', { ascending: false, nullsFirst: false })
        .limit(20),
    );
  }

  const results = await Promise.all(queries);
  results.forEach((result) => {
    if (result.error) console.error('Error fetching justice funding dossier rows:', result.error);
  });

  return uniqueById(results.flatMap((result) => result.data || [])).map((row) => ({
    id: row.id,
    source: row.source,
    sourceUrl: row.source_url || null,
    recipientName: row.recipient_name,
    programName: row.program_name,
    programRound: row.program_round || null,
    amount: numeric(row.amount_dollars),
    state: row.state || null,
    location: row.location || null,
    fundingType: row.funding_type || null,
    sector: row.sector || null,
    projectDescription: row.project_description || null,
    announcementDate: row.announcement_date || null,
    financialYear: row.financial_year || null,
  }));
}

async function fetchContracts(service: any, abn: string | null): Promise<DossierContract[]> {
  if (!abn) return [];

  const { data, error } = await service
    .from('austender_contracts')
    .select(
      'id, title, description, contract_value, procurement_method, category, contract_start, contract_end, buyer_name, source_url',
    )
    .eq('supplier_abn', abn)
    .order('contract_value', { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) {
    console.error('Error fetching AusTender contract dossier rows:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title || null,
    description: row.description || null,
    contractValue: numeric(row.contract_value),
    procurementMethod: row.procurement_method || null,
    category: row.category || null,
    contractStart: row.contract_start || null,
    contractEnd: row.contract_end || null,
    buyerName: row.buyer_name || null,
    sourceUrl: row.source_url || null,
  }));
}

async function fetchRelationships(service: any, entityId: string | null): Promise<DossierRelationship[]> {
  if (!entityId) return [];

  const { data, error } = await service
    .from('gs_relationships')
    .select(
      'id, relationship_type, amount, currency, year, start_date, end_date, dataset, source_url, confidence, source_entity_id, target_entity_id',
    )
    .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    .order('amount', { ascending: false, nullsFirst: false })
    .limit(120);

  if (error) {
    console.error('Error fetching CivicScope relationship dossier rows:', error);
    return [];
  }

  const rows = data || [];
  const otherEntityIds = Array.from(
    new Set(
      rows
        .map((row: any) => (row.source_entity_id === entityId ? row.target_entity_id : row.source_entity_id))
        .filter(Boolean),
    ),
  );

  const entityMap = new Map<string, { canonical_name: string; entity_type: string | null; abn: string | null }>();
  if (otherEntityIds.length > 0) {
    const { data: entities, error: entityError } = await service
      .from('gs_entities')
      .select('id, canonical_name, entity_type, abn')
      .in('id', otherEntityIds);

    if (entityError) {
      console.error('Error resolving CivicScope relationship entities:', entityError);
    }

    (entities || []).forEach((entity: any) => {
      entityMap.set(entity.id, {
        canonical_name: entity.canonical_name,
        entity_type: entity.entity_type || null,
        abn: entity.abn || null,
      });
    });
  }

  return rows.map((row: any) => {
    const incoming = row.target_entity_id === entityId;
    const otherEntityId = incoming ? row.source_entity_id : row.target_entity_id;
    const otherEntity = otherEntityId ? entityMap.get(otherEntityId) : null;

    return {
      id: row.id,
      type: row.relationship_type,
      direction: incoming ? 'incoming' : 'outgoing',
      otherEntityId: otherEntityId || null,
      otherName: otherEntity?.canonical_name || 'Unknown entity',
      otherType: otherEntity?.entity_type || null,
      otherAbn: otherEntity?.abn || null,
      amount: numeric(row.amount),
      currency: row.currency || null,
      year: row.year ?? null,
      dataset: row.dataset,
      sourceUrl: row.source_url || null,
      confidence: row.confidence || null,
    };
  });
}

async function fetchBoardRoles(service: any, entityId: string | null, abn: string | null): Promise<DossierPersonRole[]> {
  const queries: Promise<{ data: any[] | null; error: unknown }>[] = [];

  if (entityId) {
    queries.push(
      service
        .from('person_roles')
        .select(
          'id, person_name, role_type, company_name, company_abn, appointment_date, cessation_date, source, confidence',
        )
        .eq('entity_id', entityId)
        .order('cessation_date', { ascending: true, nullsFirst: true })
        .limit(60),
    );
  }

  if (abn) {
    queries.push(
      service
        .from('person_roles')
        .select(
          'id, person_name, role_type, company_name, company_abn, appointment_date, cessation_date, source, confidence',
        )
        .eq('company_abn', abn)
        .order('cessation_date', { ascending: true, nullsFirst: true })
        .limit(60),
    );
  }

  if (queries.length === 0) return [];

  const results = await Promise.all(queries);
  results.forEach((result) => {
    if (result.error) console.error('Error fetching CivicScope person roles:', result.error);
  });

  return uniqueById(results.flatMap((result) => result.data || [])).map((row) => ({
    id: row.id,
    personName: row.person_name,
    roleType: row.role_type,
    companyName: row.company_name || null,
    companyAbn: row.company_abn || null,
    appointmentDate: row.appointment_date || null,
    cessationDate: row.cessation_date || null,
    source: row.source,
    confidence: row.confidence || null,
  }));
}

async function fetchInterventions(service: any, orgId: string, entityId: string | null): Promise<DossierIntervention[]> {
  const queries: Promise<{ data: any[] | null; error: unknown }>[] = [
    service
      .from('alma_interventions')
      .select(
        'id, name, type, service_role, evidence_level, geography, estimated_annual_capacity, cost_per_young_person, current_funding',
      )
      .eq('operating_organization_id', orgId)
      .neq('verification_status', 'ai_generated')
      .limit(30),
  ];

  if (entityId) {
    queries.push(
      service
        .from('alma_interventions')
        .select(
          'id, name, type, service_role, evidence_level, geography, estimated_annual_capacity, cost_per_young_person, current_funding',
        )
        .eq('gs_entity_id', entityId)
        .neq('verification_status', 'ai_generated')
        .limit(30),
    );
  }

  const results = await Promise.all(queries);
  results.forEach((result) => {
    if (result.error) console.error('Error fetching ALMA intervention dossier rows:', result.error);
  });

  return uniqueById(results.flatMap((result) => result.data || [])).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type || null,
    serviceRole: row.service_role || null,
    evidenceLevel: row.evidence_level || null,
    geography: row.geography || null,
    estimatedAnnualCapacity: row.estimated_annual_capacity ?? null,
    costPerYoungPerson: numeric(row.cost_per_young_person),
    currentFunding: row.current_funding,
  }));
}

async function fetchCentrePartnerships(service: any, orgId: string): Promise<DossierCentrePartnership[]> {
  const [programResult, serviceResult] = await Promise.all([
    service.from('registered_services').select('id').eq('organization_id', orgId).limit(200),
    service.from('services').select('id').eq('organization_id', orgId).limit(200),
  ]);

  if (programResult.error) console.error('Error resolving org programs for centre dossier:', programResult.error);
  if (serviceResult.error) console.error('Error resolving org services for centre dossier:', serviceResult.error);

  const programIds = (programResult.data || []).map((row: any) => row.id).filter(Boolean);
  const serviceIds = (serviceResult.data || []).map((row: any) => row.id).filter(Boolean);
  const clauses = [`organization_id.eq.${orgId}`];
  if (programIds.length > 0) clauses.push(`program_id.in.(${programIds.join(',')})`);
  if (serviceIds.length > 0) clauses.push(`service_id.in.(${serviceIds.join(',')})`);

  const { data, error } = await service
    .from('facility_partnerships')
    .select(
      'id, facility_id, partner_type, partnership_type, description, participants_served',
    )
    .eq('is_active', true)
    .or(clauses.join(','))
    .order('partnership_type')
    .limit(100);

  if (error) {
    console.error('Error fetching centre partnership dossier rows:', error);
    return [];
  }

  const facilityIds = Array.from(new Set((data || []).map((row: any) => row.facility_id).filter(Boolean)));
  const facilityMap = new Map<string, any>();
  if (facilityIds.length > 0) {
    const { data: facilities, error: facilityError } = await service
      .from('youth_detention_facilities')
      .select('id, name, slug, state, city')
      .in('id', facilityIds);

    if (facilityError) {
      console.error('Error resolving centre partnership facilities:', facilityError);
    }

    (facilities || []).forEach((facility: any) => facilityMap.set(facility.id, facility));
  }

  return (data || []).map((row: any) => {
    const facility = row.facility_id ? facilityMap.get(row.facility_id) : null;
    return {
      id: row.id,
      centreId: row.facility_id || null,
      centreName: facility?.name || 'Unknown centre',
      centreSlug: facility?.slug || null,
      centreState: facility?.state || null,
      centreCity: facility?.city || null,
      partnerType: row.partner_type,
      partnershipType: row.partnership_type,
      description: row.description || null,
      participantsServed: row.participants_served ?? null,
    };
  });
}

export async function getOrganizationDossier(input: DossierInput): Promise<OrganizationDossier> {
  const service = createServiceClient() as any;
  const abn = cleanAbn(input.abn);
  const entityId = await resolveEntityId(service, input.gsEntityId, abn);

  const [
    entity,
    justiceFunding,
    contracts,
    relationships,
    boardRoles,
    interventions,
    centrePartnerships,
  ] = await Promise.all([
    fetchEntity(service, entityId),
    fetchJusticeFunding(service, input.orgId, input.orgName, abn),
    fetchContracts(service, abn),
    fetchRelationships(service, entityId),
    fetchBoardRoles(service, entityId, abn),
    fetchInterventions(service, input.orgId, entityId),
    fetchCentrePartnerships(service, input.orgId),
  ]);

  const fundingReceived = relationships.filter(
    (relationship) => relationship.direction === 'incoming' && FUNDING_RELATIONSHIP_TYPES.has(relationship.type),
  );
  const fundingProvided = relationships.filter(
    (relationship) => relationship.direction === 'outgoing' && FUNDING_RELATIONSHIP_TYPES.has(relationship.type),
  );
  const networkLinks = relationships.filter(
    (relationship) =>
      NETWORK_RELATIONSHIP_TYPES.has(relationship.type) ||
      (!FUNDING_RELATIONSHIP_TYPES.has(relationship.type) && relationship.type !== 'directorship'),
  );

  const justiceFundingTotal = justiceFunding.reduce((sum, row) => sum + (row.amount || 0), 0);
  const contractTotal = contracts.reduce((sum, row) => sum + (row.contractValue || 0), 0);
  const relationshipFundingTotal = fundingReceived.reduce((sum, row) => sum + (row.amount || 0), 0);
  const hasContractGraphEdges = fundingReceived.some((row) => row.type === 'contract');
  const contractContribution = hasContractGraphEdges ? 0 : contractTotal;
  const centreCount = new Set(centrePartnerships.map((row) => row.centreId || row.centreName)).size;

  return {
    entity,
    justiceFunding,
    contracts,
    relationships,
    fundingReceived,
    fundingProvided,
    networkLinks,
    boardRoles,
    interventions,
    centrePartnerships,
    summary: {
      knownFundingTotal: justiceFundingTotal + relationshipFundingTotal + contractContribution,
      justiceFundingTotal,
      contractTotal,
      relationshipFundingTotal,
      fundingRecordCount: justiceFunding.length + contracts.length + fundingReceived.length,
      relationshipCount: relationships.length,
      boardRoleCount: boardRoles.length,
      centreCount,
      interventionCount: interventions.length,
    },
  };
}
