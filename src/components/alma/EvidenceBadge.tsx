interface EvidenceBadgeProps {
  evidenceCount: number;
  evidenceType?:
    | 'RCT (Randomized Control Trial)'
    | 'Quasi-experimental'
    | 'Program evaluation'
    | 'Longitudinal study'
    | 'Case study'
    | 'Community-led research'
    | 'Lived experience'
    | 'Cultural knowledge'
    | 'Policy analysis'
    | null;
  compact?: boolean;
}

export function EvidenceBadge({
  evidenceCount,
  evidenceType,
  compact = false,
}: EvidenceBadgeProps) {
  if (evidenceCount === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
        No Evidence
      </span>
    );
  }

  // Determine color based on evidence type strength
  const getColorClass = () => {
    if (evidenceType === 'RCT (Randomized Control Trial)') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (
      evidenceType === 'Quasi-experimental' ||
      evidenceType === 'Program evaluation'
    ) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (
      evidenceType === 'Community-led research' ||
      evidenceType === 'Cultural knowledge'
    ) {
      return 'bg-ochre-100 text-ochre-800 border-ochre-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getTypeAbbreviation = () => {
    if (!evidenceType) return '';
    if (evidenceType === 'RCT (Randomized Control Trial)') return 'RCT';
    if (evidenceType === 'Quasi-experimental') return 'Quasi-exp';
    if (evidenceType === 'Program evaluation') return 'Program eval';
    if (evidenceType === 'Community-led research') return 'Community-led';
    return evidenceType;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getColorClass()}`}
    >
      {evidenceCount} Evidence {evidenceCount === 1 ? 'Record' : 'Records'}
      {!compact && evidenceType && (
        <span className="ml-1.5 opacity-75">({getTypeAbbreviation()})</span>
      )}
    </span>
  );
}
