import * as React from 'react';

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const normalized = status.toLowerCase();
  let color = 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60';

  if (normalized.includes('accepted') || normalized.includes('delivered') || normalized.includes('implemented')) {
    color = 'bg-[#059669]/10 text-[#059669]';
  } else if (normalized.includes('rejected')) {
    color = 'bg-[#DC2626]/10 text-[#DC2626]';
  } else if (normalized.includes('partial') || normalized.includes('progress') || normalized.includes('pending')) {
    color = 'bg-[#F59E0B]/10 text-[#D97706]';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${color}`}>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null;

  const normalized = severity.toLowerCase();
  let color = 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60';

  if (normalized === 'critical') color = 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20';
  if (normalized === 'high') color = 'bg-[#F97316]/10 text-[#EA580C] border border-[#F97316]/20';
  if (normalized === 'medium') color = 'bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${color}`}>
      {severity}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  onClick,
  isActive = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl border p-5 text-left transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${
        isActive
          ? 'border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]'
          : 'border-[#0A0A0A]/10'
      }`}
      style={{ backgroundColor: isActive ? 'white' : '#F5F0E8' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#0A0A0A]/50" />
        <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">{label}</span>
      </div>
      <div
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-[#0A0A0A]/50 mt-1 font-mono">{sub}</div>}
    </button>
  );
}

export function BigStat({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="text-center">
      <div
        className="text-5xl md:text-6xl font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </div>
      <div className="text-sm font-mono text-[#0A0A0A]/60 mt-2 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-[#0A0A0A]/40 mt-1">{sub}</div>}
    </div>
  );
}
