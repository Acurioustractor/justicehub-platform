/**
 * POST /api/justice-matrix/follow
 *
 * Follow an issue: the lightest version of the partner portal. One email
 * field on an issue page; the contact lands in GHL under the canonical tag
 * contract with a per-issue interest tag, and issue-update sends run as
 * GHL workflows keyed on those tags (configured GHL-side).
 *
 * Submitting the form IS the consent being captured: the page copy says
 * exactly what will be sent (updates about this issue). No comms: newsletter
 * tag is granted here — that is a separate consent.
 */

import { NextResponse } from 'next/server';
import { getGHLClient, GHL_CANONICAL } from '@/lib/ghl/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PayloadSchema = z.object({
  email: z.string().email().max(200),
  issue_slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  issue_title: z.string().max(200).optional(),
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
      return NextResponse.json({ success: false, error: 'Follow is not available right now' }, { status: 503 });
    }
    const contactId = await ghl.upsertContact({
      email: p.email,
      source: 'justice-matrix-follow',
      tags: [
        GHL_CANONICAL.PROJECT_JH,
        GHL_CANONICAL.SOURCE_WEBSITE,
        GHL_CANONICAL.INTEREST_JUSTICE_MATRIX,
        `interest:jm-${p.issue_slug}`,
      ],
    });
    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Could not save your follow' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('justice-matrix follow: GHL upsert failed', e);
    return NextResponse.json({ success: false, error: 'Could not save your follow' }, { status: 502 });
  }
}
