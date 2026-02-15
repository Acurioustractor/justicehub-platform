import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface BudgetItem {
  id: string;
  department: string;
  category: string;
  allocated: number;
  spent: number;
  percentage: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  state: string;
  financial_year: string;
}

interface Alert {
  id: string;
  type: 'budget_exceeded' | 'underspend' | 'new_allocation' | 'transparency_issue';
  title: string;
  description: string;
  amount?: number;
  date: string;
  severity: 'high' | 'medium' | 'low';
  state: string;
}

interface KeyMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  type: string;
  state: string;
}

// Fallback data when database is empty or unavailable
const fallbackBudgetData: BudgetItem[] = [
  {
    id: '1',
    department: 'Youth Justice',
    category: 'Detention Centers',
    allocated: 125000000,
    spent: 118500000,
    percentage: 94.8,
    lastUpdated: '2024-01-15',
    trend: 'up',
    state: 'QLD',
    financial_year: '2023-24'
  },
  {
    id: '2',
    department: 'Youth Justice',
    category: 'Community Programs',
    allocated: 45000000,
    spent: 41200000,
    percentage: 91.5,
    lastUpdated: '2024-01-15',
    trend: 'stable',
    state: 'QLD',
    financial_year: '2023-24'
  },
  {
    id: '3',
    department: 'Courts',
    category: 'Youth Court Operations',
    allocated: 28000000,
    spent: 26800000,
    percentage: 95.7,
    lastUpdated: '2024-01-12',
    trend: 'down',
    state: 'QLD',
    financial_year: '2023-24'
  },
  {
    id: '4',
    department: 'Legal Aid',
    category: 'Youth Legal Representation',
    allocated: 15000000,
    spent: 12300000,
    percentage: 82.0,
    lastUpdated: '2024-01-10',
    trend: 'down',
    state: 'QLD',
    financial_year: '2023-24'
  }
];

const fallbackAlerts: Alert[] = [
  {
    id: '1',
    type: 'budget_exceeded',
    title: 'Detention Center Overtime Costs',
    description: 'Staff overtime costs have exceeded budget by 12% this quarter',
    amount: 1500000,
    date: '2024-01-15',
    severity: 'high',
    state: 'QLD'
  },
  {
    id: '2',
    type: 'underspend',
    title: 'Community Programs Underspend',
    description: 'Community-based programs showing significant underspend',
    amount: 3800000,
    date: '2024-01-12',
    severity: 'medium',
    state: 'QLD'
  },
  {
    id: '3',
    type: 'transparency_issue',
    title: 'Missing Financial Reports',
    description: 'Q2 detention facility reports not yet published',
    date: '2024-01-10',
    severity: 'high',
    state: 'QLD'
  }
];

const fallbackMetrics: KeyMetric[] = [
  {
    label: 'Total Youth Justice Budget',
    value: '$213M',
    change: '+8.5%',
    positive: false,
    type: 'total_budget',
    state: 'QLD'
  },
  {
    label: 'Cost Per Youth in Detention',
    value: '$847K',
    change: '+12.3%',
    positive: false,
    type: 'detention_cost',
    state: 'QLD'
  },
  {
    label: 'Community Program Investment',
    value: '$45M',
    change: '-2.1%',
    positive: false,
    type: 'community_investment',
    state: 'QLD'
  },
  {
    label: 'Budget Transparency Score',
    value: '67%',
    change: '+5.2%',
    positive: true,
    type: 'transparency_score',
    state: 'QLD'
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'QLD';
  const financialYear = searchParams.get('year') || '2023-24';

  try {
    const supabase = createServiceClient();

    // Try to fetch from transparency_budget table
    const { data: budgetData, error: budgetError } = await supabase
      .from('transparency_budget')
      .select('*')
      .eq('state', state)
      .eq('financial_year', financialYear)
      .order('department');

    // Try to fetch alerts
    const { data: alertData, error: alertError } = await supabase
      .from('transparency_alerts')
      .select('*')
      .eq('state', state)
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(10);

    // Try to fetch key metrics
    const { data: metricData, error: metricError } = await supabase
      .from('transparency_metrics')
      .select('*')
      .eq('state', state)
      .eq('financial_year', financialYear);

    // Use database data if available, otherwise fallback
    const budget = budgetData && budgetData.length > 0 ? budgetData : fallbackBudgetData;
    const alerts = alertData && alertData.length > 0 ? alertData : fallbackAlerts;
    const metrics = metricData && metricData.length > 0 ? metricData : fallbackMetrics;

    // Calculate summary stats
    const totalAllocated = budget.reduce((sum, item) => sum + item.allocated, 0);
    const totalSpent = budget.reduce((sum, item) => sum + item.spent, 0);

    return NextResponse.json({
      budget,
      alerts,
      metrics,
      summary: {
        totalAllocated,
        totalSpent,
        utilizationRate: Math.round((totalSpent / totalAllocated) * 100 * 10) / 10,
        activeAlerts: alerts.length,
        state,
        financialYear,
        lastUpdated: budget[0]?.lastUpdated || new Date().toISOString(),
        isLiveData: budgetData && budgetData.length > 0
      }
    });
  } catch (error) {
    console.error('Transparency API error:', error);

    // Return fallback data on error
    const totalAllocated = fallbackBudgetData.reduce((sum, item) => sum + item.allocated, 0);
    const totalSpent = fallbackBudgetData.reduce((sum, item) => sum + item.spent, 0);

    return NextResponse.json({
      budget: fallbackBudgetData,
      alerts: fallbackAlerts,
      metrics: fallbackMetrics,
      summary: {
        totalAllocated,
        totalSpent,
        utilizationRate: Math.round((totalSpent / totalAllocated) * 100 * 10) / 10,
        activeAlerts: fallbackAlerts.length,
        state: 'QLD',
        financialYear: '2023-24',
        lastUpdated: '2024-01-15',
        isLiveData: false
      }
    });
  }
}
