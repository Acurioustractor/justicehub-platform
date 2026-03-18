import { getResendClient, isResendConfigured } from './resend';
import { wrapInBrandedTemplate } from './templates';

const FROM_ADDRESS = 'JusticeHub <hello@justicehub.com.au>';

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string; // Plain text — will be wrapped in branded HTML
  preheader?: string;
  replyTo?: string;
  scheduledAt?: string; // ISO date string for scheduled send
}

interface SendBatchOptions {
  emails: Array<{
    to: string;
    subject: string;
    body: string;
    preheader?: string;
  }>;
  replyTo?: string;
}

/**
 * Send a single branded email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id: string } | null> {
  if (!isResendConfigured()) {
    console.warn('[email] Resend not configured, skipping send to:', options.to);
    return null;
  }

  try {
    const resend = getResendClient();
    const html = wrapInBrandedTemplate(options.body, options.preheader);

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html,
      replyTo: options.replyTo || 'hello@justicehub.com.au',
      ...(options.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
    });

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return null;
    }

    return { id: result.data?.id || 'sent' };
  } catch (error) {
    console.error('[email] Failed to send:', error);
    return null;
  }
}

/**
 * Send batch emails via Resend (up to 100 per call)
 * Returns count of successfully queued emails
 */
export async function sendBatchEmail(options: SendBatchOptions): Promise<number> {
  if (!isResendConfigured()) {
    console.warn('[email] Resend not configured, skipping batch send');
    return 0;
  }

  const resend = getResendClient();
  let sent = 0;

  // Resend batch API supports up to 100 emails per call
  const BATCH_SIZE = 100;

  for (let i = 0; i < options.emails.length; i += BATCH_SIZE) {
    const batch = options.emails.slice(i, i + BATCH_SIZE);

    try {
      const result = await resend.batch.send(
        batch.map(email => ({
          from: FROM_ADDRESS,
          to: email.to,
          subject: email.subject,
          html: wrapInBrandedTemplate(email.body, email.preheader),
          replyTo: options.replyTo || 'hello@justicehub.com.au',
        }))
      );

      if (result.error) {
        console.error(`[email] Batch ${i / BATCH_SIZE + 1} error:`, result.error);
      } else {
        sent += batch.length;
      }
    } catch (error) {
      console.error(`[email] Batch ${i / BATCH_SIZE + 1} failed:`, error);
    }

    // Rate limit: wait between batches
    if (i + BATCH_SIZE < options.emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return sent;
}
