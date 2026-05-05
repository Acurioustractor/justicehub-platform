'use client';

import { useEffect, useState } from 'react';
import { OrgDetailPanel } from '@/components/intelligence/OrgDetailPanel';

interface DemandSignal {
  name: string;
  score: number;
  org: string;
  role: string;
  quote: string;
  source: 'linkedin' | 'container_request' | 'email' | 'conference' | 'partner' | 'ally';
  action?: string;
}

interface KeyOrg {
  id?: string;
  name: string;
  type: string;
  indigenous: boolean;
  interventions: number;
  website?: string;
  sector?: string;
  servesYouth?: boolean;
  servesIndigenous?: boolean;
  charitySize?: string;
}

interface Politician {
  name: string;
  role: string;
  party: string;
  level: 'state' | 'federal' | 'oversight';
  portfolio?: string;
  relevance: string;
}

interface Funder {
  name: string;
  score: number;
  type: string;
}

interface IntelStop {
  id: string;
  city: string;
  stateCode: string;
  stats: {
    detentionSpend: string;
    communitySpend: string;
    indigenousOverrep: string;
    detentionPopulation: string;
    orgs: number;
    indigenousOrgs: number;
    interventions: number;
    fundingRecords: number;
    acncCharities: number;
    oricCorporations: number;
  };
  demandSignals: DemandSignal[];
  keyOrgs: KeyOrg[];
  politicians: Politician[];
  funders: Funder[];
}

const SOURCE_CONFIG: Record<DemandSignal['source'], { label: string; badge: string; color: string }> = {
  partner:           { label: 'Partner',           badge: 'PARTNER',   color: '#059669' },
  ally:              { label: 'Ally',              badge: 'ALLY',      color: '#3b82f6' },
  email:             { label: 'Email lead',        badge: 'EMAIL',     color: '#8b5cf6' },
  conference:        { label: 'Conference',        badge: 'EVENT',     color: '#f59e0b' },
  container_request: { label: 'Container request', badge: 'REQUEST',   color: '#ec4899' },
  linkedin:          { label: 'LinkedIn',          badge: 'LI',        color: '#06b6d4' },
};

interface Props {
  stopCity: string;
}

export function CivicIntelSection({ stopCity }: Props) {
  const [intel, setIntel] = useState<IntelStop | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contained/tour-intelligence', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { stops: IntelStop[] }) => {
        // Match by city name — accommodates "Perth + surrounds" and similar.
        const target = d.stops.find(
          (s) => s.city.toLowerCase().split(' +')[0] === stopCity.toLowerCase().split(' +')[0],
        );
        if (target) setIntel(target);
      })
      .catch(() => {});
  }, [stopCity]);

  if (!intel) return null;

  // Group demand signals by source.
  const signalsBySource = intel.demandSignals.reduce<Record<string, DemandSignal[]>>((acc, sig) => {
    (acc[sig.source] ||= []).push(sig);
    return acc;
  }, {});

  // Group politicians by level.
  const polsByLevel = intel.politicians.reduce<Record<string, Politician[]>>((acc, p) => {
    (acc[p.level] ||= []).push(p);
    return acc;
  }, {});

  return (
    <section className="px-4 py-16 border-t border-gray-800 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Civic intelligence
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#F5F0E8] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Who&apos;s in the room at {intel.city}
        </h2>
        <p className="text-sm text-[#F5F0E8]/85 max-w-2xl mb-12" style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>
          Demand signals, key delivery organisations, political holders, and philanthropic targets — sourced from the JusticeHub Living Map of Alternatives, CivicGraph, and direct partner outreach.
        </p>

        {/* State stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatTile label="Orgs in state" value={intel.stats.orgs.toLocaleString()} />
          <StatTile label="Indigenous-led" value={intel.stats.indigenousOrgs.toLocaleString()} />
          <StatTile label="Programs indexed" value={intel.stats.interventions.toLocaleString()} />
          <StatTile label="Funding records" value={intel.stats.fundingRecords.toLocaleString()} />
        </div>

        {/* Demand signals */}
        {intel.demandSignals.length > 0 && (
          <div className="mb-16">
            <h3 className="text-xl font-bold text-[#F5F0E8] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Demand signals ({intel.demandSignals.length})
            </h3>
            <p className="text-xs text-[#F5F0E8]/85 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              People and organisations who&apos;ve asked for the container, offered to host, or said yes.
            </p>

            {Object.entries(signalsBySource).map(([source, signals]) => {
              const cfg = SOURCE_CONFIG[source as DemandSignal['source']];
              return (
                <div key={source} className="mb-8">
                  <div
                    className="text-xs uppercase tracking-[0.15em] py-1.5 px-3 mb-3 font-bold border-l-2 inline-block"
                    style={{ borderColor: cfg.color, backgroundColor: cfg.color + '15', color: cfg.color, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {cfg.label} ({signals.length})
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {signals.map((s, i) => (
                      <div key={`${s.name}-${i}`} className="border border-white/10 bg-gray-950 p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-sm font-bold text-[#F5F0E8]">{s.name}</div>
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 flex-shrink-0"
                            style={{ backgroundColor: cfg.color + '25', color: cfg.color, fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {cfg.badge} {s.score}
                          </span>
                        </div>
                        <div className="text-xs text-[#F5F0E8]/85 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {s.role} · {s.org}
                        </div>
                        {s.quote && (
                          <blockquote className="border-l-2 pl-3 mb-2" style={{ borderColor: cfg.color }}>
                            <p className="text-sm italic text-[#F5F0E8] leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              &ldquo;{s.quote}&rdquo;
                            </p>
                          </blockquote>
                        )}
                        {s.action && (
                          <div className="mt-2 flex items-start gap-2 px-3 py-2" style={{ backgroundColor: '#451a03', border: '1px solid #f59e0b' }}>
                            <span className="text-[11px] font-bold uppercase tracking-wider flex-shrink-0 mt-px" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fbbf24' }}>
                              Action
                            </span>
                            <p className="text-xs leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fef3c7' }}>
                              {s.action}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Key delivery orgs */}
        {intel.keyOrgs.length > 0 && (
          <div className="mb-16">
            <h3 className="text-xl font-bold text-[#F5F0E8] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Key delivery orgs ({intel.keyOrgs.length})
            </h3>
            <p className="text-xs text-[#F5F0E8]/85 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Organisations running youth-justice programs in {intel.city}, ranked by program count.
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              {intel.keyOrgs.slice(0, 12).map((o, i) => {
                const Wrapper = o.id ? 'button' : 'div';
                const wrapperProps = o.id
                  ? { onClick: () => setActiveOrgId(o.id!), type: 'button' as const }
                  : {};
                return (
                  <Wrapper
                    key={`${o.name}-${i}`}
                    {...(wrapperProps as any)}
                    className={`text-left border border-white/10 bg-gray-950 p-3 flex items-start justify-between gap-3 ${o.id ? 'hover:border-[#DC2626] cursor-pointer transition-colors' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#F5F0E8] truncate">{o.name}</div>
                      <div className="text-[11px] text-[#F5F0E8]/85 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {o.type}{o.charitySize ? ` · ${o.charitySize}` : ''}
                      </div>
                      {o.website && (
                        <a href={o.website.startsWith('http') ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-blue-400 hover:text-blue-300 truncate block mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {o.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                      {o.id && (
                        <div className="text-[10px] text-[#DC2626] uppercase tracking-wider mt-1.5 font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          Click for ACNC + ABN detail →
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {o.indigenous && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#DC2626]/20 text-[#DC2626] uppercase tracking-wider font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          Indigenous
                        </span>
                      )}
                      <span className="text-sm font-bold text-[#F5F0E8]">{o.interventions}</span>
                      <span className="text-[10px] text-[#F5F0E8]/85 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        programs
                      </span>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}

        {/* Politicians */}
        {intel.politicians.length > 0 && (
          <div className="mb-16">
            <h3 className="text-xl font-bold text-[#F5F0E8] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Political holders ({intel.politicians.length})
            </h3>
            <p className="text-xs text-[#F5F0E8]/85 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              The decision-makers, oversight bodies, and shadows who matter for this stop.
            </p>

            {(['state', 'federal', 'oversight'] as const).map((level) => {
              const list = polsByLevel[level];
              if (!list || !list.length) return null;
              const title = level === 'state' ? 'State / Government' : level === 'federal' ? 'Federal' : 'Independent oversight';
              return (
                <div key={level} className="mb-6">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/85 font-bold mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {title} ({list.length})
                  </div>
                  <div className="space-y-2">
                    {list.map((p, i) => (
                      <div key={`${p.name}-${i}`} className="border border-white/10 bg-gray-950 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="text-sm font-bold text-[#F5F0E8]">{p.name}</div>
                            <div className="text-[11px] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {p.role}{p.portfolio ? ` · ${p.portfolio}` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 flex-shrink-0 font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", backgroundColor: '#1f2937', color: '#F5F0E8' }}>
                            {p.party}
                          </span>
                        </div>
                        {p.relevance && (
                          <p className="text-xs text-[#F5F0E8]/85 leading-snug mt-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {p.relevance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Philanthropic targets */}
        {intel.funders.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-[#F5F0E8] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Philanthropic targets ({intel.funders.length})
            </h3>
            <p className="text-xs text-[#F5F0E8]/85 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Foundations and major donors aligned with this stop, scored by CivicGraph.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {intel.funders.map((f, i) => (
                <div key={`${f.name}-${i}`} className="border border-white/10 bg-gray-950 p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#F5F0E8] truncate">{f.name}</div>
                    <div className="text-[11px] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{f.type}</div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 flex-shrink-0 ml-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {f.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide-in side panel — full ACNC + ABN + financials + programs */}
      <OrgDetailPanel orgId={activeOrgId} onClose={() => setActiveOrgId(null)} />
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-3">
      <div className="text-2xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      <div className="text-[11px] text-[#F5F0E8]/85 uppercase tracking-[0.15em] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
    </div>
  );
}
