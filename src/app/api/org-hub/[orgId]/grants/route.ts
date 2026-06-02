import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function asDate(value: unknown) {
  const text = asText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const grantName = asText(body.grant_name);
    const funderName = asText(body.funder_name);
    const approvedAmount = asMoney(body.approved_amount);
    const acquittalDue = asDate(body.acquittal_due);

    if (!grantName) {
      return NextResponse.json({ error: 'Grant name is required' }, { status: 400 });
    }

    if (!funderName) {
      return NextResponse.json({ error: 'Funder name is required' }, { status: 400 });
    }

    if (approvedAmount === null) {
      return NextResponse.json({ error: 'Approved amount must be zero or more' }, { status: 400 });
    }

    const serviceClient = createServiceClient() as any;
    const requirements = asText(body.reporting_requirements);
    const reportingFrequency = asText(body.reporting_frequency);
    const notes = [
      requirements ? `Reporting requirements: ${requirements}` : null,
      reportingFrequency ? `Reporting frequency: ${reportingFrequency}` : null,
      asText(body.notes) || null,
    ].filter(Boolean).join('\n\n') || 'Created from organization hub.';

    const { data: grant, error } = await serviceClient
      .from('org_grants')
      .insert({
        organization_id: orgId,
        grant_name: grantName,
        funder_name: funderName,
        amount_awarded: approvedAmount,
        approved_amount: approvedAmount,
        contract_start: asDate(body.start_date),
        contract_end: asDate(body.end_date),
        acquittal_due_date: acquittalDue,
        status: asText(body.status) || 'draft',
        reporting_system: reportingFrequency || null,
        notes,
      })
      .select('id, grant_name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (grant?.id && acquittalDue) {
      await serviceClient
        .from('org_deadlines')
        .insert({
          organization_id: orgId,
          grant_id: grant.id,
          deadline_type: 'acquittal',
          title: `${grantName} acquittal`,
          due_date: acquittalDue,
          status: 'pending',
          requirements: requirements || 'Confirm acquittal requirements with the funding agreement.',
          reminder_days_before: 14,
        });
    }

    return NextResponse.json({ data: grant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
