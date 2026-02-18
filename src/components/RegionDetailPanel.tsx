'use client';

import { X, AlertTriangle, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface RegionAggregation {
  sa3_code: string;
  sa3_name: string;
  system_type: string;
  report_count: number;
}

export interface RegionSummary {
  sa3_code: string;
  sa3_name: string;
  state: string;
  total_reports: number;
  breakdown: { system_type: string; count: number }[];
}

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  education: 'Education',
  health: 'Health',
  policing: 'Policing',
  housing: 'Housing',
  employment: 'Employment',
  'anti-discrimination': 'Anti-discrimination body',
  other: 'Other',
};

const SYSTEM_TYPE_COLORS: Record<string, string> = {
  education: '#2563eb',
  health: '#059669',
  policing: '#dc2626',
  housing: '#d97706',
  employment: '#7c3aed',
  'anti-discrimination': '#0891b2',
  other: '#6b7280',
};

interface RegionDetailPanelProps {
  region: RegionSummary;
  onClose: () => void;
}

export function RegionDetailPanel({ region, onClose }: RegionDetailPanelProps) {
  const maxCount = Math.max(...region.breakdown.map((b) => b.count), 1);

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white border-l-2 border-black z-20 overflow-y-auto shadow-[-4px_0_12px_rgba(0,0,0,0.1)]">
      <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs text-gray-500 uppercase tracking-widest">
            SA3 Region
          </div>
          <h3 className="text-lg font-bold text-black leading-tight">{region.sa3_name}</h3>
          <div className="text-xs text-gray-600">{region.state}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Total count */}
        <div className="border-2 border-black p-4">
          <div className="text-4xl font-bold text-black">{region.total_reports}</div>
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Approved reports
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Aggregated from community-submitted discrimination reports.
          </p>
        </div>

        {/* Breakdown by system type */}
        {region.breakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wide text-sm text-black">
              By system type
            </h4>
            <div className="space-y-2">
              {region.breakdown
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.system_type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-800">
                        {SYSTEM_TYPE_LABELS[item.system_type] || item.system_type}
                      </span>
                      <span className="font-bold text-black">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 border border-gray-200">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                          backgroundColor: SYSTEM_TYPE_COLORS[item.system_type] || '#6b7280',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Report an incident CTA */}
        <div className="border-2 border-black bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0" />
            <h4 className="font-bold uppercase tracking-wide text-sm text-black">
              Experienced discrimination?
            </h4>
          </div>
          <p className="text-sm text-gray-700">
            Your anonymous report adds to the collective evidence for this region.
          </p>
          <Link
            href="/call-it-out"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase tracking-wide text-sm hover:bg-gray-900 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Report an incident
          </Link>
        </div>

        {/* Data note */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            Only approved, consented reports are included. Individual reports are never shown.
          </p>
          <p>
            Data is updated hourly. Reports go through moderation before appearing in counts.
          </p>
        </div>
      </div>
    </div>
  );
}
