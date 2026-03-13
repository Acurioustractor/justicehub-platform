'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Building2, Users, DollarSign, FileText, ArrowRight,
  TrendingUp, Globe, Loader2, BarChart3, Network, Scale
} from 'lucide-react';

interface SectorData {
  summary: {
    totalFundingBillions: number;
    totalGrants: number;
    totalInterventions: number;
    totalEvidence: number;
    totalOrgs: number;
    indigenousOrgs: number;
    gsEntities: number;
    austenderContracts: number;
    foundationsCount: number;
  };
  interventionsByType: { type: string; count: number }[];
  topFundedOrgs: {
    org_name: string;
    intervention_count: number;
    evidence_count: number;
    total_funding: number;
    is_indigenous_org: boolean;
  }[];
  fundingBySource: { source: string; total_amount: number; grant_count: number }[];
  entityBreakdown: { entity_type: string; count: number }[];
  gsRelationshipTypes: { relationship_type: string; count: number }[];
  topJusticeFunding: {
    source: string;
    recipient: string;
    total_amount: number;
    grant_count: number;
    latest_year: string;
  }[];
}

function formatDollars(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

const SOURCE_LABELS: Record<string, string> = {
  qgip: 'QLD Grants & Investment',
  austender: 'AusTender (Federal)',
  philanthropy: 'Philanthropic',
  state_budget: 'State Budgets',
};

const ENTITY_LABELS: Record<string, string> = {
  charity: 'Charities',
  company: 'Companies',
  foundation: 'Foundations',
  indigenous_corp: 'Indigenous Corporations',
  social_enterprise: 'Social Enterprises',
  government: 'Government',
  research: 'Research Orgs',
};

const ENTITY_COLORS: Record<string, string> = {
  charity: 'bg-blue-500',
  company: 'bg-gray-400',
  foundation: 'bg-amber-500',
  indigenous_corp: 'bg-ochre-600',
  social_enterprise: 'bg-emerald-500',
  government: 'bg-purple-500',
  research: 'bg-cyan-500',
};

export default function SectorMapPage() {
  const [data, setData] = useState<SectorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sector-map')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navigation />
        <main className="header-offset">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-3" />
            <span className="font-bold text-gray-500">Loading sector intelligence...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  const totalEntityCount = data.entityBreakdown.reduce((s, e) => s + e.count, 0);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="header-offset">
        {/* Hero */}
        <section className="section-padding border-b-2 border-black bg-black text-white">
          <div className="container-justice">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">
              Intelligence / Sector Map
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
              Australian Youth<br />Justice Sector
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mb-10">
              A comprehensive map of every organisation, grant, intervention, and funding flow
              in Australia's youth justice sector. Cross-referencing {formatNumber(summary.gsEntities)} entities,{' '}
              {formatNumber(summary.totalGrants)} funding records, and {formatNumber(summary.totalInterventions)} verified
              interventions across every state and territory.
            </p>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Funding Tracked', value: `$${summary.totalFundingBillions}B`, icon: DollarSign },
                { label: 'Funding Records', value: formatNumber(summary.totalGrants), icon: FileText },
                { label: 'GS Entities', value: formatNumber(summary.gsEntities), icon: Building2 },
                { label: 'Verified Interventions', value: formatNumber(summary.totalInterventions), icon: Scale },
                { label: 'AusTender Contracts', value: formatNumber(summary.austenderContracts), icon: Globe },
              ].map(m => (
                <div key={m.label} className="border border-gray-700 rounded-lg p-4">
                  <m.icon className="h-4 w-4 text-gray-500 mb-2" />
                  <p className="text-2xl md:text-3xl font-black tracking-tight">{m.value}</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Entity Landscape */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-2">
              <Network className="h-5 w-5" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                Entity Landscape
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 max-w-2xl">
              {formatNumber(totalEntityCount)} organisations mapped via GrantScope's civic graph —
              charities, foundations, Indigenous corporations, social enterprises, and government bodies.
            </p>

            {/* Entity type bars */}
            <div className="space-y-3 mb-8">
              {data.entityBreakdown.map(e => {
                const pct = (e.count / totalEntityCount) * 100;
                return (
                  <div key={e.entity_type} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-bold text-right shrink-0">
                      {ENTITY_LABELS[e.entity_type] || e.entity_type}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ENTITY_COLORS[e.entity_type] || 'bg-gray-500'} transition-all duration-700`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <div className="w-24 text-sm font-black text-right shrink-0">
                      {formatNumber(e.count)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Relationship types */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {data.gsRelationshipTypes.map(r => (
                <div key={r.relationship_type} className="border-2 border-black rounded-lg p-4 text-center">
                  <p className="text-xl font-black">{formatNumber(r.count)}</p>
                  <p className="text-xs font-bold text-gray-500 capitalize">{r.relationship_type.replace(/_/g, ' ')} links</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funding Flows */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                Funding Flows
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 max-w-2xl">
              Where ${summary.totalFundingBillions}B in justice funding has gone —
              by source, by recipient, and by sector.
            </p>

            {/* Funding by source */}
            <h3 className="text-lg font-black mb-4">By Source</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {data.fundingBySource.slice(0, 8).map(s => (
                <div key={s.source} className="bg-white border-2 border-black rounded-lg p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {SOURCE_LABELS[s.source] || s.source}
                  </p>
                  <p className="text-2xl font-black">
                    {formatDollars(Number(s.total_amount))}
                  </p>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {formatNumber(Number(s.grant_count))} records
                  </p>
                </div>
              ))}
            </div>

            {/* Top funding flows */}
            <h3 className="text-lg font-black mb-4">Top Funding Recipients</h3>
            <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50">
                      <th className="text-left p-3 font-black text-xs uppercase tracking-wider">Source</th>
                      <th className="text-left p-3 font-black text-xs uppercase tracking-wider">Recipient</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Total</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Records</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topJusticeFunding
                      .filter(f => f.recipient && f.recipient !== '(blank)' && f.recipient !== 'Multiple')
                      .slice(0, 15)
                      .map((f, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-500">
                          {SOURCE_LABELS[f.source] || f.source}
                        </td>
                        <td className="p-3 font-bold">{f.recipient}</td>
                        <td className="p-3 text-right font-black text-green-700">
                          {formatDollars(Number(f.total_amount))}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-500">
                          {formatNumber(Number(f.grant_count))}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-400">
                          {f.latest_year}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Intervention Coverage */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                Intervention Coverage
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 max-w-2xl">
              {formatNumber(summary.totalInterventions)} verified interventions with{' '}
              {formatNumber(summary.totalEvidence)} evidence items — mapped by type, linked to
              organisations and funding.
            </p>

            {/* Intervention types */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
              {data.interventionsByType.slice(0, 12).map(t => (
                <div key={t.type} className="border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <p className="text-2xl font-black">{t.count}</p>
                  <p className="text-xs font-bold text-gray-500 capitalize mt-1">
                    {(t.type || 'Unclassified').replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>

            {/* Top orgs with interventions + funding */}
            <h3 className="text-lg font-black mb-4">Organisations with ALMA Intelligence + Funding Data</h3>
            <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50">
                      <th className="text-left p-3 font-black text-xs uppercase tracking-wider">Organisation</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Interventions</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Evidence</th>
                      <th className="text-right p-3 font-black text-xs uppercase tracking-wider">Funding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topFundedOrgs.slice(0, 20).map((org, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-bold">{org.org_name}</span>
                          {org.is_indigenous_org && (
                            <span className="ml-2 text-[10px] font-black bg-ochre-100 text-ochre-800 px-1.5 py-0.5 rounded uppercase">
                              Indigenous
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black">{org.intervention_count}</td>
                        <td className="p-3 text-right font-bold text-gray-500">{org.evidence_count}</td>
                        <td className="p-3 text-right font-black text-green-700">
                          {org.total_funding ? formatDollars(Number(org.total_funding)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* JusticeHub Orgs Summary */}
        <section className="section-padding border-b-2 border-black bg-ochre-50">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                JusticeHub Network
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 max-w-2xl">
              {formatNumber(summary.totalOrgs)} organisations on JusticeHub, including{' '}
              {formatNumber(summary.indigenousOrgs)} Indigenous-led organisations — connected
              to GrantScope's civic graph for cross-sector intelligence.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-black rounded-lg p-5">
                <p className="text-3xl font-black">{formatNumber(summary.totalOrgs)}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Total Organisations</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-5">
                <p className="text-3xl font-black">{formatNumber(summary.indigenousOrgs)}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Indigenous-Led</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-5">
                <p className="text-3xl font-black">{formatNumber(summary.foundationsCount)}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Foundations (GS)</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-5">
                <p className="text-3xl font-black">{formatNumber(summary.totalEvidence)}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Evidence Items</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/intelligence/interventions"
                className="inline-flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-3 rounded-lg border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Explore Interventions <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/justice-funding"
                className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 rounded-lg border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Justice Spending <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/grants"
                className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 rounded-lg border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Find Grants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="section-padding">
          <div className="container-justice">
            <h2 className="text-2xl font-black tracking-tight uppercase mb-6">
              Data Sources
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="border-2 border-black rounded-lg p-5">
                <p className="font-black mb-2">GrantScope Civic Graph</p>
                <p className="text-gray-500">
                  {formatNumber(summary.gsEntities)} entities, {formatNumber(summary.austenderContracts)} AusTender
                  contracts, {formatNumber(summary.foundationsCount)} foundations. Entity relationships,
                  corporate structures, and donation flows.
                </p>
              </div>
              <div className="border-2 border-black rounded-lg p-5">
                <p className="font-black mb-2">ALMA Intelligence</p>
                <p className="text-gray-500">
                  {formatNumber(summary.totalInterventions)} verified interventions,{' '}
                  {formatNumber(summary.totalEvidence)} evidence items. AI-discovered,
                  community-verified knowledge about what works in youth justice.
                </p>
              </div>
              <div className="border-2 border-black rounded-lg p-5">
                <p className="font-black mb-2">Justice Funding</p>
                <p className="text-gray-500">
                  ${summary.totalFundingBillions}B tracked across {formatNumber(summary.totalGrants)} records.
                  QLD grants, ROGS data, AusTender contracts, and philanthropic flows.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Data updated continuously via automated collection agents. Last refresh: live.
              Contact us for API access or custom analysis.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
