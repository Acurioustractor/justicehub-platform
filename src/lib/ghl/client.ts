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

        // IMPORTANT: Explicitly add tags because updateContact does not handle them
        if (contact.tags && contact.tags.length > 0) {
          await this.addTags(existing.id, contact.tags);
        }

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
   * Get opportunities for a contact
   */
  async getOpportunities(contactId: string): Promise<any[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/opportunities/search?locationId=${this.locationId}&contact_id=${contactId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.opportunities || [];
    } catch (error) {
      console.error('GHL getOpportunities error:', error);
      return [];
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

  /**
   * Get contacts by tag
   */
  async getContactsByTag(tag: string): Promise<GHLContact[]> {
    return this.getAllContacts(tag);
  }

  /**
   * Get all contacts (with optional tag query)
   * Handles pagination automatically
   */
  async getAllContacts(query?: string): Promise<GHLContact[]> {
    if (!this.isConfigured()) {
      return [];
    }

    let allContacts: GHLContact[] = [];
    let nextPageUrl: string | null = `${GHL_API_BASE}/contacts/?locationId=${this.locationId}&limit=100`;

    if (query) {
      nextPageUrl += `&query=${encodeURIComponent(query)}`;
    }

    try {
      while (nextPageUrl) {
        console.log(`Fetching page: ${nextPageUrl.replace(GHL_API_BASE, '')}`);

        const response: Response = await fetch(nextPageUrl, {
          method: 'GET',
          headers: this.headers,
        });

        if (!response.ok) {
          console.error(`Failed to fetch contacts: ${response.statusText}`);
          break;
        }

        const data = await response.json();
        const contacts = (data.contacts || []).map((c: any) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          name: c.contactName,
          phone: c.phone,
          tags: c.tags,
          customFields: c.customFields,
        }));

        allContacts = [...allContacts, ...contacts];

        // Check for next page
        if (data.meta?.nextPageUrl) {
          // Ensure we use the full URL provided, or construct it if relative
          // Usually GHL returns full URL or partial logic. 
          // The debug output showed full URL: https://services.leadconnectorhq.com/...
          nextPageUrl = data.meta.nextPageUrl;
        } else if (data.meta?.startAfterId && data.meta?.startAfter) {
          // Fallback manual construction if nextPageUrl missing but tokens present (rare if nextPageUrl exists)
          // But usually nextPageUrl is reliable if present.
          // Reset to null if no more pages
          nextPageUrl = null;
        } else {
          nextPageUrl = null;
        }

        // Safety break
        if (allContacts.length > 5000) {
          console.warn('Hit 5000 contact safety limit, stopping fetch.');
          break;
        }
      }

      return allContacts;
    } catch (error) {
      console.error('GHL getAllContacts error:', error);
      return allContacts;
    }
  }
  /**
   * Send an email to a contact via GHL Conversations API
   * Requires contactId — will upsert contact first if only email is provided
   */
  async sendEmail(options: {
    contactId: string;
    subject: string;
    html: string;
    emailFrom?: string;
  }): Promise<{ id: string } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          type: 'Email',
          contactId: options.contactId,
          subject: options.subject,
          html: options.html,
          emailFrom: options.emailFrom || 'JusticeHub <hello@justicehub.com.au>',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[GHL] Email send failed:', error);
        return null;
      }

      const data = await response.json();
      return { id: data.messageId || data.id || 'sent' };
    } catch (error) {
      console.error('[GHL] Email send error:', error);
      return null;
    }
  }

  /**
   * Send email by recipient email address (upserts contact first)
   */
  async sendEmailToAddress(options: {
    to: string;
    name?: string;
    subject: string;
    html: string;
    tags?: string[];
    source?: string;
  }): Promise<{ id: string } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      // Ensure contact exists
      const contactId = await this.upsertContact({
        email: options.to,
        name: options.name,
        tags: options.tags,
        source: options.source,
      });

      if (!contactId) {
        console.error('[GHL] Could not create/find contact for:', options.to);
        return null;
      }

      return this.sendEmail({
        contactId,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('[GHL] sendEmailToAddress error:', error);
      return null;
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

// Consolidated tag system (12 core tags + 4 role tags + 4 tier tags)
// See: consolidation done 2026-03-19
export const GHL_TAGS = {
  // Source
  JUSTICEHUB: 'JusticeHub',

  // Campaign
  CONTAINED: 'CONTAINED',
  NEWSLETTER: 'Newsletter',
  EVENT: 'Event',

  // Actions taken
  REACTED: 'Reacted',           // Walked through CONTAINED + shared story
  NOMINATED: 'Nominated',       // Nominated a decision maker
  WROTE_MP: 'Wrote MP',         // Sent letter to MP
  WANTS_TO_HELP: 'Wants to Help', // Help form (details in custom fields)
  PARTNER: 'Partner',           // Partnership / funder interest
  MEDIA: 'Media',               // Media inquiry

  // Roles
  STEWARD: 'Steward',
  RESEARCHER: 'Researcher',
  PRACTITIONER: 'Practitioner',
  YOUTH_VOICE: 'Youth Voice',

  // Engagement tiers (set by weekly scoring cron)
  TIER_AWARE: 'Tier: Aware',
  TIER_ENGAGED: 'Tier: Engaged',
  TIER_ACTIVE: 'Tier: Active',
  TIER_CHAMPION: 'Tier: Champion',
} as const;

export const GHL_PIPELINES = {
  STEWARD: process.env.GHL_STEWARD_PIPELINE_ID || '',
  EVENT: process.env.GHL_EVENT_PIPELINE_ID || '',
} as const;
