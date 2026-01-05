/**
 * GoHighLevel (GHL) API Client
 *
 * Handles integration with GoHighLevel CRM for:
 * - Contact management (create, update, tag)
 * - Event registrations
 * - Newsletter subscriptions
 * - Steward pipeline management
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLConfig {
  apiKey: string;
  locationId: string;
}

interface GHLContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
  source?: string;
}

interface GHLContactResponse {
  contact: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tags: string[];
  };
}

interface GHLOpportunity {
  pipelineId: string;
  pipelineStageId: string;
  name: string;
  contactId: string;
  monetaryValue?: number;
}

export class GHLClient {
  private apiKey: string;
  private locationId: string;

  constructor(config?: GHLConfig) {
    this.apiKey = config?.apiKey || process.env.GHL_API_KEY || '';
    this.locationId = config?.locationId || process.env.GHL_LOCATION_ID || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    };
  }

  /**
   * Check if GHL is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.locationId);
  }

  /**
   * Create or update a contact in GHL
   */
  async upsertContact(contact: GHLContact): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn('GHL not configured, skipping contact upsert');
      return null;
    }

    try {
      // First try to find existing contact by email
      const existing = await this.findContactByEmail(contact.email);

      if (existing) {
        // Update existing contact
        await this.updateContact(existing.id, contact);
        return existing.id;
      }

      // Create new contact
      const response = await fetch(`${GHL_API_BASE}/contacts/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          locationId: this.locationId,
          email: contact.email,
          firstName: contact.firstName || contact.name?.split(' ')[0] || '',
          lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
          phone: contact.phone,
          tags: contact.tags || [],
          source: contact.source || 'JusticeHub',
          customFields: contact.customFields ? Object.entries(contact.customFields).map(([key, value]) => ({
            key,
            field_value: value,
          })) : [],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GHL create contact failed: ${error}`);
      }

      const data: GHLContactResponse = await response.json();
      return data.contact.id;
    } catch (error) {
      console.error('GHL upsertContact error:', error);
      return null;
    }
  }

  /**
   * Find a contact by email
   */
  async findContactByEmail(email: string): Promise<{ id: string; email: string } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${GHL_API_BASE}/contacts/search/duplicate?locationId=${this.locationId}&email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.contact) {
        return {
          id: data.contact.id,
          email: data.contact.email,
        };
      }

      return null;
    } catch (error) {
      console.error('GHL findContactByEmail error:', error);
      return null;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId: string, contact: Partial<GHLContact>): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          customFields: contact.customFields ? Object.entries(contact.customFields).map(([key, value]) => ({
            key,
            field_value: value,
          })) : undefined,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('GHL updateContact error:', error);
      return false;
    }
  }

  /**
   * Add tags to a contact
   */
  async addTags(contactId: string, tags: string[]): Promise<boolean> {
    if (!this.isConfigured() || tags.length === 0) {
      return false;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ tags }),
      });

      return response.ok;
    } catch (error) {
      console.error('GHL addTags error:', error);
      return false;
    }
  }

  /**
   * Remove tags from a contact
   */
  async removeTags(contactId: string, tags: string[]): Promise<boolean> {
    if (!this.isConfigured() || tags.length === 0) {
      return false;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({ tags }),
      });

      return response.ok;
    } catch (error) {
      console.error('GHL removeTags error:', error);
      return false;
    }
  }

  /**
   * Create an opportunity (for pipeline management)
   */
  async createOpportunity(opportunity: GHLOpportunity): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/opportunities/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          locationId: this.locationId,
          ...opportunity,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GHL create opportunity failed: ${error}`);
      }

      const data = await response.json();
      return data.opportunity?.id || null;
    } catch (error) {
      console.error('GHL createOpportunity error:', error);
      return null;
    }
  }

  /**
   * Add contact to a workflow
   */
  async addToWorkflow(contactId: string, workflowId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/workflow/${workflowId}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          eventStartTime: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('GHL addToWorkflow error:', error);
      return false;
    }
  }
}

// Singleton instance
let ghlClient: GHLClient | null = null;

export function getGHLClient(): GHLClient {
  if (!ghlClient) {
    ghlClient = new GHLClient();
  }
  return ghlClient;
}

// Pipeline and tag constants
export const GHL_TAGS = {
  NEWSLETTER: 'Newsletter',
  STEWARD: 'Steward',
  RESEARCHER: 'Researcher',
  PRACTITIONER: 'Practitioner',
  EVENT_REGISTRANT: 'Event Registrant',
  CONTAINED_LAUNCH: 'CONTAINED Launch 2026',
  YOUTH_VOICE: 'Youth Voice',
} as const;

export const GHL_PIPELINES = {
  STEWARD: process.env.GHL_STEWARD_PIPELINE_ID || '',
  EVENT: process.env.GHL_EVENT_PIPELINE_ID || '',
} as const;
