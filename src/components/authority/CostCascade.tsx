'use client';

import { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

interface StateDetention {
  state: string;
  costPerDay: number;
  annual: number;
}

interface CostCascadeProps {
  stateDetention: StateDetention[];
}

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000, visible = false }: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  visible?: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function CostCascade({ stateDetention }: CostCascadeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.02 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  const maxCost = Math.max(...stateDetention.map(s => s.costPerDay));
  const communityCost = 351;

  return (
    <div ref={containerRef} className="container-justice px-5 md:px-8">
      {/* Headline cascade */}
      <div className="max-w-4xl mb-12 md:mb-24">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(40px)',
            transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-4 md:mb-6">
            The Price of a Child
          </div>
          <div className="text-[clamp(48px,10vw,140px)] font-bold text-red-500 tracking-[-0.04em] leading-[0.9] mb-3 md:mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <AnimatedCounter target={7304} prefix="$" visible={visible} />
          </div>
          <p className="text-base md:text-lg text-[#F5F0E8]/50">/day to cage one child in Victoria</p>
        </div>

        <div
          className="mt-6 md:mt-8 pl-4 md:pl-5 border-l-2 border-[#F5F0E8]/10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateX(-40px)',
            transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
          }}
        >
          <p className="text-xl md:text-[28px] font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            x 365 = <span className="text-red-500">$2.67M/year</span>
          </p>
        </div>

        <div
          className="mt-4 md:mt-6 pl-4 md:pl-5 border-l-2 border-[#F5F0E8]/10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateX(-40px)',
            transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s',
          }}
        >
          <p className="text-xl md:text-[28px] font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            x 825 children = <span className="text-red-500">$1.08B</span>
          </p>
        </div>

        <div
          className="mt-8 inline-block"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'scale(1.1)',
            transition: 'opacity 0.4s ease 0.7s, transform 0.4s ease 0.7s',
          }}
        >
          <div className="px-6 py-4 border border-red-600/30 bg-red-950/10">
            <span className="text-[56px] font-bold text-red-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>84%</span>
            <div className="text-sm text-[#F5F0E8]/50 mt-1">reoffend within two years of release</div>
          </div>
        </div>
      </div>

      {/* State-by-state bars */}
      <div className="space-y-2 md:space-y-3">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-4 md:mb-6">
          Cost per day by state
        </div>
        {stateDetention.map((s, i) => (
          <div
            key={s.state}
            className="flex items-center gap-2 md:gap-4"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateX(-60px)',
              transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
            }}
          >
            <div className="w-8 md:w-10 font-mono text-[11px] md:text-[13px] font-semibold text-[#F5F0E8]/50 text-right shrink-0">{s.state}</div>
            <div className="flex-1 h-6 md:h-8 bg-gray-900 relative overflow-hidden">
              <div
                className="h-full bg-red-600"
                style={{
                  width: visible ? `${(s.costPerDay / maxCost) * 100}%` : '0%',
                  transition: `width 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.08}s`,
                }}
              />
            </div>
            <div className="w-16 md:w-24 font-mono text-[11px] md:text-[13px] font-bold text-[#F5F0E8]/70 text-right shrink-0">
              ${s.costPerDay.toLocaleString()}
            </div>
          </div>
        ))}

        {/* Community cost comparison */}
        <div
          className="flex items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-4 border-t border-gray-800"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateX(-60px)',
            transition: 'opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s',
          }}
        >
          <div className="w-8 md:w-10 font-mono text-[10px] md:text-[11px] font-bold text-emerald-500 text-right shrink-0">COMM</div>
          <div className="flex-1 h-6 md:h-8 bg-gray-900 relative overflow-hidden">
            <div
              className="h-full bg-emerald-600"
              style={{
                width: visible ? `${(communityCost / maxCost) * 100}%` : '0%',
                transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1) 0.9s',
              }}
            />
          </div>
          <div className="w-16 md:w-24 font-mono text-[11px] md:text-[13px] font-bold text-emerald-500 text-right shrink-0">
            $351
          </div>
        </div>

        <p className="font-mono text-[10px] text-[#F5F0E8]/20 mt-4">
          Source: Productivity Commission ROGS 2024-25, Table 17A. Community = average community supervision cost.
        </p>
      </div>
    </div>
  );
}
