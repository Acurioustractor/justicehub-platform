'use client';

import { useState } from 'react';
import { Check, Copy, Linkedin, Twitter, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  modelCount: number;
  evidenceBacked: number;
  avgCost: number;
  detentionCost: number;
  ntDetentionCost: number;
  ratio: number;
  ntRatio: number;
  totalFunding: string;
  fundingRecords: number;
  totalOrgs: number;
  indigenousOrgs: number;
  evidenceItems: number;
  basecamps: number;
  costModels: number;
}

interface Template {
  id: string;
  category: string;
  platform: 'linkedin' | 'twitter' | 'newsletter' | 'funder';
  title: string;
  content: string;
  hashtags?: string;
  cta?: string;
}

function generateTemplates(s: Stats): Template[] {
  const avgFmt = s.avgCost >= 1000 ? `$${(s.avgCost / 1000).toFixed(0)}K` : `$${s.avgCost.toLocaleString()}`;
  const detFmt = s.detentionCost >= 1_000_000 ? `$${(s.detentionCost / 1_000_000).toFixed(1)}M` : `$${(s.detentionCost / 1000).toFixed(0)}K`;
  const ntDetFmt = s.ntDetentionCost >= 1_000_000 ? `$${(s.ntDetentionCost / 1_000_000).toFixed(1)}M` : `$${(s.ntDetentionCost / 1000).toFixed(0)}K`;

  return [
    // LinkedIn — Cost argument
    {
      id: 'li-cost-1',
      category: 'The Cost Argument',
      platform: 'linkedin',
      title: 'The cost comparison that stops people',
      content: `Australia spends ${detFmt} per year to detain one young person.\n\nCommunity alternatives cost ${avgFmt} on average.\n\nThat's ${s.ratio}x cheaper. For better outcomes.\n\nWe've now documented ${s.modelCount.toLocaleString()} alternative models across Australia. ${s.evidenceBacked} have evidence backing them. ${s.costModels} have verified cost data.\n\nThe alternative isn't theoretical. It exists. It works. It costs a fraction of what we spend on a system that fails 85% of the time.\n\nThe data: justicehub.com.au/proof`,
      hashtags: '#YouthJustice #Australia #AlternativeModels #ALMA',
    },
    {
      id: 'li-cost-nt',
      category: 'The Cost Argument',
      platform: 'linkedin',
      title: 'NT spotlight — highest cost in Australia',
      content: `The Northern Territory spends $${Math.round(s.ntDetentionCost / 365).toLocaleString()} per day to detain one young person.\n\nThat's ${ntDetFmt} per year. Per child.\n\nCommunity models like Oonchiumpa in Mparntwe (Alice Springs) achieve better outcomes for ${avgFmt}.\n\nThat's ${s.ntRatio}x cheaper.\n\nThe NT also has the highest rate of Indigenous youth incarceration in the country. The money flows to a system that doesn't work while community organisations fight for scraps.\n\nThe data is all here: justicehub.com.au/calculator`,
      hashtags: '#NorthernTerritory #YouthJustice #IndigenousAustralia',
    },
    // LinkedIn — Follow the Money
    {
      id: 'li-funding-1',
      category: 'Follow the Money',
      platform: 'linkedin',
      title: 'Where the money actually goes',
      content: `We've tracked ${s.totalFunding} in youth justice funding across ${s.fundingRecords.toLocaleString()} records.\n\n${s.totalOrgs.toLocaleString()} organisations. ${s.indigenousOrgs.toLocaleString()} Indigenous-led.\n\nThe pattern is clear: large providers receive the bulk of funding. Community organisations — the ones achieving better outcomes at lower cost — get what's left.\n\nThis isn't opinion. It's public data, aggregated for the first time in one place.\n\nFollow the money: justicehub.com.au/follow-the-money`,
      hashtags: '#FundingTransparency #YouthJustice #FollowTheMoney',
    },
    // LinkedIn — The Network
    {
      id: 'li-network-1',
      category: 'The Network',
      platform: 'linkedin',
      title: 'The ALMA Network — what we\'re building',
      content: `We're building a national network of community organisations that prove alternative models work.\n\nThe ALMA Network (Alternative Local Models of Australia):\n\n→ ${s.modelCount.toLocaleString()} verified community models\n→ ${s.evidenceBacked} with evidence backing\n→ ${s.basecamps} Basecamps coordinating across states\n→ ${s.evidenceItems.toLocaleString()} evidence items in the library\n\nBasecamps coordinate. Miners do the work. Validators confirm it's real. Together, they're building the alternative to a billion-dollar system that fails kids.\n\nJoin us: justicehub.com.au/join`,
      hashtags: '#ALMANetwork #CommunityLed #YouthJustice',
    },
    // Twitter threads
    {
      id: 'tw-cost-thread',
      category: 'The Cost Argument',
      platform: 'twitter',
      title: 'Cost comparison thread',
      content: `🧵 Thread: The youth justice cost argument in 5 tweets\n\n1/ Australia spends ${detFmt}/year per young person in detention. Community alternatives: ${avgFmt}. That's ${s.ratio}x cheaper.\n\n2/ The NT is worst: $${Math.round(s.ntDetentionCost / 365).toLocaleString()}/day per child. ${ntDetFmt}/year. ${s.ntRatio}x what community models cost. Highest Indigenous incarceration rate in the country.\n\n3/ We've documented ${s.modelCount.toLocaleString()} alternative models. ${s.evidenceBacked} have evidence. ${s.costModels} have cost data. This isn't theory — these are real programs operating right now.\n\n4/ ${s.totalFunding} in funding tracked. The pattern: large providers get the bulk. Community orgs get scraps. The ones achieving better outcomes at lower cost are the ones being underfunded.\n\n5/ All the data: justicehub.com.au/proof\nThe calculator: justicehub.com.au/calculator\nFollow the money: justicehub.com.au/follow-the-money`,
      hashtags: '#YouthJustice #auspol',
    },
    // Newsletter snippet
    {
      id: 'nl-weekly',
      category: 'The Network',
      platform: 'newsletter',
      title: 'Weekly newsletter snippet',
      content: `THIS WEEK ON JUSTICEHUB\n\nThe ALMA Network now tracks ${s.modelCount.toLocaleString()} verified alternative models across Australia. ${s.evidenceBacked} have evidence backing them.\n\nThe cost argument keeps getting stronger: detention costs ${detFmt}/year per young person. Community models average ${avgFmt}. That's ${s.ratio}x cheaper — for better outcomes.\n\nNew this week: Wall of Proof (justicehub.com.au/proof), interactive Cost Calculator (justicehub.com.au/calculator), and shareable data cards for your next board meeting (justicehub.com.au/share).\n\nThe alternative exists. Help us prove it.`,
    },
    // Funder email
    {
      id: 'funder-email',
      category: 'For Funders',
      platform: 'funder',
      title: 'Funder briefing email',
      content: `Subject: ${s.modelCount} alternative models — the evidence base you asked for\n\nHi [Name],\n\nFollowing our conversation about the evidence for community-led youth justice alternatives, I wanted to share what we've built.\n\nJusticeHub now tracks:\n• ${s.modelCount.toLocaleString()} verified alternative models across Australia\n• ${s.evidenceBacked} with formal evidence backing\n• ${s.costModels} with verified cost-per-young-person data\n• ${s.totalFunding} in youth justice funding mapped\n\nThe cost argument: detention costs ${detFmt}/year per young person. Community models average ${avgFmt}. That's ${s.ratio}x cheaper.\n\nKey pages for your team:\n• Wall of Proof: justicehub.com.au/proof\n• Cost Calculator: justicehub.com.au/calculator\n• Follow the Money: justicehub.com.au/follow-the-money\n• Shareable data cards: justicehub.com.au/share\n\nHappy to walk your team through the data. The platform is open — everything is there for due diligence.\n\nBest,\n[Your name]`,
    },
    // LinkedIn — Individual stat posts
    {
      id: 'li-stat-indigenous',
      category: 'Follow the Money',
      platform: 'linkedin',
      title: 'Indigenous org funding share',
      content: `Of ${s.totalOrgs.toLocaleString()} organisations in Australia's youth justice sector, ${s.indigenousOrgs.toLocaleString()} are Indigenous-led.\n\nIndigenous young people are 24x more likely to be in detention.\n\nThe question isn't whether Indigenous-led organisations should receive more funding. It's why they don't.\n\nData: justicehub.com.au/follow-the-money`,
      hashtags: '#IndigenousAustralia #YouthJustice #FundingEquity',
    },
    {
      id: 'li-stat-proof',
      category: 'The Cost Argument',
      platform: 'linkedin',
      title: 'The one-liner',
      content: `${s.modelCount} alternatives. ${s.evidenceBacked} with evidence. ${s.ratio}x cheaper than detention.\n\nThe alternative exists.\n\njusticehub.com.au/proof`,
      hashtags: '#YouthJustice #ALMA',
    },
  ];
}

const PLATFORM_ICONS: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  newsletter: Mail,
  funder: Mail,
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  newsletter: 'Newsletter',
  funder: 'Funder Email',
};

export function ContentTemplates({ stats }: { stats: Stats }) {
  const templates = generateTemplates(stats);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCopy = (id: string, content: string, hashtags?: string) => {
    const full = hashtags ? `${content}\n\n${hashtags}` : content;
    navigator.clipboard.writeText(full);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Group by category
  const categories: Record<string, Template[]> = {};
  for (const t of templates) {
    if (!categories[t.category]) categories[t.category] = [];
    categories[t.category].push(t);
  }

  return (
    <div className="space-y-12">
      {Object.entries(categories).map(([category, catTemplates]) => (
        <section key={category}>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {category}
          </h2>
          <div className="space-y-4">
            {catTemplates.map((t) => {
              const Icon = PLATFORM_ICONS[t.platform] || Mail;
              const isExpanded = expanded === t.id;
              const preview = t.content.split('\n').slice(0, 3).join('\n');

              return (
                <div key={t.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#0A0A0A]/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0A0A0A]/5">
                        <Icon className="w-4 h-4 text-[#0A0A0A]/60" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.title}</p>
                        <p className="text-xs text-[#0A0A0A]/40">{PLATFORM_LABELS[t.platform]}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />
                    )}
                  </button>

                  {/* Content */}
                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <div className="bg-[#F5F0E8] rounded-lg p-4 mb-3">
                        <pre className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap font-sans leading-relaxed">
                          {t.content}
                        </pre>
                        {t.hashtags && (
                          <p className="text-xs text-[#059669] mt-3">{t.hashtags}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(t.id, t.content, t.hashtags)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-medium rounded-lg hover:bg-[#0A0A0A]/80 transition-colors"
                        >
                          {copied === t.id ? (
                            <>
                              <Check className="w-3 h-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy to clipboard
                            </>
                          )}
                        </button>
                        <Link
                          href="/share"
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0A0A0A]/20 text-xs font-medium rounded-lg hover:border-[#0A0A0A]/40 transition-colors"
                        >
                          Get data card
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Tips */}
      <section className="bg-[#0A0A0A] text-white rounded-xl p-8">
        <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Amplification Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">LinkedIn (highest reach)</h3>
            <ul className="space-y-1.5">
              {[
                `Lead with the number — "${stats.detentionCost >= 1_000_000 ? `$${(stats.detentionCost / 1_000_000).toFixed(1)}M` : `$${(stats.detentionCost / 1000).toFixed(0)}K`} vs ${stats.avgCost >= 1000 ? `$${(stats.avgCost / 1000).toFixed(0)}K` : `$${stats.avgCost.toLocaleString()}`}" stops the scroll`,
                'Attach a data card from /share as the image',
                'Tag relevant people (ministers, funder contacts, sector leads)',
                'Post between 8-10am AEST for maximum reach',
                'End with the URL — let people find the full data',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                  <span className="text-[#059669] mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Funder Emails</h3>
            <ul className="space-y-1.5">
              {[
                'Personalise the opening — reference your last conversation',
                'Lead with the number they care about most',
                'Include 2-3 links max (proof, calculator, follow-the-money)',
                'Offer a walkthrough — "happy to show your team the data"',
                'Attach the cost-comparison data card as an image',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                  <span className="text-[#059669] mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
