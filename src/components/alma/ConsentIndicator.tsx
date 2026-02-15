interface ConsentIndicatorProps {
  consentLevel: 'Public Knowledge Commons' | 'Community Controlled' | 'Strictly Private';
  culturalAuthority?: string | null;
  showAuthority?: boolean;
  compact?: boolean;
}

export function ConsentIndicator({
  consentLevel,
  culturalAuthority,
  showAuthority = true,
  compact = false,
}: ConsentIndicatorProps) {
  const getColorClass = () => {
    switch (consentLevel) {
      case 'Public Knowledge Commons':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Community Controlled':
        return 'bg-ochre-100 text-ochre-800 border-ochre-200';
      case 'Strictly Private':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = () => {
    if (compact) {
      switch (consentLevel) {
        case 'Public Knowledge Commons':
          return 'Public';
        case 'Community Controlled':
          return 'Community';
        case 'Strictly Private':
          return 'Private';
        default:
          return consentLevel;
      }
    }
    return consentLevel;
  };

  return (
    <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getColorClass()}`}
      >
        {getLabel()}
      </span>

      {showAuthority && culturalAuthority && (
        <span className="text-sm text-gray-600">
          <span className="font-medium">Governed by:</span>{' '}
          <span className="text-gray-800">{culturalAuthority}</span>
        </span>
      )}
    </div>
  );
}
