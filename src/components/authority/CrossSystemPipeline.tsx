'use client';

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface DecileData {
  decile: number;
  orgCount: number;
  totalFunding: number;
  grantCount: number;
}

interface LgaRow {
  lgaCode: string;
  lgaName: string;
  state: string;
  avgIcsea: number | null;
  detentionBeds: number;
  youthOffenders: number;
  youthOffenderRate: number | null;
  jhFunding: number;
  jhOrgCount: number;
  pipelineIntensity: number;
}

interface CrossSystemData {
  disability: {
    cognitiveDisabilityPct: string;
    fasdPrevalence: string;
    ndisGap: string;
    findingsCount: number;
  };
  childProtection: {
    crossoverPct: string;
    description: string;
    findingsCount: number;
  };
  poverty: {
    byDecile: DecileData[];
    bottom3: { orgCount: number; totalFunding: number };
    top3: { orgCount: number; totalFunding: number };
    disparity: number | null;
  };
  lgaHeatmap?: LgaRow[];
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function PipelineArrow() {
  return (
    <div className="flex items-center justify-center py-3 md:py-0 md:px-2">
      <svg width="40" height="24" viewBox="0 0 40 24" className="text-red-600/40 rotate-90 md:rotate-0">
        <path d="M4 12h28M26 6l8 6-8 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Heatmap cell: maps a 0-100 value to red intensity */
function HeatCell({ value, max, label, suffix }: { value: number; max: number; label?: string; suffix?: string }) {
  const intensity = max > 0 ? Math.min(value / max, 1) : 0;
  const bg = intensity > 0.7
    ? 'bg-red-600/60'
    : intensity > 0.4
      ? 'bg-red-600/30'
      : intensity > 0.1
        ? 'bg-red-600/15'
        : 'bg-[#F5F0E8]/5';

  return (
    <td className={`px-2 py-1.5 text-right font-mono text-[11px] ${bg}`}>
      <span className="text-[#F5F0E8]/70">{label ?? (value > 0 ? value.toLocaleString() : '—')}</span>
      {suffix && value > 0 && <span className="text-[#F5F0E8]/30 ml-0.5">{suffix}</span>}
    </td>
  );
}

function IntensityBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <td className="px-2 py-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[#F5F0E8]/5 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-[10px] font-mono text-[#F5F0E8]/40 w-7 text-right">{value}</span>
      </div>
    </td>
  );
}

export default function CrossSystemPipeline() {
  const [data, setData] = useState<CrossSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.02 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  useEffect(() => {
    fetch('/api/authority/cross-system')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-justice px-5 md:px-8">
        <div className="h-[300px] bg-[#F5F0E8]/5 animate-pulse flex items-center justify-center">
          <span className="text-[#F5F0E8]/20 font-mono text-sm">Loading cross-system data...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxDecileFunding = Math.max(...data.poverty.byDecile.map(d => d.totalFunding));

  const pipelineCards = [
    {
      label: 'Child Protection',
      stat: data.childProtection.crossoverPct,
      desc: "of detained children had prior child protection contact. In Queensland, it's 72.9%. For First Nations kids: 81.2%.",
      meta: `${data.childProtection.findingsCount} research findings tracked`,
      borderColor: 'border-amber-800/40',
      bgColor: 'bg-amber-950/10',
      labelColor: 'text-amber-500/60',
      statColor: 'text-amber-500',
      metaColor: 'text-amber-500/30',
    },
    {
      label: 'Youth Detention',
      stat: '84%',
      desc: 'reoffending rate. The system catches them, warehouses them, and releases them — changed only for the worse.',
      meta: '$2.6M per child per year',
      borderColor: 'border-red-600/60 border-2',
      bgColor: 'bg-red-950/20',
      labelColor: 'text-red-500/60',
      statColor: 'text-red-500',
      metaColor: 'text-red-500/30',
    },
    {
      label: 'Disability / NDIS',
      stat: data.disability.cognitiveDisabilityPct,
      desc: `of detained youth have a cognitive disability, speech disorder, or learning disability. ${data.disability.fasdPrevalence} have FASD. Most are undiagnosed.`,
      meta: `${data.disability.findingsCount} research findings tracked`,
      borderColor: 'border-blue-800/40',
      bgColor: 'bg-blue-950/10',
      labelColor: 'text-blue-400/60',
      statColor: 'text-blue-400',
      metaColor: 'text-blue-400/30',
    },
  ];

  // LGA heatmap data
  const lgaRows = data.lgaHeatmap || [];
  const displayRows = showAll ? lgaRows : lgaRows.slice(0, 20);
  const maxOffenders = Math.max(...lgaRows.map(r => r.youthOffenders));
  const maxFunding = Math.max(...lgaRows.map(r => r.jhFunding));
  const maxBeds = Math.max(...lgaRows.map(r => r.detentionBeds));

  return (
    <div ref={sectionRef} className="container-justice px-5 md:px-8">
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
          The Invisible Pipeline
        </div>
        <h2
          className="text-2xl md:text-5xl font-bold tracking-[-0.02em] text-[#F5F0E8] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Same kids. Three systems. Zero coordination.
        </h2>
        <p className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-2xl leading-relaxed">
          Children don&apos;t arrive in detention from nowhere. The same kids cycle through child protection,
          disability services, and poverty before the justice system catches them.
          Here&apos;s the data trail.
        </p>
      </div>

      {/* Pipeline flow — three connected nodes */}
      <div className="flex flex-col md:flex-row items-stretch gap-0 mb-12">
        {pipelineCards.map((card, i) => (
          <div key={card.label} className="contents">
            {i > 0 && <PipelineArrow />}
            <div
              className={`flex-1 border ${card.borderColor} ${card.bgColor} p-5 md:p-6`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${0.1 + i * 0.15}s, transform 0.5s ease ${0.1 + i * 0.15}s`,
              }}
            >
              <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${card.labelColor} mb-3`}>
                {card.label}
              </div>
              <div
                className={`text-4xl md:text-5xl font-bold ${card.statColor} mb-2`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {card.stat}
              </div>
              <p className="text-xs text-[#F5F0E8]/40 leading-relaxed mb-3">
                {card.desc}
              </p>
              <div className={`text-[10px] font-mono ${card.metaColor}`}>
                {card.meta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Poverty layer — SEIFA bars */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s',
        }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/25 mb-1">
              The Foundation: Poverty
            </div>
            <h3
              className="text-lg md:text-xl font-bold text-[#F5F0E8]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Funding by community disadvantage
            </h3>
          </div>
          {data.poverty.disparity && (
            <div className="text-right hidden sm:block">
              <div
                className="text-2xl font-bold text-red-500"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {data.poverty.disparity.toFixed(1)}x
              </div>
              <div className="text-[10px] font-mono text-[#F5F0E8]/25">
                more per-org in wealthy areas
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-2">
          <span className="text-[10px] font-mono text-[#F5F0E8]/20">Most disadvantaged</span>
          <span className="text-[10px] font-mono text-[#F5F0E8]/20">Least disadvantaged</span>
        </div>

        <div className="space-y-1.5">
          {data.poverty.byDecile.map((d, i) => (
            <div key={d.decile} className="flex items-center gap-3">
              <div className="w-6 text-right">
                <span className="text-[10px] font-mono text-[#F5F0E8]/25">{d.decile}</span>
              </div>
              <div className="flex-1 h-6 bg-[#F5F0E8]/5 overflow-hidden">
                <div
                  className={`h-full ${d.decile <= 3 ? 'bg-red-600' : d.decile >= 8 ? 'bg-emerald-600' : 'bg-[#F5F0E8]/20'}`}
                  style={{
                    width: visible ? `${maxDecileFunding > 0 ? (d.totalFunding / maxDecileFunding) * 100 : 0}%` : '0%',
                    transition: `width 1s cubic-bezier(0.22,1,0.36,1) ${0.6 + i * 0.06}s`,
                  }}
                />
              </div>
              <div className="w-20 text-right">
                <span className="text-[10px] font-mono text-[#F5F0E8]/30">
                  {formatDollars(d.totalFunding)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-gray-800">
          <div>
            <span className="text-sm font-bold text-red-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatDollars(data.poverty.bottom3.totalFunding)}
            </span>
            <span className="text-[11px] text-[#F5F0E8]/30 ml-2">
              to {data.poverty.bottom3.orgCount.toLocaleString()} orgs in most disadvantaged areas
            </span>
          </div>
          <div>
            <span className="text-sm font-bold text-emerald-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatDollars(data.poverty.top3.totalFunding)}
            </span>
            <span className="text-[11px] text-[#F5F0E8]/30 ml-2">
              to {data.poverty.top3.orgCount.toLocaleString()} orgs in least disadvantaged areas
            </span>
          </div>
        </div>
      </div>

      {/* LGA Pipeline Heatmap */}
      {lgaRows.length > 0 && (
        <div
          className="mt-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s',
          }}
        >
          <div className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/25 mb-1">
              Community-Level Evidence
            </div>
            <h3
              className="text-lg md:text-2xl font-bold text-[#F5F0E8] mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Where every system fails at once
            </h3>
            <p className="text-[13px] text-[#F5F0E8]/35 max-w-xl leading-relaxed">
              The same 20 LGAs that fail kids in schools and trap families in welfare are where
              youth get criminalised and detained. It&apos;s not three separate problems — it&apos;s one pipeline.
            </p>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-[#F5F0E8]/10">
                  <th className="text-left px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium">LGA</th>
                  <th className="text-left px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium w-10">State</th>
                  <th className="text-right px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium">
                    <span title="SEIFA IRSD — lower = more disadvantaged">SEIFA</span>
                  </th>
                  <th className="text-right px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium">Youth Crime</th>
                  <th className="text-right px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium">Detention Beds</th>
                  <th className="text-right px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium">JH Funding</th>
                  <th className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 font-medium w-32">Pipeline Score</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr
                    key={row.lgaCode}
                    className="border-b border-[#F5F0E8]/5 hover:bg-[#F5F0E8]/5 transition-colors"
                    style={{
                      opacity: visible ? 1 : 0,
                      transition: `opacity 0.3s ease ${0.9 + i * 0.03}s`,
                    }}
                  >
                    <td className="px-2 py-1.5 text-[12px] text-[#F5F0E8]/70 font-medium">{row.lgaName}</td>
                    <td className="px-2 py-1.5 text-[10px] font-mono text-[#F5F0E8]/30">{row.state}</td>
                    <HeatCell
                      value={row.avgIcsea ? 1100 - row.avgIcsea : 0}
                      max={200}
                      label={row.avgIcsea ? String(row.avgIcsea) : '—'}
                    />
                    <HeatCell value={row.youthOffenders} max={maxOffenders} />
                    <HeatCell value={row.detentionBeds} max={maxBeds} />
                    <HeatCell
                      value={row.jhFunding}
                      max={maxFunding}
                      label={row.jhFunding > 0 ? formatDollars(row.jhFunding) : '—'}
                    />
                    <IntensityBar value={row.pipelineIntensity} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lgaRows.length > 20 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 font-mono text-[11px] text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60 transition-colors"
            >
              {showAll ? 'Show top 20' : `Show all ${lgaRows.length} LGAs`}
            </button>
          )}

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-red-600/60" />
              <span className="text-[9px] font-mono text-[#F5F0E8]/25">High burden</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-red-600/30" />
              <span className="text-[9px] font-mono text-[#F5F0E8]/25">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-red-600/15" />
              <span className="text-[9px] font-mono text-[#F5F0E8]/25">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-[#F5F0E8]/5" />
              <span className="text-[9px] font-mono text-[#F5F0E8]/25">No data</span>
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-[10px] text-[#F5F0E8]/15 mt-8">
        Disadvantage: SEIFA IRSD decile via ABS. Crossover: QFCC 2023-24, Sentencing Advisory Council VIC.
        Disability: Banksia Hill research, AIHW. Crime: BOCSAR NSW. Funding: JusticeHub live database.
      </p>
    </div>
  );
}
