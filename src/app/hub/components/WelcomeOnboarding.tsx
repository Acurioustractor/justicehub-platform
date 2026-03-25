'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Newspaper, Heart, DollarSign, Users,
  ArrowRight, ChevronRight, ChevronLeft, X, MapPin,
  BookOpen, BarChart3, Share2, Shield, Search, Megaphone,
} from 'lucide-react';

interface WelcomeOnboardingProps {
  userName: string;
  memberType: string | null;
  userState: string;
  orgSlug: string | null;
  orgName: string | null;
  profileSlug: string | null;
}

const ROLE_STEPS: Record<string, Array<{
  title: string;
  description: string;
  icon: any;
  cta: { label: string; href: string };
}>> = {
  organization: [
    {
      title: 'Your Organisation Hub',
      description: 'Access grants, compliance tools, programs, and network connections — all tailored to your org. Claim your organisation to unlock the full dashboard.',
      icon: Building2,
      cta: { label: 'Claim your org', href: '/hub' },
    },
    {
      title: 'Funding Intelligence',
      description: 'We track 94,000+ funding records nationally. See what funding flows to your state, discover grants you may be eligible for, and benchmark against similar organisations.',
      icon: BarChart3,
      cta: { label: 'Explore funding', href: '/justice-funding' },
    },
    {
      title: 'The CONTAINED Network',
      description: 'Connect with other organisations, supporters, funders, and media in your tour stop city. Build the coalition that changes youth justice.',
      icon: Megaphone,
      cta: { label: 'See the network', href: '/hub' },
    },
  ],
  media: [
    {
      title: 'Data-Driven Briefings',
      description: 'Copy-ready statistics, sourced from live JusticeHub data. Funding breakdowns, program evidence, and cost comparisons — updated daily.',
      icon: BarChart3,
      cta: { label: 'Open Media Hub', href: '/hub/media' },
    },
    {
      title: 'Coverage & Sentiment',
      description: 'Track youth justice media coverage across Australia. See what stories are breaking, sentiment trends, and where the conversation is heading.',
      icon: Newspaper,
      cta: { label: 'See latest coverage', href: '/hub/media' },
    },
    {
      title: 'Photo & Video Library',
      description: 'Real photos and video from real programs and real people — sourced from the Empathy Ledger. No stock photos, no AI images.',
      icon: BookOpen,
      cta: { label: 'Browse the library', href: '/hub/media' },
    },
  ],
  supporter: [
    {
      title: 'Write to Your MP',
      description: 'Pre-written letter templates personalised with your state\'s data. Copy, paste, send — it takes 2 minutes to make your voice heard.',
      icon: Share2,
      cta: { label: 'Open Supporter Hub', href: '/hub/supporter' },
    },
    {
      title: 'Your Tour Stop',
      description: 'CONTAINED is touring 5 cities. Find your nearest event, register, and meet the movement in person.',
      icon: MapPin,
      cta: { label: 'See tour dates', href: '/contained/register' },
    },
    {
      title: 'Share the Campaign',
      description: 'Ready-made social posts for Twitter, LinkedIn, Instagram, and Facebook. One click to amplify the message.',
      icon: Megaphone,
      cta: { label: 'Get the social kit', href: '/contained/tour/social' },
    },
  ],
  funder: [
    {
      title: 'Funding Gap Analysis',
      description: 'See which evidence-backed programs have zero tracked government funding. Find where your investment will have the highest impact.',
      icon: DollarSign,
      cta: { label: 'Open Funder Hub', href: '/hub/funder' },
    },
    {
      title: 'Evidence Library',
      description: '1,076 verified interventions with cost data, evidence levels, and outcomes. Filter by state, evidence level, and program type.',
      icon: Search,
      cta: { label: 'Explore evidence', href: '/intelligence' },
    },
    {
      title: 'Due Diligence Tools',
      description: 'Organisation profiles with ACNC data, funding history, compliance status, and board connections. Everything you need before writing a cheque.',
      icon: Shield,
      cta: { label: 'Search organisations', href: '/organizations' },
    },
  ],
  lived_experience: [
    {
      title: 'Your Story Matters',
      description: 'Share your experience anonymously, by name, or on video. Nothing is published without your explicit approval. Your voice shapes the campaign.',
      icon: BookOpen,
      cta: { label: 'Open your Hub', href: '/hub/lived-experience' },
    },
    {
      title: 'Find Programs Near You',
      description: 'Search for youth programs, support services, and community organisations in your state. Find the help that\'s already out there.',
      icon: Search,
      cta: { label: 'Find programs', href: '/hub/lived-experience' },
    },
    {
      title: 'You\'re Not Alone',
      description: 'Connect with the network. See community stories, meet people at tour events, and access crisis support if you need it.',
      icon: Users,
      cta: { label: 'See community stories', href: '/stories' },
    },
  ],
};

export function WelcomeOnboarding({ userName, memberType, userState, orgSlug, orgName, profileSlug }: WelcomeOnboardingProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true); // start hidden, check localStorage

  useEffect(() => {
    const key = 'contained_onboarding_dismissed';
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('contained_onboarding_dismissed', '1');
    }
  }

  if (dismissed) return null;

  const steps = memberType ? ROLE_STEPS[memberType] : ROLE_STEPS.supporter;
  if (!steps) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const roleLabel = {
    organization: 'Organisation',
    media: 'Media',
    supporter: 'Supporter',
    funder: 'Funder',
    lived_experience: 'Lived Experience',
  }[memberType || 'supporter'] || 'Member';

  return (
    <div className="border border-[#DC2626]/30 bg-[#DC2626]/5 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] text-[#DC2626] uppercase tracking-wider">Welcome to CONTAINED</p>
          <h2 className="text-lg font-bold mt-0.5">
            {step === 0 ? `Hey ${userName} — here's what's here for you` : current.title}
          </h2>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60 transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step content */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 bg-[#DC2626]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#DC2626]" />
        </div>
        <div>
          {step === 0 && <h3 className="font-bold text-sm mb-1">{current.title}</h3>}
          <p className="text-sm text-[#F5F0E8]/70">{current.description}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Step dots */}
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-[#DC2626]' : 'bg-[#F5F0E8]/20'
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
          <span className="text-[10px] font-mono text-[#F5F0E8]/30 ml-2">
            {step + 1}/{steps.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-xs font-mono text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Back
            </button>
          )}

          {isLast ? (
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-bold hover:bg-[#DC2626]/90 transition-colors flex items-center gap-1"
            >
              Get Started <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-bold hover:bg-[#DC2626]/90 transition-colors flex items-center gap-1"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* CTA link */}
      <Link
        href={current.cta.href}
        className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
      >
        {current.cta.label} →
      </Link>
    </div>
  );
}
