'use client';

import Link from 'next/link';
import {
  Heart, ArrowLeft, MapPin, Share2, Mail, Calendar,
  Users, Megaphone, CheckCircle2, Clock, ExternalLink, Zap,
} from 'lucide-react';
import type { TourStop } from '@/content/campaign';

interface SupporterHubDashboardProps {
  userName: string;
  userState: string;
  matchedStop: TourStop | null;
  tourStops: TourStop[];
  totalMembers: number;
  totalOrgs: number;
  totalSupporters: number;
  stateCounts: Record<string, number>;
  fundingRecords: number;
  interventions: number;
}

const ACTIONS = [
  {
    title: 'Write to your MP',
    description: 'Use our template to contact your representative about youth justice',
    icon: Mail,
    href: '/contained/act',
    urgency: 'high' as const,
  },
  {
    title: 'Share the campaign',
    description: 'Social media posts, graphics, and hashtags ready to go',
    icon: Share2,
    href: '/contained/tour/social',
    urgency: 'medium' as const,
  },
  {
    title: 'Register for a tour event',
    description: 'Attend your local CONTAINED tour stop',
    icon: Calendar,
    href: '/contained/register',
    urgency: 'high' as const,
  },
  {
    title: 'Explore the evidence',
    description: 'Learn what actually works in youth justice — backed by data',
    icon: Zap,
    href: '/intelligence',
    urgency: 'low' as const,
  },
];

export function SupporterHubDashboard({
  userName,
  userState,
  matchedStop,
  tourStops,
  totalMembers,
  totalOrgs,
  totalSupporters,
  stateCounts,
  fundingRecords,
  interventions,
}: SupporterHubDashboardProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="font-mono text-xs text-pink-500">SUPPORTER HUB</span>
          </div>
          <span className="font-mono text-xs text-[#F5F0E8]/40">{userName}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your Actions Matter
          </h1>
          <p className="text-sm text-[#F5F0E8]/50 mt-1 font-mono">
            {totalMembers} people have joined — here&apos;s how you can amplify the movement
          </p>
        </div>

        {/* Impact counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Network</p>
            <p className="text-2xl font-bold mt-1">{totalMembers}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">members joined</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Supporters</p>
            <p className="text-2xl font-bold mt-1">{totalSupporters}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">like you</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Organisations</p>
            <p className="text-2xl font-bold mt-1">{totalOrgs}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">in the coalition</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Tour Stops</p>
            <p className="text-2xl font-bold mt-1">{tourStops.length}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">cities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action items */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Take Action</h2>
              <div className="space-y-3">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="block p-4 border border-[#F5F0E8]/5 hover:border-pink-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${
                          action.urgency === 'high' ? 'text-[#DC2626]' : action.urgency === 'medium' ? 'text-pink-500' : 'text-[#F5F0E8]/30'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{action.title}</p>
                            {action.urgency === 'high' && (
                              <span className="text-[9px] font-mono bg-[#DC2626]/20 text-[#DC2626] px-1.5 py-0.5">PRIORITY</span>
                            )}
                          </div>
                          <p className="text-xs text-[#F5F0E8]/40 mt-0.5">{action.description}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#F5F0E8]/20 shrink-0 mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Your tour stop */}
            {matchedStop && (
              <div className="border border-pink-500/20 bg-pink-500/5 p-6">
                <h2 className="font-mono text-xs text-pink-500 mb-4 uppercase tracking-wider">Your Tour Stop</h2>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#DC2626]" />
                      {matchedStop.city}, {matchedStop.state}
                    </h3>
                    <p className="text-sm text-[#F5F0E8]/60 mt-1">{matchedStop.partner}</p>
                    <p className="text-sm text-[#F5F0E8]/40 mt-2">{matchedStop.description}</p>
                    {stateCounts[userState] && (
                      <p className="text-xs font-mono text-pink-500 mt-3">
                        {stateCounts[userState]} members in {userState}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono text-xs text-[#F5F0E8]/40">DATE</p>
                    <p className="font-bold text-sm">{matchedStop.date}</p>
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono ${
                      matchedStop.status === 'confirmed' ? 'bg-[#059669]/20 text-[#059669]' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {matchedStop.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {matchedStop.status}
                    </div>
                  </div>
                </div>
                <Link
                  href="/contained/register"
                  className="inline-block mt-4 px-4 py-2 bg-[#DC2626] text-white text-sm font-bold hover:bg-[#DC2626]/90 transition-colors"
                >
                  Register for Event
                </Link>
              </div>
            )}

            {/* The movement by numbers */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Why This Matters</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-[#F5F0E8]/5">
                  <p className="text-xl font-bold">{interventions.toLocaleString()}</p>
                  <p className="text-xs text-[#F5F0E8]/40 font-mono">alternative programs documented</p>
                </div>
                <div className="p-3 border border-[#F5F0E8]/5">
                  <p className="text-xl font-bold">{fundingRecords.toLocaleString()}</p>
                  <p className="text-xs text-[#F5F0E8]/40 font-mono">funding records tracked</p>
                </div>
                <div className="p-3 border border-[#F5F0E8]/5">
                  <p className="text-xl font-bold">$170K</p>
                  <p className="text-xs text-[#F5F0E8]/40 font-mono">median program cost/year</p>
                </div>
                <div className="p-3 border border-[#F5F0E8]/5">
                  <p className="text-xl font-bold">$548K</p>
                  <p className="text-xs text-[#F5F0E8]/40 font-mono">cost of detention/year</p>
                </div>
              </div>
              <p className="text-xs text-[#F5F0E8]/40 mt-3 font-mono">
                Community alternatives cost 3x less than detention and deliver better outcomes.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Network by state */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Network Growth</h2>
              <div className="space-y-2">
                {tourStops.map((stop) => {
                  const count = stateCounts[stop.state] || 0;
                  const isYours = stop.state === userState;
                  return (
                    <div key={stop.state} className={`flex items-center justify-between text-sm ${isYours ? 'text-pink-500 font-bold' : ''}`}>
                      <span className="flex items-center gap-1.5">
                        <MapPin className={`w-3 h-3 ${isYours ? 'text-pink-500' : 'text-[#F5F0E8]/20'}`} />
                        {stop.city}
                      </span>
                      <span className="font-mono text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Learn More</h2>
              <div className="space-y-2">
                <Link href="/contained" className="block text-sm hover:text-pink-400 transition-colors">
                  Campaign overview →
                </Link>
                <Link href="/stories" className="block text-sm hover:text-pink-400 transition-colors">
                  Community stories →
                </Link>
                <Link href="/intelligence" className="block text-sm hover:text-pink-400 transition-colors">
                  ALMA evidence platform →
                </Link>
                <Link href="/justice-funding" className="block text-sm hover:text-pink-400 transition-colors">
                  Follow the money →
                </Link>
              </div>
            </div>

            {/* Spread the word */}
            <div className="border border-pink-500/20 bg-pink-500/5 p-5">
              <h2 className="font-mono text-xs text-pink-500 mb-2 uppercase tracking-wider">Spread the Word</h2>
              <p className="text-xs text-[#F5F0E8]/50 mb-3">
                Invite others to join the movement
              </p>
              <Link
                href="/contained/join"
                className="block text-center py-2 bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
              >
                Share Join Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
