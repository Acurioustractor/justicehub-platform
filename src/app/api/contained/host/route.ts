import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_CANONICAL, GHL_PIPELINES, STATE_TO_PLACE } from '@/lib/ghl/client';
import { sanitizeInput, sanitizeEmail } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';

/**
 * POST /api/contained/host
 *
 * GAP #18 — "Host the Container" capture.
 *
 * A host is a venue / festival / community partner offering to bring CONTAINED
 * to their region. Under the canonical one-account GHL contract (R4) they are
 * tagged role:partner (RC1), with the CONTAINED campaign source and a place:
 * tag for regional segmentation. When the Phase D partner pipeline env vars are
 * present, the host is also created as a GHL opportunity — gated exactly like
 * the Steward pipeline in /api/ghl/signup so no opportunity is attempted until
 * the pipeline exists. No live GHL writes happen unless GHL is configured.
 *
 * (The "Back the Tour" / role:supporter half of this gap reuses the already
 * canonical /api/projects/[slug]/backers route — only the host half is new.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, state, venue_type, message, website } = body;

    // Honeypot — bots fill the hidden `website` field.
    if (website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const cleanName = sanitizeInput(name, { maxLength: 200, allowNewlines: false });
    const cleanOrg = organization
      ? sanitizeInput(organization, { maxLength: 200, allowNewlines: false })
      : '';
    const cleanVenue = venue_type
      ? sanitizeInput(venue_type, { maxLength: 200, allowNewlines: false })
      : '';
    const cleanMessage = message ? sanitizeInput(message, { maxLength: 5000 }) : '';
    const cleanState =
      typeof state === 'string' && STATE_TO_PLACE[state.trim().toUpperCase()]
        ? state.trim().toUpperCase()
        : '';

    if (!cleanName) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Persist to the shared inbox (best-effort — never fail capture if absent).
    try {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('contact_submissions').insert({
        name: cleanName,
        email: cleanEmail,
        category: 'partnership',
        subject: `[CONTAINED HOST] ${cleanOrg || cleanName}${cleanState ? ` · ${cleanState}` : ''}`,
        message: [
          'Host the Container enquiry.',
          cleanOrg ? `Organisation: ${cleanOrg}` : null,
          cleanState ? `State: ${cleanState}` : null,
          cleanVenue ? `Venue / space: ${cleanVenue}` : null,
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
      // Table missing or insert failed — capture still proceeds via GHL.
      console.error('[contained/host] contact_submissions insert skipped:', dbErr);
    }

    // Canonical GHL capture: role:partner + CONTAINED source + gated opportunity.
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      const tags: string[] = [
        GHL_CANONICAL.PROJECT_JH,
        GHL_CANONICAL.SOURCE_EVENT_CONTAINED,
        GHL_CANONICAL.INTEREST_JUSTICE_REFORM,
        GHL_CANONICAL.ROLE_PARTNER,
      ];
      if (cleanState) {
        const placeTag = STATE_TO_PLACE[cleanState];
        if (placeTag) tags.push(placeTag);
      }

      const contactId = await ghl.upsertContact({
        email: cleanEmail,
        name: cleanName,
        tags,
        source: 'JusticeHub CONTAINED Host Form',
        customFields: {
          organization: cleanOrg,
          host_state: cleanState,
          host_venue_type: cleanVenue,
          host_message: cleanMessage,
        },
      });

      // Opportunity is gated on the Phase D partner pipeline env vars, the same
      // way is_steward gates the Steward opportunity in /api/ghl/signup.
      if (contactId && GHL_PIPELINES.PARTNER) {
        ghl
          .createOpportunity({
            pipelineId: GHL_PIPELINES.PARTNER,
            pipelineStageId: process.env.GHL_PARTNER_STAGE_NEW || '',
            name: `Host: ${cleanOrg || cleanName}`,
            contactId,
          })
          .catch((err) => console.error('[contained/host] opportunity create failed:', err));
      }
    }

    // Thank-you confirmation (fire-and-forget).
    sendEmail({
      to: cleanEmail,
      subject: 'Thanks for offering to host CONTAINED',
      preheader: 'We will be in touch about bringing the container to your area.',
      body: `Hi ${cleanName},

Thank you for offering to host CONTAINED. We will be in touch about what it takes to bring the container to your area.

In the meantime:

CONTAINED tour: https://justicehub.com.au/contained
How it works: https://justicehub.com.au/contained/how-it-works

— The JusticeHub Team`,
    }).catch((err) => console.error('[contained/host] confirmation email failed:', err));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Contained host POST error:', error);
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }
}
