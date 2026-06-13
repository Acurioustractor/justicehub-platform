import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_CANONICAL, GHL_PIPELINES, MEMBER_TYPE_TO_ROLE, STATE_TO_PLACE, GHL_NURTURE_WORKFLOWS } from '@/lib/ghl/client';
import { sanitizeInput } from '@/lib/security';
import { writeCaptureLog, backfillCaptureSync } from '@/lib/contained/capture-log';
import { sendEmail } from '@/lib/email/send';
import { signupReceipt } from '@/content/contained-receipts';

/**
 * POST /api/ghl/signup
 *
 * Syncs new user signups with GoHighLevel CRM
 * Called after Supabase auth user + profile creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      email,
      full_name,
      preferred_name,
      is_steward,
      steward_motivation,
      steward_experience,
      steward_commitments,
      organization,
      newsletter,
      source,
      member_type,
      state,
      message,
    } = body;

    // Free-text note from the register-interest form. Sanitised before it
    // reaches GHL custom fields (newlines kept, capped at 1000 chars).
    const sanitizedMessage = message
      ? sanitizeInput(String(message), { maxLength: 1000, allowNewlines: true })
      : '';

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    let ghlContactId: string | null = null;

    // Community lane (OCAP agency model, R3): lived-experience / youth voice are
    // NEVER auto-enrolled into comms: or nurture automation — here, in the
    // workflow trigger, or in the newsletter-list upsert below. A community-lane
    // newsletter opt-in is honored only via a human-confirmed follow-up.
    const communityLane = member_type === 'lived_experience';

    // Durable-first capture: write an append-only row BEFORE any GHL call, so a
    // GHL failure (outage, 504, API error) can never lose the lead. This is the
    // fail-loud spine — if it throws (anything but a missing table pre-migration),
    // we 500 and the form's fail-loud fallback tells the person nothing was saved.
    let captureId: string | null = null;
    try {
      const capture = await writeCaptureLog(supabase, {
        route: 'signup',
        email,
        name: full_name || null,
        role: member_type || (is_steward ? 'steward' : null),
        payload: {
          organization: organization || '',
          state: state || '',
          source: source || '',
          newsletter: !!newsletter,
          message: sanitizedMessage,
        },
      });
      captureId = capture.captureId;
    } catch (captureErr) {
      console.error('[signup] durable capture insert failed:', captureErr);
      return NextResponse.json(
        { error: 'We could not save your details. Please email ben@justicehub.com.au and we will register you directly.' },
        { status: 500 }
      );
    }

    if (ghl.isConfigured()) {
      // Build canonical tags. project: is always present.
      const tags: string[] = [GHL_CANONICAL.PROJECT_JH];

      if (is_steward) {
        tags.push(GHL_CANONICAL.TIER_STEWARD);
      }

      // Campaign member type → canonical role (+ CONTAINED source, R4)
      if (member_type) {
        tags.push(GHL_CANONICAL.SOURCE_EVENT_CONTAINED);
        const roleTag = MEMBER_TYPE_TO_ROLE[member_type];
        if (roleTag) tags.push(roleTag);
        if (communityLane) {
          tags.push(GHL_CANONICAL.LANE_COMMUNITY);
        }
      }

      // State → canonical place: tag for regional segmentation
      if (state) {
        const placeTag = STATE_TO_PLACE[state.toUpperCase()];
        if (placeTag) tags.push(placeTag);
      }

      // Newsletter opt-in → comms send-trigger, UNLESS community lane (OCAP).
      if (newsletter && !communityLane) {
        tags.push(GHL_CANONICAL.COMMS_JH_NEWSLETTER);
      }

      // Create/update GHL contact
      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name,
        tags,
        source: source || (is_steward ? 'JusticeHub Steward Signup' : 'JusticeHub Signup'),
        customFields: {
          preferred_name: preferred_name || '',
          organization: organization || '',
          signup_type: member_type || (is_steward ? 'steward' : 'user'),
          member_type: member_type || '',
          state: state || '',
          steward_motivation: steward_motivation || '',
          steward_experience: steward_experience || '',
          steward_commitments: steward_commitments?.join(', ') || '',
          newsletter_consent: (newsletter && !communityLane) ? 'Yes' : '',
          message: sanitizedMessage,
        },
      });

      // If steward, add to Steward pipeline
      if (is_steward && ghlContactId && GHL_PIPELINES.STEWARD) {
        await ghl.createOpportunity({
          pipelineId: GHL_PIPELINES.STEWARD,
          pipelineStageId: process.env.GHL_STEWARD_STAGE_NEW || '',
          name: `Steward: ${full_name}`,
          contactId: ghlContactId,
        });
      }

      // Trigger role-specific nurture workflow — NEVER for community lane (OCAP).
      if (member_type && ghlContactId && !communityLane) {
        const workflowId = GHL_NURTURE_WORKFLOWS[member_type];
        if (workflowId) {
          ghl.addToWorkflow(ghlContactId, workflowId).catch(err =>
            console.error('Failed to trigger nurture workflow:', err)
          );
        }
      }
    }

    // Backfill the durable capture row with the GHL result. An un-synced row
    // (ghl_synced=false) is replayable; the lead is never lost.
    await backfillCaptureSync(supabase, captureId, {
      ghl_contact_id: ghlContactId,
      ghl_synced: !!ghlContactId,
    });

    // Receipt to the person — this is the no-reply fix (Defect B). Fire-and-forget;
    // the kill switch in send.ts makes it a safe no-op when EMAIL_ENABLED is off.
    // Community lane (OCAP) gets no automated email; a human follow-up acknowledges
    // their submission. (Ben can enable a receipt for that lane if desired.)
    if (!communityLane) {
      const firstName = (full_name || '').split(' ')[0] || 'there';
      const receipt = signupReceipt(firstName);
      // AWAIT the send: there is no further awaited work before the response, so
      // a fire-and-forget here would be frozen by the serverless runtime before
      // the GHL email call completes. Awaiting guarantees the receipt actually
      // sends (adds ~1s; acceptable for a confirmation).
      try {
        const result = await sendEmail({
          to: email,
          subject: receipt.subject,
          body: receipt.body,
          preheader: receipt.preheader,
          heroImage: {
            src: 'https://www.justicehub.com.au/images/contained/contained-brand-square.png',
            alt: 'CONTAINED. 3 rooms. 30 minutes. The truth.',
          },
        });
        if (result) await backfillCaptureSync(supabase, captureId, { receipt_sent: true });
      } catch (err) {
        console.error('[signup] receipt email failed:', err);
      }
    }

    // Update profile with GHL contact ID
    if (user_id && ghlContactId) {
      // Read current metadata then merge
      const { data: profile } = await (supabase as any)
        .from('public_profiles')
        .select('metadata')
        .eq('user_id', user_id)
        .single();

      if (profile) {
        await (supabase as any)
          .from('public_profiles')
          .update({
            metadata: {
              ...(profile.metadata || {}),
              ghl_contact_id: ghlContactId,
            },
          })
          .eq('user_id', user_id);
      }
    }

    // Newsletter list enrolment — skipped for community lane (OCAP): a
    // community-lane opt-in is honored only via a human-confirmed follow-up.
    if (newsletter && !communityLane) {
      await supabase
        .from('newsletter_subscriptions')
        .upsert(
          {
            email,
            full_name,
            organization,
            subscription_type: is_steward ? 'steward' : 'general',
            ghl_contact_id: ghlContactId,
          },
          { onConflict: 'email' }
        );
    }

    return NextResponse.json({
      success: true,
      ghl_contact_id: ghlContactId,
      message: ghlContactId
        ? 'Synced with CRM successfully'
        : 'GHL not configured, skipped CRM sync',
    });
  } catch (error: any) {
    console.error('GHL signup sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
