'use client';

type ConfidenceLevel = 'verified' | 'cross-referenced' | 'estimate';

const LEVEL_CONFIG: Record<ConfidenceLevel, { color: string; label: string }> = {
  verified: { color: 'bg-[#059669]', label: 'Verified' },
  'cross-referenced': { color: 'bg-[#D97706]', label: 'Cross-ref' },
  estimate: { color: 'bg-[#DC2626]', label: 'Estimate' },
};

export default function ConfidenceBadge({
  level,
  source,
}: {
  level: ConfidenceLevel;
  source?: string;
}) {
  const config = LEVEL_CONFIG[level];

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] text-gray-400"
      title={source || config.label}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
