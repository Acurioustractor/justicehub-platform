import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrgAccess } from '@/lib/org-hub/auth';

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

    // Fetch all summary data in parallel
    const sb = supabase as any;
    const [
      grantsRes,
      complianceRes,
      sessionsRes,
      actionItemsRes,
      budgetLinesRes,
      transactionsRes,
    ] = await Promise.all([
      sb.from('org_grants').select('id, grant_name, amount_awarded, acquittal_status, acquittal_due_date, contract_end').eq('organization_id', orgId),
      sb.from('org_compliance_docs').select('id, title, category, status, expiry_date').eq('organization_id', orgId),
      sb.from('org_sessions').select('id, session_date, participant_count, program_name').eq('organization_id', orgId).gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      sb.from('org_action_items').select('id, title, item_type, priority, status, due_date').eq('organization_id', orgId).in('status', ['open', 'in_progress']),
      sb.from('org_grant_budget_lines').select('id, grant_id, budgeted_amount, actual_amount').eq('organization_id', orgId),
      sb.from('org_grant_transactions').select('id, grant_id, amount, transaction_type').eq('organization_id', orgId),
    ]);

    const grants = grantsRes.data || [];
    const compliance = complianceRes.data || [];
    const sessions = sessionsRes.data || [];
    const actionItems = actionItemsRes.data || [];
    const budgetLines = budgetLinesRes.data || [];

    // Compute summaries
    const totalAwarded = grants.reduce((sum: number, g: any) => sum + (Number(g.amount_awarded) || 0), 0);
    const totalBudgeted = budgetLines.reduce((sum: number, b: any) => sum + (Number(b.budgeted_amount) || 0), 0);
    const totalActual = budgetLines.reduce((sum: number, b: any) => sum + (Number(b.actual_amount) || 0), 0);

    const complianceByStatus = compliance.reduce((acc: any, doc: any) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});

    const actionsByPriority = actionItems.reduce((acc: any, item: any) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {});

    const sessionsThisMonth = sessions.length;
    const participantsThisMonth = sessions.reduce((sum: number, s: any) => sum + (s.participant_count || 0), 0);

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingDeadlines = [
      ...grants
        .filter((g: any) => g.acquittal_due_date && new Date(g.acquittal_due_date) <= thirtyDaysFromNow)
        .map((g: any) => ({ type: 'grant_acquittal', title: g.grant_name, date: g.acquittal_due_date, id: g.id })),
      ...compliance
        .filter((d: any) => d.expiry_date && new Date(d.expiry_date) <= thirtyDaysFromNow)
        .map((d: any) => ({ type: 'compliance_expiry', title: d.title, date: d.expiry_date, id: d.id })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      grants: { count: grants.length, totalAwarded },
      compliance: { total: compliance.length, byStatus: complianceByStatus },
      sessions: { thisMonth: sessionsThisMonth, participantsThisMonth },
      actionItems: { open: actionItems.length, byPriority: actionsByPriority },
      budget: { totalBudgeted, totalActual, burnRate: totalBudgeted > 0 ? (totalActual / totalBudgeted * 100).toFixed(1) : '0' },
      upcomingDeadlines,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
