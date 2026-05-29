import { createServiceClient } from '@/lib/supabase/service-lite';
import type {
  BGFitGrantHealth,
  BGFitDeadline,
  BGFitBudgetVsActual,
  BGFitBudgetItem,
  BGFitDashboardSummary,
} from './types';

type OrgGrantRow = {
  id: string;
  organization_id: string;
  grant_name: string;
  funder_name: string;
  amount_awarded: number | string | null;
  approved_amount: number | string | null;
  contract_start: string | null;
  contract_end: string | null;
  acquittal_due_date: string | null;
  status: string | null;
};

type OrgBudgetLineRow = {
  id: string;
  grant_id: string;
  category: string | null;
  description: string | null;
  budgeted_amount: number | string | null;
  actual_amount: number | string | null;
  has_issue: boolean | null;
  issue_severity: string | null;
  issue_notes: string | null;
};

type OrgDeadlineRow = {
  id: string;
  organization_id: string;
  grant_id: string | null;
  deadline_type: string | null;
  title: string;
  due_date: string;
  status: string | null;
  submitted_date: string | null;
  requirements: string | null;
  document_url: string | null;
  reminder_days_before: number | null;
  org_grants?:
    | {
        grant_name: string | null;
        funder_name: string | null;
      }
    | Array<{
        grant_name: string | null;
        funder_name: string | null;
      }>
    | null;
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysUntil(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function deadlineUrgency(status: string | null, dueDate: string): BGFitDeadline['urgency'] {
  if (status === 'completed' || status === 'submitted' || status === 'complete') return 'done';
  const days = daysUntil(dueDate);
  if (days === null) return 'upcoming';
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'soon';
  return 'upcoming';
}

function deadlineStatus(status: string | null): BGFitDeadline['status'] {
  if (status === 'completed' || status === 'complete') return 'complete';
  if (status === 'submitted') return 'submitted';
  if (status === 'overdue') return 'overdue';
  if (status === 'in_progress') return 'in_progress';
  return 'upcoming';
}

function relatedGrant(deadline: OrgDeadlineRow) {
  return Array.isArray(deadline.org_grants)
    ? deadline.org_grants[0] || null
    : deadline.org_grants || null;
}

function budgetStatus(budgeted: number, actual: number): BGFitBudgetVsActual['calculated_status'] {
  if (actual <= 0) return 'not_spent';
  if (actual > budgeted) return 'overspent';
  if (budgeted > 0 && actual < budgeted * 0.85) return 'underspent';
  return 'on_track';
}

function issueSeverity(value: string | null): BGFitBudgetItem['issue_severity'] {
  if (value === 'critical') return 'critical';
  if (value === 'high' || value === 'medium') return 'warning';
  if (value === 'low') return 'info';
  return null;
}

export async function getGrantHealthByOrg(orgId: string): Promise<BGFitGrantHealth[]> {
  const supabase = createServiceClient();

  const { data: grants, error: grantsError } = await supabase
    .from('org_grants')
    .select('id, organization_id, grant_name, funder_name, amount_awarded, approved_amount, contract_start, contract_end, acquittal_due_date, status')
    .eq('organization_id', orgId)
    .order('grant_name');

  if (grantsError) {
    console.error('Error fetching org grant health:', grantsError);
    return [];
  }

  const grantRows = (grants ?? []) as OrgGrantRow[];
  if (grantRows.length === 0) return [];

  const grantIds = grantRows.map((grant) => grant.id);
  const { data: budgetLines, error: budgetError } = await supabase
    .from('org_grant_budget_lines')
    .select('grant_id, actual_amount, has_issue')
    .in('grant_id', grantIds);

  if (budgetError) {
    console.error('Error fetching org grant budget lines:', budgetError);
  }

  const totals = new Map<string, { actual: number; issues: number }>();
  for (const line of (budgetLines ?? []) as Array<Pick<OrgBudgetLineRow, 'grant_id' | 'actual_amount' | 'has_issue'>>) {
    const current = totals.get(line.grant_id) || { actual: 0, issues: 0 };
    current.actual += toNumber(line.actual_amount);
    current.issues += line.has_issue ? 1 : 0;
    totals.set(line.grant_id, current);
  }

  return grantRows.map((grant) => {
    const approvedAmount = toNumber(grant.approved_amount ?? grant.amount_awarded);
    const grantTotals = totals.get(grant.id) || { actual: 0, issues: 0 };

    return {
      id: grant.id,
      organization_id: grant.organization_id,
      grant_name: grant.grant_name,
      funder_name: grant.funder_name,
      approved_amount: approvedAmount,
      received_amount: approvedAmount,
      total_spent: grantTotals.actual,
      remaining_budget: approvedAmount - grantTotals.actual,
      cash_remaining: approvedAmount - grantTotals.actual,
      issues_count: grantTotals.issues,
      items_not_purchased: 0,
      status: grant.status || 'active',
      acquittal_due: grant.acquittal_due_date,
      days_until_acquittal: daysUntil(grant.acquittal_due_date),
    };
  });
}

export async function getUpcomingDeadlines(orgId: string): Promise<BGFitDeadline[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('org_deadlines')
    .select('id, organization_id, grant_id, deadline_type, title, due_date, status, submitted_date, requirements, document_url, reminder_days_before, org_grants(grant_name, funder_name)')
    .eq('organization_id', orgId)
    .order('due_date');

  if (error) {
    console.error('Error fetching org deadlines:', error);
    return [];
  }

  return ((data ?? []) as OrgDeadlineRow[]).map((deadline) => {
    const grant = relatedGrant(deadline);
    return {
      id: deadline.id,
      grant_id: deadline.grant_id,
      deadline_type: deadline.deadline_type || 'report',
      title: deadline.title,
      due_date: deadline.due_date,
      status: deadlineStatus(deadline.status),
      submitted_date: deadline.submitted_date,
      requirements: deadline.requirements,
      document_url: deadline.document_url,
      reminder_days_before: deadline.reminder_days_before ?? 14,
      grant_name: grant?.grant_name || null,
      funder_name: grant?.funder_name || null,
      days_until_due: daysUntil(deadline.due_date) ?? 9999,
      urgency: deadlineUrgency(deadline.status, deadline.due_date),
    };
  });
}

export async function getBudgetVsActualByGrant(grantId: string): Promise<BGFitBudgetVsActual[]> {
  const supabase = createServiceClient();
  const [{ data: grant }, { data, error }] = await Promise.all([
    supabase
      .from('org_grants')
      .select('id, grant_name')
      .eq('id', grantId)
      .maybeSingle(),
    supabase
      .from('org_grant_budget_lines')
      .select('id, grant_id, category, description, budgeted_amount, actual_amount, has_issue, issue_severity, issue_notes')
      .eq('grant_id', grantId)
      .order('category')
      .order('description'),
  ]);

  if (error) {
    console.error('Error fetching org budget vs actual:', error);
    return [];
  }

  return ((data ?? []) as OrgBudgetLineRow[]).map((line) => {
    const budgeted = toNumber(line.budgeted_amount);
    const actual = toNumber(line.actual_amount);

    return {
      id: line.id,
      grant_id: line.grant_id,
      grant_name: (grant as { grant_name?: string } | null)?.grant_name || 'Grant',
      category: line.category || 'General',
      item_name: line.description || line.category || 'Budget line',
      budgeted_amount: budgeted,
      actual_amount: actual,
      variance: budgeted - actual,
      calculated_status: budgetStatus(budgeted, actual),
      status: budgetStatus(budgeted, actual),
      has_issue: Boolean(line.has_issue),
      issue_severity: issueSeverity(line.issue_severity),
      issue_description: line.issue_notes,
      supplier_name: null,
      receipt_details: null,
    };
  });
}

export async function getFlaggedIssues(orgId: string): Promise<BGFitBudgetItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('org_grant_budget_lines')
    .select('id, grant_id, category, description, budgeted_amount, actual_amount, has_issue, issue_severity, issue_notes')
    .eq('organization_id', orgId)
    .eq('has_issue', true)
    .order('issue_severity');

  if (error) {
    console.error('Error fetching org flagged issues:', error);
    return [];
  }

  return ((data ?? []) as OrgBudgetLineRow[]).map((line, index) => {
    const budgeted = toNumber(line.budgeted_amount);
    const actual = toNumber(line.actual_amount);
    return {
      id: line.id,
      grant_id: line.grant_id,
      category: line.category || 'General',
      item_name: line.description || line.category || 'Budget line',
      item_type: 'grant_budget',
      budgeted_amount: budgeted,
      actual_amount: actual,
      status: budgetStatus(budgeted, actual),
      supplier_name: null,
      receipt_details: null,
      has_issue: Boolean(line.has_issue),
      issue_severity: issueSeverity(line.issue_severity),
      issue_description: line.issue_notes,
      sort_order: index,
    };
  });
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
