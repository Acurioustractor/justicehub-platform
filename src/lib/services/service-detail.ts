import { createServiceClient } from '@/lib/supabase/service';

type ServicesCompleteRow = {
  id: string | null;
  name: string | null;
  description: string | null;
  categories: string[] | null;
  location: Record<string, unknown> | null;
  contact: Record<string, unknown> | null;
  score: number | null;
  updated_at: string | null;
  last_scraped_at: string | null;
  url: string | null;
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
  cost: 'free' | 'low' | 'moderate';
  rating: number;
  verified: boolean;
  lastUpdated: string;
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
    verified: (row.score || 0) >= 0.8,
    lastUpdated: formatTimestamp(row.last_scraped_at || row.updated_at),
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

function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    legal_aid: 'legal',
    mental_health: 'health',
    crisis_support: 'emergency',
    education_training: 'education',
    employment: 'employment',
    housing: 'housing',
    substance_abuse: 'substance',
    family_support: 'family',
    court_support: 'legal',
    advocacy: 'legal',
  };
  return categoryMap[category] || 'family';
}

function mapCost(cost: string): 'free' | 'low' | 'moderate' {
  if (!cost) return 'free';
  const normalized = cost.toLowerCase();
  if (normalized === 'free' || normalized === 'unknown') return 'free';
  if (normalized === 'subsidized') return 'low';
  if (normalized === 'fee_based') return 'moderate';
  return 'free';
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
