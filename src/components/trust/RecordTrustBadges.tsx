import { cn } from '@/lib/utils';

export type RecordTrustBadgeTone =
  | 'neutral'
  | 'review'
  | 'warning'
  | 'promising'
  | 'strong'
  | 'community'
  | 'source';

export interface RecordTrustBadge {
  label: string;
  tone?: RecordTrustBadgeTone;
  title?: string;
}

export interface RecordTrustBadgeInput {
  evidenceLevel?: string | null;
  verificationStatus?: string | null;
  reviewStatus?: string | null;
  hasLocation?: boolean | null;
  locationLabel?: string | null;
  hasCostData?: boolean | null;
  hasSource?: boolean | null;
  sourceFresh?: boolean | null;
  sourceLabel?: string | null;
  communityControlled?: boolean | null;
  humanConfirmed?: boolean | null;
  showReview?: boolean;
  compact?: boolean;
  maxBadges?: number;
  extraBadges?: RecordTrustBadge[];
}

const toneClasses: Record<RecordTrustBadgeTone, string> = {
  neutral: 'border-stone-300 bg-stone-50 text-stone-700',
  review: 'border-stone-300 bg-white text-stone-600',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  promising: 'border-blue-300 bg-blue-50 text-blue-800',
  strong: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  community: 'border-purple-300 bg-purple-50 text-purple-800',
  source: 'border-sky-300 bg-sky-50 text-sky-800',
};

function evidenceBadge(evidenceLevel?: string | null): RecordTrustBadge {
  const level = (evidenceLevel || '').trim().toLowerCase();

  if (level.startsWith('proven')) {
    return {
      label: 'Proven',
      tone: 'strong',
      title: evidenceLevel || 'Proven evidence level',
    };
  }

  if (level.startsWith('effective')) {
    return {
      label: 'Effective',
      tone: 'strong',
      title: evidenceLevel || 'Effective evidence level',
    };
  }

  if (level.startsWith('indigenous')) {
    return {
      label: 'Indigenous-led',
      tone: 'community',
      title: evidenceLevel || 'Indigenous-led evidence and authority signal',
    };
  }

  if (level.startsWith('promising')) {
    return {
      label: 'Promising',
      tone: 'promising',
      title: evidenceLevel || 'Promising evidence level',
    };
  }

  return {
    label: 'Untested',
    tone: 'warning',
    title: evidenceLevel || 'Untested or not yet evidence-rated',
  };
}

function reviewBadge(input: RecordTrustBadgeInput): RecordTrustBadge {
  const verification = (input.verificationStatus || '').toLowerCase();
  const review = (input.reviewStatus || '').toLowerCase();

  if (input.humanConfirmed || verification === 'human_verified' || verification === 'verified') {
    return {
      label: 'Human verified',
      tone: 'strong',
      title: 'A human reviewer has confirmed this record.',
    };
  }

  if (verification === 'community_verified') {
    return {
      label: 'Community verified',
      tone: 'community',
      title: 'A community or sector reviewer has confirmed this record.',
    };
  }

  if (review === 'approved' || review === 'published') {
    return {
      label: 'Reviewed',
      tone: 'strong',
      title: `Review status: ${input.reviewStatus}`,
    };
  }

  return {
    label: 'Needs review',
    tone: 'review',
    title: verification || review ? `Status: ${[input.verificationStatus, input.reviewStatus].filter(Boolean).join(' / ')}` : 'This record still needs human review.',
  };
}

export function buildRecordTrustBadges(input: RecordTrustBadgeInput): RecordTrustBadge[] {
  const badges: RecordTrustBadge[] = [];
  if (input.evidenceLevel !== undefined) badges.push(evidenceBadge(input.evidenceLevel));
  if (input.showReview !== false) badges.push(reviewBadge(input));

  if (input.communityControlled) {
    badges.push({
      label: 'Community verified',
      tone: 'community',
      title: 'Community-controlled or community-led signal.',
    });
  }

  if (input.hasLocation) {
    badges.push({
      label: 'Local',
      tone: 'neutral',
      title: input.locationLabel || 'This record has a location or geographic coverage.',
    });
  }

  if (input.hasCostData) {
    badges.push({
      label: 'Cost data',
      tone: 'strong',
      title: 'This record includes a cost value or cost category.',
    });
  }

  if (input.hasSource) {
    badges.push({
      label: 'Source linked',
      tone: 'source',
      title: input.sourceLabel || 'This record links back to a source.',
    });
  }

  if (input.hasSource && input.sourceFresh) {
    badges.push({
      label: 'Fresh check',
      tone: 'source',
      title: 'The linked source has been checked recently.',
    });
  }

  if (input.extraBadges?.length) badges.push(...input.extraBadges);

  const seen = new Set<string>();
  const unique = badges.filter((badge) => {
    const key = badge.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return typeof input.maxBadges === 'number' ? unique.slice(0, input.maxBadges) : unique;
}

export function RecordTrustBadges({
  className,
  badgeClassName,
  ...input
}: RecordTrustBadgeInput & {
  className?: string;
  badgeClassName?: string;
}) {
  const badges = buildRecordTrustBadges(input);
  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map((badge) => (
        <span
          key={badge.label}
          title={badge.title}
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
            input.compact ? 'px-1.5 py-0 text-[9px]' : null,
            toneClasses[badge.tone || 'neutral'],
            badgeClassName,
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

const legendBadges: RecordTrustBadge[] = [
  { label: 'Untested', tone: 'warning', title: 'Not yet evidence-rated.' },
  { label: 'Promising', tone: 'promising', title: 'Community-endorsed or emerging evidence.' },
  { label: 'Community verified', tone: 'community', title: 'Confirmed through community or sector review.' },
  { label: 'Human verified', tone: 'strong', title: 'Confirmed by a human reviewer.' },
  { label: 'Local', tone: 'neutral', title: 'Location or geographic coverage is available.' },
  { label: 'Cost data', tone: 'strong', title: 'Cost data is available.' },
  { label: 'Source linked', tone: 'source', title: 'A source URL or source trail is available.' },
  { label: 'Fresh check', tone: 'source', title: 'The linked source has been checked recently.' },
  { label: 'Needs review', tone: 'review', title: 'Still needs stronger review or confirmation.' },
];

export function TrustBadgeLegend({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-stone-200 bg-white/80 p-3', className)}>
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
        Badge guide
      </p>
      <div className="flex flex-wrap gap-1.5">
        {legendBadges.map((badge) => (
          <span
            key={badge.label}
            title={badge.title}
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
              toneClasses[badge.tone || 'neutral'],
            )}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </div>
  );
}
