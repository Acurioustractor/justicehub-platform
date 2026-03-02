import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkOrgAccess } from '@/lib/org-hub/auth';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    const serviceClient = getServiceClient();
    const sb = supabase as any;
    const now = new Date();
    const items: any[] = [];

    // 1. Check compliance expiry
    const { data: docs } = await sb
      .from('org_compliance_docs')
      .select('*')
      .eq('organization_id', orgId);

    for (const doc of docs || []) {
      if (!doc.expiry_date) continue;
      const expiry = new Date(doc.expiry_date);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = doc.reminder_days || 30;

      if (daysUntil < 0) {
        items.push({
          organization_id: orgId,
          item_type: 'compliance',
          title: `EXPIRED: ${doc.title}`,
          description: `${doc.title} expired ${Math.abs(daysUntil)} days ago. Renew immediately.`,
          priority: 'urgent',
          due_date: doc.expiry_date,
          source_agent: 'pulse',
          link_to_table: 'org_compliance_docs',
          link_to_id: doc.id,
        });
      } else if (daysUntil <= reminderDays) {
        items.push({
          organization_id: orgId,
          item_type: 'compliance',
          title: `Expiring soon: ${doc.title}`,
          description: `${doc.title} expires in ${daysUntil} days (${doc.expiry_date}).`,
          priority: daysUntil <= 7 ? 'high' : 'medium',
          due_date: doc.expiry_date,
          source_agent: 'pulse',
          link_to_table: 'org_compliance_docs',
          link_to_id: doc.id,
        });
      }
    }

    // 2. Check overdue grant acquittals
    const { data: grants } = await sb
      .from('org_grants')
      .select('*')
      .eq('organization_id', orgId)
      .in('acquittal_status', ['pending', 'in_progress']);

    for (const grant of grants || []) {
      if (!grant.acquittal_due_date) continue;
      const due = new Date(grant.acquittal_due_date);
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        items.push({
          organization_id: orgId,
          item_type: 'reporting',
          title: `OVERDUE: ${grant.grant_name} acquittal`,
          description: `Acquittal for ${grant.grant_name} (${grant.funder_name}) was due ${Math.abs(daysUntil)} days ago.`,
          priority: 'urgent',
          due_date: grant.acquittal_due_date,
          source_agent: 'pulse',
          link_to_table: 'org_grants',
          link_to_id: grant.id,
        });
      } else if (daysUntil <= 30) {
        items.push({
          organization_id: orgId,
          item_type: 'reporting',
          title: `Acquittal due: ${grant.grant_name}`,
          description: `Acquittal for ${grant.grant_name} due in ${daysUntil} days.`,
          priority: daysUntil <= 7 ? 'high' : 'medium',
          due_date: grant.acquittal_due_date,
          source_agent: 'pulse',
          link_to_table: 'org_grants',
          link_to_id: grant.id,
        });
      }
    }

    // 3. Check session gaps (no sessions in last 14 days)
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { data: recentSessions } = await sb
      .from('org_sessions')
      .select('id')
      .eq('organization_id', orgId)
      .gte('session_date', twoWeeksAgo.toISOString().split('T')[0]);

    if (!recentSessions || recentSessions.length === 0) {
      items.push({
        organization_id: orgId,
        item_type: 'session',
        title: 'No sessions logged recently',
        description: 'No sessions have been logged in the past 14 days. Consider logging recent activities.',
        priority: 'low',
        source_agent: 'pulse',
      });
    }

    // 4. Check over-budget lines
    const { data: budgetLines } = await sb
      .from('org_grant_budget_lines')
      .select('*, org_grants(grant_name)')
      .eq('organization_id', orgId);

    for (const line of budgetLines || []) {
      if (line.budgeted_amount > 0 && line.actual_amount > line.budgeted_amount) {
        const overBy = ((line.actual_amount - line.budgeted_amount) / line.budgeted_amount * 100).toFixed(0);
        items.push({
          organization_id: orgId,
          item_type: 'grant',
          title: `Over budget: ${line.category}`,
          description: `${line.category} is ${overBy}% over budget ($${line.actual_amount} vs $${line.budgeted_amount}).`,
          priority: 'high',
          source_agent: 'pulse',
          link_to_table: 'org_grant_budget_lines',
          link_to_id: line.id,
        });
      }
    }

    // Clear old pulse items before inserting new ones
    await serviceClient
      .from('org_action_items')
      .delete()
      .eq('organization_id', orgId)
      .eq('source_agent', 'pulse')
      .in('status', ['open']);

    // Insert new items
    if (items.length > 0) {
      const { error } = await serviceClient.from('org_action_items').insert(items);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, itemsCreated: items.length, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
