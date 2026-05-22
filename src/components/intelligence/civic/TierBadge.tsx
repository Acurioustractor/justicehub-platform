import { tierLabel } from '@/lib/civic-intelligence/citation-format';

export function TierBadge({ tier, size = 'sm' }: { tier: number | null; size?: 'sm' | 'xs' }) {
  if (!tier) return null;
  const color =
    tier === 1 ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
    : tier === 2 ? 'bg-amber-50 text-amber-900 border-amber-300'
    : 'bg-stone-50 text-stone-700 border-stone-300';
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-widest border rounded ${color} ${padding}`}>
      {tierLabel(tier)}
    </span>
  );
}
