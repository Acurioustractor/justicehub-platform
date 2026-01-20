/**
 * Empathy Ledger Sync Service
 *
 * Pulls media content from Empathy Ledger Content Hub API
 * for use across the ACT ecosystem.
 *
 * API: GET https://empathyledger.com/api/v1/content-hub/media
 *
 * Query Parameters:
 * - organization_id: Filter by organization UUID
 * - project_code: Filter by ACT ecosystem project
 * - type: Filter by media type (image, video, audio)
 * - elder_approved: Filter to elder-approved content only
 * - cultural_tags: Comma-separated cultural tags
 * - page, limit: Pagination
 */

// Types for Empathy Ledger Content Hub API
export interface ELMediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  altText: string | null;
  mediaType: 'image' | 'video' | 'audio';
  width: number | null;
  height: number | null;
  duration: number | null;
  // ACT Ecosystem metadata
  organizationId: string | null;
  projectCode: string | null;
  // Cultural safety
  elderApproved: boolean;
  consentObtained: boolean;
  culturalTags: string[];
  culturalSensitivity: string | null;
  attributionText: string | null;
  // Provenance
  uploaderName: string | null;
  createdAt: string;
}

export interface ELMediaResponse {
  media: ELMediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  ecosystem: {
    source: string;
    version: string;
    accessLevel: string;
    filters: Record<string, string | boolean | null>;
  };
}

export interface SyncOptions {
  organizationId?: string;
  projectCode?: string;
  mediaType?: 'image' | 'video' | 'audio';
  elderApprovedOnly?: boolean;
  culturalTags?: string[];
  limit?: number;
}

// Organization ID mapping from JusticeHub to Empathy Ledger
// These are the Basecamp organizations in the ACT ecosystem
export const ORGANIZATION_ID_MAP: Record<string, string> = {
  // JusticeHub org IDs → Empathy Ledger org IDs
  // Add mappings as organizations are registered in EL
  'oonchiumpa': '11111111-1111-1111-1111-111111111001',
  'mounty-yarns': '11111111-1111-1111-1111-111111111003',
  'bg-fit': '11111111-1111-1111-1111-111111111004',
  'picc': '11111111-1111-1111-1111-111111111005',
};

export class EmpathyLedgerSyncService {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    // Use environment variable for API URL
    this.baseUrl = process.env.EMPATHY_LEDGER_API_URL || 'https://empathyledger.com';
    this.apiKey = process.env.EMPATHY_LEDGER_API_KEY || null;
  }

  /**
   * Fetch media from Empathy Ledger Content Hub
   */
  async fetchMedia(options: SyncOptions = {}): Promise<ELMediaResponse> {
    const params = new URLSearchParams();

    if (options.organizationId) {
      params.append('organization_id', options.organizationId);
    }
    if (options.projectCode) {
      params.append('project_code', options.projectCode);
    }
    if (options.mediaType) {
      params.append('type', options.mediaType);
    }
    if (options.elderApprovedOnly) {
      params.append('elder_approved', 'true');
    }
    if (options.culturalTags?.length) {
      params.append('cultural_tags', options.culturalTags.join(','));
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `${this.baseUrl}/api/v1/content-hub/media?${params.toString()}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key for ecosystem-level access
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`EL API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch media for a specific organization by slug
   */
  async fetchOrganizationMedia(
    orgSlug: string,
    options: Omit<SyncOptions, 'organizationId'> = {}
  ): Promise<ELMediaItem[]> {
    const orgId = ORGANIZATION_ID_MAP[orgSlug];

    if (!orgId) {
      console.warn(`No EL organization mapping for slug: ${orgSlug}`);
      return [];
    }

    try {
      const response = await this.fetchMedia({
        ...options,
        organizationId: orgId,
      });
      return response.media;
    } catch (error) {
      console.error(`Failed to fetch media for ${orgSlug}:`, error);
      return [];
    }
  }

  /**
   * Fetch all photos for an organization
   */
  async fetchOrganizationPhotos(orgSlug: string): Promise<ELMediaItem[]> {
    return this.fetchOrganizationMedia(orgSlug, { mediaType: 'image' });
  }

  /**
   * Fetch all videos for an organization
   */
  async fetchOrganizationVideos(orgSlug: string): Promise<ELMediaItem[]> {
    return this.fetchOrganizationMedia(orgSlug, { mediaType: 'video' });
  }

  /**
   * Fetch elder-approved content only
   */
  async fetchElderApprovedMedia(options: SyncOptions = {}): Promise<ELMediaItem[]> {
    const response = await this.fetchMedia({
      ...options,
      elderApprovedOnly: true,
    });
    return response.media;
  }

  /**
   * Fetch media by cultural tags
   */
  async fetchByCulturalTags(
    tags: string[],
    options: Omit<SyncOptions, 'culturalTags'> = {}
  ): Promise<ELMediaItem[]> {
    const response = await this.fetchMedia({
      ...options,
      culturalTags: tags,
    });
    return response.media;
  }

  /**
   * Check if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/content-hub/media?limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const empathyLedgerSync = new EmpathyLedgerSyncService();
