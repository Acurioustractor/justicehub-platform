import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify webhook signature using HMAC-SHA256 with timing-safe comparison
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Handle both raw hex and prefixed formats (e.g., "sha256=...")
    const providedSignature = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * POST /api/ghl/webhook
 *
 * Receives webhooks from GoHighLevel for:
 * - Contact updates
 * - Tag changes
 * - Opportunity updates
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (required in production)
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
    const signature = request.headers.get('x-ghl-signature');

    if (webhookSecret) {
      if (!signature) {
        console.warn('Webhook rejected: missing signature');
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        );
      }

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('Webhook rejected: invalid signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require webhook secret to be configured
      console.error('SECURITY: GHL_WEBHOOK_SECRET not configured in production');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Parse the verified body
    const body = JSON.parse(rawBody);
    const { type, locationId, contact, opportunity } = body;

    // Verify location ID
    if (locationId && locationId !== process.env.GHL_LOCATION_ID) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    switch (type) {
      case 'ContactCreate':
      case 'ContactUpdate': {
        if (!contact?.email) break;

        // Update any registrations with this GHL contact ID
        if (contact.id) {
          await supabase
            .from('event_registrations')
            .update({
              metadata: supabase.sql`metadata || ${JSON.stringify({
                ghl_last_sync: new Date().toISOString(),
                ghl_tags: contact.tags || [],
              })}::jsonb`,
            })
            .eq('ghl_contact_id', contact.id);

          // Update newsletter subscription
          await supabase
            .from('newsletter_subscriptions')
            .update({
              full_name: contact.firstName && contact.lastName
                ? `${contact.firstName} ${contact.lastName}`
                : undefined,
            })
            .eq('ghl_contact_id', contact.id);
        }
        break;
      }

      case 'ContactTagUpdate': {
        if (!contact?.id) break;

        // Sync tag changes back to our system
        const tags = contact.tags || [];

        // Check if newsletter tag was removed
        if (!tags.includes('Newsletter')) {
          await supabase
            .from('newsletter_subscriptions')
            .update({
              is_active: false,
              unsubscribed_at: new Date().toISOString(),
            })
            .eq('ghl_contact_id', contact.id);
        }
        break;
      }

      case 'OpportunityCreate':
      case 'OpportunityUpdate': {
        // Handle opportunity updates for steward pipeline tracking
        if (!opportunity?.contactId) break;
        // TODO: Implement opportunity status sync to database
        break;
      }

      default:
        // Unhandled webhook type - no action needed
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('GHL webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ghl/webhook
 *
 * Webhook verification endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
