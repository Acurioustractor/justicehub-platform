import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';
import { preEventSequence } from '@/content/newsletter-sequences';
import { verifyTurnstileToken } from '@/lib/turnstile';

/**
 * POST /api/ghl/register
 *
 * Registers a user for an event and syncs with GoHighLevel CRM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      email,
      full_name,
      organization,
      role,
      dietary_requirements,
      accessibility_needs,
      how_heard,
      newsletter,
      event_name,
      turnstile_token,
    } = body;

    // Verify Turnstile token
    const turnstileValid = await verifyTurnstileToken(turnstile_token);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Bot verification failed. Please try again.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Create/update GHL contact
    let ghlContactId: string | null = null;

    if (ghl.isConfigured()) {
      const tags: string[] = [
        GHL_TAGS.EVENT,
        GHL_TAGS.JUSTICEHUB,
      ];

      // Add CONTAINED tag if it's a CONTAINED event
      if (event_name?.toUpperCase().includes('CONTAINED')) {
        tags.push(GHL_TAGS.CONTAINED);
      }

      if (newsletter) {
        tags.push(GHL_TAGS.NEWSLETTER);
      }

      // Map role to tag
      if (role === 'researcher') tags.push(GHL_TAGS.RESEARCHER);
      if (role === 'practitioner') tags.push(GHL_TAGS.PRACTITIONER);
      if (role === 'lived_experience') tags.push(GHL_TAGS.YOUTH_VOICE);

      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name,
        tags,
        source: 'JusticeHub Event Registration',
        customFields: {
          organization: organization || '',
          role: role || '',
          how_heard: how_heard || '',
        },
      });
    }

    // 2. Save registration to database
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event_id || null,
        email,
        full_name,
        organization: organization || null,
        ghl_contact_id: ghlContactId,
        metadata: {
          role,
          dietary_requirements,
          accessibility_needs,
          how_heard,
          newsletter,
          event_name,
          registered_at: new Date().toISOString(),
        },
        registration_status: 'registered',
      })
      .select()
      .single();

    if (regError) {
      console.error('Registration error:', regError);
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      );
    }

    // 3. If newsletter opted in, also add to newsletter subscriptions
    if (newsletter) {
      await supabase
        .from('newsletter_subscriptions')
        .upsert(
          {
            email,
            full_name,
            organization,
            subscription_type: role === 'researcher' ? 'researcher' : 'general',
            ghl_contact_id: ghlContactId,
            source: 'event_registration',
          },
          { onConflict: 'email' }
        );
    }

    // 4. Send event confirmation email immediately via Resend
    const confirmation = preEventSequence.emails[0];
    sendEmail({
      to: email,
      subject: confirmation.subject,
      body: confirmation.body,
      preheader: confirmation.preheader,
    }).catch(err => console.error('Failed to send event confirmation email:', err));

    // 5. Trigger GHL pre-event workflow if configured (legacy/supplementary)
    if (ghlContactId && ghl.isConfigured()) {
      const preEventWorkflowId = process.env.GHL_PRE_EVENT_WORKFLOW_ID;
      if (preEventWorkflowId) {
        ghl.addToWorkflow(ghlContactId, preEventWorkflowId).catch(err =>
          console.error('Failed to trigger pre-event drip:', err)
        );
      }
    }

    // 6. Track as member action if user has an account
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (matchedProfile?.id) {
      await (supabase as any).from('member_actions').insert({
        user_id: matchedProfile.id,
        action_type: 'event_registration',
        metadata: { event_name: event_name || null, event_id: event_id || null },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      ghl_contact_id: ghlContactId,
    });
  } catch (error: any) {
    console.error('GHL register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
