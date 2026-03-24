'use client';

import { Mic, Camera, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface DayCapture {
  day: number;
  date: string;
  title: string;
  prompts: string[];
  photoSuggestions: string[];
}

interface StoryCaptureCardProps {
  tripName: string;
  days: DayCapture[];
}

export function StoryCaptureCard({ tripName, days }: StoryCaptureCardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#0A0A0A]/10">
        <h3
          className="font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Story Capture Guide
        </h3>
        <p className="text-xs text-[#0A0A0A]/50 mt-1">
          Daily prompts for voice recordings and photo documentation — {tripName}
        </p>
      </div>

      <div className="divide-y divide-[#0A0A0A]/5">
        {days.map((day) => {
          const isExpanded = expandedDay === day.day;
          return (
            <div key={day.day}>
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-[#0A0A0A]/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span
                    className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 w-12"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Day {day.day}
                  </span>
                  <span className="text-sm font-medium">{day.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-4 space-y-4">
                  {/* Voice prompts */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-3.5 h-3.5 text-[#059669]" />
                      <span
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Voice Reflection Prompts
                      </span>
                    </div>
                    <ul className="space-y-1.5 ml-5">
                      {day.prompts.map((p, i) => (
                        <li key={i} className="text-sm text-[#0A0A0A]/70">
                          &ldquo;{p}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Photo suggestions */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-3.5 h-3.5 text-[#059669]" />
                      <span
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Photo Opportunities
                      </span>
                    </div>
                    <ul className="space-y-1.5 ml-5">
                      {day.photoSuggestions.map((p, i) => (
                        <li key={i} className="text-xs text-[#0A0A0A]/50">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-built data for Oonchiumpa SEQ trip
export const OONCHIUMPA_SEQ_CAPTURES: DayCapture[] = [
  {
    day: 1,
    date: 'Monday 8 June',
    title: 'Minjerribah — MMEIC',
    prompts: [
      'What struck you most about how MMEIC has been running for 31 years?',
      'What parallels do you see between Quandamooka and Arrernte approaches to youth and justice?',
      'What would it look like if Oonchiumpa was still going strong in 31 years?',
    ],
    photoSuggestions: [
      'Welcome to Country ceremony (with permission)',
      'Group during yarn circle at MMEIC',
      'Cultural heritage sites on Minjerribah',
      'Team on the ferry — journey shot',
    ],
  },
  {
    day: 2,
    date: 'Tuesday 9 June',
    title: 'Toowoomba — Adapt Mentorship',
    prompts: [
      'How does Adapt\'s sport-based approach compare to Oonchiumpa\'s cultural brokerage model?',
      'What did you learn about how multiple orgs in one region can complement rather than compete?',
      'What would a Toowoomba-style ecosystem look like in Mparntwe?',
    ],
    photoSuggestions: [
      'Street Footy session with Adapt team',
      'Adam & Susy with Oonchiumpa team',
      'Program walkthrough — the work in action',
      'Lunch and yarn circle',
    ],
  },
  {
    day: 3,
    date: 'Wednesday 10 June',
    title: 'Brisbane — Culture & YAC',
    prompts: [
      'How does art tell the justice story? What did you see at QAGOMA that connected?',
      'What could a partnership between YAC and Oonchiumpa look like?',
      'What does it feel like being in an urban First Nations space like Musgrave Park?',
    ],
    photoSuggestions: [
      'QAGOMA First Nations collection pieces (where permitted)',
      'Musgrave Park community space',
      'Birrunga Gallery visit',
      'YAC Brisbane — team meeting',
    ],
  },
  {
    day: 4,
    date: 'Thursday 11 June',
    title: 'Witta — Manufacturing Day 1',
    prompts: [
      'What was it like shredding your first batch of plastic and pressing your first sheet?',
      'How does this manufacturing process connect to what your community needs?',
      'What excites you most about the Alice Springs facility?',
    ],
    photoSuggestions: [
      'Team at the containerised facility',
      'Hands-on shredding and sorting',
      'Press operations — making sheets',
      'First production run — team with their output',
      'Campfire dinner — the group together',
    ],
  },
  {
    day: 5,
    date: 'Friday 12 June',
    title: 'Witta — Design & Business Planning',
    prompts: [
      'What Arrernte design language would you put on the products?',
      'How does Oonchiumpa Goods fit into the bigger picture of what you\'re building?',
      'What are you taking home from this week?',
    ],
    photoSuggestions: [
      'Full bed assembly from flat-pack',
      'Cultural design concepts on paper/whiteboard',
      'Business planning session — the team working together',
      'Product samples completed',
      'Reflection circle',
    ],
  },
  {
    day: 6,
    date: 'Saturday 13 June',
    title: 'Workshop & Departure',
    prompts: [
      'What\'s the one thing you\'re taking home from this trip?',
      'What\'s your one commitment — what will you do differently?',
      'How has this trip changed what you think is possible for Oonchiumpa?',
    ],
    photoSuggestions: [
      'Ways of Working workshop — collaboration in action',
      'Year planning session',
      'Individual commitment sharing moment',
      'Group photo — the full team, last day',
    ],
  },
];
