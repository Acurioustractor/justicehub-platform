'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { STATE_NAMES } from '@/lib/constants';

interface StateData {
  state: string;
  totalFunding: string;
  totalOrgs: number;
  indigenousOrgs: number;
  almaModels: number;
  fundingRecords: number;
}

interface LetterGeneratorProps {
  stateData: Record<string, StateData>;
  nationalModels: number;
  avgCost: number;
  ratio: number;
  stateDetentionCosts: Record<string, number>;
}

function generateLetter(
  state: string,
  sd: StateData,
  name: string,
  nationalModels: number,
  avgCost: number,
  ratio: number,
  stateDetentionCosts: Record<string, number>
): string {
  const stateName = STATE_NAMES[state];
  const detDaily = stateDetentionCosts[state] || 1500;
  const detAnnual = detDaily * 365;
  const detFmt = detAnnual >= 1_000_000 ? `$${(detAnnual / 1_000_000).toFixed(1)}M` : `$${(detAnnual / 1000).toFixed(0)}K`;
  const avgFmt = avgCost >= 1000 ? `$${(avgCost / 1000).toFixed(0)}K` : `$${avgCost.toLocaleString()}`;
  const stateRatio = Math.round(detAnnual / avgCost);

  return `Dear Member,

I am writing to you as a constituent in ${stateName} about the current approach to youth justice in our state.

I want to draw your attention to some numbers that I believe warrant serious consideration:

• ${stateName} currently spends $${detDaily.toLocaleString()} per day to detain one young person. That is ${detFmt} per year, per child.

• Nationally, community-led alternatives to detention cost an average of ${avgFmt} per young person — ${stateRatio}x less than detention.

• Across Australia, ${nationalModels.toLocaleString()} community-led alternative models have been documented by JusticeHub (justicehub.com.au/proof). ${sd.almaModels} of these operate in ${stateName}.

• ${stateName} has ${sd.totalOrgs.toLocaleString()} organisations working in youth justice, of which ${sd.indigenousOrgs.toLocaleString()} are Indigenous-led. ${sd.totalFunding} in funding has been tracked across ${sd.fundingRecords.toLocaleString()} records.

• Nationally, 84% of young people who go through detention reoffend. Community programs achieve significantly better outcomes at a fraction of the cost.

The evidence is clear: community-led approaches work better and cost less. The question is whether our state's funding reflects this evidence.

I would welcome the opportunity to discuss:

1. How ${stateName} is allocating youth justice funding between detention and community alternatives
2. What plans exist to increase investment in evidence-backed community models
3. How Indigenous-led organisations — who work with the communities most affected — are being supported and funded proportionally

The data I've referenced is publicly available at justicehub.com.au. I encourage your office to review the following resources:

• Wall of Proof: justicehub.com.au/proof
• Cost Calculator: justicehub.com.au/calculator
• Funding Trail: justicehub.com.au/follow-the-money
• ${stateName} Scorecard: justicehub.com.au/states/${state.toLowerCase()}

I look forward to your response.

${name ? `Yours sincerely,\n${name}` : 'Yours sincerely,\n[Your name]'}
${stateName} constituent`;
}

export function LetterGenerator({ stateData, nationalModels, avgCost, ratio, stateDetentionCosts }: LetterGeneratorProps) {
  const [state, setState] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  const sd = state ? stateData[state] : null;

  const letter = useMemo(() => {
    if (!state || !sd) return '';
    return generateLetter(state, sd, name, nationalModels, avgCost, ratio, stateDetentionCosts);
  }, [state, sd, name, nationalModels, avgCost, ratio, stateDetentionCosts]);

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
        <h2 className="font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Generate your letter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Your state
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#0A0A0A]/20 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <option value="">Select your state...</option>
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Your name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg border border-[#0A0A0A]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            />
          </div>
        </div>
      </div>

      {/* State stats */}
      {sd && (
        <div className="bg-[#0A0A0A] text-white rounded-xl p-6">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {STATE_NAMES[state]} data in your letter
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ${(stateDetentionCosts[state] || 1500).toLocaleString()}/day
              </p>
              <p className="text-xs text-white/40">detention cost</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {sd.almaModels}
              </p>
              <p className="text-xs text-white/40">ALMA models</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {sd.totalOrgs.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">organisations</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {sd.indigenousOrgs.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">Indigenous orgs</p>
            </div>
          </div>
        </div>
      )}

      {/* Letter preview */}
      {letter && (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#0A0A0A]/10 flex items-center justify-between">
            <h3 className="font-bold text-sm">Your letter</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-medium rounded-lg hover:bg-[#0A0A0A]/80 transition-colors"
            >
              {copied ? (
                <><Check className="w-3 h-3" /> Copied!</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy letter</>
              )}
            </button>
          </div>
          <div className="p-6">
            <pre className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap font-sans leading-relaxed">
              {letter}
            </pre>
          </div>
        </div>
      )}

      {/* How to send */}
      {letter && (
        <div className="bg-[#F5F0E8] rounded-xl border border-[#0A0A0A]/10 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-[#059669]" />
            <h3 className="font-bold text-sm">How to send it</h3>
          </div>
          <ol className="space-y-2 text-sm text-[#0A0A0A]/70">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#0A0A0A] shrink-0">1.</span>
              Find your MP at{' '}
              <a href="https://www.aph.gov.au/Senators_and_Members/Parliamentarian_Search_Results?q=&mem=1&par=-1&gen=0&ps=0" target="_blank" rel="noopener noreferrer" className="text-[#059669] underline">
                aph.gov.au
              </a>
              {' '}(federal) or your state parliament website.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#0A0A0A] shrink-0">2.</span>
              Copy the letter above and paste it into an email.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#0A0A0A] shrink-0">3.</span>
              Add your name and any personal experience that makes it real.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#0A0A0A] shrink-0">4.</span>
              Send it. Then share this page with someone else who should do the same.
            </li>
          </ol>
        </div>
      )}

      {/* No state selected */}
      {!state && (
        <div className="text-center py-12">
          <p className="text-sm text-[#0A0A0A]/40">
            Select your state above to generate a letter with your local data.
          </p>
        </div>
      )}
    </div>
  );
}
