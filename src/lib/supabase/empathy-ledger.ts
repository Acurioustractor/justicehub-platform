import {
  getStories as v2GetStories,
  getStorytellers as v2GetStorytellers,
  getStoryDetail as v2GetStoryDetail,
  getProjects as v2GetProjects,
  isV2Configured,
  type V2Story,
} from '@/lib/empathy-ledger/v2-client';

// Import clients from lite (single source of truth — no duplicate Supabase instances)
import {
  empathyLedgerClient,
  empathyLedgerServiceClient,
  isEmpathyLedgerConfigured,
  isEmpathyLedgerWriteConfigured,
  EMPATHY_LEDGER_ENV_ERROR,
} from '@/lib/supabase/empathy-ledger-lite';

// Re-export for consumers
export {
  empathyLedgerClient,
  empathyLedgerServiceClient,
  isEmpathyLedgerConfigured,
  isEmpathyLedgerWriteConfigured,
  EMPATHY_LEDGER_ENV_ERROR,
};

/**
 * Empathy Ledger Client
 *
 * Read operations now use the v2 REST API (org-scoped API key).
 * Write operations (push-sync, engagement) still use direct Supabase clients.
 *
 * ## Consent Model
 * The v2 API enforces consent server-side — only published/public content is returned.
 * Elder approval and cultural sensitivity are preserved in the API layer.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsentLevel = 'private' | 'community' | 'public';

export interface ConsentInfo {
  privacy_level: ConsentLevel;
  is_public: boolean;
  justicehub_enabled?: boolean;
  elder_approval_required?: boolean;
  description: string;
}

export interface EmpathyLedgerOrganization {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  website_url?: string;
  contact_email?: string;
  logo_url?: string;
  cultural_protocols?: any;
  cultural_significance?: string;
  indigenous_controlled?: boolean;
  traditional_country?: string;
  language_groups?: string[];
  service_locations?: string[];
  coordinates?: { lat: number; lng: number };
  empathy_ledger_enabled?: boolean;
  elder_approval_required?: boolean;
}

export interface EmpathyLedgerStory {
  id: string;
  tenant_id: string;
  author_id?: string;
  storyteller_id?: string;
  organization_id?: string;
  project_id?: string;
  service_id?: string;
  title: string;
  content: string;
  summary?: string;
  story_image_url?: string;
  media_urls?: string[];
  themes?: string[];
  story_category?: string;
  story_type?: string;
  privacy_level: ConsentLevel;
  is_public: boolean;
  is_featured?: boolean;
  cultural_sensitivity_level?: string;
  cultural_warnings?: string[];
  requires_elder_approval?: boolean;
  elder_approved_by?: string;
  elder_approved_at?: string;
  has_explicit_consent?: boolean;
  consent_details?: Record<string, unknown>;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmpathyLedgerProfile {
  id: string;
  user_id?: string;
  tenant_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  primary_organization_id?: string;
  justicehub_enabled?: boolean;
  justicehub_featured?: boolean;
  justicehub_role?: string;
  justicehub_synced_at?: string;
}

export interface EmpathyLedgerProject {
  id: string;
  tenant_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  location?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// ─── Consent helpers ──────────────────────────────────────────────────────────

export function canDisplayOnJusticeHub(story: EmpathyLedgerStory): boolean {
  if (!story.is_public) return false;
  if (story.privacy_level !== 'public') return false;
  if (story.requires_elder_approval && !story.elder_approved_at) return false;
  return true;
}

export function hasCulturalWarnings(story: EmpathyLedgerStory): boolean {
  return !!(story.cultural_warnings && story.cultural_warnings.length > 0);
}

export function getStoryConsentStatus(story: EmpathyLedgerStory): {
  canDisplay: boolean;
  requiresElderApproval: boolean;
  isElderApproved: boolean;
  hasCulturalWarnings: boolean;
  consentLevel: ConsentLevel;
} {
  return {
    canDisplay: canDisplayOnJusticeHub(story),
    requiresElderApproval: !!story.requires_elder_approval,
    isElderApproved: !!story.elder_approved_at,
    hasCulturalWarnings: hasCulturalWarnings(story),
    consentLevel: story.privacy_level
  };
}

export function shouldShowCulturalWarning(story: EmpathyLedgerStory): boolean {
  return !!(
    story.cultural_warnings &&
    story.cultural_warnings.length > 0 &&
    story.cultural_sensitivity_level !== 'public'
  );
}

export function formatCulturalProtocols(org: EmpathyLedgerOrganization): string[] {
  if (!org.cultural_protocols) return [];
  const protocols = typeof org.cultural_protocols === 'string'
    ? JSON.parse(org.cultural_protocols)
    : org.cultural_protocols;
  return Array.isArray(protocols) ? protocols : [];
}

// ─── v2 API-powered read functions ────────────────────────────────────────────

function v2StoryToLegacy(story: V2Story): Partial<EmpathyLedgerStory> & { excerpt: string } {
  return {
    id: story.id,
    title: story.title,
    summary: story.excerpt || undefined,
    content: '',
    story_image_url: story.imageUrl || undefined,
    themes: story.themes,
    is_public: true,
    privacy_level: 'public',
    is_featured: false,
    cultural_sensitivity_level: story.culturalLevel || undefined,
    published_at: story.publishedAt || undefined,
    created_at: story.createdAt,
    updated_at: story.createdAt,
    storyteller_id: story.storyteller?.id,
    project_id: story.projectId || undefined,
    excerpt: story.excerpt || '',
    tenant_id: '',
  };
}

/**
 * Get public stories — now via v2 API
 */
export async function getPublicStories(limit = 10) {
  if (isV2Configured) {
    const result = await v2GetStories({ limit });
    return result.data.map(v2StoryToLegacy);
  }
  // Fallback to direct Supabase if v2 not configured
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Error fetching public stories:', error); return []; }
  return data || [];
}

/**
 * Get featured stories for homepage — now via v2 API
 */
export async function getFeaturedStories(limit = 3) {
  if (isV2Configured) {
    const result = await v2GetStories({ limit: limit * 3 }); // Fetch extra to pick best
    const stories = result.data.map(s => ({
      ...v2StoryToLegacy(s),
      _hasImage: !!s.imageUrl,
    }));
    // Sort: stories with images first
    stories.sort((a, b) => (b._hasImage ? 1 : 0) - (a._hasImage ? 1 : 0));
    return stories.slice(0, limit);
  }
  // Fallback to direct Supabase
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select('id, title, summary, content, story_image_url, story_category, is_featured, published_at')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Error fetching featured stories:', error); return []; }
  return (data || []).map(story => ({
    ...story,
    excerpt: story.summary || (story.content ? story.content.substring(0, 200) + '...' : '')
  }));
}

/**
 * Get featured justice stories for JusticeHub homepage — now via v2 API
 */
export async function getFeaturedJusticeStories(limit = 6) {
  if (isV2Configured) {
    const result = await v2GetStories({ limit: limit * 3 });
    const stories = result.data.map(s => {
      const legacy = v2StoryToLegacy(s);
      let score = 0;
      if (s.imageUrl) score += 100;
      if (s.excerpt && s.excerpt.length > 50) score += 50;
      return { ...legacy, _score: score };
    });
    stories.sort((a, b) => (b._score || 0) - (a._score || 0));
    return stories.slice(0, limit);
  }
  // Fallback to direct Supabase (original complex logic)
  const { data } = await empathyLedgerClient
    .from('stories')
    .select('id, title, summary, content, story_image_url, story_category, story_type, is_featured, published_at, themes, service_id')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .not('title', 'like', '%Key Story%')
    .order('published_at', { ascending: false })
    .limit(limit * 10);
  return (data || []).slice(0, limit).map(story => ({
    ...story,
    excerpt: story.summary || (story.content ? story.content.substring(0, 200) + '...' : '')
  }));
}

/**
 * Get stories for a service — now via v2 API (returns all org stories)
 */
export async function getStoriesForService(_serviceId: string) {
  if (isV2Configured) {
    const result = await v2GetStories({ limit: 50 });
    return result.data.map(v2StoryToLegacy);
  }
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('service_id', _serviceId)
    .eq('is_public', true)
    .eq('privacy_level', 'public');
  if (error) { console.error('Error fetching stories:', error); return []; }
  return data || [];
}

/**
 * Get organization by slug — uses Supabase (org data not in v2 API)
 */
export async function getOrganizationBySlug(slug: string) {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) { console.error('Error fetching organization:', error); return null; }
  return data;
}

/**
 * Get Indigenous organizations — uses Supabase (org data not in v2 API)
 */
export async function getIndigenousOrganizations() {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('indigenous_controlled', true)
    .eq('empathy_ledger_enabled', true);
  if (error) { console.error('Error fetching Indigenous organizations:', error); return []; }
  return data || [];
}

/**
 * Get stories for organization — now via v2 API
 */
export async function getStoriesForOrganization(_orgId: string, _publicOnly = true) {
  if (isV2Configured) {
    const result = await v2GetStories({ limit: 50 });
    return result.data.map(v2StoryToLegacy);
  }
  let query = empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('organization_id', _orgId);
  if (_publicOnly) {
    query = query.eq('is_public', true).eq('privacy_level', 'public');
  }
  const { data, error } = await query.order('published_at', { ascending: false });
  if (error) { console.error('Error fetching organization stories:', error); return []; }
  return data || [];
}

/**
 * Search stories — uses Supabase (full-text search not in v2 API)
 */
export async function searchStories(searchTerm: string, includeWarnings = false) {
  let query = empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .textSearch('content', searchTerm);
  if (!includeWarnings) {
    query = query.or('cultural_warnings.is.null,cultural_warnings.eq.{}');
  }
  const { data, error } = await query;
  if (error) { console.error('Error searching stories:', error); return []; }
  return data || [];
}

/**
 * Get public projects — now via v2 API
 */
export async function getPublicProjects() {
  if (isV2Configured) {
    const result = await v2GetProjects({ limit: 50 });
    return result.data.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      location: p.location,
      status: p.status,
      start_date: p.startDate,
      end_date: p.endDate,
      created_at: p.createdAt,
    }));
  }
  const { data, error } = await empathyLedgerClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching projects:', error); return []; }
  return data || [];
}
