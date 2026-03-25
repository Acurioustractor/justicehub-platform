'use client';

import Link from 'next/link';
import {
  MapPin, Calendar, CheckCircle2, Clock, DollarSign,
  Download, Share2, ExternalLink, ArrowRight,
} from 'lucide-react';
import type { TourStop } from '@/content/campaign';

interface FundingRecord {
  id: string;
  program_name: string | null;
  amount_dollars: number | null;
  financial_year: string | null;
  source: string | null;
}

interface CampaignViewProps {
  orgName: string;
  orgState: string;
  orgCity: string;
  matchedStop: TourStop | null;
  stateFundingCount: number;
  orgFunding: FundingRecord[];
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function CampaignView({
  orgName,
  orgState,
  orgCity,
  matchedStop,
  stateFundingCount,
  orgFunding,
}: CampaignViewProps) {
  const totalFunding = orgFunding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black">CONTAINED Campaign</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Campaign resources and connections for {orgName}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tour stop */}
        {matchedStop && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-red-600" />
              Your Tour Stop
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xl font-black">{matchedStop.city}, {matchedStop.state}</p>
                <p className="text-sm text-gray-600">{matchedStop.partner}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold">{matchedStop.date}</span>
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded ${
                  matchedStop.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {matchedStop.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {matchedStop.status}
                </div>
              </div>
              <p className="text-sm text-gray-500">{matchedStop.description}</p>
              {matchedStop.partnerQuote && (
                <p className="text-sm italic text-gray-400 border-l-2 border-red-600 pl-3 mt-3">
                  {matchedStop.partnerQuote}
                </p>
              )}
              <Link
                href="/contained/register"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors mt-2"
              >
                Register for Event <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Funding overview */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
          <h3 className="text-lg font-black flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            Funding in {orgState}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-2xl font-black">{stateFundingCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-bold">State funding records</p>
            </div>
            {totalFunding > 0 && (
              <div>
                <p className="text-2xl font-black">{formatCurrency(totalFunding)}</p>
                <p className="text-xs text-gray-500 font-bold">Your org&apos;s tracked funding</p>
              </div>
            )}
          </div>
          {orgFunding.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Recent Funding</p>
              {orgFunding.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-bold">{f.program_name || 'Grant'}</p>
                    <p className="text-xs text-gray-400">{f.financial_year} · {f.source}</p>
                  </div>
                  {f.amount_dollars && (
                    <span className="text-sm font-bold text-green-700">{formatCurrency(f.amount_dollars)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link
            href={`/justice-funding?state=${orgState}`}
            className="text-sm font-bold text-red-600 hover:underline"
          >
            Explore all {orgState} funding →
          </Link>
        </div>
      </div>

      {/* Campaign toolkit */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
        <h3 className="text-lg font-black mb-4">Campaign Toolkit</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/contained/tour/social"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded hover:border-black transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Social Kit</p>
              <p className="text-xs text-gray-400">Posts, images, hashtags</p>
            </div>
          </Link>
          <Link
            href="/contained/act"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded hover:border-black transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Take Action</p>
              <p className="text-xs text-gray-400">Write to your MP</p>
            </div>
          </Link>
          <Link
            href="/contained"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded hover:border-black transition-colors"
          >
            <Download className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Campaign Page</p>
              <p className="text-xs text-gray-400">Full overview</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
