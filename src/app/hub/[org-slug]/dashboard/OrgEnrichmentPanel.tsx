'use client';

import { DollarSign, TrendingUp, MapPin, Database, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
import type { EntityEnrichment } from '@/lib/grantscope/entity-enrichment';

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

interface OrgEnrichmentPanelProps {
  enrichment: EntityEnrichment;
  orgName: string;
}

export function OrgEnrichmentPanel({ enrichment, orgName }: OrgEnrichmentPanelProps) {
  const { relationshipSummary } = enrichment;
  const hasFundingSources = relationshipSummary.topFundingSources.length > 0;
  const hasFundingTargets = relationshipSummary.topFundingTargets.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black">Organisation Profile</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Public data from {enrichment.sourceCount || 0} government datasets
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {enrichment.latestRevenue && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Revenue</span>
            </div>
            <p className="text-2xl font-black">{formatCurrency(enrichment.latestRevenue)}</p>
            {enrichment.financialYear && (
              <p className="text-xs text-gray-400 mt-0.5">FY{enrichment.financialYear}</p>
            )}
          </div>
        )}
        {enrichment.latestAssets && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Assets</span>
            </div>
            <p className="text-2xl font-black">{formatCurrency(enrichment.latestAssets)}</p>
          </div>
        )}
        {enrichment.lgaName && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Location</span>
            </div>
            <p className="text-lg font-black">{enrichment.lgaName}</p>
            {enrichment.remoteness && (
              <p className="text-xs text-gray-400 mt-0.5">{enrichment.remoteness}</p>
            )}
          </div>
        )}
        {enrichment.seifaDecile && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">SEIFA Decile</span>
            </div>
            <p className="text-2xl font-black">{enrichment.seifaDecile}/10</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {enrichment.seifaDecile <= 3 ? 'High disadvantage' : enrichment.seifaDecile <= 6 ? 'Moderate' : 'Low disadvantage'}
            </p>
          </div>
        )}
      </div>

      {/* Funding relationships */}
      {(hasFundingSources || hasFundingTargets) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Who funds this org */}
          {hasFundingSources && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
              <h3 className="text-lg font-black flex items-center gap-2 mb-4">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
                Funding Received
              </h3>
              <div className="space-y-3">
                {relationshipSummary.topFundingSources.map((source, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">{source.name}</p>
                        {source.year && <p className="text-xs text-gray-400">{source.year}</p>}
                      </div>
                    </div>
                    <span className="font-black text-green-700">{formatCurrency(source.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Who this org funds */}
          {hasFundingTargets && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
              <h3 className="text-lg font-black flex items-center gap-2 mb-4">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                Funding Deployed
              </h3>
              <div className="space-y-3">
                {relationshipSummary.topFundingTargets.map((target, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">{target.name}</p>
                        {target.year && <p className="text-xs text-gray-400">{target.year}</p>}
                      </div>
                    </div>
                    <span className="font-black text-blue-700">{formatCurrency(target.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata bar */}
      <div className="flex flex-wrap gap-3 text-xs font-mono text-gray-400">
        {enrichment.abn && <span>ABN {enrichment.abn}</span>}
        {enrichment.sector && <span>· {enrichment.sector}</span>}
        {enrichment.subSector && <span>/ {enrichment.subSector}</span>}
        {enrichment.isCommunityControlled && <span>· Community Controlled</span>}
        {enrichment.sourceDatasets && <span>· Sources: {enrichment.sourceDatasets.join(', ')}</span>}
        <span>· {relationshipSummary.totalRelationships} funding relationships</span>
      </div>
    </div>
  );
}
