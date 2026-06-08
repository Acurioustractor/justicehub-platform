import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS, STATE_TO_TAG } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';
import { preEventSequence } from '@/content/newsletter-sequences';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';

const ALLOWED_ROLES = [
  'researcher',
  'practitioner',
  'lived_experience',
  'media',
  'funder',
  'service_org',
  'student',
  'policymaker',
  'advocate',
  'artist',
  'community',
  'supporter',
];

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
      event_slug,
      state,
      tags: customTags,
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

    const sanitizedEmail = sanitizeEmail(String(email || ''));
    const sanitizedFullName = full_name
      ? sanitizeInput(String(full_name), { maxLength: 200, allowNewlines: false })
      : '';
    const sanitizedOrganization = organization
      ? sanitizeInput(String(organization), { maxLength: 200, allowNewlines: false })
      : null;
    const sanitizedRole = typeof role === 'string' && ALLOWED_ROLES.includes(role)
      ? role
      : 'supporter';
    const sanitizedDietaryRequirements = dietary_requirements
      ? sanitizeInput(String(dietary_requirements), { maxLength: 1000, allowNewlines: true })
      : null;
    const sanitizedAccessibilityNeeds = accessibility_needs
      ? sanitizeInput(String(accessibility_needs), { maxLength: 1000, allowNewlines: true })
      : null;
    const sanitizedHowHeard = how_heard
      ? sanitizeInput(String(how_heard), { maxLength: 500, allowNewlines: false })
      : null;
    const sanitizedEventName = event_name
      ? sanitizeInput(String(event_name), { maxLength: 200, allowNewlines: false })
      : null;
    const sanitizedEventSlug = event_slug
      ? sanitizeInput(String(event_slug), { maxLength: 120, allowNewlines: false })
      : null;
    const sanitizedState = typeof state === 'string' && /^[A-Za-z]{2,3}$/.test(state.trim())
      ? state.trim().toUpperCase()
      : null;
    const sanitizedEventId = typeof event_id === 'string' && /^[\w-]+$/.test(event_id)
      ? sanitizeInput(event_id, { maxLength: 120, allowNewlines: false })
      : null;
    const newsletterOptIn = newsletter === true || newsletter === 'true';

    // Validate required fields
    if (!sanitizedEmail || !sanitizedFullName) {
      return NextResponse.json(
        { error: 'Valid email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Create/update GHL contact
    let ghlContactId: string | null = null;
    const safeCustomTags = Array.isArray(customTags)
      ? customTags
        .filter((tag): tag is string => typeof tag === 'string' && /^[\w\s:-]+$/.test(tag) && tag.length <= 60)
        .slice(0, 8)
      : [];

    if (ghl.isConfigured()) {
      const cohortTag = safeCustomTags.find((tag) => tag.startsWith('cohort_'));
      const isPublicCohort = !cohortTag || cohortTag === 'cohort_public';

      const tags: string[] = [
        GHL_TAGS.EVENT,
        GHL_TAGS.JUSTICEHUB,
        ...safeCustomTags,
      ];

      // Add CONTAINED tag if it's a CONTAINED event. public_visitor is reserved
      // for the general public cohort, not VIP / funder / conference walkthroughs.
      if (sanitizedEventName?.toUpperCase().includes('CONTAINED')) {
        tags.push(GHL_TAGS.CONTAINED);
        if (isPublicCohort) tags.push(GHL_TAGS.PUBLIC_VISITOR);
      }

      if (sanitizedEventSlug === 'contained-adelaide-tandanya' || sanitizedEventName?.toLowerCase().includes('adelaide')) {
        tags.push(GHL_TAGS.CONTAINED_ADELAIDE, GHL_TAGS.YOUTH_REMAND, GHL_TAGS.COUNTRY_REPORTS);
      }

      // Canonical state tag derived from the stop, not hardcoded on the page.
      if (sanitizedState && STATE_TO_TAG[sanitizedState]) {
        tags.push(STATE_TO_TAG[sanitizedState]);
      }

      if (newsletterOptIn) {
        tags.push(GHL_TAGS.NEWSLETTER);
      }

      // Map role to tag
      if (sanitizedRole === 'researcher') tags.push(GHL_TAGS.RESEARCHER);
      if (sanitizedRole === 'practitioner') tags.push(GHL_TAGS.PRACTITIONER);
      if (sanitizedRole === 'lived_experience') tags.push(GHL_TAGS.YOUTH_VOICE);
      if (sanitizedRole === 'media') tags.push(GHL_TAGS.MEDIA, GHL_TAGS.ROLE_MEDIA);
      if (sanitizedRole === 'funder') tags.push(GHL_TAGS.PARTNER, GHL_TAGS.ROLE_FUNDER);
      if (sanitizedRole === 'service_org') tags.push(GHL_TAGS.ROLE_ORGANIZATION, 'service');
      if (sanitizedRole === 'student') tags.push('student', 'university');
      if (sanitizedRole === 'policymaker') tags.push('policy');
      if (sanitizedRole === 'advocate') tags.push('advocate');
      if (sanitizedRole === 'artist') tags.push('artist');
      if (sanitizedRole === 'community') tags.push('community');

      ghlContactId = await ghl.upsertContact({
        email: sanitizedEmail,
        name: sanitizedFullName,
        tags,
        source: 'JusticeHub Event Registration',
        customFields: {
          organization: sanitizedOrganization || '',
          role: sanitizedRole,
          how_heard: sanitizedHowHeard || '',
          event_slug: sanitizedEventSlug || '',
        },
      });
    }

    // 2. Save registration to database
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: sanitizedEventId,
        email: sanitizedEmail,
        full_name: sanitizedFullName,
        organization: sanitizedOrganization,
        ghl_contact_id: ghlContactId,
        metadata: {
          role: sanitizedRole,
          dietary_requirements: sanitizedDietaryRequirements,
          accessibility_needs: sanitizedAccessibilityNeeds,
          how_heard: sanitizedHowHeard,
          newsletter: newsletterOptIn,
          event_name: sanitizedEventName,
          event_slug: sanitizedEventSlug,
          state: sanitizedState,
          tags: safeCustomTags,
          cohort: safeCustomTags.find((tag) => tag.startsWith('cohort_')) || null,
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
    if (newsletterOptIn) {
      await supabase
        .from('newsletter_subscriptions')
        .upsert(
          {
            email: sanitizedEmail,
            full_name: sanitizedFullName,
            organization: sanitizedOrganization,
            subscription_type: sanitizedRole === 'researcher' ? 'researcher' : 'general',
            ghl_contact_id: ghlContactId,
            source: 'event_registration',
          },
          { onConflict: 'email' }
        );
    }

    // 4. Send event confirmation email immediately via Resend
    const confirmation = preEventSequence.emails[0];
    sendEmail({
      to: sanitizedEmail,
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
      .eq('email', sanitizedEmail)
      .single();

    if (matchedProfile?.id) {
      await (supabase as any).from('member_actions').insert({
        user_id: matchedProfile.id,
        action_type: 'event_registration',
        metadata: { event_name: sanitizedEventName, event_slug: sanitizedEventSlug, event_id: sanitizedEventId },
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
