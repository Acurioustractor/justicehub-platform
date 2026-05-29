'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardList, DollarSign, FilePlus2, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { BGFitGrantHealth } from '@/lib/bgfit/types';
import { formatCurrency, getSpendPercentage, getHealthStatus } from '@/lib/bgfit/utils';
import { GrantDetail } from './GrantDetail';

interface GrantsViewProps {
  grants: BGFitGrantHealth[];
  orgId: string;
  orgSlug: string;
}

export function GrantsView({ grants, orgId, orgSlug }: GrantsViewProps) {
  const router = useRouter();
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);
  const [savingGrant, setSavingGrant] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const totalBudget = grants.reduce((s, g) => s + Number(g.approved_amount), 0);
  const totalSpent = grants.reduce((s, g) => s + Number(g.total_spent), 0);
  const totalRemaining = grants.reduce((s, g) => s + Number(g.remaining_budget), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Grants</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {grants.length} grant{grants.length !== 1 ? 's' : ''} totalling {formatCurrency(totalBudget)}
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Budget</p>
            <p className="text-xl font-black font-mono">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Spent</p>
            <p className="text-xl font-black font-mono text-orange-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Remaining</p>
            <p className="text-xl font-black font-mono text-green-600">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {grants.length === 0 && (
        <EmptyGrantStart orgId={orgId} orgSlug={orgSlug} />
      )}

      <GrantCreateForm
        orgId={orgId}
        saving={savingGrant}
        message={formMessage}
        error={formError}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          setSavingGrant(true);
          setFormMessage(null);
          setFormError(null);

          try {
            const response = await fetch(`/api/org-hub/${orgId}/grants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grant_name: String(formData.get('grant_name') || ''),
                funder_name: String(formData.get('funder_name') || ''),
                approved_amount: String(formData.get('approved_amount') || ''),
                received_amount: String(formData.get('received_amount') || ''),
                start_date: String(formData.get('start_date') || ''),
                end_date: String(formData.get('end_date') || ''),
                acquittal_due: String(formData.get('acquittal_due') || ''),
                reporting_frequency: String(formData.get('reporting_frequency') || ''),
                reporting_requirements: String(formData.get('reporting_requirements') || ''),
                status: String(formData.get('status') || 'draft'),
              }),
            });
            const payload = await response.json();

            if (!response.ok) {
              throw new Error(payload.error || 'Could not create grant');
            }

            form.reset();
            setFormMessage('Grant created. The workspace is refreshing.');
            router.refresh();
          } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Could not create grant');
          } finally {
            setSavingGrant(false);
          }
        }}
      />

      {/* Grant cards */}
      {grants.length > 0 && (
        <div className="space-y-4">
          {grants.map((grant) => {
            const pct = getSpendPercentage(Number(grant.total_spent), Number(grant.approved_amount));
            const health = getHealthStatus(Number(grant.total_spent), Number(grant.approved_amount));
            const isExpanded = expandedGrant === grant.id;

            return (
              <div key={grant.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden">
                {/* Card header - clickable */}
                <button
                  onClick={() => setExpandedGrant(isExpanded ? null : grant.id)}
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-ochre-100 rounded-lg border border-ochre-200 shrink-0">
                        <DollarSign className="h-5 w-5 text-ochre-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black truncate">{grant.grant_name}</p>
                        <p className="text-xs text-gray-500">{grant.funder_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold ${health.color}`}>{health.label}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 grid grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block">Awarded</span>
                      <span className="font-bold">{formatCurrency(Number(grant.approved_amount))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Spent</span>
                      <span className="font-bold">{formatCurrency(Number(grant.total_spent))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Remaining</span>
                      <span className="font-bold text-green-600">{formatCurrency(Number(grant.remaining_budget))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Issues</span>
                      <span className={`font-bold ${Number(grant.issues_count) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {grant.issues_count}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 border border-black/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pct}% spent</p>
                </button>

                {/* Expanded budget detail */}
                {isExpanded && (
                  <div className="border-t-2 border-black">
                    <GrantDetail grantId={grant.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GrantCreateForm({
  orgId,
  saving,
  message,
  error,
  onSubmit,
}: {
  orgId: string;
  saving: boolean;
  message: string | null;
  error: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-gray-500">Populate this workspace</p>
        <h3 className="mt-1 text-xl font-black">Create a managed grant</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
          This creates a live <code className="font-mono">org_grants</code> record for this organization.
          If you add an acquittal due date, the compliance page will also get its first deadline.
        </p>
        <input type="hidden" name="organization_id" value={orgId} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Grant name</span>
          <input name="grant_name" required className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="e.g. Community enterprise pilot" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Funder</span>
          <input name="funder_name" required className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="Foundation, department, council..." />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Approved amount</span>
          <input name="approved_amount" required inputMode="decimal" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="0" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Received</span>
          <input name="received_amount" inputMode="decimal" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="0" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Start date</span>
          <input name="start_date" type="date" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Acquittal due</span>
          <input name="acquittal_due" type="date" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">End date</span>
          <input name="end_date" type="date" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Reporting</span>
          <select name="reporting_frequency" className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold">
            <option value="">Not set</option>
            <option value="final">Final only</option>
            <option value="quarterly">Quarterly</option>
            <option value="six-monthly">Six-monthly</option>
            <option value="annual">Annual</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Status</span>
          <select name="status" defaultValue="draft" className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="acquitting">Acquitting</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-gray-500">Reporting requirements</span>
        <textarea name="reporting_requirements" rows={3} className="w-full border-2 border-black px-3 py-2 text-sm" placeholder="What needs to be reported, acquitted, measured, or supplied?" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex min-h-[44px] items-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
          Create grant
        </button>
        {message && <p className="text-sm font-bold text-eucalyptus-800">{message}</p>}
        {error && <p className="text-sm font-bold text-red-700">{error}</p>}
      </div>
    </form>
  );
}

function EmptyGrantStart({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  return (
    <section className="border-2 border-black bg-sand-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-wide text-gray-500">Why this is empty</p>
        <h3 className="mt-2 text-xl font-black">No managed grant records have been attached to this org yet.</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          This page reads live working grants from <code className="font-mono">org_grants</code>.
          GrantScope can help find opportunities and public funding signals, but budget tracking only starts
          once a live grant, contract, or application is promoted into this workspace.
        </p>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <PopulateLink
          href={`/funding/workspace/${orgId}`}
          icon={ClipboardList}
          title="Build readiness first"
          detail="Use the funding workspace to add support notes, blockers, capability signals, and application context."
        />
        <PopulateLink
          href={`/hub/${orgSlug}/grants?tab=discover`}
          icon={Search}
          title="Search GrantScope"
          detail="Find likely grants and government pathways before creating a managed grant record."
        />
        <PopulateLink
          href={`/hub/${orgSlug}/profile?tab=programs`}
          icon={FilePlus2}
          title="Add delivery context"
          detail="Funders need programs, locations, people, and proof before matches become useful."
        />
      </div>
    </section>
  );
}

function PopulateLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof ClipboardList;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      prefetch={href.includes('/funding/workspace') ? false : undefined}
      className="group flex min-h-[150px] flex-col justify-between border-2 border-black bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      <div>
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-white">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="text-base font-black">{title}</h4>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">{detail}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-ochre-700">
        Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
