import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

const SECTION_TABLES: Record<string, string> = {
  grants: 'org_grants',
  budget_lines: 'org_grant_budget_lines',
  grant_budget_lines: 'org_grant_budget_lines',
  transactions: 'org_grant_transactions',
  grant_transactions: 'org_grant_transactions',
  compliance: 'org_compliance_docs',
  sessions: 'org_sessions',
  participants: 'org_participants',
  referrals: 'org_referrals',
  milestones: 'org_milestones',
  action_items: 'org_action_items',
  contact_messages: 'contact_submissions',
};

function getServiceClient() {
  return createServiceClient();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    if (!section || !SECTION_TABLES[section]) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    const tableName = SECTION_TABLES[section];

    // contact_submissions has admin-only RLS; use service client since access is already verified
    const queryClient = section === 'contact_messages' ? getServiceClient() : supabase;
    let query = (queryClient as any).from(tableName).select('*').eq('organization_id', orgId);

    // Default ordering
    if (['grants', 'sessions'].includes(section)) {
      query = query.order('created_at', { ascending: false });
    } else if (section === 'transactions') {
      query = query.order('transaction_date', { ascending: false });
    } else if (section === 'action_items') {
      query = query.order('priority', { ascending: true }).order('due_date', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
    if (!await checkOrgAccess(supabase, user.id, orgId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const { section, action, data, id } = body;

    if (!section || !SECTION_TABLES[section]) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const tableName = SECTION_TABLES[section];

    if (action === 'create') {
      const { data: result, error } = await serviceClient
        .from(tableName)
        .insert({ organization_id: orgId, ...data })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID required for update' }, { status: 400 });
      const { data: result, error } = await serviceClient
        .from(tableName)
        .update(data)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID required for delete' }, { status: 400 });
      const { error } = await serviceClient
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
