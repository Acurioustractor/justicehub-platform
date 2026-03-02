'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Calendar,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  FileText,
  Receipt,
  BarChart3,
} from 'lucide-react';

// ---------- Types ----------

interface BudgetLine {
  id: string;
  category: string;
  description: string;
  budgeted_amount: number;
  actual_amount: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  receipt_url: string | null;
}

interface Grant {
  id: string;
  funder_name: string;
  grant_name: string;
  amount_awarded: number;
  contract_start: string;
  contract_end: string;
  reporting_system: string | null;
  acquittal_status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'overdue';
  acquittal_due_date: string | null;
  portal_url: string | null;
  notes: string | null;
  budget_lines: BudgetLine[];
  transactions: Transaction[];
}

// ---------- Constants ----------

const ACQUITTAL_COLORS: Record<string, { bg: string; text: string }> = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
  submitted: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800' },
};

const ACQUITTAL_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  overdue: 'Overdue',
};

// ---------- Helpers ----------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------- Sub-components ----------

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function BudgetBar({ budgeted, actual }: { budgeted: number; actual: number }) {
  const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
  const overBudget = pct > 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="w-full h-4 bg-gray-200 border border-black relative">
          <div
            className={`h-full ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
      <span className={`text-xs font-bold whitespace-nowrap ${overBudget ? 'text-red-700' : 'text-gray-600'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ---------- Main Component ----------

export function GrantsTab({ orgId }: { orgId: string }) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);

  // Modal states
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState<string | null>(null); // grant id
  const [showAddBudgetLine, setShowAddBudgetLine] = useState<string | null>(null); // grant id
  const [showReportDraft, setShowReportDraft] = useState<string | null>(null); // grant id
  const [reportDraft, setReportDraft] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=grants`);
      if (!res.ok) throw new Error('Failed to load grants');
      const json = await res.json();
      setGrants(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  // ---------- Mutation helpers ----------

  const handleSubmit = useCallback(async (
    section: string,
    action: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    id?: string,
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, action, data, id }),
      });
      if (!res.ok) throw new Error('Operation failed');
      await fetchGrants();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [orgId, fetchGrants]);

  const handleDraftReport = useCallback(async (grantId: string) => {
    setReportLoading(true);
    setReportDraft(null);
    setShowReportDraft(grantId);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/report-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
      if (!res.ok) throw new Error('Failed to generate report draft');
      const json = await res.json();
      setReportDraft(json.draft || 'No content generated.');
    } catch (err) {
      setReportDraft(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setReportLoading(false);
    }
  }, [orgId]);

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-red-700 font-bold">Error: {error}</p>
        <button
          onClick={fetchGrants}
          className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Active Grants</h2>
        <button
          onClick={() => setShowAddGrant(true)}
          className="px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Grant
        </button>
      </div>

      {/* Grants List */}
      {grants.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">No grants yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first grant to start tracking funding.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grants.map((grant) => {
            const isExpanded = expandedGrant === grant.id;
            const totalActual = grant.transactions
              .filter((t) => t.transaction_type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div
                key={grant.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {/* Grant Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-black">{grant.grant_name}</h3>
                        <span className={`px-2 py-1 text-xs font-bold ${
                          ACQUITTAL_COLORS[grant.acquittal_status]?.bg || 'bg-gray-100'
                        } ${ACQUITTAL_COLORS[grant.acquittal_status]?.text || 'text-gray-700'}`}>
                          {ACQUITTAL_LABELS[grant.acquittal_status] || grant.acquittal_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium mt-1">{grant.funder_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="font-bold text-black">{formatCurrency(grant.amount_awarded)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(grant.contract_start)} - {formatDate(grant.contract_end)}
                        </span>
                        {grant.acquittal_due_date && (
                          <span className="text-yellow-700 font-medium">
                            Acquittal due {formatDate(grant.acquittal_due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {grant.portal_url && (
                        <a
                          href={grant.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 border-2 border-black hover:bg-gray-100 transition-colors"
                          title="Open funder portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDraftReport(grant.id)}
                        className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Draft Report
                      </button>
                      <button
                        onClick={() => setExpandedGrant(isExpanded ? null : grant.id)}
                        className="px-3 py-2 border-2 border-black hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: Budget Lines + Transactions */}
                {isExpanded && (
                  <div className="border-t-2 border-black">
                    {/* Budget Lines */}
                    <div className="p-5 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          <h4 className="font-black text-sm uppercase tracking-wide">Budget Lines</h4>
                        </div>
                        <button
                          onClick={() => setShowAddBudgetLine(grant.id)}
                          className="px-3 py-1 text-xs font-bold border-2 border-black hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Line
                        </button>
                      </div>
                      {grant.budget_lines.length === 0 ? (
                        <p className="text-sm text-gray-400 font-medium">No budget lines defined.</p>
                      ) : (
                        <div className="space-y-3">
                          {grant.budget_lines.map((line) => (
                            <div key={line.id}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-bold">{line.category}: {line.description}</span>
                                <span className="text-gray-600">
                                  {formatCurrency(line.actual_amount)} / {formatCurrency(line.budgeted_amount)}
                                </span>
                              </div>
                              <BudgetBar budgeted={line.budgeted_amount} actual={line.actual_amount} />
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black">
                            <span>Total</span>
                            <span>
                              {formatCurrency(totalActual)} / {formatCurrency(grant.amount_awarded)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Transactions */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          <h4 className="font-black text-sm uppercase tracking-wide">Transactions</h4>
                        </div>
                        <button
                          onClick={() => setShowAddTransaction(grant.id)}
                          className="px-3 py-1 text-xs font-bold border-2 border-black hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Transaction
                        </button>
                      </div>
                      {grant.transactions.length === 0 ? (
                        <p className="text-sm text-gray-400 font-medium">No transactions recorded.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-black">
                                <th className="text-left py-2 font-black">Date</th>
                                <th className="text-left py-2 font-black">Description</th>
                                <th className="text-left py-2 font-black">Type</th>
                                <th className="text-right py-2 font-black">Amount</th>
                                <th className="text-right py-2 font-black">Receipt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grant.transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-gray-200">
                                  <td className="py-2 text-gray-600">{formatDate(tx.transaction_date)}</td>
                                  <td className="py-2 font-medium">{tx.description}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-1 text-xs font-bold ${
                                      tx.transaction_type === 'income'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {tx.transaction_type}
                                    </span>
                                  </td>
                                  <td className={`py-2 text-right font-bold ${
                                    tx.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                  </td>
                                  <td className="py-2 text-right">
                                    {tx.receipt_url ? (
                                      <a
                                        href={tx.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        View
                                      </a>
                                    ) : (
                                      <span className="text-gray-300">--</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- MODALS ---------- */}

      {/* Add Grant Modal */}
      {showAddGrant && (
        <AddGrantModal
          submitting={submitting}
          onClose={() => setShowAddGrant(false)}
          onSubmit={async (data) => {
            const ok = await handleSubmit('grants', 'create', data);
            if (ok) setShowAddGrant(false);
          }}
        />
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          grantId={showAddTransaction}
          submitting={submitting}
          onClose={() => setShowAddTransaction(null)}
          onSubmit={async (data) => {
            const ok = await handleSubmit('grant_transactions', 'create', data, showAddTransaction);
            if (ok) setShowAddTransaction(null);
          }}
        />
      )}

      {/* Add Budget Line Modal */}
      {showAddBudgetLine && (
        <AddBudgetLineModal
          grantId={showAddBudgetLine}
          submitting={submitting}
          onClose={() => setShowAddBudgetLine(null)}
          onSubmit={async (data) => {
            const ok = await handleSubmit('grant_budget_lines', 'create', data, showAddBudgetLine);
            if (ok) setShowAddBudgetLine(null);
          }}
        />
      )}

      {/* Report Draft Modal */}
      {showReportDraft && (
        <ModalBackdrop onClose={() => { setShowReportDraft(null); setReportDraft(null); }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">Draft Report</h3>
              <button
                onClick={() => { setShowReportDraft(null); setReportDraft(null); }}
                className="p-1 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {reportLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 font-medium text-gray-600">Generating report draft...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-gray-50 border border-gray-200 p-4 text-sm font-mono">
                  {reportDraft}
                </pre>
              </div>
            )}
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

// ---------- Modal Components ----------

function AddGrantModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    funder_name: '',
    grant_name: '',
    amount_awarded: '',
    contract_start: '',
    contract_end: '',
    reporting_system: '',
    acquittal_due_date: '',
    portal_url: '',
    notes: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black">Add Grant</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Funder Name *</label>
            <input
              type="text"
              value={form.funder_name}
              onChange={(e) => update('funder_name', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. Department of Justice"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Grant Name *</label>
            <input
              type="text"
              value={form.grant_name}
              onChange={(e) => update('grant_name', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. Youth Diversion Program 2025"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Amount Awarded *</label>
            <input
              type="number"
              value={form.amount_awarded}
              onChange={(e) => update('amount_awarded', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. 150000"
              min="0"
              step="1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Contract Start *</label>
              <input
                type="date"
                value={form.contract_start}
                onChange={(e) => update('contract_start', e.target.value)}
                className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Contract End *</label>
              <input
                type="date"
                value={form.contract_end}
                onChange={(e) => update('contract_end', e.target.value)}
                className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Reporting System</label>
            <input
              type="text"
              value={form.reporting_system}
              onChange={(e) => update('reporting_system', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. SmartyGrants, DEX"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Acquittal Due Date</label>
            <input
              type="date"
              value={form.acquittal_due_date}
              onChange={(e) => update('acquittal_due_date', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Portal URL</label>
            <input
              type="url"
              value={form.portal_url}
              onChange={(e) => update('portal_url', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                ...form,
                amount_awarded: Number(form.amount_awarded) || 0,
                acquittal_due_date: form.acquittal_due_date || null,
                portal_url: form.portal_url || null,
                reporting_system: form.reporting_system || null,
                notes: form.notes || null,
              })
            }
            disabled={submitting || !form.funder_name || !form.grant_name || !form.amount_awarded || !form.contract_start || !form.contract_end}
            className="px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Grant
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function AddTransactionModal({
  grantId,
  submitting,
  onClose,
  onSubmit,
}: {
  grantId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    transaction_date: '',
    transaction_type: 'expense' as 'income' | 'expense',
    receipt_url: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black">Add Transaction</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. Facilitator payment - March"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Amount *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. 2500"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Date *</label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) => update('transaction_date', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Type *</label>
            <select
              value={form.transaction_type}
              onChange={(e) => update('transaction_type', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Receipt URL</label>
            <input
              type="url"
              value={form.receipt_url}
              onChange={(e) => update('receipt_url', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                grant_id: grantId,
                description: form.description,
                amount: Number(form.amount) || 0,
                transaction_date: form.transaction_date,
                transaction_type: form.transaction_type,
                receipt_url: form.receipt_url || null,
              })
            }
            disabled={submitting || !form.description || !form.amount || !form.transaction_date}
            className="px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Transaction
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function AddBudgetLineModal({
  grantId,
  submitting,
  onClose,
  onSubmit,
}: {
  grantId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    category: '',
    description: '',
    budgeted_amount: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black">Add Budget Line</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Category *</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. Staffing, Program Delivery, Admin"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. Youth worker salary Q1-Q2"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Budgeted Amount *</label>
            <input
              type="number"
              value={form.budgeted_amount}
              onChange={(e) => update('budgeted_amount', e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              placeholder="e.g. 45000"
              min="0"
              step="1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                grant_id: grantId,
                category: form.category,
                description: form.description,
                budgeted_amount: Number(form.budgeted_amount) || 0,
              })
            }
            disabled={submitting || !form.category || !form.description || !form.budgeted_amount}
            className="px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Budget Line
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
