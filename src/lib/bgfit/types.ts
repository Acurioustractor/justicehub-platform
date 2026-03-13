// Types mapping to bgfit_* tables and views

export interface BGFitGrant {
  id: string;
  organization_id: string;
  grant_name: string;
  funder_name: string;
  funder_department: string | null;
  reference_number: string | null;
  approved_amount: number;
  gst_inclusive: boolean;
  received_amount: number;
  spent_amount: number;
  start_date: string | null;
  end_date: string | null;
  acquittal_due: string | null;
  status: 'draft' | 'active' | 'acquitting' | 'acquitted' | 'closed';
  tranches: { amount: number; received_date: string; label: string }[];
  reporting_requirements: string | null;
  reporting_frequency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BGFitBudgetItem {
  id: string;
  grant_id: string;
  category: string;
  item_name: string;
  item_type: string;
  budgeted_amount: number;
  actual_amount: number;
  status: 'pending' | 'on_track' | 'underspent' | 'overspent' | 'not_spent' | 'not_funded' | 'reallocated';
  supplier_name: string | null;
  receipt_details: string | null;
  has_issue: boolean;
  issue_severity: 'info' | 'warning' | 'critical' | null;
  issue_description: string | null;
  sort_order: number;
}

export interface BGFitDeadline {
  id: string;
  grant_id: string | null;
  deadline_type: string;
  title: string;
  due_date: string;
  status: 'upcoming' | 'in_progress' | 'submitted' | 'overdue' | 'complete';
  submitted_date: string | null;
  requirements: string | null;
  document_url: string | null;
  reminder_days_before: number;
  grant_name: string | null;
  funder_name: string | null;
  days_until_due: number;
  urgency: 'done' | 'overdue' | 'urgent' | 'soon' | 'upcoming';
}

export interface BGFitGrantHealth {
  id: string;
  organization_id: string;
  grant_name: string;
  funder_name: string;
  approved_amount: number;
  received_amount: number;
  total_spent: number;
  remaining_budget: number;
  cash_remaining: number;
  issues_count: number;
  items_not_purchased: number;
  status: string;
  acquittal_due: string | null;
  days_until_acquittal: number | null;
}

export interface BGFitBudgetVsActual {
  id: string;
  grant_id: string;
  grant_name: string;
  category: string;
  item_name: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  calculated_status: 'not_spent' | 'on_track' | 'overspent' | 'underspent';
  status: string;
  has_issue: boolean;
  issue_severity: 'info' | 'warning' | 'critical' | null;
  issue_description: string | null;
  supplier_name: string | null;
  receipt_details: string | null;
}

export interface BGFitDashboardSummary {
  activeGrants: number;
  totalSpent: number;
  totalBudget: number;
  deadlinesDueThisWeek: number;
  flaggedIssues: BGFitBudgetItem[];
  upcomingDeadlines: BGFitDeadline[];
  grantHealth: BGFitGrantHealth[];
}
