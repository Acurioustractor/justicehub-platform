// Formatting and display utilities for BG Fit hub

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getUrgencyColor(urgency: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (urgency) {
    case 'overdue':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' };
    case 'urgent':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' };
    case 'soon':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' };
    case 'done':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400' };
  }
}

export function getHealthStatus(spent: number, budget: number): {
  label: string;
  color: string;
} {
  if (budget === 0) return { label: 'No budget', color: 'text-gray-500' };
  const ratio = spent / budget;
  if (ratio > 1) return { label: 'Overspent', color: 'text-red-600' };
  if (ratio > 0.9) return { label: 'Nearly spent', color: 'text-orange-600' };
  if (ratio > 0.5) return { label: 'On track', color: 'text-green-600' };
  return { label: 'Under budget', color: 'text-blue-600' };
}

export function getSpendPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

export function getIssueSeverityColor(severity: string | null): string {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getBudgetStatusColor(status: string): string {
  switch (status) {
    case 'on_track': return 'bg-green-100 text-green-800';
    case 'overspent': return 'bg-red-100 text-red-800';
    case 'underspent': return 'bg-blue-100 text-blue-800';
    case 'not_spent': return 'bg-gray-100 text-gray-600';
    case 'not_funded': return 'bg-yellow-100 text-yellow-800';
    case 'reallocated': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
