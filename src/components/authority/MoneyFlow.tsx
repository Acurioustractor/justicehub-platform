'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface MoneyFlowProps {
  data: any;
  totalFunding?: number;
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Clear detention-vs-community split visualization.
 */
export default function MoneyFlow({ data, totalFunding = 97_900_000_000 }: MoneyFlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  const detentionSpend = 1_080_000_000;
  const policeYouthSpend = 2_400_000_000;
  const courtsCustody = 890_000_000;
  const systemTotal = detentionSpend + policeYouthSpend + courtsCustody;
  const communitySpend = 187_000_000;
  const total = systemTotal + communitySpend;

  const splits = [
    {
      label: 'Detention & custody',
      amount: detentionSpend,
      pct: ((detentionSpend / total) * 100).toFixed(0),
      color: 'bg-red-600',
      barColor: '#dc2626',
      sublabel: '$7,304/day per child in VIC. 84% reoffend.',
    },
    {
      label: 'Policing (youth)',
      amount: policeYouthSpend,
      pct: ((policeYouthSpend / total) * 100).toFixed(0),
      color: 'bg-orange-600',
      barColor: '#ea580c',
      sublabel: 'Arrest. Process. Repeat.',
    },
    {
      label: 'Courts & legal aid',
      amount: courtsCustody,
      pct: ((courtsCustody / total) * 100).toFixed(0),
      color: 'bg-amber-600',
      barColor: '#d97706',
      sublabel: 'Processing, not prevention.',
    },
    {
      label: 'Community programs',
      amount: communitySpend,
      pct: ((communitySpend / total) * 100).toFixed(0),
      color: 'bg-emerald-600',
      barColor: '#059669',
      sublabel: '981 alternatives exist. $351/day. They work.',
    },
  ];

  return (
    <div ref={ref} className="py-2">
      {/* The punch line */}
      <div
        className="mb-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div
          className="text-[clamp(32px,4vw,56px)] font-bold text-[#F5F0E8] tracking-[-0.03em] leading-[1.1]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          For every{' '}
          <span className="text-red-500">$23</span> spent locking kids up,{' '}
          <span className="text-emerald-500">$1</span> goes to keeping them out.
        </div>
      </div>

      {/* Stacked proportion bar */}
      <div
        className="mb-8"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.2s',
        }}
      >
        <div className="w-full h-12 md:h-16 flex overflow-hidden">
          {splits.map((s, i) => (
            <div
              key={s.label}
              className={`h-full ${s.color} relative group`}
              style={{
                width: visible ? `${(s.amount / total) * 100}%` : '0%',
                transition: `width 0.8s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.15}s`,
              }}
            >
              {s.amount / total > 0.12 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-80 px-1 truncate">
                    {s.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-1">
          <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-wider">
            community {splits[3].pct}%
          </div>
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-4">
        {splits.map((s, i) => (
          <div
            key={s.label}
            className="flex items-start gap-4"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateX(-40px)',
              transition: `opacity 0.5s ease ${0.6 + i * 0.1}s, transform 0.5s ease ${0.6 + i * 0.1}s`,
            }}
          >
            <div className="w-3 h-3 rounded-sm shrink-0 mt-1.5" style={{ backgroundColor: s.barColor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-bold text-[#F5F0E8]">{s.label}</span>
                <span
                  className="text-lg md:text-xl font-bold shrink-0"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: s.barColor }}
                >
                  {formatDollars(s.amount)}
                </span>
              </div>
              <p className="text-xs text-[#F5F0E8]/35 mt-0.5">{s.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      <p
        className="font-mono text-[10px] text-[#F5F0E8]/15 mt-8"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 1.2s' }}
      >
        Source: Productivity Commission ROGS 2024-25, AIHW Youth Justice 2023-24, state budget papers
      </p>
    </div>
  );
}
