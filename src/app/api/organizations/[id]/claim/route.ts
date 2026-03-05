import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput, sanitizeEmail } from '@/lib/security';

const ALLOWED_ROLES = ['founder', 'ceo', 'manager', 'staff', 'board', 'volunteer'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ABN_REGEX = /^\d{11}$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    if (!UUID_REGEX.test(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contact_name, contact_email, role_at_org, message, abn } = body;

    // Validate required fields
    if (!contact_name || !contact_email || !role_at_org) {
      return NextResponse.json(
        { error: 'contact_name, contact_email, and role_at_org are required' },
        { status: 400 }
      );
    }

    // Sanitize
    const sanitizedName = sanitizeInput(String(contact_name), { maxLength: 200, allowNewlines: false });
    const sanitizedEmail = sanitizeEmail(String(contact_email));
    if (!sanitizedEmail) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sanitizedRole = String(role_at_org).toLowerCase();
    if (!ALLOWED_ROLES.includes(sanitizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const sanitizedMessage = message
      ? sanitizeInput(String(message), { maxLength: 2000, allowNewlines: true })
      : null;

    const sanitizedAbn = abn ? String(abn).replace(/\s/g, '') : null;
    if (sanitizedAbn && !ABN_REGEX.test(sanitizedAbn)) {
      return NextResponse.json({ error: 'ABN must be 11 digits' }, { status: 400 });
    }

    // Check org exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Insert claim (table not yet in generated types)
    const { data: claim, error: insertError } = await (supabase as any)
      .from('organization_claims')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        contact_name: sanitizedName,
        contact_email: sanitizedEmail,
        role_at_org: sanitizedRole,
        message: sanitizedMessage,
        abn: sanitizedAbn,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted a claim for this organization.' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // Notify admin via agent_task_queue
    const now = new Date().toISOString();
    await supabase.from('agent_task_queue').insert({
      source: 'org_claims',
      source_id: `claim:${claim.id}`,
      task_type: 'org_claim_review',
      title: `Organization claim: ${org.name}`,
      description: `${sanitizedName} (${sanitizedRole}) wants to claim ${org.name}`,
      status: 'pending',
      priority: 2,
      needs_review: true,
      output: {
        claim_id: claim.id,
        organization_id: organizationId,
        organization_name: org.name,
        contact_name: sanitizedName,
        contact_email: sanitizedEmail,
        role_at_org: sanitizedRole,
        abn: sanitizedAbn,
        generated_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Claim submitted successfully. Pending review.',
      claim,
    });
  } catch (error) {
    console.error('Error submitting org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    if (!UUID_REGEX.test(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ claim: null });
    }

    const { data: claim } = await (supabase as any)
      .from('organization_claims')
      .select('id, status, created_at')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ claim: claim || null });
  } catch (error) {
    console.error('Error checking org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
