import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl/client';
import { allSequences } from '@/content/newsletter-sequences';

/**
 * POST /api/ghl/trigger-sequence
 *
 * Triggers a GHL workflow for a contact by sequence name.
 * Requires: { sequence_id, contact_id, workflow_id }
 *
 * The sequence_id maps to our content (for reference/logging).
 * The workflow_id is the GHL workflow that handles scheduling.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence_id, contact_id, workflow_id } = body;

    if (!sequence_id || !contact_id || !workflow_id) {
      return NextResponse.json(
        { error: 'sequence_id, contact_id, and workflow_id are required' },
        { status: 400 }
      );
    }

    // Validate sequence exists in our content
    const sequence = allSequences[sequence_id];
    if (!sequence) {
      return NextResponse.json(
        { error: `Unknown sequence: ${sequence_id}. Available: ${Object.keys(allSequences).join(', ')}` },
        { status: 400 }
      );
    }

    const ghl = getGHLClient();
    if (!ghl.isConfigured()) {
      return NextResponse.json(
        { error: 'GHL not configured', triggered: false },
        { status: 200 }
      );
    }

    const success = await ghl.addToWorkflow(contact_id, workflow_id);

    return NextResponse.json({
      triggered: success,
      sequence: sequence.name,
      email_count: sequence.emails.length,
    });
  } catch (error: any) {
    console.error('GHL trigger-sequence error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ghl/trigger-sequence
 *
 * Returns available sequences and their email content (for admin reference).
 */
export async function GET() {
  const sequences = Object.values(allSequences).map(seq => ({
    id: seq.id,
    name: seq.name,
    trigger: seq.trigger,
    email_count: seq.emails.length,
    emails: seq.emails.map(e => ({
      id: e.id,
      subject: e.subject,
      preheader: e.preheader,
      delayDays: e.delayDays,
    })),
  }));

  return NextResponse.json({ sequences });
}
