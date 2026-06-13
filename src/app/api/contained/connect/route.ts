import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_CANONICAL, GHL_PIPELINES } from '@/lib/ghl/client';
import { sanitizeInput, sanitizeEmail } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';
import { writeCaptureLog, backfillCaptureSync } from '@/lib/contained/capture-log';

/**
 * POST /api/contained/connect
 *
 * GAP #20 — funder / partner / media routed capture.
 *
 * Someone who *is* a funder, partner, or journalist self-identifies and reaches
 * out directly (distinct from the share-templates on /contained/act, which let
 * a supporter pitch TO a funder/journalist). Under the canonical one-account
 * GHL contract (R4) they are tagged with the matching role: and the CONTAINED
 * campaign source. Funders and partners also become a GHL opportunity in their
 * Phase D pipeline (gated on the pipeline env var, the same way the Steward
 * pipeline is gated in /api/ghl/signup). Media gets the role tag + routing only.
 *
 * Routing: enquiries are emailed to the team (benjamin@act.place) with the
 * submitter as reply-to, and the submitter gets a confirmation whose replies
 * route back to benjamin@act.place. Email only fires when EMAIL_ENABLED=true and
 * GHL is configured — a no-op in environments without live CRM.
 */

const TEAM_EMAIL = 'benjamin@act.place';
const TEAM_FROM = 'CONTAINED · A Curious Tractor <benjamin@act.place>';

type Role = 'funder' | 'partner' | 'media';

const ROLE_TAG: Record<Role, string> = {
  funder: GHL_CANONICAL.ROLE_FUNDER,
  partner: GHL_CANONICAL.ROLE_PARTNER,
  media: GHL_CANONICAL.ROLE_MEDIA,
};

// Funders and partners get a pipeline opportunity; media is tag + routing only.
const ROLE_PIPELINE: Record<Role, string | null> = {
  funder: GHL_PIPELINES.FUNDER,
  partner: GHL_PIPELINES.PARTNER,
  media: null,
};

const ROLE_STAGE: Record<Role, string> = {
  funder: process.env.GHL_FUNDER_STAGE_NEW || '',
  partner: process.env.GHL_PARTNER_STAGE_NEW || '',
  media: '',
};

// contact_submissions.category — reuse values the contact form already inserts.
const ROLE_CATEGORY: Record<Role, string> = {
  funder: 'partnership',
  partner: 'partnership',
  media: 'media',
};

const ROLE_LABEL: Record<Role, string> = {
  funder: 'Funder',
  partner: 'Partner',
  media: 'Media',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, name, email, organization, message, website } = body;

    // Honeypot — bots fill the hidden `website` field.
    if (website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!role || !['funder', 'partner', 'media'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const typedRole = role as Role;
    const cleanName = sanitizeInput(name, { maxLength: 200, allowNewlines: false });
    const cleanOrg = organization
      ? sanitizeInput(organization, { maxLength: 200, allowNewlines: false })
      : '';
    const cleanMessage = message ? sanitizeInput(message, { maxLength: 5000 }) : '';

    if (!cleanName) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Durable-first capture: write an append-only row BEFORE any GHL call so a
    // GHL failure can never lose the lead. This is the fail-loud spine.
    const supabase = createServiceClient();
    let captureId: string | null = null;
    try {
      const capture = await writeCaptureLog(supabase, {
        route: 'connect',
        email: cleanEmail,
        name: cleanName,
        role: typedRole,
        payload: { organization: cleanOrg, message: cleanMessage },
      });
      captureId = capture.captureId;
    } catch (captureErr) {
      console.error('[contained/connect] durable capture insert failed:', captureErr);
      return NextResponse.json(
        { error: 'We could not save your details. Please email ben@justicehub.com.au and we will reply directly.' },
        { status: 500 }
      );
    }

    // Persist to the shared inbox (best-effort — never fail capture if absent).
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('contact_submissions').insert({
        name: cleanName,
        email: cleanEmail,
        category: ROLE_CATEGORY[typedRole],
        subject: `[CONTAINED ${ROLE_LABEL[typedRole].toUpperCase()}] ${cleanOrg || cleanName}`,
        message: [
          `${ROLE_LABEL[typedRole]} enquiry via CONTAINED.`,
          cleanOrg ? `Organisation: ${cleanOrg}` : null,
          '',
          cleanMessage,
        ]
          .filter((line) => line !== null)
          .join('\n'),
        organization: cleanOrg || null,
        status: 'new',
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('[contained/connect] contact_submissions insert skipped:', dbErr);
    }

    // Canonical GHL capture: role: + CONTAINED source + gated opportunity.
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      const tags: string[] = [
        GHL_CANONICAL.PROJECT_JH,
        GHL_CANONICAL.SOURCE_EVENT_CONTAINED,
        GHL_CANONICAL.INTEREST_JUSTICE_REFORM,
        ROLE_TAG[typedRole],
      ];

      const contactId = await ghl.upsertContact({
        email: cleanEmail,
        name: cleanName,
        tags,
        source: `JusticeHub CONTAINED Connect (${ROLE_LABEL[typedRole]})`,
        customFields: {
          organization: cleanOrg,
          connect_role: typedRole,
          connect_message: cleanMessage,
        },
      });

      // Opportunity is gated on the Phase D pipeline env var for this role.
      const pipelineId = ROLE_PIPELINE[typedRole];
      if (contactId && pipelineId) {
        ghl
          .createOpportunity({
            pipelineId,
            pipelineStageId: ROLE_STAGE[typedRole],
            name: `${ROLE_LABEL[typedRole]}: ${cleanOrg || cleanName}`,
            contactId,
          })
          .catch((err) => console.error('[contained/connect] opportunity create failed:', err));
      }

      // Backfill the durable capture row with the GHL result.
      await backfillCaptureSync(supabase, captureId, {
        ghl_contact_id: contactId,
        ghl_synced: !!contactId,
      });
    }

    // AWAIT both sends before returning: no further awaited work follows, so a
    // fire-and-forget send would be frozen by the serverless runtime before the
    // GHL email call completes. Run concurrently; each swallows its own error so
    // the pair never rejects.
    await Promise.all([
    // Route the enquiry to the team — reply-to = submitter so they can respond
    // directly. (No-op unless EMAIL_ENABLED=true and GHL is configured.)
    sendEmail({
      to: TEAM_EMAIL,
      subject: `[CONTAINED] New ${ROLE_LABEL[typedRole]} enquiry: ${cleanOrg || cleanName}`,
      preheader: `${cleanName} reached out via the CONTAINED connect form.`,
      emailFrom: `${cleanName} <${cleanEmail}>`,
      body: `New ${ROLE_LABEL[typedRole]} enquiry via CONTAINED.

Name: ${cleanName}
Email: ${cleanEmail}
${cleanOrg ? `Organisation: ${cleanOrg}\n` : ''}Reply directly to: ${cleanEmail}

${cleanMessage || '(no message)'}`,
    }).catch((err) => console.error('[contained/connect] team notification failed:', err)),

    // Confirmation to the submitter — replies route to benjamin@act.place.
    sendEmail({
      to: cleanEmail,
      subject: 'Thanks for reaching out about CONTAINED',
      preheader: 'We will be in touch shortly.',
      emailFrom: TEAM_FROM,
      body: `Hi ${cleanName},

Thank you for reaching out about CONTAINED. We will be in touch shortly. If you need us sooner, just reply to this email.

CONTAINED tour: https://justicehub.com.au/contained
${typedRole === 'funder' ? 'Investment thesis: https://justicehub.com.au/for-funders\n' : ''}
— The JusticeHub Team`,
    }).catch((err) => console.error('[contained/connect] confirmation email failed:', err)),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Contained connect POST error:', error);
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }
}
