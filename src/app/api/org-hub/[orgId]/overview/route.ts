import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { getFundingOrganizationWorkspaceDetail } from '@/lib/funding/funding-operating-system';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getEmpathyLedgerClient() {
  const url = process.env.EMPATHY_LEDGER_URL;
  const key = process.env.EMPATHY_LEDGER_API_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
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

    const sb = supabase as any;
    const serviceClient = createServiceClient();

    // Fetch all summary data in parallel
    const [
      grantsRes,
      complianceRes,
      sessionsRes,
      actionItemsRes,
      budgetLinesRes,
      transactionsRes,
      peopleProfilesRes,
      orgProfilesRes,
      programsRes,
      articlesRes,
      orgRes,
      fundingWorkspace,
    ] = await Promise.all([
      sb.from('org_grants').select('id, grant_name, amount_awarded, acquittal_status, acquittal_due_date, contract_end').eq('organization_id', orgId),
      sb.from('org_compliance_docs').select('id, title, category, status, expiry_date').eq('organization_id', orgId),
      sb.from('org_sessions').select('id, session_date, participant_count, program_name').eq('organization_id', orgId).gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      sb.from('org_action_items').select('id, title, item_type, priority, status, due_date').eq('organization_id', orgId).in('status', ['open', 'in_progress']),
      sb.from('org_grant_budget_lines').select('id, grant_id, budgeted_amount, actual_amount').eq('organization_id', orgId),
      sb.from('org_grant_transactions').select('id, grant_id, amount, transaction_type').eq('organization_id', orgId),
      sb.from('community_programs_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      sb.from('organizations_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      sb.from('community_programs').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      sb.from('articles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      serviceClient.from('organizations').select('empathy_ledger_org_id, name').eq('id', orgId).single(),
      getFundingOrganizationWorkspaceDetail(orgId).catch(() => null),
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

    // People count: union of community_programs_profiles + organizations_profiles
    const peopleCount = (peopleProfilesRes.count || 0) + (orgProfilesRes.count || 0);

    // Empathy Ledger summary
    let empathyLedger = null;
    const elOrgId = orgRes.data?.empathy_ledger_org_id;
    if (elOrgId) {
      const elClient = getEmpathyLedgerClient();
      if (elClient) {
        const [storiesCount, storytellersRes] = await Promise.all([
          elClient.from('stories').select('id', { count: 'exact', head: true }).eq('organization_id', elOrgId),
          elClient.from('stories').select('storyteller_id').eq('organization_id', elOrgId),
        ]);
        const uniqueStorytellers = new Set((storytellersRes.data || []).map((s: any) => s.storyteller_id).filter(Boolean));
        empathyLedger = {
          linked: true,
          storyCount: storiesCount.count || 0,
          storytellerCount: uniqueStorytellers.size,
          orgName: orgRes.data?.name || '',
        };
      }
    }

    // Funding workspace data
    let funding = null;
    if (fundingWorkspace) {
      const ws = fundingWorkspace as any;
      funding = {
        readinessScore: ws.fundingReadinessScore || 0,
        trustScore: ws.communityTrustScore || 0,
        deliveryScore: ws.deliveryConfidenceScore || 0,
        complianceScore: ws.complianceReadinessScore || 0,
        evidenceScore: ws.evidenceMaturityScore || 0,
        checklist: ws.profileChecklist || [],
        nextActions: ws.nextActions || [],
        topMatches: (ws.topMatches || []).slice(0, 3).map((m: any) => ({
          id: m.id,
          name: m.opportunity?.name || 'Funding opportunity',
          matchScore: m.matchScore,
          funder: m.opportunity?.funder_name || '',
          deadline: m.opportunity?.deadline || null,
          maxAmount: m.opportunity?.max_grant_amount || null,
        })),
        applications: (ws.applications || []).map((a: any) => ({
          id: a.id,
          name: a.opportunity?.name || 'Application',
          status: a.status,
          amountRequested: a.amountRequested,
          amountAwarded: a.amountAwarded,
        })),
        commitments: (ws.commitments || []).map((c: any) => ({
          id: c.id,
          name: c.outcomeDefinition?.name || c.outcome_definition?.name || 'Outcome',
          status: c.commitment_status || c.status || 'active',
          baseline: c.baseline_value ?? null,
          current: c.current_value ?? null,
          target: c.target_value ?? null,
        })),
        supportNeeds: [] as string[],
        organizationId: ws.organizationId || orgId,
      };

      // Compute support needs
      if (ws.deliveryConfidenceScore < 70) {
        funding.supportNeeds.push(`Strengthen delivery confidence (${ws.deliveryConfidenceScore}) with clearer program scope, staffing, or operational backing.`);
      }
      if (ws.complianceReadinessScore < 70) {
        funding.supportNeeds.push(`Lift compliance readiness (${ws.complianceReadinessScore}) before treating this as fully submission-ready.`);
      }
      if (ws.evidenceMaturityScore < 70) {
        funding.supportNeeds.push(`Tighten the evidence case (${ws.evidenceMaturityScore}) with stronger outcomes, proof points, and measurable commitments.`);
      }
    }

    return NextResponse.json({
      grants: { count: grants.length, totalAwarded },
      compliance: { total: compliance.length, byStatus: complianceByStatus },
      sessions: { thisMonth: sessionsThisMonth, participantsThisMonth },
      actionItems: { open: actionItems.length, byPriority: actionsByPriority, items: actionItems },
      budget: { totalBudgeted, totalActual, burnRate: totalBudgeted > 0 ? (totalActual / totalBudgeted * 100).toFixed(1) : '0' },
      upcomingDeadlines,
      people: { count: peopleCount },
      programs: { count: programsRes.count || 0 },
      stories: { count: articlesRes.count || 0 },
      funding,
      empathyLedger,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
