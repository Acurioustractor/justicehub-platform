export function Sparkline({ data, width = 80, height = 20, color = '#DC2626' }: {
  data: { fy: string; total: number }[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.total);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const trend = vals[vals.length - 1] > vals[0] ? 'up' : vals[vals.length - 1] < vals[0] ? 'down' : 'flat';
  const trendColor = trend === 'up' ? '#DC2626' : trend === 'down' ? '#059669' : '#888';
  const arrow = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';

  return (
    <span className="inline-flex items-center gap-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-70">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={(vals.length - 1) / (vals.length - 1) * width}
          cy={height - ((vals[vals.length - 1] - min) / range) * (height - 2) - 1}
          r="2"
          fill={color}
        />
      </svg>
      <span className="font-mono text-[10px]" style={{ color: trendColor }}>{arrow}</span>
    </span>
  );
}
