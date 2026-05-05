/**
 * Experience Packages — buyer ladder + public experiences for the Contained tour.
 * Used on the intelligence dashboard (compact mode) and per-stop pages (full mode).
 */

const BUYER_PACKAGES = [
  {
    id: 'anchor',
    label: 'Anchor partnership',
    range: '$40K — $60K',
    audience: 'Aboriginal community-controlled organisations + frontline orgs',
    includes: [
      'Paid co-design week with the local team',
      'Four young people from the org paid as program facilitators across the activation',
      'Room 3 designed with the org, not parachuted in',
      'Three film shorts about the org\'s work',
      'Photo essay set, transcripts, audio',
      'A bound copy of the year volume',
    ],
  },
  {
    id: 'university',
    label: 'University partnership',
    range: '$25K — $40K',
    audience: 'UWA, USyd, RMIT, Flinders, UWA, Tasmania, Monash',
    includes: [
      'Dedicated university day inside the public open weeks',
      'Two paid postgraduate research positions embedded with the stop',
      'Peer-review-bound study from the activation',
      'Documentation pack as licensed teaching material',
      'Named seat on the year-end exhibition curation panel',
    ],
  },
  {
    id: 'civic',
    label: 'Civic partnership',
    range: '$20K — $35K',
    audience: 'Local councils, mayors, libraries, government departments',
    includes: [
      'Hosted week of council and constituency events inside the container',
      'Dedicated MP morning with civic-partner invitations',
      'Exhibition that lives on after the container moves, in their library or town hall',
      'Named civic-partner credit on the year volume',
    ],
  },
];

const PUBLIC_EXPERIENCES = [
  {
    id: 'walkthrough',
    label: 'The walk-through',
    pricing: 'Free for community + schools · $15–25 ticketed for general public',
    description: 'Thirty minutes. Three rooms. A lived-experience facilitator. Ticket data feeds the public-appetite dataset.',
  },
  {
    id: 'build-week',
    label: 'The build week',
    pricing: '$36K per stop, costed inside activation',
    description: 'Four young people paid $1,500 a week × 6 weeks. Trades, art, trauma-informed storytelling. They design their own Room 3 panel.',
  },
  {
    id: 'funder-evening',
    label: 'The funder evening',
    pricing: '$5K per stop, costed inside activation',
    description: 'Last Thursday of every stop. Thirty funders, thirty community leaders, thirty MPs walk through together. Conversation in the container, not a panel after it.',
  },
];

const ARTEFACTS = [
  {
    id: 'case-study',
    label: 'Per-stop case-study volume',
    pricing: '~$15K per stop, costed inside backbone',
    description: 'Published into JusticeHub at month-end of each stop. Photo, story, audio, transcript. Funders cite. Communities own.',
  },
  {
    id: 'year-volume',
    label: 'National year volume',
    pricing: '$60K, costed inside backbone',
    description: 'Bound book, end of year. Fifty to sixty named storytellers across nine stops. Ten film shorts. Three travelling exhibitions. Hand-deliverable to a board.',
  },
];

interface Props {
  /** "full" for per-stop pages (dark editorial), "compact" for the intel sidebar */
  mode?: 'full' | 'compact';
  /** Optional stop name to localise headlines */
  stopName?: string;
}

export function ExperiencePackages({ mode = 'full', stopName }: Props) {
  if (mode === 'compact') {
    return (
      <div className="p-3 space-y-3">
        <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Experience packages
        </div>

        <div className="space-y-2">
          {BUYER_PACKAGES.map((p) => (
            <div key={p.id} className="border border-white/10 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-[#F5F0E8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {p.label}
                </span>
                <span className="text-[12px] text-[#DC2626] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {p.range}
                </span>
              </div>
              <p className="text-[12px] text-[#F5F0E8]/90 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {p.audience}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Public experiences
          </div>
          {PUBLIC_EXPERIENCES.map((e) => (
            <div key={e.id} className="text-[12px] text-[#F5F0E8]/95 mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              ○ {e.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full mode (per-stop page)
  const stop = stopName ?? 'this stop';
  return (
    <section className="px-4 py-16 border-t border-gray-800 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Experience packages
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#F5F0E8] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          What partners can buy at {stop}
        </h2>
        <p className="text-sm text-[#F5F0E8]/90 max-w-2xl mb-12" style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>
          Three buyer tiers sold against any stop. Three public experiences inside every activation. Two consumable artefacts produced as the container moves on.
        </p>

        {/* Buyer ladder */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {BUYER_PACKAGES.map((p) => (
            <div key={p.id} className="border border-white/10 p-6 bg-gray-950">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg font-bold text-[#F5F0E8] uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                  {p.label}
                </h3>
                <span className="text-sm font-bold text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {p.range}
                </span>
              </div>
              <p className="text-xs text-[#F5F0E8]/95 mb-4 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {p.audience}
              </p>
              <ul className="space-y-2">
                {p.includes.map((item, i) => (
                  <li key={i} className="text-xs text-[#F5F0E8]/90 flex gap-2" style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>
                    <span className="text-[#059669] flex-shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Public experiences + artefacts */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#F5F0E8]/90 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Three public experiences
            </p>
            <div className="space-y-4">
              {PUBLIC_EXPERIENCES.map((e) => (
                <div key={e.id} className="border-l-2 border-[#DC2626] pl-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="text-base font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {e.label}
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#DC2626] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {e.pricing}
                  </p>
                  <p className="text-xs text-[#F5F0E8]/90 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {e.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#F5F0E8]/90 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Two consumable artefacts
            </p>
            <div className="space-y-4">
              {ARTEFACTS.map((a) => (
                <div key={a.id} className="border-l-2 border-[#059669] pl-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="text-base font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {a.label}
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#059669] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {a.pricing}
                  </p>
                  <p className="text-xs text-[#F5F0E8]/90 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
