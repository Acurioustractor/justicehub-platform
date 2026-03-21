'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';

interface Program {
  name: string;
  evidenceLevel: string;
  type?: string;
}

interface CaseStudy {
  orgName: string;
  programs: Program[];
  totalPrograms: number;
  govFunding: number;
  costPerParticipant: number;
  description: string;
}

function getEvidenceBadge(level: string) {
  if (level?.startsWith('Proven')) return { label: 'Proven', color: 'bg-emerald-700 text-white' };
  if (level?.startsWith('Effective')) return { label: 'Effective', color: 'bg-emerald-600 text-white' };
  if (level?.startsWith('Promising')) return { label: 'Promising', color: 'bg-amber-500/90 text-black' };
  if (level?.startsWith('Indigenous')) return { label: 'Indigenous-led', color: 'bg-purple-600 text-white' };
  return { label: 'Untested', color: 'bg-gray-600 text-white' };
}

function CaseCard({ study, index }: { study: CaseStudy; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  const detentionCost = 2666960;
  const participantCost = study.costPerParticipant;
  const ratio = Math.round(detentionCost / participantCost);

  return (
    <div
      ref={ref}
      className="border border-gray-800 hover:border-gray-600 transition-colors"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(50px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.15}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.15}s`,
      }}
    >
      {/* Header */}
      <div className="p-5 md:p-8 border-b border-gray-800">
        <h3 className="text-xl md:text-3xl font-bold tracking-[-0.02em] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{study.orgName}</h3>
        <p className="text-xs md:text-sm text-[#F5F0E8]/40 leading-relaxed">{study.description}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
        <div className="p-2 md:p-5 text-center overflow-hidden">
          <div className="text-sm md:text-lg font-bold text-red-500 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>${study.govFunding.toLocaleString()}</div>
          <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35 mt-1">gov funding</div>
        </div>
        <div className="p-2 md:p-5 text-center overflow-hidden">
          <div className="text-sm md:text-lg font-bold text-[#F5F0E8] truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{study.totalPrograms}</div>
          <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35 mt-1">programs</div>
        </div>
        <div className="p-2 md:p-5 text-center overflow-hidden">
          <div className="text-sm md:text-lg font-bold text-emerald-500 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>${participantCost.toLocaleString()}</div>
          <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35 mt-1">per participant</div>
        </div>
      </div>

      {/* Programs list */}
      <div className="p-5 md:p-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-4">Programs</div>
        <div className="space-y-2 mb-6">
          {study.programs.slice(0, 5).map((prog, i) => {
            const badge = getEvidenceBadge(prog.evidenceLevel);
            return (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-sm text-gray-300 truncate">{prog.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
          {study.programs.length > 5 && (
            <div className="text-xs text-gray-600">+{study.programs.length - 5} more programs</div>
          )}
        </div>

        {/* Cost comparison callout */}
        <div className="p-4 bg-gray-950 border border-gray-800">
          <div className="text-xs text-gray-500 mb-2">The math</div>
          <p className="text-sm text-gray-300">
            <span className="text-emerald-500 font-bold">${participantCost.toLocaleString()}</span> per participant vs{' '}
            <span className="text-red-500 font-bold">$2.67M</span> per year in detention.
          </p>
          <p className="text-lg font-bold text-[#F5F0E8] mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {ratio.toLocaleString()}x more effective per dollar. Same kid.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CaseStudyCards({ studies }: { studies: CaseStudy[] }) {
  return (
    <div className="container-justice px-5 md:px-8">
      <div className="mb-8 md:mb-12">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
          The Heroes
        </div>
        <h2 className="text-2xl md:text-5xl font-bold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Zero dollars. Proven results.
        </h2>
        <p className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 mt-4 max-w-2xl leading-relaxed">
          These organisations run evidence-rated programs with little to no government funding.
          The system pays millions to lock up the same kids they help for thousands.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {studies.map((study, i) => (
          <CaseCard key={study.orgName} study={study} index={i} />
        ))}
      </div>
    </div>
  );
}
