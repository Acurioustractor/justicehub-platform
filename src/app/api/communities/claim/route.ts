/**
 * POST /api/communities/claim
 *
 * One-click claim flow for a community action-profile. The contact behind a
 * community-controlled organisation tells us they want to become the editor of
 * record for their profile. They land in GHL under the canonical tag contract
 * with a per-org interest tag, and a human follows up to confirm. Nothing on
 * the profile changes from this form alone: claiming is confirmed by talking to
 * the organisation, not by an automated check.
 *
 * Submitting the form IS the consent being captured for this contact. No
 * newsletter (comms:) tag is granted here.
 */

import { NextResponse } from 'next/server';
import { getGHLClient, GHL_CANONICAL } from '@/lib/ghl/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PayloadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  role_in_org: z.string().min(2).max(80),
  org_slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  org_name: z.string().min(2).max(200),
  hp: z.string().max(500).optional(), // honeypot
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid submission' }, { status: 400 });
  }
  const p = parsed.data;
  if (p.hp) {
    return NextResponse.json({ success: true }); // honeypot tripped — discard silently
  }

  try {
    const ghl = getGHLClient();
    if (!ghl.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Claiming is not available right now' },
        { status: 503 }
      );
    }
    const contactId = await ghl.upsertContact({
      email: p.email,
      name: p.name,
      source: 'communities-profile-claim',
      tags: [
        GHL_CANONICAL.PROJECT_JH,
        GHL_CANONICAL.SOURCE_WEBSITE,
        GHL_CANONICAL.ROLE_PARTNER,
        GHL_CANONICAL.INTEREST_PROFILE_CLAIM,
        `interest:claim-${p.org_slug}`,
      ],
      customFields: {
        role_in_org: p.role_in_org,
        claimed_org: p.org_name,
      },
    });
    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Could not save your claim' },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('communities claim: GHL upsert failed', e);
    return NextResponse.json(
      { success: false, error: 'Could not save your claim' },
      { status: 502 }
    );
  }
}
