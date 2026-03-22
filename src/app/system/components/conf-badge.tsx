export function ConfBadge({ level }: { level: 'verified' | 'cross-referenced' | 'estimate' }) {
  const styles = {
    verified: 'bg-[#059669]/20 text-[#059669]',
    'cross-referenced': 'bg-amber-500/20 text-amber-400',
    estimate: 'bg-gray-800 text-gray-500',
  };
  const dots = { verified: '#059669', 'cross-referenced': '#D97706', estimate: '#555' };
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${styles[level]}`}>
      <span className="w-1 h-1 rounded-full" style={{ background: dots[level] }} />
      {level}
    </span>
  );
}
