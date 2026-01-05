import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

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
    // Verify webhook signature if configured
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
    const signature = request.headers.get('x-ghl-signature');

    if (webhookSecret && signature) {
      // In production, verify the signature
      // For now, we'll just log a warning if not matching
      // TODO: Implement proper HMAC verification
    }

    const body = await request.json();
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
        if (!opportunity?.contactId) break;

        // Log opportunity updates for steward pipeline tracking
        console.log('GHL Opportunity update:', {
          id: opportunity.id,
          contactId: opportunity.contactId,
          status: opportunity.status,
          pipelineStageId: opportunity.pipelineStageId,
        });
        break;
      }

      default:
        console.log('Unhandled GHL webhook type:', type);
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
