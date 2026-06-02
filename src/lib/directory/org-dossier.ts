/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient, type LooseSupabaseClient } from '@/lib/supabase/service-lite';

export type DirectoryOrgSummary = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  abn: string | null;
  gsEntityId: string | null;
  verificationStatus: string | null;
  website: string | null;
  counts: {
    services: number;
    sourceLinkedServices: number;
    programs: number;
    fundingRecords: number;
    publicPeople: number;
  };
  fundingTotal: number;
  badges: string[];
  gaps: string[];
};

export type DirectoryOrgDossier = DirectoryOrgSummary & {
  location: string | null;
  postcode: string | null;
  isIndigenousOrg: boolean;
  accoCertified: boolean;
  grantScopeEntity: {
    id: string;
    canonicalName: string | null;
    abn: string | null;
    entityType: string | null;
    sector: string | null;
    state: string | null;
    website: string | null;
    sourceCount: number | null;
    confidence: string | null;
    isCommunityControlled: boolean | null;
    remoteness: string | null;
    seifaDecile: number | null;
  } | null;
  identityWarnings: string[];
  services: DirectoryServiceRecord[];
  programs: DirectoryProgramRecord[];
  funding: {
    total: number;
    records: number;
    recent: DirectoryFundingRecord[];
  };
  people: DirectoryPersonRecord[];
  civicSignals: DirectoryCivicSignal[];
  grantOpportunities: DirectoryGrantOpportunity[];
};

export type DirectoryServiceRecord = {
  id: string;
  name: string;
  description: string | null;
  serviceType: string | null;
  category: string | null;
  state: string | null;
  sourceUrl: string | null;
  verificationStatus: string | null;
  cost: string | null;
};

export type DirectoryProgramRecord = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  evidenceLevel: string | null;
  costPerYoungPerson: number | null;
  verificationStatus: string | null;
  website: string | null;
};

export type DirectoryFundingRecord = {
  id: string;
  source: string | null;
  sourceUrl: string | null;
  recipientName: string | null;
  programName: string | null;
  amountDollars: number;
  state: string | null;
  financialYear: string | null;
  announcementDate: string | null;
};

export type DirectoryPersonRecord = {
  id: string;
  name: string;
  slug: string | null;
  role: string | null;
  tagline: string | null;
  roleTags: string[];
};

export type DirectoryCivicSignal = {
  id: string;
  type: 'diary' | 'hansard' | 'statement' | 'consultancy' | 'rti';
  title: string;
  detail: string | null;
  date: string | null;
  sourceUrl: string | null;
  jurisdiction: string | null;
};

export type DirectoryGrantOpportunity = {
  id: string;
  name: string;
  provider: string | null;
  description: string | null;
  closesAt: string | null;
  amountMin: number | null;
  amountMax: number | null;
  url: string | null;
  geography: string | null;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  postcode: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  verification_status: string | null;
  website: string | null;
  website_url: string | null;
  is_indigenous_org: boolean | null;
  acco_certified: boolean | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: string | null | undefined, max = 220): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.length > max ? `${cleaned.slice(0, max - 1).trim()}...` : cleaned;
}

function cleanAbn(value: string | null | undefined): string | null {
  const cleaned = (value || '').replace(/\D/g, '');
  return cleaned.length === 11 ? cleaned : null;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

const weakNameTokens = new Set([
  'the',
  'and',
  'of',
  'a',
  'an',
  'ltd',
  'limited',
  'pty',
  'inc',
  'incorporated',
  'corporation',
  'association',
  'australia',
  'australian',
  'company',
]);

function nameTokens(value: string | null | undefined): Set<string> {
  return new Set(
    (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !weakNameTokens.has(token)),
  );
}

function namesLookAligned(a: string | null | undefined, b: string | null | undefined): boolean {
  const aTokens = nameTokens(a);
  const bTokens = nameTokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return true;

  for (const token of aTokens) {
    if (bTokens.has(token)) return true;
  }
  return false;
}

function buildBadges(org: Pick<DirectoryOrgSummary, 'abn' | 'gsEntityId' | 'verificationStatus' | 'counts'> & {
  isIndigenousOrg?: boolean;
  accoCertified?: boolean;
  identityReliable?: boolean;
}): string[] {
  const identityReliable = org.identityReliable !== false;
  const badges = [
    org.abn && identityReliable ? 'ABN linked' : null,
    org.gsEntityId && identityReliable ? 'CivicGraph linked' : null,
    org.verificationStatus?.toLowerCase().includes('verified') ? 'Human verified' : null,
    org.counts.sourceLinkedServices > 0 ? 'Source linked' : null,
    org.counts.programs > 0 ? 'Programs linked' : null,
    org.counts.fundingRecords > 0 ? 'Funding history' : null,
    org.counts.publicPeople > 0 ? 'Public people' : null,
    org.accoCertified ? 'ACCO certified' : null,
    org.isIndigenousOrg ? 'Community controlled signal' : null,
  ];

  return uniqueStrings(badges);
}

function buildGaps(org: Pick<DirectoryOrgSummary, 'abn' | 'gsEntityId' | 'verificationStatus' | 'counts'>): string[] {
  const gaps = [
    !org.abn ? 'Missing ABN link' : null,
    !org.gsEntityId ? 'Missing or untrusted CivicGraph link' : null,
    !org.verificationStatus?.toLowerCase().includes('verified') ? 'Needs human review' : null,
    org.counts.sourceLinkedServices === 0 ? 'No source-linked service record yet' : null,
    org.counts.programs === 0 ? 'No ALMA program linked yet' : null,
    org.counts.fundingRecords === 0 ? 'No funding records linked yet' : null,
    org.counts.publicPeople === 0 ? 'No public people linked yet' : null,
  ];

  return uniqueStrings(gaps);
}

function normalizeOrg(row: any): OrgRow {
  return {
    id: String(row.id),
    name: String(row.name || 'Unnamed organisation'),
    slug: row.slug || null,
    description: row.description || null,
    type: row.type || null,
    city: row.city || null,
    state: row.state || null,
    location: row.location || null,
    postcode: row.postcode || null,
    abn: cleanAbn(row.abn),
    gs_entity_id: row.gs_entity_id || null,
    verification_status: row.verification_status || null,
    website: row.website || null,
    website_url: row.website_url || null,
    is_indigenous_org: Boolean(row.is_indigenous_org),
    acco_certified: Boolean(row.acco_certified),
  };
}

async function safeRows<T>(label: string, promise: PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error(`[directory-dossier] ${label}:`, error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(`[directory-dossier] ${label}:`, error);
    return [];
  }
}

async function safeSingle<T>(label: string, promise: PromiseLike<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error(`[directory-dossier] ${label}:`, error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error(`[directory-dossier] ${label}:`, error);
    return null;
  }
}

async function fetchFundingAgg(service: LooseSupabaseClient, orgIds: string[]) {
  const ids = orgIds.filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return new Map<string, { records: number; total: number }>();

  const quotedIds = ids.map((id) => `'${id}'::uuid`).join(',');
  const rows = await safeRows<{ org_id: string; records: number; total: number }>(
    'funding aggregate',
    service.rpc('exec_sql', {
      query: `
        SELECT alma_organization_id AS org_id,
               COUNT(*)::int AS records,
               COALESCE(SUM(amount_dollars), 0)::numeric AS total
        FROM justice_funding
        WHERE alma_organization_id IN (${quotedIds})
        GROUP BY alma_organization_id
      `,
    }),
  );

  return new Map(rows.map((row) => [row.org_id, { records: Number(row.records || 0), total: Number(row.total || 0) }]));
}

async function hydrateSummaries(service: LooseSupabaseClient, orgRows: any[]): Promise<DirectoryOrgSummary[]> {
  const orgs = orgRows.map(normalizeOrg);
  const orgIds = orgs.map((org) => org.id);
  if (orgIds.length === 0) return [];

  const [services, programs, profileLinks, fundingAgg] = await Promise.all([
    safeRows<any>(
      'summary services',
      service
        .from('services')
        .select('organization_id, data_source_url')
        .eq('is_active', true)
        .in('organization_id', orgIds),
    ),
    safeRows<any>(
      'summary programs',
      service
        .from('alma_interventions')
        .select('operating_organization_id')
        .neq('verification_status', 'ai_generated')
        .in('operating_organization_id', orgIds),
    ),
    safeRows<any>(
      'summary people',
      service
        .from('organizations_profiles')
        .select('organization_id, public_profiles!inner(id, is_public)')
        .eq('public_profiles.is_public', true)
        .in('organization_id', orgIds),
    ),
    fetchFundingAgg(service, orgIds),
  ]);

  const gsIds = uniqueStrings(orgs.map((org) => org.gs_entity_id));
  const gsRows = gsIds.length
    ? await safeRows<any>(
        'summary gs identity check',
        service
          .from('gs_entities')
          .select('id, abn, canonical_name')
          .in('id', gsIds),
      )
    : [];
  const gsById = new Map(gsRows.map((row) => [row.id, row]));

  const counts = new Map<string, DirectoryOrgSummary['counts']>();
  for (const id of orgIds) {
    counts.set(id, { services: 0, sourceLinkedServices: 0, programs: 0, fundingRecords: 0, publicPeople: 0 });
  }

  services.forEach((row) => {
    const orgId = row.organization_id;
    const count = counts.get(orgId);
    if (!count) return;
    count.services += 1;
    if (row.data_source_url) count.sourceLinkedServices += 1;
  });

  programs.forEach((row) => {
    const count = counts.get(row.operating_organization_id);
    if (count) count.programs += 1;
  });

  profileLinks.forEach((row) => {
    const count = counts.get(row.organization_id);
    if (count) count.publicPeople += 1;
  });

  return orgs.map((org) => {
    const count = counts.get(org.id) || { services: 0, sourceLinkedServices: 0, programs: 0, fundingRecords: 0, publicPeople: 0 };
    const funding = fundingAgg.get(org.id);
    if (funding) count.fundingRecords = funding.records;

    const linkedEntity = org.gs_entity_id ? gsById.get(org.gs_entity_id) : null;
    const civicGraphVerified = Boolean(
      org.gs_entity_id
      && linkedEntity
      && (!org.abn || !linkedEntity.abn || cleanAbn(linkedEntity.abn) === org.abn),
    );
    const identityReliable = civicGraphVerified && namesLookAligned(org.name, linkedEntity?.canonical_name);

    const summary: DirectoryOrgSummary = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: cleanText(org.description),
      type: org.type,
      city: org.city,
      state: org.state,
      abn: org.abn,
      gsEntityId: identityReliable ? org.gs_entity_id : null,
      verificationStatus: org.verification_status,
      website: org.website || org.website_url,
      counts: count,
      fundingTotal: funding?.total || 0,
      badges: [],
      gaps: [],
    };

    summary.badges = buildBadges({
      ...summary,
      isIndigenousOrg: org.is_indigenous_org || false,
      accoCertified: org.acco_certified || false,
      identityReliable,
    });
    summary.gaps = buildGaps(summary);
    return summary;
  });
}

export async function getDirectorySearchResults({
  query,
  state,
  limit = 12,
}: {
  query?: string | null;
  state?: string | null;
  limit?: number;
}): Promise<DirectoryOrgSummary[]> {
  const service = createServiceClient();
  const cleanQuery = (query || '').trim();
  const cleanState = (state || '').trim().toUpperCase();
  const max = Math.min(Math.max(limit, 1), 30);

  let orgQuery = service
    .from('organizations')
    .select('id, name, slug, description, type, city, state, location, postcode, abn, gs_entity_id, verification_status, website, website_url, is_indigenous_org, acco_certified')
    .eq('is_active', true)
    .not('name', 'is', null)
    .neq('name', '')
    .limit(max);

  const abn = cleanAbn(cleanQuery);
  if (abn) {
    orgQuery = orgQuery.eq('abn', abn);
  } else if (UUID_RE.test(cleanQuery)) {
    orgQuery = orgQuery.eq('id', cleanQuery);
  } else if (cleanQuery.length >= 2) {
    orgQuery = orgQuery.ilike('name', `%${cleanQuery}%`);
  }

  if (cleanState) orgQuery = orgQuery.eq('state', cleanState);
  orgQuery = cleanQuery ? orgQuery.order('name') : orgQuery.order('graph_score', { ascending: false, nullsFirst: false }).order('name');

  const rows = await safeRows<any>('directory search orgs', orgQuery);
  return hydrateSummaries(service, rows);
}

export async function getFeaturedDirectoryOrganizations(limit = 4): Promise<DirectoryOrgSummary[]> {
  const service = createServiceClient();
  const max = Math.min(Math.max(limit, 1), 8);
  const rows = await safeRows<any>(
    'featured directory orgs',
    service
      .from('organizations')
      .select('id, name, slug, description, type, city, state, location, postcode, abn, gs_entity_id, verification_status, website, website_url, is_indigenous_org, acco_certified')
      .eq('is_active', true)
      .not('name', 'is', null)
      .neq('name', '')
      .not('abn', 'is', null)
      .not('gs_entity_id', 'is', null)
      .order('graph_score', { ascending: false, nullsFirst: false })
      .order('name')
      .limit(max * 3),
  );

  const summaries = await hydrateSummaries(service, rows);
  return summaries
    .filter((summary) => summary.abn && summary.gsEntityId)
    .sort((a, b) => {
      const aScore = a.counts.services + a.counts.programs + Math.min(a.counts.fundingRecords, 50);
      const bScore = b.counts.services + b.counts.programs + Math.min(b.counts.fundingRecords, 50);
      return bScore - aScore || a.name.localeCompare(b.name);
    })
    .slice(0, max);
}

async function fetchOrganization(service: LooseSupabaseClient, identifier: string): Promise<OrgRow | null> {
  const clean = decodeURIComponent(identifier).trim();
  const select = 'id, name, slug, description, type, city, state, location, postcode, abn, gs_entity_id, verification_status, website, website_url, is_indigenous_org, acco_certified';

  let query = service.from('organizations').select(select).eq('is_active', true).limit(1);
  const abn = cleanAbn(clean);
  if (UUID_RE.test(clean)) {
    query = query.eq('id', clean);
  } else if (abn) {
    query = query.eq('abn', abn);
  } else {
    query = query.eq('slug', clean);
  }

  const row = await safeSingle<any>('directory org', query.maybeSingle());
  return row ? normalizeOrg(row) : null;
}

async function fetchGrantScopeIdentity(service: LooseSupabaseClient, org: OrgRow) {
  const warnings: string[] = [];

  const [byAbn, byStoredId] = await Promise.all([
    org.abn
      ? safeSingle<any>(
          'gs entity by abn',
          service
            .from('gs_entities')
            .select('id, canonical_name, abn, entity_type, sector, state, website, source_count, confidence, is_community_controlled, remoteness, seifa_irsd_decile')
            .eq('abn', org.abn)
            .maybeSingle(),
        )
      : Promise.resolve(null),
    org.gs_entity_id
      ? safeSingle<any>(
          'gs entity by stored id',
          service
            .from('gs_entities')
            .select('id, canonical_name, abn, entity_type, sector, state, website, source_count, confidence, is_community_controlled, remoteness, seifa_irsd_decile')
            .eq('id', org.gs_entity_id)
            .maybeSingle(),
        )
      : Promise.resolve(null),
  ]);

  if (byStoredId?.abn && org.abn && cleanAbn(byStoredId.abn) !== org.abn) {
    warnings.push('Stored CivicGraph ID ABN mismatch');
  }

  if (byAbn?.id && org.gs_entity_id && byAbn.id !== org.gs_entity_id) {
    warnings.push('ABN resolves to a different CivicGraph entity');
  }

  const entity = byAbn || byStoredId;
  if (entity?.canonical_name && !namesLookAligned(org.name, entity.canonical_name)) {
    warnings.push('ABN/CivicGraph name needs review');
  }

  return {
    entity,
    warnings,
  };
}

function fundingOrFilter(org: OrgRow) {
  return `alma_organization_id.eq.${org.id}`;
}

async function fetchCivicSignals(service: LooseSupabaseClient, org: OrgRow): Promise<DirectoryCivicSignal[]> {
  const nameTerm = org.name.slice(0, 80);
  const diaryQuery = org.abn
    ? service
        .from('civic_ministerial_diaries')
        .select('id, minister_name, portfolio, meeting_date, organisation, purpose, source_url, jurisdiction')
        .eq('organisation_abn', org.abn)
        .order('meeting_date', { ascending: false })
        .limit(4)
    : service
        .from('civic_ministerial_diaries')
        .select('id, minister_name, portfolio, meeting_date, organisation, purpose, source_url, jurisdiction')
        .ilike('organisation', `%${nameTerm}%`)
        .order('meeting_date', { ascending: false })
        .limit(4);

  const consultancyQuery = org.abn
    ? service
        .from('civic_consultancy_spending')
        .select('id, department, consultant_name, description, amount_dollars, financial_year, source_url, jurisdiction')
        .eq('consultant_abn', org.abn)
        .order('created_at', { ascending: false })
        .limit(4)
    : service
        .from('civic_consultancy_spending')
        .select('id, department, consultant_name, description, amount_dollars, financial_year, source_url, jurisdiction')
        .ilike('consultant_name', `%${nameTerm}%`)
        .order('created_at', { ascending: false })
        .limit(4);

  const [diaries, hansard, statements, consultancies, rti] = await Promise.all([
    safeRows<any>('civic diaries', diaryQuery),
    safeRows<any>(
      'civic hansard',
      service
        .from('civic_hansard')
        .select('id, sitting_date, speaker_name, subject, summary, source_url, jurisdiction')
        .ilike('body_text', `%${nameTerm}%`)
        .order('sitting_date', { ascending: false })
        .limit(4),
    ),
    safeRows<any>(
      'civic statements',
      service
        .from('civic_ministerial_statements')
        .select('id, headline, minister_name, published_at, summary, source_url, jurisdiction')
        .ilike('body_text', `%${nameTerm}%`)
        .order('published_at', { ascending: false })
        .limit(4),
    ),
    safeRows<any>('civic consultancies', consultancyQuery),
    safeRows<any>(
      'civic rti',
      service
        .from('civic_rti_disclosures')
        .select('id, department, title, description, decision_date, document_url, source_url, jurisdiction')
        .ilike('description', `%${nameTerm}%`)
        .order('decision_date', { ascending: false })
        .limit(4),
    ),
  ]);

  return [
    ...diaries.map((row): DirectoryCivicSignal => ({
      id: row.id,
      type: 'diary',
      title: `Meeting with ${row.minister_name || row.portfolio || 'ministerial office'}`,
      detail: cleanText(row.purpose || row.organisation),
      date: row.meeting_date || null,
      sourceUrl: row.source_url || null,
      jurisdiction: row.jurisdiction || null,
    })),
    ...hansard.map((row): DirectoryCivicSignal => ({
      id: row.id,
      type: 'hansard',
      title: row.subject || `Hansard mention by ${row.speaker_name || 'speaker'}`,
      detail: cleanText(row.summary),
      date: row.sitting_date || null,
      sourceUrl: row.source_url || null,
      jurisdiction: row.jurisdiction || null,
    })),
    ...statements.map((row): DirectoryCivicSignal => ({
      id: row.id,
      type: 'statement',
      title: row.headline || `Ministerial statement by ${row.minister_name || 'minister'}`,
      detail: cleanText(row.summary),
      date: row.published_at || null,
      sourceUrl: row.source_url || null,
      jurisdiction: row.jurisdiction || null,
    })),
    ...consultancies.map((row): DirectoryCivicSignal => ({
      id: row.id,
      type: 'consultancy',
      title: `${row.department || 'Department'} consultancy record`,
      detail: cleanText(row.description || row.consultant_name),
      date: row.financial_year || null,
      sourceUrl: row.source_url || null,
      jurisdiction: row.jurisdiction || null,
    })),
    ...rti.map((row): DirectoryCivicSignal => ({
      id: row.id,
      type: 'rti',
      title: row.title || `${row.department || 'Department'} RTI disclosure`,
      detail: cleanText(row.description),
      date: row.decision_date || null,
      sourceUrl: row.document_url || row.source_url || null,
      jurisdiction: row.jurisdiction || null,
    })),
  ].slice(0, 10);
}

async function fetchGrantOpportunities(service: LooseSupabaseClient, org: OrgRow): Promise<DirectoryGrantOpportunity[]> {
  const today = new Date().toISOString().slice(0, 10);
  let query = service
    .from('grant_opportunities')
    .select('id, name, provider, description, closes_at, amount_min, amount_max, url, geography')
    .gte('closes_at', today)
    .or('name.ilike.%youth%,description.ilike.%youth%,name.ilike.%community%,description.ilike.%community%,name.ilike.%justice%,description.ilike.%justice%')
    .order('closes_at', { ascending: true })
    .limit(6);

  if (org.state) {
    query = service
      .from('grant_opportunities')
      .select('id, name, provider, description, closes_at, amount_min, amount_max, url, geography')
      .gte('closes_at', today)
      .or(`geography.ilike.%${org.state}%,geography.ilike.%Australia%,name.ilike.%youth%,description.ilike.%youth%`)
      .order('closes_at', { ascending: true })
      .limit(6);
  }

  const rows = await safeRows<any>('grant opportunities', query);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    provider: row.provider || null,
    description: cleanText(row.description, 180),
    closesAt: row.closes_at || null,
    amountMin: row.amount_min === null ? null : Number(row.amount_min),
    amountMax: row.amount_max === null ? null : Number(row.amount_max),
    url: row.url || null,
    geography: row.geography || null,
  }));
}

export async function getDirectoryOrgDossier(identifier: string): Promise<DirectoryOrgDossier | null> {
  const service = createServiceClient();
  const org = await fetchOrganization(service, identifier);
  if (!org) return null;

  const [summary] = await hydrateSummaries(service, [org]);
  const fundingFilter = fundingOrFilter(org);

  const [
    grantScopeIdentity,
    services,
    programs,
    fundingRows,
    peopleRows,
    civicSignals,
    grantOpportunities,
  ] = await Promise.all([
    fetchGrantScopeIdentity(service, org),
    safeRows<any>(
      'org services',
      service
        .from('services')
        .select('id, name, description, service_type, category, location_state, data_source_url, verification_status, cost')
        .eq('is_active', true)
        .eq('organization_id', org.id)
        .order('name')
        .limit(12),
    ),
    safeRows<any>(
      'org programs',
      service
        .from('alma_interventions')
        .select('id, name, type, description, evidence_level, cost_per_young_person, verification_status, website')
        .neq('verification_status', 'ai_generated')
        .eq('operating_organization_id', org.id)
        .order('portfolio_score', { ascending: false, nullsFirst: false })
        .limit(12),
    ),
    safeRows<any>(
      'org funding',
      service
        .from('justice_funding')
        .select('id, source, source_url, recipient_name, program_name, amount_dollars, state, financial_year, announcement_date')
        .or(fundingFilter)
        .order('announcement_date', { ascending: false, nullsFirst: false })
        .limit(12),
    ),
    safeRows<any>(
      'org people',
      service
        .from('organizations_profiles')
        .select('role, is_current, is_featured, public_profiles!inner(id, full_name, slug, tagline, bio, role_tags, is_public)')
        .eq('organization_id', org.id)
        .eq('public_profiles.is_public', true)
        .order('is_featured', { ascending: false, nullsFirst: false })
        .limit(8),
    ),
    fetchCivicSignals(service, org),
    fetchGrantOpportunities(service, org),
  ]);

  const fundingTotal = fundingRows.reduce((sum, row) => sum + toNumber(row.amount_dollars), 0);
  const grantScopeEntity = grantScopeIdentity.entity;

  const dossier: DirectoryOrgDossier = {
    ...summary,
    location: org.location,
    postcode: org.postcode,
    isIndigenousOrg: Boolean(org.is_indigenous_org),
    accoCertified: Boolean(org.acco_certified),
    grantScopeEntity: grantScopeEntity
      ? {
          id: grantScopeEntity.id,
          canonicalName: grantScopeEntity.canonical_name || null,
          abn: cleanAbn(grantScopeEntity.abn),
          entityType: grantScopeEntity.entity_type || null,
          sector: grantScopeEntity.sector || null,
          state: grantScopeEntity.state || null,
          website: grantScopeEntity.website || null,
          sourceCount: grantScopeEntity.source_count === null ? null : Number(grantScopeEntity.source_count),
          confidence: grantScopeEntity.confidence || null,
          isCommunityControlled: grantScopeEntity.is_community_controlled,
          remoteness: grantScopeEntity.remoteness || null,
          seifaDecile: grantScopeEntity.seifa_irsd_decile === null ? null : Number(grantScopeEntity.seifa_irsd_decile),
        }
      : null,
    identityWarnings: grantScopeIdentity.warnings,
    services: services.map((row) => ({
      id: row.id,
      name: row.name,
      description: cleanText(row.description, 160),
      serviceType: row.service_type || null,
      category: row.category || null,
      state: row.location_state || null,
      sourceUrl: row.data_source_url || null,
      verificationStatus: row.verification_status || null,
      cost: row.cost || null,
    })),
    programs: programs.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type || null,
      description: cleanText(row.description, 160),
      evidenceLevel: row.evidence_level || null,
      costPerYoungPerson: row.cost_per_young_person === null ? null : Number(row.cost_per_young_person),
      verificationStatus: row.verification_status || null,
      website: row.website || null,
    })),
    funding: {
      total: fundingTotal || summary.fundingTotal,
      records: summary.counts.fundingRecords,
      recent: fundingRows.map((row) => ({
        id: row.id,
        source: row.source || null,
        sourceUrl: row.source_url || null,
        recipientName: row.recipient_name || null,
        programName: row.program_name || null,
        amountDollars: toNumber(row.amount_dollars),
        state: row.state || null,
        financialYear: row.financial_year || null,
        announcementDate: row.announcement_date || null,
      })),
    },
    people: peopleRows
      .map((row) => {
        const profile = Array.isArray(row.public_profiles) ? row.public_profiles[0] : row.public_profiles;
        if (!profile?.is_public) return null;
        return {
          id: profile.id,
          name: profile.full_name,
          slug: profile.slug || null,
          role: row.role || null,
          tagline: profile.tagline || null,
          roleTags: Array.isArray(profile.role_tags) ? profile.role_tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
        };
      })
      .filter((profile): profile is DirectoryPersonRecord => Boolean(profile)),
    civicSignals,
    grantOpportunities,
  };

  dossier.counts.services = dossier.services.length || dossier.counts.services;
  dossier.counts.sourceLinkedServices = dossier.services.filter((serviceRecord) => Boolean(serviceRecord.sourceUrl)).length || dossier.counts.sourceLinkedServices;
  dossier.counts.programs = dossier.programs.length || dossier.counts.programs;
  dossier.counts.publicPeople = dossier.people.length || dossier.counts.publicPeople;
  dossier.badges = buildBadges(dossier);
  if (dossier.identityWarnings.length > 0) {
    dossier.badges = dossier.badges.filter((badge) => !['ABN linked', 'CivicGraph linked'].includes(badge));
  }
  dossier.gaps = uniqueStrings([...buildGaps(dossier), ...dossier.identityWarnings]);

  return dossier;
}
