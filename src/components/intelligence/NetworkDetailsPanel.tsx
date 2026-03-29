'use client';

import Link from 'next/link';
import { X, ExternalLink, Building2, DollarSign, Users, Zap, Scale } from 'lucide-react';
import type { NetworkNode } from './NetworkGraph';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDollars(amount: number | null): string {
  if (amount === null || amount === 0) return '$0';
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: 'Company',
  government: 'Government',
  individual: 'Individual',
  charity: 'Charity / NFP',
  trust: 'Trust',
};

/* ── Component ──────────────────────────────────────────────── */

interface NetworkDetailsPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
  onNavigate: (entityId: string) => void;
}

export default function NetworkDetailsPanel({
  node,
  onClose,
  onNavigate,
}: NetworkDetailsPanelProps) {
  if (!node) return null;

  const totalDollars =
    (node.procurement_dollars ?? 0) +
    (node.justice_dollars ?? 0) +
    (node.donation_dollars ?? 0) +
    (node.foundation_dollars ?? 0);

  return (
    <div className="w-80 bg-[#F5F0E8] border-l border-[#0A0A0A]/10 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#0A0A0A]/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-bold text-[#0A0A0A] leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {node.label}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {node.entity_type && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-[#0A0A0A]/5 rounded text-[#0A0A0A]/70">
                  {ENTITY_TYPE_LABELS[node.entity_type] || node.entity_type}
                </span>
              )}
              {node.state && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-[#0A0A0A]/5 rounded text-[#0A0A0A]/70">
                  {node.state}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#0A0A0A]/10 transition-colors shrink-0"
          >
            <X size={16} className="text-[#0A0A0A]/50" />
          </button>
        </div>
        {node.abn && (
          <p className="mt-2 font-mono text-[11px] text-[#0A0A0A]/50">
            ABN {node.abn}
          </p>
        )}
      </div>

      {/* Power Score */}
      {node.power_score !== null && (
        <div className="p-4 border-b border-[#0A0A0A]/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-[#0A0A0A]/50" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#0A0A0A]/50">
              Power Score
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold text-[#0A0A0A]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {node.power_score.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-[#0A0A0A]/40">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 bg-[#0A0A0A]/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(node.power_score, 100)}%`,
                backgroundColor:
                  node.power_score > 70
                    ? '#DC2626'
                    : node.power_score > 40
                    ? '#D97706'
                    : '#059669',
              }}
            />
          </div>
        </div>
      )}

      {/* Dollar Flows */}
      {totalDollars > 0 && (
        <div className="p-4 border-b border-[#0A0A0A]/10">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={14} className="text-[#0A0A0A]/50" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#0A0A0A]/50">
              Dollar Flows
            </span>
          </div>
          <div className="space-y-2">
            {[
              {
                label: 'Procurement',
                value: node.procurement_dollars,
                color: '#6B7280',
              },
              {
                label: 'Justice Funding',
                value: node.justice_dollars,
                color: '#059669',
              },
              {
                label: 'Donations',
                value: node.donation_dollars,
                color: '#DC2626',
              },
              {
                label: 'Foundation Grants',
                value: node.foundation_dollars,
                color: '#059669',
              },
            ]
              .filter((item) => (item.value ?? 0) > 0)
              .map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#0A0A0A]/60">
                    {item.label}
                  </span>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: item.color }}
                  >
                    {formatDollars(item.value)}
                  </span>
                </div>
              ))}
            <div className="pt-2 border-t border-[#0A0A0A]/10 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#0A0A0A]">
                Total
              </span>
              <span className="font-mono text-sm font-bold text-[#0A0A0A]">
                {formatDollars(totalDollars)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connections */}
      <div className="p-4 border-b border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-[#0A0A0A]/50" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#0A0A0A]/50">
            Connections
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0A0A0A]/5 rounded-lg p-2.5 text-center">
            <p
              className="text-xl font-bold text-[#0A0A0A]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {node.board_connections ?? 0}
            </p>
            <p className="font-mono text-[10px] text-[#0A0A0A]/50 mt-0.5">
              Board Links
            </p>
          </div>
          <div className="bg-[#0A0A0A]/5 rounded-lg p-2.5 text-center">
            <p
              className="text-xl font-bold text-[#059669]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {node.alma_intervention_count ?? 0}
            </p>
            <p className="font-mono text-[10px] text-[#0A0A0A]/50 mt-0.5">
              Programs
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-2">
        {!node.is_center && (
          <button
            onClick={() => onNavigate(node.id)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#0A0A0A] text-[#F5F0E8] rounded-lg font-mono text-xs font-medium hover:bg-[#0A0A0A]/80 transition-colors"
          >
            <Building2 size={14} />
            Explore This Entity
          </button>
        )}
        {node.jh_org_slug && (
          <Link
            href={`/organisations/${node.jh_org_slug}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-[#0A0A0A]/20 text-[#0A0A0A] rounded-lg font-mono text-xs font-medium hover:bg-[#0A0A0A]/5 transition-colors"
          >
            <ExternalLink size={14} />
            View JusticeHub Profile
          </Link>
        )}
        {node.abn && (
          <a
            href={`https://www.abr.business.gov.au/ABN/View?abn=${node.abn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-[#0A0A0A]/10 text-[#0A0A0A]/60 rounded-lg font-mono text-[11px] hover:bg-[#0A0A0A]/5 transition-colors"
          >
            <Scale size={12} />
            ABR Lookup
          </a>
        )}
      </div>
    </div>
  );
}
