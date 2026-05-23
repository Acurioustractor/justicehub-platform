import { CivicClaim, regionLabel } from '@/lib/civic-intelligence/citation-format';
import { CopyCitationButton } from './CopyCitationButton';
import { TierBadge } from './TierBadge';

interface Props {
  claim: CivicClaim;
  displayValue?: string;
  context?: string;
  accent?: 'neutral' | 'urgent' | 'positive';
  size?: 'sm' | 'md' | 'lg';
  /** Triangulation tier from v_claim_evidence_summary, optional. */
  triangulationTier?: 'triangulated' | 'corroborated' | 'single_source' | 'no_evidence' | null;
  /** Source count when tier is provided. */
  supportingSources?: number;
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  triangulated: { label: 'Triangulated', cls: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
  corroborated: { label: 'Corroborated', cls: 'text-amber-700 bg-amber-100 border-amber-300' },
  single_source: { label: 'Single source', cls: 'text-rose-700 bg-rose-100 border-rose-300' },
  no_evidence: { label: 'No evidence', cls: 'text-stone-600 bg-stone-100 border-stone-300' },
};

export function SnapshotStatCard({ claim, displayValue, context, accent = 'neutral', size = 'md', triangulationTier, supportingSources }: Props) {
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
          {triangulationTier && TIER_BADGE[triangulationTier] && (
            <span
              title={supportingSources ? `Backed by ${supportingSources} independent source${supportingSources === 1 ? '' : 's'}` : undefined}
              className={`text-[10px] font-mono uppercase tracking-widest border px-1.5 py-0.5 rounded ${TIER_BADGE[triangulationTier].cls}`}
            >
              {TIER_BADGE[triangulationTier].label}
              {supportingSources ? ` · ${supportingSources}` : ''}
            </span>
          )}
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
