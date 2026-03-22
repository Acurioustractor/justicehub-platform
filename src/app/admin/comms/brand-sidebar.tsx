'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Copy, Check, AlertTriangle } from 'lucide-react';
import { STATS, BRAND } from '@/lib/contained-brand';

const COLORS = [
  { name: 'Primary Black', hex: BRAND.black, usage: 'Headings, body, backgrounds' },
  { name: 'Off-White', hex: BRAND.offWhite, usage: 'Page backgrounds, cards' },
  { name: 'Urgent Red', hex: BRAND.red, usage: 'CTAs and critical data ONLY' },
  { name: 'Emerald', hex: BRAND.emerald, usage: 'Success metrics, positive' },
];

const TYPOGRAPHY = [
  { name: 'Space Grotesk Bold', usage: 'Display headings', weight: '700' },
  { name: 'IBM Plex Mono', usage: 'Data labels, stats', weight: '400/500' },
  { name: 'Inter', usage: 'Body text', weight: '400/500/600' },
];

const DO_LANGUAGE = ['system-impacted', 'community-led', 'evidence-based', 'young people', 'self-determination'];
const DONT_LANGUAGE = ['offenders', 'at-risk youth', 'tough on crime', 'juvenile delinquents', 'troubled kids'];

const TOP_STATS = ['detention_cost', 'reoffending', 'indigenous', 'alternatives', 'ratio', 'inequality'];

interface BrandSidebarProps {
  onInsertStat?: (text: string) => void;
}

export default function BrandSidebar({ onInsertStat }: BrandSidebarProps) {
  const [open, setOpen] = useState(true);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 px-1.5 py-8 rounded-l-lg"
        style={{ backgroundColor: BRAND.black, color: BRAND.offWhite }}
        title="Open brand guide"
      >
        <ChevronLeft size={16} />
        <span className="text-[10px] writing-mode-vertical mt-2 block" style={{ writingMode: 'vertical-rl' }}>BRAND</span>
      </button>
    );
  }

  return (
    <div
      className="w-[280px] shrink-0 border-l overflow-y-auto h-full"
      style={{ backgroundColor: '#111', borderColor: '#333', color: BRAND.offWhite }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Brand Guide
          </h3>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" title="Collapse">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Colors */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 opacity-60">Colors</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => copyHex(c.hex)}
                className="group flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors text-left"
              >
                <div
                  className="w-6 h-6 rounded border border-white/20 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-medium truncate">{c.name}</div>
                  <div className="text-[9px] opacity-50 flex items-center gap-1">
                    {copiedColor === c.hex ? (
                      <><Check size={8} /> Copied</>
                    ) : (
                      <><Copy size={8} className="opacity-0 group-hover:opacity-100" /> {c.hex}</>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 opacity-60">Typography</h4>
          <div className="space-y-1">
            {TYPOGRAPHY.map(t => (
              <div key={t.name} className="text-[11px]">
                <span className="font-medium">{t.name}</span>
                <span className="opacity-50 ml-1">- {t.usage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 opacity-60">Language</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] font-bold mb-1" style={{ color: BRAND.emerald }}>DO USE</div>
              {DO_LANGUAGE.map(w => (
                <div key={w} className="text-[10px] opacity-80">{w}</div>
              ))}
            </div>
            <div>
              <div className="text-[9px] font-bold mb-1" style={{ color: BRAND.red }}>DON&apos;T USE</div>
              {DONT_LANGUAGE.map(w => (
                <div key={w} className="text-[10px] opacity-80 line-through">{w}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 opacity-60">Key Stats</h4>
          <div className="space-y-1.5">
            {TOP_STATS.map(key => {
              const stat = STATS[key];
              if (!stat) return null;
              return (
                <button
                  key={key}
                  onClick={() => onInsertStat?.(`${stat.value} ${stat.label} (${stat.source})`)}
                  className="w-full text-left p-1.5 rounded hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: BRAND.red }}>
                      {stat.value}
                    </span>
                    <span className="text-[10px] opacity-70">{stat.label}</span>
                  </div>
                  <div className="text-[9px] opacity-40 mt-0.5">{stat.source}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photography Rule */}
        <div
          className="p-3 rounded border"
          style={{ borderColor: BRAND.red, backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} style={{ color: BRAND.red }} />
            <span className="text-[10px] font-bold uppercase" style={{ color: BRAND.red }}>
              Photography Rule
            </span>
          </div>
          <p className="text-[10px] opacity-80 leading-relaxed">
            REAL PHOTOS ONLY for people, places, programs. Never AI-generated photorealistic images.
            Illustrations, posters, data-viz = approved for AI generation.
          </p>
        </div>
      </div>
    </div>
  );
}
