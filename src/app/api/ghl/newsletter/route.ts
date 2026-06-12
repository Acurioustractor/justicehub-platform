import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_CANONICAL } from '@/lib/ghl/client';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';
import { welcomeSequence } from '@/content/newsletter-sequences';

// Allowed subscription types
const ALLOWED_SUBSCRIPTION_TYPES = ['general', 'steward', 'researcher', 'organization'];

// Allowed source values
const ALLOWED_SOURCES = ['newsletter_form', 'homepage', 'signup', 'footer', 'contained_launch', 'contained_tour', 'contained_experience', 'contained_stories', 'contained_act_page', 'get_involved_form', 'storyteller_registration'];

/**
 * POST /api/ghl/newsletter
 *
 * Subscribes a user to the newsletter and syncs with GoHighLevel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, organization, subscription_type, source, tags: customTags } = body;

    // Validate and sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Sanitize optional text fields
    const sanitizedFullName = full_name
      ? sanitizeInput(String(full_name), { maxLength: 200, allowNewlines: false })
      : null;
    const sanitizedOrganization = organization
      ? sanitizeInput(String(organization), { maxLength: 200, allowNewlines: false })
      : null;

    // Validate subscription type
    const validSubscriptionType = subscription_type && ALLOWED_SUBSCRIPTION_TYPES.includes(subscription_type)
      ? subscription_type
      : 'general';

    // Validate source
    const validSource = source && ALLOWED_SOURCES.includes(source)
      ? source
      : 'newsletter_form';

    // Validate custom tags (only allow alphanumeric and spaces, max 5 tags)
    const validTags: string[] = [];
    if (customTags && Array.isArray(customTags)) {
      for (const tag of customTags.slice(0, 5)) {
        if (typeof tag === 'string' && /^[\w\s-]+$/.test(tag) && tag.length <= 50) {
          validTags.push(tag);
        }
      }
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Create/update GHL contact
    let ghlContactId: string | null = null;

    if (ghl.isConfigured()) {
      // Canonical contract: explicit newsletter opt-in → grant the send-trigger
      // tag + capture consent (see whole-system forms→GHL alignment plan).
      const tags: string[] = [
        GHL_CANONICAL.SOURCE_WEBSITE,
        GHL_CANONICAL.PROJECT_JH,
        GHL_CANONICAL.ROLE_SUPPORTER,
        GHL_CANONICAL.COMMS_JH_NEWSLETTER,
      ];

      // CONTAINED surfaces also carry the campaign event tag (R4)
      if (validSource.startsWith('contained')) { tags.push(GHL_CANONICAL.SOURCE_EVENT_CONTAINED); }

      // Add subscription type tag
      if (validSubscriptionType === 'steward') tags.push(GHL_CANONICAL.TIER_STEWARD);
      if (validSubscriptionType === 'researcher') tags.push(GHL_CANONICAL.ROLE_RESEARCHER);

      // Add validated custom tags
      if (validTags.length > 0) {
        tags.push(...validTags);
      }

      ghlContactId = await ghl.upsertContact({
        email: sanitizedEmail,
        name: sanitizedFullName || '',
        tags,
        source: `JusticeHub ${validSource}`,
        customFields: {
          organization: sanitizedOrganization || '',
          subscription_type: validSubscriptionType,
          newsletter_consent: 'Yes',
        },
      });
    }

    // 2. Save to newsletter subscriptions
    const { data: subscription, error: subError } = await supabase
      .from('newsletter_subscriptions')
      .upsert(
        {
          email: sanitizedEmail,
          full_name: sanitizedFullName,
          organization: sanitizedOrganization,
          subscription_type: validSubscriptionType,
          ghl_contact_id: ghlContactId,
          source: validSource,
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (subError) {
      console.error('Newsletter subscription error:', subError);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // 3. Send welcome email immediately via Resend
    const welcome = welcomeSequence.emails[0];
    sendEmail({
      to: sanitizedEmail,
      subject: welcome.subject,
      body: welcome.body,
      preheader: welcome.preheader,
    }).catch(err => console.error('Failed to send welcome email:', err));

    // 4. Trigger GHL welcome workflow if configured (legacy/supplementary)
    if (ghlContactId && ghl.isConfigured()) {
      const welcomeWorkflowId = process.env.GHL_WELCOME_WORKFLOW_ID;
      if (welcomeWorkflowId) {
        ghl.addToWorkflow(ghlContactId, welcomeWorkflowId).catch(err =>
          console.error('Failed to trigger welcome sequence:', err)
        );
      }
    }

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      ghl_contact_id: ghlContactId,
    });
  } catch (error: any) {
    console.error('GHL newsletter error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ghl/newsletter?email=...
 *
 * Unsubscribe link target from email footers — browsers issue a GET,
 * so this performs the unsubscribe and renders a confirmation page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sanitizedEmail = sanitizeEmail(searchParams.get('email') || '');

  if (!sanitizedEmail) {
    return unsubscribePage('That unsubscribe link is missing a valid email address. Reply to any of our emails and we will remove you by hand.', 400);
  }

  try {
    await unsubscribe(sanitizedEmail);
    return unsubscribePage(`${sanitizedEmail} has been unsubscribed. You will not hear from us again.`, 200);
  } catch (error) {
    console.error('GHL newsletter unsubscribe (GET) error:', error);
    return unsubscribePage('Something went wrong unsubscribing you. Reply to any of our emails and we will remove you by hand.', 500);
  }
}

function unsubscribePage(message: string, status: number) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Unsubscribe · JusticeHub</title></head>
<body style="margin: 0; background-color: #F5F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0A0A0A;">
  <div style="max-width: 560px; margin: 80px auto; padding: 0 20px;">
    <p style="font-weight: 700; font-size: 22px; letter-spacing: -0.03em; border-bottom: 3px solid #DC2626; padding-bottom: 20px;">JUSTICEHUB</p>
    <p style="font-size: 17px; line-height: 1.6;">${message}</p>
    <p style="font-size: 14px;"><a href="https://justicehub.com.au" style="color: #DC2626;">justicehub.com.au</a></p>
  </div>
</body>
</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

async function unsubscribe(sanitizedEmail: string) {
  const supabase = createServiceClient();
  const ghl = getGHLClient();

  const { error: updateError } = await supabase
    .from('newsletter_subscriptions')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email', sanitizedEmail);

  if (updateError) {
    throw new Error(`Failed to unsubscribe: ${updateError.message}`);
  }

  if (ghl.isConfigured()) {
    const contact = await ghl.findContactByEmail(sanitizedEmail);
    if (contact) {
      await ghl.removeTags(contact.id, [GHL_CANONICAL.COMMS_JH_NEWSLETTER]);
    }
  }
}

/**
 * DELETE /api/ghl/newsletter
 *
 * Unsubscribes a user from the newsletter
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    // Validate email
    const sanitizedEmail = sanitizeEmail(emailParam || '');
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Update database
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', sanitizedEmail);

    if (updateError) {
      console.error('Newsletter unsubscribe error:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // 2. Remove newsletter tag in GHL
    if (ghl.isConfigured()) {
      const contact = await ghl.findContactByEmail(sanitizedEmail);
      if (contact) {
        await ghl.removeTags(contact.id, [GHL_CANONICAL.COMMS_JH_NEWSLETTER]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('GHL newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
