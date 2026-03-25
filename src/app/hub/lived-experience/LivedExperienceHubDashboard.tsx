'use client';

import Link from 'next/link';
import {
  Users, ArrowLeft, MapPin, Shield, Eye, EyeOff, BookOpen,
  Heart, Phone, MessageCircle, CheckCircle2, Clock, Calendar,
} from 'lucide-react';
import type { TourStop } from '@/content/campaign';

interface LivedExperienceHubDashboardProps {
  userName: string;
  userState: string;
  isPublic: boolean;
  matchedStop: TourStop | null;
  tourStops: TourStop[];
  totalPeers: number;
  publicPeers: Array<{ preferred_name: string | null; location: string | null }>;
  peersByState: Record<string, number>;
  storyCount: number;
  youthPrograms: Array<{
    id: string;
    name: string;
    evidence_level: string | null;
    organizations?: { name: string } | null;
  }>;
}

export function LivedExperienceHubDashboard({
  userName,
  userState,
  isPublic,
  matchedStop,
  tourStops,
  totalPeers,
  publicPeers,
  peersByState,
  storyCount,
  youthPrograms,
}: LivedExperienceHubDashboardProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Users className="w-5 h-5 text-purple-500" />
            <span className="font-mono text-xs text-purple-500">LIVED EXPERIENCE HUB</span>
          </div>
          <span className="font-mono text-xs text-[#F5F0E8]/40">{userName}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your Voice, Your Terms
          </h1>
          <p className="text-sm text-[#F5F0E8]/50 mt-1 font-mono">
            A safe space to connect, share, and shape the movement
          </p>
        </div>

        {/* Privacy notice */}
        <div className={`mb-8 p-4 border ${isPublic ? 'border-[#059669]/30 bg-[#059669]/5' : 'border-purple-500/30 bg-purple-500/5'}`}>
          <div className="flex items-center gap-3">
            {isPublic ? (
              <>
                <Eye className="w-5 h-5 text-[#059669]" />
                <div>
                  <p className="text-sm font-bold">Your profile is public</p>
                  <p className="text-xs text-[#F5F0E8]/50 font-mono">Other members can see your name and state. Change this in profile settings.</p>
                </div>
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-bold">Your profile is private</p>
                  <p className="text-xs text-[#F5F0E8]/50 font-mono">Only you can see your details. You control what&apos;s shared.</p>
                </div>
              </>
            )}
            <Shield className="w-4 h-4 text-[#F5F0E8]/20 ml-auto" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your community */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Your Community</h2>
              <p className="text-sm text-[#F5F0E8]/50 mb-4">
                {totalPeers} people with lived experience have joined the movement
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tourStops.map((stop) => {
                  const count = peersByState[stop.state] || 0;
                  const isYours = stop.state === userState;
                  return (
                    <div
                      key={stop.state}
                      className={`p-3 border transition-colors ${
                        isYours ? 'border-purple-500/30 bg-purple-500/5' : 'border-[#F5F0E8]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className={`w-3 h-3 ${isYours ? 'text-purple-500' : 'text-[#F5F0E8]/20'}`} />
                        <span className="font-bold text-sm">{stop.city}</span>
                      </div>
                      <p className="font-mono text-xs text-[#F5F0E8]/40">
                        {count} {count === 1 ? 'person' : 'people'}
                        {isYours && <span className="text-purple-500 ml-1">· you</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tour stop */}
            {matchedStop && (
              <div className="border border-purple-500/20 bg-purple-500/5 p-6">
                <h2 className="font-mono text-xs text-purple-500 mb-4 uppercase tracking-wider">Your Tour Stop</h2>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#DC2626]" />
                      {matchedStop.city}, {matchedStop.state}
                    </h3>
                    <p className="text-sm text-[#F5F0E8]/60 mt-1">{matchedStop.partner}</p>
                    <p className="text-sm text-[#F5F0E8]/40 mt-2">{matchedStop.description}</p>
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

            {/* Programs that help */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Programs That Help</h2>
              <p className="text-sm text-[#F5F0E8]/50 mb-4">
                Community-based alternatives — support that works outside the system
              </p>
              <div className="space-y-2">
                {youthPrograms.map((program) => (
                  <div key={program.id} className="p-3 border border-[#F5F0E8]/5">
                    <p className="font-bold text-sm">{program.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {(program.organizations as any)?.name && (
                        <span className="text-[10px] font-mono text-[#F5F0E8]/40">{(program.organizations as any).name}</span>
                      )}
                      {program.evidence_level && (
                        <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5">
                          {program.evidence_level.split(' (')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/intelligence"
                className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
              >
                Browse all programs →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share your story */}
            <div className="border border-purple-500/20 bg-purple-500/5 p-5">
              <h2 className="font-mono text-xs text-purple-500 mb-2 uppercase tracking-wider">Share Your Story</h2>
              <p className="text-xs text-[#F5F0E8]/50 mb-3">
                Your experience can change policy. Share on your terms — anonymous or named, written or recorded.
              </p>
              <Link
                href="/stories"
                className="block text-center py-2 bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-colors"
              >
                View Stories
              </Link>
              <p className="text-[10px] text-[#F5F0E8]/30 font-mono mt-2 text-center">
                All submissions reviewed before publishing
              </p>
            </div>

            {/* Support resources */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Support Resources</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#F5F0E8]/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">13YARN</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">13 92 76 — Aboriginal & Torres Strait Islander crisis line</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#F5F0E8]/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Kids Helpline</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">1800 55 1800 — free, 24/7</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-[#F5F0E8]/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Headspace</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">headspace.org.au — mental health support for young people</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-[#F5F0E8]/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Legal Aid</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">Free legal help — search by state at legalaid.gov.au</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Your Privacy</h2>
              <div className="space-y-2 text-xs text-[#F5F0E8]/40">
                <p className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  Profile is {isPublic ? 'public' : 'private'} by default
                </p>
                <p className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  You choose what to share
                </p>
                <p className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  Stories reviewed before publishing
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Explore</h2>
              <div className="space-y-2">
                <Link href="/contained" className="block text-sm hover:text-purple-400 transition-colors">
                  About CONTAINED →
                </Link>
                <Link href="/contained/tour/social" className="block text-sm hover:text-purple-400 transition-colors">
                  Social media kit →
                </Link>
                <Link href="/contained/act" className="block text-sm hover:text-purple-400 transition-colors">
                  Take action →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
