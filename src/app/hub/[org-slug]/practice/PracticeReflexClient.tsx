'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Handshake,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import type {
  PracticeReflexAction,
  PracticeReflexLane,
  PracticeReflexRiskLevel,
  PracticeReflexState,
  PracticeReflexStatus,
} from '@/lib/org-hub/practice-reflex';

type AdvancedAccess = {
  grantManagement: boolean;
  outcomeTracking: boolean;
  upgradeUrl: string | null;
  trialActive: boolean;
};

interface PracticeReflexClientProps {
  state: PracticeReflexState;
  advancedAccess: AdvancedAccess;
}

const LANE_ICONS: Record<PracticeReflexLane['key'], LucideIcon> = {
  identity: BadgeCheck,
  programs: ClipboardList,
  people: Users,
  proof: FileText,
  referrals: Handshake,
  practice_learning: Sparkles,
  funding: WalletCards,
  compliance: ShieldCheck,
  outcomes: CheckCircle2,
};

const PRIORITIES: PracticeReflexAction['priority'][] = ['urgent', 'high', 'medium', 'low'];

function statusClasses(status: PracticeReflexStatus) {
  if (status === 'ready') return 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-900';
  if (status === 'needs_work') return 'border-red-700 bg-red-50 text-red-800';
  return 'border-ochre-700 bg-ochre-50 text-ochre-900';
}

function riskClasses(risk: PracticeReflexRiskLevel) {
  if (risk === 'urgent') return 'bg-red-600 text-white';
  if (risk === 'high') return 'bg-red-100 text-red-800 border border-red-300';
  if (risk === 'medium') return 'bg-ochre-100 text-ochre-900 border border-ochre-300';
  if (risk === 'low') return 'bg-blue-50 text-blue-800 border border-blue-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
}

function priorityClasses(priority: PracticeReflexAction['priority']) {
  if (priority === 'urgent') return 'border-red-700 bg-red-50 text-red-800';
  if (priority === 'high') return 'border-red-300 bg-red-50 text-red-700';
  if (priority === 'medium') return 'border-ochre-300 bg-ochre-50 text-ochre-900';
  return 'border-blue-200 bg-blue-50 text-blue-800';
}

function percentLabel(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function PracticeReflexClient({ state, advancedAccess }: PracticeReflexClientProps) {
  const router = useRouter();
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseError, setPulseError] = useState<string | null>(null);
  const [pulseMessage, setPulseMessage] = useState<string | null>(null);

  const actionsByPriority = useMemo(() => {
    const grouped: Record<string, PracticeReflexAction[]> = {};
    for (const priority of PRIORITIES) grouped[priority] = [];
    for (const action of state.actions) {
      grouped[action.priority || 'medium'] = grouped[action.priority || 'medium'] || [];
      grouped[action.priority || 'medium'].push(action);
    }
    return grouped;
  }, [state.actions]);

  async function runPulse() {
    setIsPulsing(true);
    setPulseError(null);
    setPulseMessage(null);
    try {
      const response = await fetch(`/api/org-hub/${state.organization.id}/practice-reflex/pulse`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Practice Reflex pulse failed');
      setPulseMessage(`${payload.generatedActions || 0} generated action${payload.generatedActions === 1 ? '' : 's'} refreshed.`);
      router.refresh();
    } catch (error) {
      setPulseError(error instanceof Error ? error.message : 'Practice Reflex pulse failed');
    } finally {
      setIsPulsing(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-eucalyptus-700 bg-eucalyptus-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-eucalyptus-800">
              <RefreshCw className="h-4 w-4" />
              Practice Reflex
            </div>
            <h1 className="text-3xl font-black leading-tight">{state.organization.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              The operating loop for keeping community justice work coherent: what is ready,
              what is missing, what is due, and what proof or funding work should happen next.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-[340px]">
            <button
              type="button"
              onClick={runPulse}
              disabled={isPulsing}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {isPulsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Run reflex check
            </button>
            {pulseMessage && <p className="text-sm font-bold text-eucalyptus-800">{pulseMessage}</p>}
            {pulseError && <p className="text-sm font-bold text-red-700">{pulseError}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Essential steps" value={`${state.summary.essentialStepsReady}/${state.summary.essentialStepsTotal}`} detail={`${state.summary.needsWork} need work`} icon={ClipboardList} />
        <MetricCard label="Open actions" value={state.summary.openActions} detail="Active org queue" icon={AlertTriangle} />
        <MetricCard label="Due soon" value={state.summary.dueSoon} detail="Deadlines and compliance" icon={Clock} />
        <MetricCard label="Proof strength" value={percentLabel(state.summary.proofStrength)} detail={`${state.counts.proof} proof records`} icon={FileText} />
        <MetricCard label="Funding readiness" value={percentLabel(state.summary.fundingReadiness)} detail={`${state.counts.fundingProfileCount} capability profile`} icon={WalletCards} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">Operating loop</p>
              <h2 className="text-2xl font-black">Essential steps</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.lanes.map((lane) => (
              <LaneCard key={lane.key} lane={lane} />
            ))}
          </div>
        </div>

        <SustainabilityPanel access={advancedAccess} orgSlug={state.organization.slug} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <ActionPanel title="Suggested by this check" empty="No new suggestions. Run the check again after changing the workspace.">
          {state.suggestedActions.map((action) => (
            <ActionCard key={`${action.lane}-${action.title}`} action={action} />
          ))}
        </ActionPanel>

        <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-ochre-700" />
            <h2 className="text-xl font-black">Current action queue</h2>
          </div>

          {state.actions.length === 0 ? (
            <p className="text-sm leading-relaxed text-gray-600">
              No open action items are recorded for this organisation.
            </p>
          ) : (
            <div className="space-y-5">
              {PRIORITIES.map((priority) => {
                const actions = actionsByPriority[priority] || [];
                if (actions.length === 0) return null;
                return (
                  <div key={priority}>
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-500">{priority}</p>
                    <div className="space-y-2">
                      {actions.map((action) => (
                        <ActionCard key={action.id || `${action.lane}-${action.title}`} action={action} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-sand-50">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{detail}</p>
    </div>
  );
}

function LaneCard({ lane }: { lane: PracticeReflexLane }) {
  const Icon = LANE_ICONS[lane.key];
  return (
    <article className="flex min-h-[230px] flex-col justify-between border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-sand-50">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">{lane.label}</h3>
              <p className="text-xs font-bold text-gray-500">{lane.count} signal{lane.count === 1 ? '' : 's'}</p>
            </div>
          </div>
          <span className={`shrink-0 border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusClasses(lane.status)}`}>
            {lane.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{lane.summary}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${riskClasses(lane.riskLevel)}`}>
          {lane.riskLevel}
        </span>
        <Link href={lane.nextAction.href} className="inline-flex items-center gap-1 text-sm font-black text-ochre-700 hover:text-ochre-900">
          {lane.nextAction.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function SustainabilityPanel({ access, orgSlug }: { access: AdvancedAccess; orgSlug: string }) {
  const operationalAccess = access.grantManagement && access.outcomeTracking;
  return (
    <aside className="border-2 border-black bg-sand-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex items-center gap-2">
        {operationalAccess ? <CheckCircle2 className="h-5 w-5 text-eucalyptus-700" /> : <Lock className="h-5 w-5 text-ochre-700" />}
        <h2 className="text-xl font-black">Sustainability layer</h2>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-gray-700">
        <div className="border-2 border-black bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Core access</p>
          <p className="mt-1 font-bold">Practice checklist and manual next actions stay available to community organisations.</p>
        </div>
        <div className="border-2 border-black bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Operating support</p>
          <p className="mt-1 font-bold">
            {operationalAccess
              ? 'Grant management and outcome tracking are active for this workspace.'
              : 'Organisation tier unlocks grant management, outcome tracking, report drafting, and funding operations.'}
          </p>
          {!operationalAccess && access.upgradeUrl && (
            <Link href={access.upgradeUrl} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-ochre-700">
              Review billing
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <Link href={`/hub/${orgSlug}/grants`} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-black text-white">
          Open operating support
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}

function ActionPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-eucalyptus-700" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="space-y-3">
        {hasChildren ? children : <p className="text-sm leading-relaxed text-gray-600">{empty}</p>}
      </div>
    </section>
  );
}

function ActionCard({ action, compact = false }: { action: PracticeReflexAction; compact?: boolean }) {
  const content = (
    <div className={`border-2 p-4 ${priorityClasses(action.priority)} ${compact ? '' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black">{action.title}</p>
          {action.description && <p className="mt-1 text-sm leading-relaxed opacity-80">{action.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide opacity-70">
            <span>{action.priority}</span>
            {action.sourceAgent && <span>{action.sourceAgent.replace('_', ' ')}</span>}
            {action.dueDate && <span>Due {action.dueDate}</span>}
          </div>
        </div>
        {action.href && <ArrowRight className="h-4 w-4 shrink-0" />}
      </div>
    </div>
  );

  if (!action.href) return content;
  return (
    <Link href={action.href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
