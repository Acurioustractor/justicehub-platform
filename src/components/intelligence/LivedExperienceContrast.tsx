'use client';

import * as React from 'react';
import { Shield, VolumeX, MessageSquareQuote } from 'lucide-react';
import { EmpathyStoryCard, type EmpathyStory } from './EmpathyStoryCard';
import type { HansardEntry } from './HansardList';

export default function LivedExperienceContrast({ 
  hansard, 
  stories 
}: { 
  hansard: HansardEntry[], 
  stories: EmpathyStory[] 
}) {
  // Grab a few hard-hitting or highly punitive sounding speeches from the list
  // Usually this would be driven by the "stance:punitive" tag from ALMA, but for now we fallback to regex
  const punitiveSpeeches = hansard.filter(h => 
    (h.body_text || '').toLowerCase().includes('detention') || 
    (h.body_text || '').toLowerCase().includes('offender') ||
    (h.body_text || '').toLowerCase().includes('punish') ||
    (h.subject || '').toLowerCase().includes('crime')
  ).slice(0, 4);

  // If we don't have enough, just use whatever is listed
  const leftItems = punitiveSpeeches.length > 0 ? punitiveSpeeches : hansard.slice(0, 4);
  const rightItems = stories.slice(0, 4);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Column: Political Rhetoric */}
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b border-[#0A0A0A]/10 pb-4">
            <VolumeX className="w-6 h-6 text-[#DC2626]" />
            <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The Political Rhetoric
            </h3>
          </div>
          
          <div className="space-y-6">
            {leftItems.map((h, i) => (
              <div key={h.id || i} className="bg-[#f8f9fa] border-l-4 border-[#0A0A0A]/20 p-6 rounded-r-xl">
                <Shield className="w-5 h-5 text-[#0A0A0A]/30 mb-4" />
                <blockquote className="text-lg font-medium text-[#0A0A0A]/80 leading-relaxed mb-4">
                  "{(h.body_text || '').slice(0, 200).trim()}..."
                </blockquote>
                <div className="text-xs font-mono text-[#0A0A0A]/50 flex items-center gap-2 uppercase tracking-wider">
                  <span className="font-bold text-[#0A0A0A]/70">{h.speaker_name || 'Parliamentary Record'}</span>
                  {h.party && (
                    <>
                      <span>|</span>
                      <span>{h.party}</span>
                    </>
                  )}
                  {h.date && (
                    <>
                      <span>|</span>
                      <span>{new Date(h.date).getFullYear()}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {leftItems.length === 0 && (
               <div className="p-8 border border-dashed border-[#0A0A0A]/20 rounded-xl text-center text-[#0A0A0A]/40 font-mono text-sm">
                 No speeches available.
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Lived Experience */}
        <div className="flex flex-col space-y-6 mt-12 lg:mt-0">
          <div className="flex items-center gap-2 mb-4 border-b border-[#0A0A0A]/10 pb-4">
            <MessageSquareQuote className="w-6 h-6 text-[#059669]" />
            <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The Lived Experience
            </h3>
          </div>
          
          <div className="space-y-6">
            {rightItems.map((story, i) => (
              <div key={story.id || i} className="h-80 sm:h-96">
                <EmpathyStoryCard story={story} />
              </div>
            ))}
            {rightItems.length === 0 && (
               <div className="p-8 border border-dashed border-[#0A0A0A]/20 rounded-xl text-center text-[#0A0A0A]/40 font-mono text-sm">
                 No stories available for this region.
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
