/**
 * Empathy Ledger Syndication Client for JusticeHub
 *
 * Official integration with Empathy Ledger's Story Syndication API.
 * This client handles authentication, story fetching, and access logging
 * for stories that storytellers have explicitly shared with JusticeHub.
 *
 * @see https://github.com/empathy-ledger/docs/syndication-api
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const EMPATHY_LEDGER_API_URL =
  process.env.EMPATHY_LEDGER_API_URL || 'https://empathy-ledger.vercel.app';
const JUSTICEHUB_API_KEY =
  process.env.EMPATHY_LEDGER_API_KEY || '';

// =============================================================================
// TYPES
// =============================================================================

interface AuthResponse {
  token: string;
  expires_in: number;
  app: {
    name: string;
    display_name: string;
    allowed_story_types: string[];
  };
}

export interface SyndicatedStory {
  story_id: string;
  title: string;
  content: string;
  storyteller_name: string;
  themes: string[];
  story_date: string;
  cultural_restrictions: Record<string, unknown> | null;
  media: string[];
}

export interface StoriesResponse {
  stories: SyndicatedStory[];
  total: number;
  limit: number;
  offset: number;
}

export interface StoryFetchOptions {
  type?: 'testimony' | 'case_study' | 'advocacy' | string;
  limit?: number;
  offset?: number;
  since?: string; // ISO date string for incremental sync
}

export type AccessType = 'view' | 'embed' | 'export';

// =============================================================================
// CLIENT CLASS
// =============================================================================

class EmpathyLedgerClient {
  private baseUrl: string;
  private apiKey: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private allowedStoryTypes: string[] = [];

  constructor(baseUrl: string = EMPATHY_LEDGER_API_URL, apiKey: string = JUSTICEHUB_API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  /**
   * Authenticate and get a JWT token
   */
  async authenticate(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'Empathy Ledger API not configured. Set EMPATHY_LEDGER_API_URL and EMPATHY_LEDGER_API_KEY.'
      );
    }

    const response = await fetch(`${this.baseUrl}/api/external/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: this.apiKey }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Empathy Ledger authentication failed: ${error.error || response.statusText}`);
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.allowedStoryTypes = data.app.allowed_story_types;

    console.log(`[EmpathyLedger] Authenticated as ${data.app.display_name}`);
  }

  /**
   * Ensure we have a valid token
   */
  private async ensureAuthenticated(): Promise<string> {
    // Token expires in 5 minutes - refresh with 1 minute buffer
    const needsRefresh = !this.token || !this.tokenExpiry ||
      this.tokenExpiry < new Date(Date.now() + 60 * 1000);

    if (needsRefresh) {
      await this.authenticate();
    }
    return this.token!;
  }

  /**
   * Get allowed story types for JusticeHub
   */
  getAllowedStoryTypes(): string[] {
    return this.allowedStoryTypes;
  }

  /**
   * Fetch stories syndicated to JusticeHub
   */
  async getStories(options: StoryFetchOptions = {}): Promise<StoriesResponse> {
    const token = await this.ensureAuthenticated();

    const params = new URLSearchParams();
    if (options.type) params.set('type', options.type);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.since) params.set('since', options.since);

    const url = `${this.baseUrl}/api/external/stories${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute in Next.js
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch stories: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single story by ID
   */
  async getStory(storyId: string): Promise<SyndicatedStory> {
    const token = await this.ensureAuthenticated();

    const response = await fetch(`${this.baseUrl}/api/external/stories/${storyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch story: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return data.story;
  }

  /**
   * Log story access for storyteller transparency
   * This allows storytellers to see how their stories are being used.
   */
  async logAccess(
    storyId: string,
    accessType: AccessType,
    context?: Record<string, unknown>
  ): Promise<void> {
    try {
      const token = await this.ensureAuthenticated();

      const response = await fetch(`${this.baseUrl}/api/external/stories/${storyId}/access`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_type: accessType, context }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.warn(`[EmpathyLedger] Failed to log access: ${error.error || response.statusText}`);
      }
    } catch (err) {
      // Don't throw - logging failure shouldn't break the user experience
      console.warn('[EmpathyLedger] Access logging failed:', err);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let _clientInstance: EmpathyLedgerClient | null = null;

/**
 * Get the shared Empathy Ledger client instance
 */
export function getEmpathyLedgerClient(): EmpathyLedgerClient {
  if (!_clientInstance) {
    _clientInstance = new EmpathyLedgerClient();
  }
  return _clientInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Fetch stories from Empathy Ledger
 */
export async function fetchSyndicatedStories(
  options?: StoryFetchOptions
): Promise<SyndicatedStory[]> {
  const client = getEmpathyLedgerClient();

  if (!client.isConfigured()) {
    console.warn('[EmpathyLedger] Client not configured, returning empty array');
    return [];
  }

  try {
    const response = await client.getStories(options);
    return response.stories;
  } catch (err) {
    console.error('[EmpathyLedger] Failed to fetch stories:', err);
    return [];
  }
}

/**
 * Fetch a single story by ID
 */
export async function fetchSyndicatedStory(storyId: string): Promise<SyndicatedStory | null> {
  const client = getEmpathyLedgerClient();

  if (!client.isConfigured()) {
    console.warn('[EmpathyLedger] Client not configured');
    return null;
  }

  try {
    const story = await client.getStory(storyId);
    // Log the view
    await client.logAccess(storyId, 'view', { source: 'justicehub' });
    return story;
  } catch (err) {
    console.error('[EmpathyLedger] Failed to fetch story:', err);
    return null;
  }
}

/**
 * Log story access
 */
export async function logStoryAccess(
  storyId: string,
  accessType: AccessType,
  context?: Record<string, unknown>
): Promise<void> {
  const client = getEmpathyLedgerClient();

  if (!client.isConfigured()) {
    return;
  }

  await client.logAccess(storyId, accessType, context);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { EmpathyLedgerClient };
