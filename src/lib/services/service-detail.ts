import { createServiceClient } from '@/lib/supabase/service';
import {
  normalizeServiceCatalogRow,
  type NormalizedServiceCatalogRow,
} from '@/lib/services/service-catalog';

type ServicesCompleteRow = {
  id: string | null;
  name: string | null;
  description: string | null;
  categories: string[] | null;
  location: Record<string, unknown> | null;
  contact: Record<string, unknown> | null;
  score: number | null;
  updated_at: string | null;
  last_verified_at?: string | null;
  last_scraped_at: string | null;
  url: string | null;
  verification_status?: string | null;
  active: boolean | null;
  indigenous_specific: boolean | null;
  youth_specific: boolean | null;
};

export interface ServiceDetailPayload {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  contact: string;
  cost: 'free' | 'low' | 'moderate' | 'unknown';
  rating: number;
  verified: boolean;
  verificationStatus?: string | null;
  lastUpdated: string;
  lastVerifiedAt?: string | null;
  source?: string | null;
  aiDiscovered: boolean;
  eligibility: string[];
  subcategory?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  confidenceScore?: number | null;
  extractionTimestamp?: string | null;
}

export type ServiceDetailResult =
  | { status: 200; body: { service: ServiceDetailPayload; metadata: Record<string, string> } }
  | { status: 400 | 404 | 500; body: { error: string } };

export async function getServiceDetailResult(serviceId: string): Promise<ServiceDetailResult> {
  if (!serviceId) {
    return { status: 400, body: { error: 'Service ID is required' } };
  }

  const supabase = createServiceClient();
  const fallback = await getFallbackServiceDetailResult(supabase, serviceId);
  if (fallback) {
    return fallback;
  }

  const { data: service, error } = await supabase
    .from('services_complete')
    .select('*')
    .eq('id', serviceId)
    .eq('active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { status: 404, body: { error: 'Service not found' } };
    }

    console.error('Error fetching service:', error);
    return { status: 500, body: { error: error.message } };
  }

  if (!service) {
    return { status: 404, body: { error: 'Service not found' } };
  }

  const row = service as unknown as ServicesCompleteRow;
  const categories = Array.isArray(row.categories) ? row.categories : [];

  const transformedService: ServiceDetailPayload = {
    id: row.id || serviceId,
    name: row.name || 'Unknown service',
    category: mapCategory(categories[0] || 'support'),
    description: row.description || 'No description available',
    location: buildLocation(row),
    contact: extractContact(row),
    cost: mapCost('unknown'),
    rating: Math.round((row.score || 0.5) * 5 * 100) / 100,
    verified: (row.score || 0) >= 0.8 || isVerified(row.verification_status),
    verificationStatus: row.verification_status || null,
    lastUpdated: formatTimestamp(row.last_scraped_at || row.updated_at),
    lastVerifiedAt: row.last_verified_at || null,
    source: row.url,
    aiDiscovered: true,
    eligibility: [],
    subcategory: categories[1],
    contactInfo: {
      phone: stringFrom(row.contact, 'phone'),
      email: stringFrom(row.contact, 'email'),
      website: row.url || undefined,
      address: buildAddress(row),
    },
    confidenceScore: row.score,
    extractionTimestamp: row.last_scraped_at,
  };

  return {
    status: 200,
    body: {
      service: transformedService,
      metadata: {
        source: 'Canonical service detail (services_complete)',
        lastUpdate: new Date().toISOString(),
        confidence: 'Schema-aligned data',
      },
    },
  };
}

async function getFallbackServiceDetailResult(
  supabase: ReturnType<typeof createServiceClient>,
  serviceId: string,
): Promise<ServiceDetailResult | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching fallback service:', error);
      return { status: 500, body: { error: error.message } };
    }
    return null;
  }

  if (!data) {
    return null;
  }

  const row = normalizeServiceCatalogRow(data as Record<string, unknown>);
  if (!row.id || !row.active) {
    return null;
  }

  const transformedService = buildServiceDetailFromCatalog(row, serviceId);

  return {
    status: 200,
    body: {
      service: transformedService,
      metadata: {
        source: 'Canonical service detail (services fallback)',
        lastUpdate: new Date().toISOString(),
        confidence: 'Fallback table data',
      },
    },
  };
}

function buildServiceDetailFromCatalog(
  row: NormalizedServiceCatalogRow,
  serviceId: string,
): ServiceDetailPayload {
  const categories = Array.isArray(row.categories) ? row.categories : [];
  const source = row.data_source_url || row.url || null;
  const website = stringFrom(row.contact, 'website') || source || undefined;
  const confidenceScore = numberFrom(row.scrape_confidence_score);

  return {
    id: row.id || serviceId,
    name: row.name || 'Unknown service',
    category: mapCategory(row.category || categories[0] || 'support'),
    description: row.description || 'No description available',
    location: buildCatalogLocation(row),
    contact: extractCatalogContact(row),
    cost: mapCost(row.cost),
    rating: confidenceScore ? Math.round(confidenceScore * 5 * 100) / 100 : 0,
    verified: isVerified(row.verification_status),
    verificationStatus: row.verification_status,
    lastUpdated: formatTimestamp(row.updated_at || row.created_at),
    lastVerifiedAt: row.last_verified_at,
    source,
    aiDiscovered: row.data_source === 'ai_scrape' || row.data_source === 'ai_generated',
    eligibility: row.eligibility_criteria || [],
    subcategory: categories[1] || row.category,
    contactInfo: {
      phone: stringFrom(row.contact, 'phone'),
      email: stringFrom(row.contact, 'email'),
      website,
      address: buildCatalogAddress(row),
    },
    confidenceScore,
    extractionTimestamp: stringFrom(row, 'last_scraped_at'),
  };
}

function isVerified(status: string | null | undefined): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized === 'verified' || normalized === 'human_verified';
}

function numberFrom(recordValue: unknown): number | null {
  return typeof recordValue === 'number' && Number.isFinite(recordValue) ? recordValue : null;
}

function buildCatalogLocation(service: NormalizedServiceCatalogRow): string {
  const city = stringFrom(service.location, 'city');
  const region = stringFrom(service.location, 'region');
  const state = stringFrom(service.location, 'state');
  const parts = [city, region, state]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, list) => list.findIndex((other) => other.toLowerCase() === part.toLowerCase()) === index);

  return parts.join(', ') || 'Australia';
}

function buildCatalogAddress(service: NormalizedServiceCatalogRow): string {
  const address = stringFrom(service.location, 'address');
  const city = stringFrom(service.location, 'city');
  const state = stringFrom(service.location, 'state');
  const postcode = stringFrom(service.location, 'postcode');
  const parts = [address, city, state, postcode].filter(Boolean);

  return parts.join(', ') || 'Address not available';
}

function extractCatalogContact(service: NormalizedServiceCatalogRow): string {
  const phone = stringFrom(service.contact, 'phone');
  const email = stringFrom(service.contact, 'email');
  const website = stringFrom(service.contact, 'website') || service.data_source_url || service.url;

  if (phone) return phone;
  if (email) return email;
  if (website) return website;
  return 'Open source link or contact service directly';
}

function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    legal_aid: 'legal',
    legal: 'legal',
    mental_health: 'health',
    health: 'health',
    crisis_support: 'emergency',
    emergency: 'emergency',
    education_training: 'education',
    education: 'education',
    mentoring: 'education',
    employment: 'employment',
    housing: 'housing',
    substance_abuse: 'substance',
    substance: 'substance',
    family_support: 'family',
    family: 'family',
    case_management: 'family',
    court_support: 'legal',
    advocacy: 'legal',
    diversion: 'legal',
    disability: 'disability',
    disability_support: 'disability',
  };
  return categoryMap[category] || 'family';
}

function mapCost(cost: string): 'free' | 'low' | 'moderate' | 'unknown' {
  if (!cost) return 'unknown';
  const normalized = cost.toLowerCase();
  if (normalized === 'free') return 'free';
  if (normalized === 'low') return 'low';
  if (normalized === 'moderate') return 'moderate';
  if (normalized === 'unknown') return 'unknown';
  if (normalized === 'subsidized') return 'low';
  if (normalized === 'fee_based') return 'moderate';
  return 'unknown';
}

function stringFrom(record: Record<string, unknown> | null, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function buildLocation(service: ServicesCompleteRow): string {
  const city = stringFrom(service.location, 'city');
  const state = stringFrom(service.location, 'state');
  const parts = [city, state].filter(Boolean);
  return parts.join(', ') || 'Australia';
}

function buildAddress(service: ServicesCompleteRow): string {
  const address = stringFrom(service.location, 'address');
  const suburb = stringFrom(service.location, 'suburb');
  const city = stringFrom(service.location, 'city');
  const state = stringFrom(service.location, 'state');
  const postcode = stringFrom(service.location, 'postcode');
  const parts = [address, suburb, city, state, postcode].filter(Boolean);
  return parts.join(', ') || 'Address not available';
}

function extractContact(service: ServicesCompleteRow): string {
  const phone = stringFrom(service.contact, 'phone');
  const email = stringFrom(service.contact, 'email');
  if (phone) return phone;
  if (email) return email;
  if (service.url) return service.url;
  return 'Contact via service website';
}

function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Recently';

  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
