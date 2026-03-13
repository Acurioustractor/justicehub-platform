'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { BGFitBudgetVsActual } from '@/lib/bgfit/types';
import { formatCurrency, getBudgetStatusColor, getIssueSeverityColor } from '@/lib/bgfit/utils';

interface GrantDetailProps {
  grantId: string;
}

export function GrantDetail({ grantId }: GrantDetailProps) {
  const [items, setItems] = useState<BGFitBudgetVsActual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBudget() {
      try {
        const res = await fetch(`/api/hub/budget-vs-actual?grantId=${grantId}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBudget();
  }, [grantId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-500">No budget items found for this grant.</div>
    );
  }

  // Group by category
  const categories = items.reduce<Record<string, BGFitBudgetVsActual[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="p-5 bg-gray-50">
      <h4 className="font-black text-sm mb-4">Budget vs Actual</h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="pb-2 font-black">Category / Item</th>
              <th className="pb-2 font-black text-right">Budgeted</th>
              <th className="pb-2 font-black text-right">Actual</th>
              <th className="pb-2 font-black text-right">Variance</th>
              <th className="pb-2 font-black text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categories).map(([category, catItems]) => (
              <>
                <tr key={`cat-${category}`} className="bg-gray-100">
                  <td colSpan={5} className="py-2 px-2 font-bold text-xs uppercase tracking-wide text-gray-600">
                    {category}
                  </td>
                </tr>
                {catItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.item_name}</span>
                        {item.has_issue && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getIssueSeverityColor(item.issue_severity)}`}>
                            {item.issue_severity?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {item.issue_description && (
                        <p className="text-xs text-red-600 mt-0.5">{item.issue_description}</p>
                      )}
                      {item.supplier_name && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.supplier_name}</p>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(Number(item.budgeted_amount))}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(Number(item.actual_amount))}</td>
                    <td className={`py-2.5 text-right font-mono ${Number(item.variance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Number(item.variance) >= 0 ? '+' : ''}{formatCurrency(Number(item.variance))}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${getBudgetStatusColor(item.calculated_status)}`}>
                        {item.calculated_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
