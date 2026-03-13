'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, ShieldAlert } from 'lucide-react';

type ActionableBundle = {
  placeKey: string;
  lifecycleStatus: string;
  reviewStatus: string;
  overallConfidence: number;
};

interface ReviewPendingActionsProps {
  bundles: ActionableBundle[];
}

export default function ReviewPendingActions({ bundles }: ReviewPendingActionsProps) {
  const router = useRouter();
  const [activePlaceKey, setActivePlaceKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function queueRepairRefresh(placeKey: string) {
    setActivePlaceKey(placeKey);

    try {
      const response = await fetch('/api/admin/governed-proof/place-bundles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'queue_repair_refresh',
          placeKey,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' ? payload.error : 'Failed to queue repair refresh'
        );
      }

      const taskId =
        payload?.task && typeof payload.task.id === 'string' ? payload.task.id : 'unknown-task';
      alert(
        payload?.reusedExistingTask
          ? `Repair task already queued for ${placeKey}. Task ${taskId}.`
          : `Queued repair refresh for ${placeKey}. Task ${taskId}.`
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Failed to queue governed-proof repair refresh:', error);
      alert(error instanceof Error ? error.message : 'Failed to queue repair refresh.');
    } finally {
      setActivePlaceKey(null);
    }
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-50 border-2 border-amber-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">
            <ShieldAlert className="h-3.5 w-3.5" />
            Review Pending
          </div>
          <h2 className="text-2xl font-black text-black">Actionable Weak Bundles</h2>
          <p className="text-sm text-gray-700 mt-2 max-w-3xl">
            Queue a repair refresh for bundles that are low-confidence or already flagged for
            operator review. This creates a shared repair-lane task without widening promotion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bundles.map((bundle) => {
          const isActive = activePlaceKey === bundle.placeKey;
          return (
            <div key={bundle.placeKey} className="border-2 border-black p-5 bg-amber-50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <div className="text-2xl font-black text-black">{bundle.placeKey}</div>
                  <div className="text-xs uppercase tracking-wide text-amber-800">
                    {bundle.lifecycleStatus} · {bundle.reviewStatus}
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-700">
                  {bundle.overallConfidence.toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void queueRepairRefresh(bundle.placeKey)}
                disabled={isPending || isActive}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`h-4 w-4 ${isActive ? 'animate-spin' : ''}`} />
                {isActive ? 'Queueing Repair…' : 'Queue Repair Refresh'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
