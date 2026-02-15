import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';

// Allowed subscription types
const ALLOWED_SUBSCRIPTION_TYPES = ['general', 'steward', 'researcher', 'organization'];

// Allowed source values
const ALLOWED_SOURCES = ['newsletter_form', 'homepage', 'signup', 'footer', 'contained_launch', 'get_involved_form', 'storyteller_registration'];

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
      const tags = [GHL_TAGS.NEWSLETTER];

      // Add subscription type tag
      if (validSubscriptionType === 'steward') tags.push(GHL_TAGS.STEWARD);
      if (validSubscriptionType === 'researcher') tags.push(GHL_TAGS.RESEARCHER);

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
        await ghl.removeTags(contact.id, [GHL_TAGS.NEWSLETTER]);
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
