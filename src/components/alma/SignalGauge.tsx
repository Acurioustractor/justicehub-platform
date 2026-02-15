interface SignalGaugeProps {
  label: string;
  value: number; // 0.0 to 1.0
  color?: 'blue' | 'ochre' | 'red' | 'green' | 'purple' | 'gray';
  weight?: number; // For Community Authority (30%)
  inverted?: boolean; // For Harm Risk (lower is better)
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-600',
  ochre: 'bg-ochre-600',
  red: 'bg-red-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  gray: 'bg-gray-600',
};

export function SignalGauge({
  label,
  value,
  color = 'blue',
  weight,
  inverted = false,
  className = '',
}: SignalGaugeProps) {
  const percentage = Math.round(value * 100);
  const displayValue = inverted ? 100 - percentage : percentage;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {displayValue}%
          {weight && (
            <span className="ml-1 text-xs text-gray-500">
              (weight: {weight}%)
            </span>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}
