import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * POST /api/ghl/newsletter
 *
 * Subscribes a user to the newsletter and syncs with GoHighLevel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, organization, subscription_type, source, tags: customTags } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Create/update GHL contact
    let ghlContactId: string | null = null;

    if (ghl.isConfigured()) {
      const tags = [GHL_TAGS.NEWSLETTER];

      // Add subscription type tag
      if (subscription_type === 'steward') tags.push(GHL_TAGS.STEWARD);
      if (subscription_type === 'researcher') tags.push(GHL_TAGS.RESEARCHER);

      // Add custom tags (e.g., 'CONTAINED Launch Interest')
      if (customTags && Array.isArray(customTags)) {
        tags.push(...customTags);
      }

      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name || '',
        tags,
        source: source ? `JusticeHub ${source}` : 'JusticeHub Newsletter',
        customFields: {
          organization: organization || '',
          subscription_type: subscription_type || 'general',
        },
      });
    }

    // 2. Save to newsletter subscriptions
    const { data: subscription, error: subError } = await supabase
      .from('newsletter_subscriptions')
      .upsert(
        {
          email,
          full_name: full_name || null,
          organization: organization || null,
          subscription_type: subscription_type || 'general',
          ghl_contact_id: ghlContactId,
          source: source || 'newsletter_form',
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
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
      .eq('email', email);

    if (updateError) {
      console.error('Newsletter unsubscribe error:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // 2. Remove newsletter tag in GHL
    if (ghl.isConfigured()) {
      const contact = await ghl.findContactByEmail(email);
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
