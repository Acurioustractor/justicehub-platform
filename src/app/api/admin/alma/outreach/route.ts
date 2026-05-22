import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

const VALID_KINDS = ['email', 'linkedin', 'phone', 'basecamp_referral', 'manual_note'] as const;
const VALID_RESPONSE = [
  'sent',
  'no_response',
  'responded',
  'claimed',
  'declined',
  'bounced',
  'requires_cultural_referral',
] as const;

interface CreateBody {
  organization_id: string;
  attempt_kind: string;
  email_to?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
  notes?: string | null;
  response_status?: string;
  claim_token?: string | null;
}

interface UpdateBody {
  id: string;
  response_status: string;
  notes?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as CreateBody;
    if (!body.organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
    }
    if (!VALID_KINDS.includes(body.attempt_kind as any)) {
      return NextResponse.json(
        { error: `attempt_kind must be one of: ${VALID_KINDS.join(', ')}` },
        { status: 400 }
      );
    }
    const response_status = body.response_status || 'sent';
    if (!VALID_RESPONSE.includes(response_status as any)) {
      return NextResponse.json(
        { error: `response_status must be one of: ${VALID_RESPONSE.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const row = {
      organization_id: body.organization_id,
      attempt_kind: body.attempt_kind,
      sent_by: admin.user.id,
      sent_at: now,
      email_to: body.email_to || null,
      email_subject: body.email_subject || null,
      email_body: body.email_body || null,
      claim_token: body.claim_token || null,
      response_status,
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from('organization_outreach_log')
      .insert(row)
      .select('id, organization_id, attempt_kind, response_status, sent_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, outreach: data });
  } catch (e: any) {
    console.error('[outreach POST]', e);
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 });
  }
}

// Update an existing outreach row — used when admin marks "they responded"
// or "bounced" etc. days after sending.
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as UpdateBody;
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (!VALID_RESPONSE.includes(body.response_status as any)) {
      return NextResponse.json(
        { error: `response_status must be one of: ${VALID_RESPONSE.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const updatePayload: Record<string, unknown> = {
      response_status: body.response_status,
      updated_at: new Date().toISOString(),
    };
    if (body.notes !== undefined) updatePayload.notes = body.notes;
    if (body.response_status === 'responded' || body.response_status === 'claimed') {
      updatePayload.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('organization_outreach_log')
      .update(updatePayload)
      .eq('id', body.id)
      .select('id, response_status, responded_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, outreach: data });
  } catch (e: any) {
    console.error('[outreach PATCH]', e);
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 });
  }
}
