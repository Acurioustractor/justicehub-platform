/**
 * POST /api/justice-matrix/contribute
 *
 * Public partner-contribution endpoint. Anyone can submit a candidate case or
 * campaign for review; nothing publishes to the live matrix without an admin
 * approving it from the discoveries queue.
 *
 * Validated with Zod. Inserted into justice_matrix_discovered with
 * source='partner_contribution' and raw_data containing contributor
 * provenance. The existing review UI surfaces this alongside scanner items.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_CANONICAL } from '@/lib/ghl/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PayloadSchema = z.object({
  contributor_name: z.string().min(2).max(120),
  contributor_email: z.string().email().max(200),
  contributor_org: z.string().max(200).optional().or(z.literal('')),
  item_type: z.enum(['case', 'campaign']),
  title: z.string().min(4).max(400),
  jurisdiction_or_region: z.string().max(200).optional().or(z.literal('')),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  summary: z.string().min(20).max(4000),
  link: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  // Minimal honeypot field: real submitters never see it, naive bots fill
  // every input. Schema accepts anything; the handler silently swallows
  // non-empty submissions below.
  hp: z.string().max(500).optional(),
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
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid submission',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 5),
      },
      { status: 400 },
    );
  }

  const p = parsed.data;
  if (p.hp) {
    // Honeypot tripped — silently accept and discard.
    return NextResponse.json({ success: true, queued: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { error } = await supabase.from('justice_matrix_discovered').insert({
    source_id: null,
    source_url: p.link || `mailto:${p.contributor_email}`,
    item_type: p.item_type,
    raw_data: {
      contributor: {
        name: p.contributor_name,
        email: p.contributor_email,
        org: p.contributor_org || null,
      },
      notes: p.notes || null,
      submitted_at: new Date().toISOString(),
      submitted_via: 'partner_contribute_form',
    },
    extracted_title: p.title,
    extracted_jurisdiction: p.jurisdiction_or_region || null,
    extracted_year: p.year ?? null,
    extracted_summary: p.summary,
    extraction_confidence: null,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Best-effort CRM upsert so the contributor gets a confirmation and a
  // published/declined notice (GHL workflow keyed on interest:justice-matrix).
  // Canonical tag contract only; no comms: tag — no newsletter consent was
  // captured here. Never blocks the submission.
  try {
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      await ghl.upsertContact({
        email: p.contributor_email,
        name: p.contributor_name,
        source: 'justice-matrix-contribute',
        tags: [
          GHL_CANONICAL.PROJECT_JH,
          GHL_CANONICAL.SOURCE_WEBSITE,
          GHL_CANONICAL.ROLE_PARTNER,
          GHL_CANONICAL.INTEREST_JUSTICE_MATRIX,
        ],
      });
    }
  } catch (e) {
    console.error('justice-matrix contribute: GHL upsert failed (non-blocking)', e);
  }

  return NextResponse.json({ success: true });
}
