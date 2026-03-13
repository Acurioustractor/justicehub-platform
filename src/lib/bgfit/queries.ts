import { createServiceClient } from '@/lib/supabase/service-lite';
import type {
  BGFitGrantHealth,
  BGFitDeadline,
  BGFitBudgetVsActual,
  BGFitBudgetItem,
  BGFitDashboardSummary,
} from './types';

export async function getGrantHealthByOrg(orgId: string): Promise<BGFitGrantHealth[]> {
  const supabase = createServiceClient();

  // Get grant IDs for this org first (base table is always in sync)
  const { data: orgGrants } = await supabase
    .from('bgfit_grants')
    .select('id')
    .eq('organization_id', orgId);

  if (!orgGrants?.length) return [];

  const grantIds = orgGrants.map((g: { id: string }) => g.id);
  const { data, error } = await supabase
    .from('v_bgfit_grant_health')
    .select('*')
    .in('id', grantIds)
    .order('grant_name');

  if (error) {
    console.error('Error fetching grant health:', error);
    return [];
  }
  // Attach org_id since the view might not expose it yet (PostgREST schema cache)
  return (data ?? []).map((g: Record<string, unknown>) => ({
    ...g,
    organization_id: orgId,
  })) as BGFitGrantHealth[];
}

export async function getUpcomingDeadlines(orgId: string): Promise<BGFitDeadline[]> {
  const supabase = createServiceClient();
  // Join through bgfit_grants to filter by org
  const { data, error } = await supabase
    .from('v_bgfit_upcoming_deadlines')
    .select('*')
    .order('due_date');

  if (error) {
    console.error('Error fetching deadlines:', error);
    return [];
  }

  // Filter by org via grant_id relationship (view doesn't have org_id directly)
  // Get org's grant IDs first
  const { data: grants } = await supabase
    .from('bgfit_grants')
    .select('id')
    .eq('organization_id', orgId);

  const grantIds = new Set((grants ?? []).map((g: { id: string }) => g.id));
  return ((data ?? []) as BGFitDeadline[]).filter(
    (d) => d.grant_id === null || grantIds.has(d.grant_id)
  );
}

export async function getBudgetVsActualByGrant(grantId: string): Promise<BGFitBudgetVsActual[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('v_bgfit_budget_vs_actual')
    .select('*')
    .eq('grant_id', grantId)
    .order('category')
    .order('item_name');

  if (error) {
    console.error('Error fetching budget vs actual:', error);
    return [];
  }
  return (data ?? []) as BGFitBudgetVsActual[];
}

export async function getFlaggedIssues(orgId: string): Promise<BGFitBudgetItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('bgfit_budget_items')
    .select('*, bgfit_grants!inner(organization_id, grant_name)')
    .eq('bgfit_grants.organization_id', orgId)
    .eq('has_issue', true)
    .order('issue_severity');

  if (error) {
    console.error('Error fetching flagged issues:', error);
    return [];
  }
  return (data ?? []) as BGFitBudgetItem[];
}

export async function getThisWeekSummary(orgId: string): Promise<BGFitDashboardSummary> {
  const [grantHealth, deadlines, flaggedIssues] = await Promise.all([
    getGrantHealthByOrg(orgId),
    getUpcomingDeadlines(orgId),
    getFlaggedIssues(orgId),
  ]);

  const activeGrants = grantHealth.filter((g) => g.status === 'active').length;
  const totalSpent = grantHealth.reduce((sum, g) => sum + Number(g.total_spent), 0);
  const totalBudget = grantHealth.reduce((sum, g) => sum + Number(g.approved_amount), 0);

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deadlinesDueThisWeek = deadlines.filter((d) => {
    const due = new Date(d.due_date);
    return due <= weekFromNow && d.urgency !== 'done';
  }).length;

  return {
    activeGrants,
    totalSpent,
    totalBudget,
    deadlinesDueThisWeek,
    flaggedIssues,
    upcomingDeadlines: deadlines.filter((d) => d.urgency !== 'done').slice(0, 10),
    grantHealth,
  };
}
