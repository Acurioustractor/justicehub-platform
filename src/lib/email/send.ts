import { getGHLClient } from '@/lib/ghl/client';
import { wrapInBrandedTemplate } from './templates';

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string; // Plain text — will be wrapped in branded HTML
  preheader?: string;
  replyTo?: string;
  name?: string; // Recipient name for GHL contact upsert
  tags?: string[]; // GHL tags to apply
  source?: string; // GHL source attribution
}

interface SendBatchOptions {
  emails: Array<{
    to: string;
    subject: string;
    body: string;
    preheader?: string;
    name?: string;
  }>;
  replyTo?: string;
  tags?: string[];
  source?: string;
}

/**
 * Send a single branded email via GHL Conversations API.
 * Upserts the contact first (so every email recipient ends up in the CRM).
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id: string } | null> {
  const ghl = getGHLClient();
  if (!ghl.isConfigured()) {
    console.warn('[email] GHL not configured, skipping send to:', options.to);
    return null;
  }

  try {
    const html = wrapInBrandedTemplate(options.body, options.preheader);

    const result = await ghl.sendEmailToAddress({
      to: options.to,
      name: options.name,
      subject: options.subject,
      html,
      tags: options.tags,
      source: options.source,
    });

    if (!result) {
      console.error('[email] GHL send failed for:', options.to);
      return null;
    }

    return result;
  } catch (error) {
    console.error('[email] Failed to send:', error);
    return null;
  }
}

/**
 * Send batch emails via GHL (sequential with rate limiting).
 * Each recipient is upserted as a contact first.
 * Returns count of successfully sent emails.
 */
export async function sendBatchEmail(options: SendBatchOptions): Promise<number> {
  const ghl = getGHLClient();
  if (!ghl.isConfigured()) {
    console.warn('[email] GHL not configured, skipping batch send');
    return 0;
  }

  let sent = 0;

  for (let i = 0; i < options.emails.length; i++) {
    const email = options.emails[i];

    try {
      const html = wrapInBrandedTemplate(email.body, email.preheader);

      const result = await ghl.sendEmailToAddress({
        to: email.to,
        name: email.name,
        subject: email.subject,
        html,
        tags: options.tags,
        source: options.source,
      });

      if (result) {
        sent++;
      }
    } catch (error) {
      console.error(`[email] Batch item ${i + 1} failed:`, error);
    }

    // Rate limit: 300ms between sends to avoid GHL throttling
    if (i < options.emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return sent;
}
