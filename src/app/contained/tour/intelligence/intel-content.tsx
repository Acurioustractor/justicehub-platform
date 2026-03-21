'use client';
// political-v2
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Users,
  Building2,
  Scale,
  Landmark,
  X,
} from 'lucide-react';

// Dynamic import for Leaflet (no SSR)
const IntelMap = dynamic(() => import('./intel-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0d1117] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#DC2626]" />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TourStopIntel {
  id: string;
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  status: 'confirmed' | 'planning' | 'exploring' | 'demand';
  date: string;
  partner: string;
  venue: string;
  cost: string;
  description: string;
  storyArc: string;
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
  demandSignals: Array<{
    name: string;
    score: number;
    org: string;
    role: string;
    quote: string;
    source: 'linkedin' | 'container_request' | 'email' | 'conference' | 'partner' | 'ally';
    action?: string;
  }>;
  keyOrgs: Array<{
    name: string;
    type: string;
    indigenous: boolean;
    interventions: number;
    website?: string;
    sector?: string;
    servesYouth?: boolean;
    servesIndigenous?: boolean;
    charitySize?: string;
  }>;
  politicians: Array<{
    name: string;
    role: string;
    party: string;
    level: 'state' | 'federal' | 'oversight';
    portfolio?: string;
    relevance: string;
  }>;
  funders: Array<{
    name: string;
    score: number;
    type: string;
  }>;
}

interface IntelData {
  stops: TourStopIntel[];
  summary: {
    totalOrgs: number;
    totalFunding: number;
    totalEntities: number;
    totalInterventions: number;
    totalEvidence: number;
    totalStories: number;
    totalPhotos: number;
    totalStopCost: string;
    raised: string;
  };
  generatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: '#059669', bg: 'bg-[#059669]/10' },
  planning: { label: 'Planning', color: '#d97706', bg: 'bg-amber-500/10' },
  exploring: { label: 'In Conversation', color: '#3b82f6', bg: 'bg-blue-500/10' },
  demand: { label: 'Community Demand', color: '#DC2626', bg: 'bg-[#DC2626]/10' },
};

// ---------------------------------------------------------------------------
// Stat Tile
// ---------------------------------------------------------------------------
function StatTile({ label, value, color = '#F5F0E8' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-3">
      <div className="text-2xl font-bold" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] text-[#F5F0E8]/40 uppercase tracking-[0.15em] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stop Detail Panel
// ---------------------------------------------------------------------------
function StopPanel({ stop, onClose }: { stop: TourStopIntel; onClose: () => void }) {
  const status = STATUS_CONFIG[stop.status] || STATUS_CONFIG.demand;
  const [activeTab, setActiveTab] = useState<'overview' | 'demand' | 'orgs' | 'intelligence'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'demand' as const, label: `Demand (${stop.demandSignals.length})` },
    { id: 'orgs' as const, label: `Orgs (${stop.keyOrgs.length})` },
    { id: 'intelligence' as const, label: 'Intelligence' },
  ];

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-[#0A0A0A]/95 backdrop-blur-sm border-l border-white/10 z-[500] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}60` }}
            />
            <div>
              <h2 className="text-xl font-bold text-[#F5F0E8] uppercase tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stop.city}
              </h2>
              <span className="text-[10px] text-[#F5F0E8]/40 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.state} &middot; {stop.date}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className={`mx-5 mb-3 px-3 py-2 ${status.bg} border`} style={{ borderColor: `${status.color}30` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: status.color, fontFamily: "'IBM Plex Mono', monospace" }}>
              {status.label}
            </span>
            <span className="text-xs font-bold text-[#F5F0E8]/60" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {stop.cost}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#DC2626] text-[#F5F0E8]'
                  : 'border-transparent text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60'
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Story arc */}
            <div className="border-l-2 border-[#DC2626] pl-4 py-2">
              <p className="text-sm italic text-[#F5F0E8]/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stop.storyArc}
              </p>
            </div>

            <p className="text-xs text-[#F5F0E8]/50 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {stop.description}
            </p>

            {/* Partner + venue */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#F5F0E8]/30 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.12em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Partner</div>
                  <div className="text-xs text-[#F5F0E8]/70">{stop.partner}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F5F0E8]/30 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.12em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Venue</div>
                  <div className="text-xs text-[#F5F0E8]/70">{stop.venue}</div>
                </div>
              </div>
            </div>

            {/* State detention stats */}
            <div>
              <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.stateCode} Justice System
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatTile label="Detention Spend" value={stop.stats.detentionSpend} color="#DC2626" />
                <StatTile label="Community Spend" value={stop.stats.communitySpend} color="#059669" />
                <StatTile label="Indigenous Overrep" value={stop.stats.indigenousOverrep} color="#DC2626" />
                <StatTile label="Children Detained" value={stop.stats.detentionPopulation} />
              </div>
            </div>

            {/* Data counts */}
            <div>
              <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                JusticeHub Data
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Organizations" value={stop.stats.orgs} />
                <StatTile label="Indigenous Orgs" value={stop.stats.indigenousOrgs} color="#d97706" />
                <StatTile label="Interventions" value={stop.stats.interventions} color="#059669" />
                <StatTile label="Funding Records" value={stop.stats.fundingRecords} />
                <StatTile label="ACNC Charities" value={stop.stats.acncCharities} />
                <StatTile label="ORIC Corps" value={stop.stats.oricCorporations} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'demand' && (
          <>
            {stop.demandSignals.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquareQuote className="w-8 h-8 text-[#F5F0E8]/10 mx-auto mb-3" />
                <p className="text-xs text-[#F5F0E8]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  No demand signals matched for this location yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group: Partners, Conferences, Allies */}
                {(() => {
                  const sourceConfig: Record<string, { label: string; color: string; badge: string }> = {
                    partner: { label: 'Partners', color: '#059669', badge: 'PARTNER' },
                    conference: { label: 'Conferences', color: '#d97706', badge: 'EVENT' },
                    ally: { label: 'Allies & Endorsers', color: '#3b82f6', badge: 'ALLY' },
                    container_request: { label: 'Container Requests', color: '#DC2626', badge: 'REQUEST' },
                    email: { label: 'Email Leads', color: '#8b5cf6', badge: 'EMAIL' },
                    linkedin: { label: 'LinkedIn Engagement', color: '#F5F0E8', badge: 'LI' },
                  };
                  const groups: [string, typeof stop.demandSignals][] = [];
                  for (const src of ['partner', 'conference', 'ally', 'container_request', 'email', 'linkedin']) {
                    const items = stop.demandSignals.filter(s => s.source === src);
                    if (items.length > 0) groups.push([src, items]);
                  }
                  return groups.map(([src, signals]) => {
                    const cfg = sourceConfig[src] || sourceConfig.linkedin;
                    return (
                      <div key={src}>
                        <div
                          className="text-[10px] uppercase tracking-[0.15em] py-1.5 px-2 mb-2 font-bold border-l-2"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: cfg.color,
                            borderColor: cfg.color,
                            backgroundColor: cfg.color + '10',
                          }}
                        >
                          {cfg.label} ({signals.length})
                        </div>
                        <div className="space-y-2">
                          {signals.map((signal, i) => (
                            <div key={i} className="border border-white/10 p-3 hover:border-white/20 transition-colors">
                              <div className="flex items-start justify-between mb-1">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#F5F0E8]/90">{signal.name}</div>
                                  <div className="text-[10px] text-[#F5F0E8]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    {signal.role}{signal.org ? ` · ${signal.org}` : ''}
                                  </div>
                                </div>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0 ml-2"
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    backgroundColor: cfg.color + '20',
                                    color: cfg.color,
                                  }}
                                >
                                  {cfg.badge} {signal.score}
                                </span>
                              </div>
                              {signal.quote && (
                                <blockquote className="border-l-2 pl-3 mt-2" style={{ borderColor: cfg.color + '40' }}>
                                  <p className="text-[11px] text-[#F5F0E8]/50 italic leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    &ldquo;{signal.quote}&rdquo;
                                  </p>
                                </blockquote>
                              )}
                              {signal.action && (
                                <div
                                  className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5"
                                  style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b30' }}
                                >
                                  <span
                                    className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-px"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fbbf24' }}
                                  >
                                    Action
                                  </span>
                                  <p
                                    className="text-[10px] leading-relaxed"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fcd34dcc' }}
                                  >
                                    {signal.action}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {activeTab === 'orgs' && (
          <>
            {stop.keyOrgs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-[#F5F0E8]/10 mx-auto mb-3" />
                <p className="text-xs text-[#F5F0E8]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  No linked organizations for this state yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Total Orgs" value={stop.stats.orgs} />
                  <StatTile label="Indigenous" value={stop.stats.indigenousOrgs} color="#d97706" />
                  <StatTile label="With Programs" value={stop.keyOrgs.filter(o => o.interventions > 0).length} color="#059669" />
                </div>

                {/* Orgs running programs */}
                {stop.keyOrgs.filter(o => o.interventions > 0).length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      Organizations Running Programs
                    </div>
                    {stop.keyOrgs.filter(o => o.interventions > 0).map((org, i) => (
                      <div key={i} className="border border-white/10 px-3 py-2.5 mb-1.5 hover:border-white/20 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {org.indigenous && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Indigenous org" />
                            )}
                            <div className="min-w-0">
                              {org.website ? (
                                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F5F0E8]/80 hover:text-[#F5F0E8] truncate block transition-colors">
                                  {org.name}
                                </a>
                              ) : (
                                <span className="text-xs text-[#F5F0E8]/70 truncate block">{org.name}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 flex-shrink-0 ml-2"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              backgroundColor: '#059669' + '20',
                              color: '#059669',
                            }}
                          >
                            {org.interventions} {org.interventions === 1 ? 'program' : 'programs'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-4">
                          {org.sector && (
                            <span className="text-[9px] text-[#F5F0E8]/25 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {org.sector}
                            </span>
                          )}
                          {org.servesYouth && (
                            <span className="text-[9px] px-1 py-0.5 bg-[#DC2626]/10 text-[#DC2626]/60 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              Youth
                            </span>
                          )}
                          {org.servesIndigenous && (
                            <span className="text-[9px] px-1 py-0.5 bg-amber-500/10 text-amber-500/60 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              First Nations
                            </span>
                          )}
                          {org.charitySize && (
                            <span className="text-[9px] text-[#F5F0E8]/20 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {org.charitySize}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notable orgs without programs */}
                {stop.keyOrgs.filter(o => o.interventions === 0).length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      Other Notable Organizations
                    </div>
                    {stop.keyOrgs.filter(o => o.interventions === 0).map((org, i) => (
                      <div key={i} className="flex items-center justify-between border border-white/8 px-3 py-2 mb-1 hover:border-white/15 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          {org.indigenous && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Indigenous org" />
                          )}
                          {org.website ? (
                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F5F0E8]/50 hover:text-[#F5F0E8]/80 truncate transition-colors">
                              {org.name}
                            </a>
                          ) : (
                            <span className="text-xs text-[#F5F0E8]/50 truncate">{org.name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#F5F0E8]/20 uppercase tracking-wider flex-shrink-0 ml-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {org.sector || org.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'intelligence' && (
          <>
            {/* Politicians */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-3.5 h-3.5 text-[#F5F0E8]/30" />
                <span className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Political Landscape
                </span>
              </div>
              {stop.politicians.length === 0 ? (
                <p className="text-xs text-[#F5F0E8]/20 italic" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Political mapping in progress for {stop.stateCode}.
                </p>
              ) : (
                <div className="space-y-4" data-testid="grouped-politicians">
                  {(['state', 'federal', 'oversight'] as const).map(level => {
                    const group = stop.politicians.filter(p => p.level === level);
                    if (group.length === 0) return null;
                    const levelLabels = { state: 'State Government & Opposition', federal: 'Federal', oversight: 'Independent Oversight' };
                    const levelColors = { state: '#d97706', federal: '#3b82f6', oversight: '#059669' };
                    return (
                      <div key={level} className="mb-1">
                        <div
                          className="text-[10px] uppercase tracking-[0.15em] py-1.5 px-2 mb-2 font-bold border-l-2"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: levelColors[level],
                            borderColor: levelColors[level],
                            backgroundColor: levelColors[level] + '10',
                          }}
                        >
                          {levelLabels[level]}
                        </div>
                        <div className="space-y-1.5">
                          {group.map((pol, i) => (
                            <div key={i} className="border border-white/10 px-3 py-2 hover:border-white/20 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-xs text-[#F5F0E8]/80 font-medium block">{pol.name}</span>
                                  <span className="text-[10px] text-[#F5F0E8]/40 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{pol.role}</span>
                                </div>
                                <span
                                  className="text-[9px] px-1.5 py-0.5 flex-shrink-0 mt-0.5"
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    backgroundColor: levelColors[level] + '20',
                                    color: levelColors[level],
                                  }}
                                >
                                  {pol.party}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Funders */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-3.5 h-3.5 text-[#F5F0E8]/30" />
                <span className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Philanthropic Targets
                </span>
              </div>
              {stop.funders.length === 0 ? (
                <p className="text-xs text-[#F5F0E8]/20 italic" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Funder mapping in progress.
                </p>
              ) : (
                <div className="space-y-2">
                  {stop.funders.map((funder, i) => (
                    <div key={i} className="flex items-center justify-between border border-white/10 px-3 py-2">
                      <span className="text-xs text-[#F5F0E8]/70">{funder.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#F5F0E8]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{funder.type}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            backgroundColor: '#059669' + '20',
                            color: '#059669',
                          }}
                        >
                          {funder.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GrantScope link */}
            <div className="border border-white/10 p-4 mt-4">
              <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Deep Intelligence
              </div>
              <p className="text-xs text-[#F5F0E8]/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                GrantScope tracks {stop.stats.orgs.toLocaleString()} organizations and {stop.stats.fundingRecords.toLocaleString()} funding records in {stop.stateCode}.
              </p>
              <Link
                href={`/intelligence?state=${stop.stateCode}`}
                className="inline-flex items-center gap-1.5 text-[#DC2626] text-[10px] font-bold uppercase tracking-[0.15em] hover:text-[#F5F0E8] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Explore {stop.stateCode} Intelligence <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 border-t border-white/10 px-5 py-3">
        <Link
          href="/contained/help"
          className="block w-full bg-[#DC2626] text-[#F5F0E8] text-center py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#b91c1c] transition-colors"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Back {stop.city} &middot; $30K per stop
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------
function SummaryBar({ summary }: { summary: IntelData['summary'] }) {
  const items = [
    { label: 'Organizations', value: summary.totalOrgs.toLocaleString() },
    { label: 'Funding Records', value: summary.totalFunding.toLocaleString() },
    { label: 'Interventions', value: summary.totalInterventions.toLocaleString() },
    { label: 'Evidence Items', value: summary.totalEvidence.toLocaleString() },
    { label: 'Stories', value: summary.totalStories.toString() },
    { label: 'Photos', value: summary.totalPhotos.toString() },
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto px-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {item.value}
          </span>
          <span className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.1em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stop List (sidebar)
// ---------------------------------------------------------------------------
function StopList({
  stops,
  activeId,
  onSelect,
}: {
  stops: TourStopIntel[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {stops.map((stop) => {
        const status = STATUS_CONFIG[stop.status] || STATUS_CONFIG.demand;
        const isActive = stop.id === activeId;
        return (
          <button
            key={stop.id}
            onClick={() => onSelect(stop.id)}
            className={`w-full text-left px-3 py-2.5 border transition-colors ${
              isActive
                ? 'border-[#DC2626]/40 bg-[#DC2626]/5'
                : 'border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: status.color, boxShadow: isActive ? `0 0 6px ${status.color}` : 'none' }}
              />
              <span className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/60'}`}>
                {stop.city}
              </span>
            </div>
            <div className="mt-1 ml-4">
              <span className="text-[10px] text-[#F5F0E8]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.date}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funding Tracker (sidebar bottom)
// ---------------------------------------------------------------------------
function FundingTracker({ stops }: { stops: TourStopIntel[] }) {
  const CONTAINER_BUILD = 70000;
  const MOUNTY_YARNS_BUILD = 70000;
  const STOP_COST = 30000;
  const tourTotal = stops.length * STOP_COST;
  const grandTotal = CONTAINER_BUILD + MOUNTY_YARNS_BUILD + tourTotal;

  // No stops funded yet — confirmed status means event booked, not funded
  const totalSecured = 0;
  const pct = Math.round((totalSecured / grandTotal) * 100);

  return (
    <div className="p-3 space-y-3">
      <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Funding
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ${totalSecured.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#F5F0E8]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            of ${grandTotal.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 w-full">
          <div
            className="h-full bg-[#059669] transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <div className="text-[9px] text-[#F5F0E8]/20 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {pct}% secured
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#F5F0E8]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            New Container Build
          </span>
          <span className="text-[10px] font-bold text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            $70K
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#F5F0E8]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Mounty Yarns Build
          </span>
          <span className="text-[10px] font-bold text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            $70K
          </span>
        </div>
        <div className="h-px bg-white/5 my-1" />
        {stops.map((stop) => {
          const secured = false; // No stops funded yet
          return (
            <div key={stop.id} className="flex items-center justify-between">
              <span className={`text-[10px] ${secured ? 'text-[#059669]' : 'text-[#F5F0E8]/30'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {secured ? '✓' : '○'} {stop.city}
              </span>
              <span className={`text-[10px] font-bold ${secured ? 'text-[#059669]' : 'text-[#F5F0E8]/20'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                $30K
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TourIntelligenceContent() {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/contained/tour-intelligence', { cache: 'no-store' })
      .then((res) => res.json())
      .then((d: IntelData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tour intelligence:', err);
        setLoading(false);
      });
  }, []);

  const handleStopSelect = (id: string) => {
    setActiveStop(id);
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
  };

  const selectedStop = data?.stops.find((s) => s.id === activeStop) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC2626] mx-auto mb-4" />
          <p className="text-xs text-[#F5F0E8]/30 uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Loading Intelligence
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-xs text-[#DC2626] uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Failed to load intelligence data.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0A0A0A]/95 backdrop-blur-sm z-[600]">
        <div className="flex items-center gap-4">
          <Link href="/contained" className="flex items-center gap-2 text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.1em] hidden sm:inline" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Contained
            </span>
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <span className="text-[#DC2626] text-xs font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Tour Intelligence
          </span>
        </div>
        <div className="hidden md:block">
          <SummaryBar summary={data.summary} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left sidebar — stop list (hidden on mobile when panel open) */}
        <div className={`w-56 flex-shrink-0 border-r border-white/10 overflow-y-auto bg-[#0A0A0A] ${showPanel ? 'hidden md:block' : ''}`}>
          <div className="p-3 border-b border-white/10">
            <div className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              8 Stops &middot; Apr–Nov 2026
            </div>
          </div>
          <StopList stops={data.stops} activeId={activeStop} onSelect={handleStopSelect} />

          {/* Funding tracker */}
          <div className="border-t border-white/10">
            <FundingTracker stops={data.stops} />
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <IntelMap
            stops={data.stops}
            activeId={activeStop}
            onStopClick={handleStopSelect}
          />

          {/* Mobile summary bar */}
          <div className="absolute bottom-0 left-0 right-0 md:hidden bg-[#0A0A0A]/90 backdrop-blur-sm border-t border-white/10 px-3 py-2 overflow-x-auto z-[400]">
            <SummaryBar summary={data.summary} />
          </div>
        </div>

        {/* Detail panel */}
        {showPanel && selectedStop && (
          <StopPanel stop={selectedStop} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
}
