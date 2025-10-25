import { createClient } from '@supabase/supabase-js';

// Empathy Ledger Supabase Client
// Multi-tenant cultural storytelling platform
export const empathyLedgerClient = createClient(
  process.env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs'
);

// Type definitions based on Empathy Ledger schema
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
  service_id?: string; // Link to JusticeHub service
  title: string;
  content: string;
  summary?: string;
  story_image_url?: string;
  media_urls?: string[];
  themes?: string[];
  story_category?: string;
  story_type?: string;
  privacy_level: 'public' | 'community' | 'private';
  is_public: boolean;
  is_featured?: boolean;
  cultural_sensitivity_level?: string;
  cultural_warnings?: string[];
  requires_elder_approval?: boolean;
  elder_approved_by?: string;
  elder_approved_at?: string;
  has_explicit_consent?: boolean;
  consent_details?: any;
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

// Helper functions for fetching Empathy Ledger data

/**
 * Get public stories linked to a JusticeHub service
 */
export async function getStoriesForService(serviceId: string) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(*),
      profile:profiles(*)
    `)
    .eq('service_id', serviceId)
    .eq('is_public', true)
    .eq('privacy_level', 'public');

  if (error) {
    console.error('Error fetching Empathy Ledger stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get Indigenous-controlled organizations
 */
export async function getIndigenousOrganizations() {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('indigenous_controlled', true)
    .eq('empathy_ledger_enabled', true);

  if (error) {
    console.error('Error fetching Indigenous organizations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get public stories with cultural context
 */
export async function getPublicStories(limit = 10) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(name, slug, traditional_country, indigenous_controlled),
      profile:profiles(display_name, avatar_url)
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching public stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const { data, error } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

/**
 * Get stories for an organization
 */
export async function getStoriesForOrganization(orgId: string, publicOnly = true) {
  let query = empathyLedgerClient
    .from('stories')
    .select(`
      *,
      profile:profiles(display_name, avatar_url)
    `)
    .eq('organization_id', orgId);

  if (publicOnly) {
    query = query.eq('is_public', true).eq('privacy_level', 'public');
  }

  const { data, error } = await query.order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Search stories with cultural sensitivity filters
 */
export async function searchStories(searchTerm: string, includeWarnings = false) {
  let query = empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(name, slug, indigenous_controlled),
      profile:profiles(display_name)
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .textSearch('content', searchTerm);

  if (!includeWarnings) {
    query = query.or('cultural_warnings.is.null,cultural_warnings.eq.{}');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching stories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get projects for display on JusticeHub
 */
export async function getPublicProjects() {
  const { data, error } = await empathyLedgerClient
    .from('projects')
    .select(`
      *,
      organization:organizations!projects_organization_id_fkey(name, slug, indigenous_controlled, traditional_country)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if cultural protocols should be displayed
 */
export function shouldShowCulturalWarning(story: EmpathyLedgerStory): boolean {
  return !!(
    story.cultural_warnings &&
    story.cultural_warnings.length > 0 &&
    story.cultural_sensitivity_level !== 'public'
  );
}

/**
 * Format cultural protocols for display
 */
export function formatCulturalProtocols(org: EmpathyLedgerOrganization): string[] {
  if (!org.cultural_protocols) return [];

  // Parse JSON if it's a string
  const protocols = typeof org.cultural_protocols === 'string'
    ? JSON.parse(org.cultural_protocols)
    : org.cultural_protocols;

  return Array.isArray(protocols) ? protocols : [];
}
