type ServiceError = {
  code?: string;
  message?: string;
};

export type ServiceCatalogFilters = {
  q?: string | null;
  category?: string | null;
  state?: string | null;
  youthSpecific?: string | null;
  indigenousSpecific?: string | null;
};

export type NormalizedServiceCatalogRow = Record<string, unknown> & {
  id: string;
  name: string;
  description: string;
  active: boolean;
  categories: string[];
  category: string;
  location: Record<string, unknown>;
  contact: Record<string, unknown>;
  cost: string;
  verification_status: string | null;
  data_source: string | null;
  data_source_url: string | null;
  eligibility_criteria: string[];
  youth_specific: boolean;
  indigenous_specific: boolean;
  updated_at: string | null;
  created_at: string | null;
  url: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const parsed = asString(value);
    if (parsed) return parsed;
  }
  return null;
}

export function isMissingServicesCompleteError(error: unknown) {
  const serviceError = error as ServiceError | null | undefined;
  return (
    serviceError?.code === 'PGRST205' ||
    String(serviceError?.message || '').includes("table 'public.services_complete'") ||
    String(serviceError?.message || '').includes('services_complete')
  );
}

export function normalizeServiceCatalogRow(row: Record<string, unknown>): NormalizedServiceCatalogRow {
  const contact = asRecord(row.contact);
  const contactInfo = asRecord(row.contact_info);
  const location = asRecord(row.location);
  const geographicalCoverage = asRecord(row.geographical_coverage);
  const categories = [
    ...asStringArray(row.categories),
    firstString(row.category, row.service_category, row.program_type, row.subcategory),
  ].filter((item): item is string => Boolean(item));
  const uniqueCategories = Array.from(new Set(categories));
  const normalizedContact = {
    ...contactInfo,
    ...contact,
  };
  const url = firstString(row.url, row.data_source_url, row.source_url, normalizedContact.website, row.website);

  return {
    ...row,
    id: firstString(row.id) || '',
    name: firstString(row.name) || 'Unknown service',
    description: firstString(row.description) || '',
    active: row.active !== false && row.is_active !== false,
    categories: uniqueCategories,
    category: uniqueCategories[0] || 'support',
    location: {
      ...geographicalCoverage,
      ...location,
      address: firstString(location.address, row.location_address),
      city: firstString(location.city, row.location_city),
      state: firstString(location.state, row.location_state),
      postcode: firstString(location.postcode, row.location_postcode),
      region: firstString(location.region, row.location_region, row.location_state),
    },
    contact: normalizedContact,
    cost: firstString(row.cost, row.cost_structure) || 'unknown',
    verification_status: firstString(row.verification_status, row.validation_status),
    data_source: firstString(row.data_source, row.source),
    data_source_url: firstString(row.data_source_url, row.source_url, url),
    eligibility_criteria: asStringArray(row.eligibility_criteria),
    youth_specific: row.youth_specific === true,
    indigenous_specific: row.indigenous_specific === true,
    updated_at: firstString(row.updated_at, row.last_scraped_at),
    created_at: firstString(row.created_at),
    url,
  };
}

export function serviceMatchesCatalogFilters(
  service: NormalizedServiceCatalogRow,
  filters: ServiceCatalogFilters,
) {
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    const haystack = [
      service.name,
      service.description,
      service.category,
      service.location.city,
      service.location.state,
      service.location.region,
      ...service.categories,
      ...service.eligibility_criteria,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(q)) return false;
  }

  if (filters.category && !service.categories.includes(filters.category)) {
    return false;
  }

  if (filters.state) {
    const expected = filters.state.toLowerCase();
    const state = String(service.location.state || '').toLowerCase();
    const region = String(service.location.region || '').toLowerCase();
    if (state !== expected && region !== expected) return false;
  }

  if (filters.youthSpecific === 'true' && !service.youth_specific) return false;
  if (filters.indigenousSpecific === 'true' && !service.indigenous_specific) return false;

  return true;
}
