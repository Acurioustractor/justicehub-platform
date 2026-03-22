'use client';

import { useState, useEffect } from 'react';
import { DollarSign, MapPin, Loader2 } from 'lucide-react';

interface TourStop {
  city: string;
  date: string;
  venue: number;
  transport: number;
  materials: number;
  accommodation: number;
}

const TOUR_STOPS: TourStop[] = [
  { city: 'Mount Druitt', date: 'Apr 2026', venue: 2500, transport: 800, materials: 1500, accommodation: 1200 },
  { city: 'Adelaide', date: 'May 2026', venue: 3000, transport: 2200, materials: 1500, accommodation: 1800 },
  { city: 'Perth', date: 'Jun 2026', venue: 3500, transport: 3500, materials: 1500, accommodation: 2200 },
  { city: 'Tennant Creek', date: 'Jul 2026', venue: 1500, transport: 4500, materials: 1500, accommodation: 2500 },
];

const COST_CATEGORIES = ['venue', 'transport', 'materials', 'accommodation'] as const;

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(cents);
}

export default function Budget() {
  const [fundingData, setFundingData] = useState<{
    total_raised_cents: number;
    donor_count: number;
    goal_cents: number;
    progress_pct: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunding = async () => {
      try {
        const res = await fetch('/api/campaign/stats');
        const data = await res.json();
        setFundingData(data);
      } catch (err) {
        console.error('Funding fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFunding();
  }, []);

  const totalBudget = TOUR_STOPS.reduce(
    (sum, stop) => sum + stop.venue + stop.transport + stop.materials + stop.accommodation,
    0
  );

  const categoryTotals = COST_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = TOUR_STOPS.reduce((sum, stop) => sum + stop[cat], 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[10px] font-medium opacity-50 uppercase tracking-wider mb-1">Total Tour Budget</div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F5F0E8' }}>
            {formatCurrency(totalBudget)}
          </div>
          <div className="text-xs opacity-40 mt-1">{TOUR_STOPS.length} stops planned</div>
        </div>

        <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[10px] font-medium opacity-50 uppercase tracking-wider mb-1">Funding Raised</div>
          {loading ? (
            <Loader2 className="animate-spin mt-2" size={16} />
          ) : (
            <>
              <div className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#059669' }}>
                {formatCurrency((fundingData?.total_raised_cents || 0) / 100)}
              </div>
              <div className="text-xs opacity-40 mt-1">
                {fundingData?.donor_count || 0} donors ({fundingData?.progress_pct || 0}% of goal)
              </div>
            </>
          )}
        </div>

        <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[10px] font-medium opacity-50 uppercase tracking-wider mb-1">Budget Gap</div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626' }}>
            {formatCurrency(Math.max(0, totalBudget - (fundingData?.total_raised_cents || 0) / 100))}
          </div>
          <div className="text-xs opacity-40 mt-1">Remaining to raise</div>
        </div>
      </div>

      {/* Tour stops table */}
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        <MapPin size={14} /> Tour Stop Costs
      </h3>
      <div className="border border-white/10 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">City</th>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Date</th>
              <th className="text-right px-4 py-2 text-xs font-medium opacity-60">Venue</th>
              <th className="text-right px-4 py-2 text-xs font-medium opacity-60">Transport</th>
              <th className="text-right px-4 py-2 text-xs font-medium opacity-60">Materials</th>
              <th className="text-right px-4 py-2 text-xs font-medium opacity-60">Accommodation</th>
              <th className="text-right px-4 py-2 text-xs font-medium opacity-60">Total</th>
            </tr>
          </thead>
          <tbody>
            {TOUR_STOPS.map(stop => {
              const stopTotal = stop.venue + stop.transport + stop.materials + stop.accommodation;
              return (
                <tr key={stop.city} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 font-medium">{stop.city}</td>
                  <td className="px-4 py-2.5 text-xs opacity-70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {stop.date}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {formatCurrency(stop.venue)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {formatCurrency(stop.transport)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {formatCurrency(stop.materials)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {formatCurrency(stop.accommodation)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {formatCurrency(stopTotal)}
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <td className="px-4 py-2.5 font-bold" colSpan={2}>TOTAL</td>
              <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(categoryTotals.venue)}
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(categoryTotals.transport)}
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(categoryTotals.materials)}
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(categoryTotals.accommodation)}
              </td>
              <td className="px-4 py-2.5 text-right font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(totalBudget)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cost breakdown */}
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        <DollarSign size={14} /> Category Breakdown
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {COST_CATEGORIES.map(cat => {
          const pct = Math.round((categoryTotals[cat] / totalBudget) * 100);
          return (
            <div key={cat} className="p-3 rounded border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1 capitalize">{cat}</div>
              <div className="text-lg font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatCurrency(categoryTotals[cat])}
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#059669' }} />
              </div>
              <div className="text-[10px] opacity-40 mt-1">{pct}% of total</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
