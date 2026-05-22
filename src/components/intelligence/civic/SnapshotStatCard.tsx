import { CivicClaim, regionLabel } from '@/lib/civic-intelligence/citation-format';
import { CopyCitationButton } from './CopyCitationButton';
import { TierBadge } from './TierBadge';

interface Props {
  claim: CivicClaim;
  /** Override the display value with a formatted variant. */
  displayValue?: string;
  /** Sub-label rendered below the value, e.g. context like "Queensland" or "since 2023". */
  context?: string;
  /** Severity / accent color. Defaults to 'neutral'. */
  accent?: 'neutral' | 'urgent' | 'positive';
  /** Headline-sized variant for chapter intros. */
  size?: 'sm' | 'md' | 'lg';
}

export function SnapshotStatCard({ claim, displayValue, context, accent = 'neutral', size = 'md' }: Props) {
  const accentClass =
    accent === 'urgent' ? 'border-rose-300 bg-rose-50'
    : accent === 'positive' ? 'border-emerald-300 bg-emerald-50'
    : 'border-stone-300 bg-white';

  const valueClass =
    size === 'lg' ? 'text-5xl font-bold tracking-tight'
    : size === 'md' ? 'text-3xl font-bold'
    : 'text-2xl font-semibold';

  const value = displayValue || claim.value_text || (claim.value_numeric != null ? String(claim.value_numeric) : 'n/a');
  const isInsufficient = (claim.value_text || '').toLowerCase().startsWith('insufficient');

  return (
    <article id={claim.claim_id} className={`p-5 border rounded-lg ${accentClass}`}>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TierBadge tier={claim.tier} size="xs" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{regionLabel(claim.region)}</span>
        </div>
        <CopyCitationButton claim={claim} />
      </header>
      <div className={`${valueClass} ${isInsufficient ? 'text-stone-400 italic' : 'text-stone-900'}`}>
        {value}
      </div>
      {context && <p className="mt-2 text-sm text-stone-600">{context}</p>}
      <p className="mt-3 text-xs font-mono text-stone-500">{claim.display_label}</p>
    </article>
  );
}
