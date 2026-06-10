/**
 * Founding anchor communities for the community action-profile experience.
 *
 * Governance note: only these four community-controlled organisations are
 * surfaced publicly at this stage. Every other organisation in the database
 * stays unlisted until it has been through a co-design round (see
 * docs/community-profiles/org-profile-spec.md, build order step 1).
 *
 * Lookup is deterministic. Each anchor carries an ILIKE pattern that resolves
 * to exactly one row in `organizations` (verified 2026-06-10). The slug is the
 * stable public URL key, decoupled from the database `slug` column so a name
 * change in the database never breaks a published profile link.
 *
 * If an anchor cannot be found by its ILIKE pattern, the profile route still
 * renders from the fallback identity here, with an empty-state for programs.
 */

export interface AnchorCommunity {
  /** Stable public URL key, used in /communities/[slug]. */
  slug: string;
  /** Display name on the profile (overrides the database name for consistency). */
  name: string;
  /** Country and place line, written by hand (place names first, colonial in brackets). */
  place: string;
  /** Short one-line description of the community-controlled work. */
  summary: string;
  /**
   * ILIKE pattern matched against organizations.name. Each pattern resolves to
   * exactly one organisation. Used for deterministic lookup, not display.
   */
  ilikePattern: string;
  /** Fallback identity used if the organisation cannot be found in the database. */
  fallback: {
    state: string | null;
    isIndigenousOrg: boolean;
  };
}

export const ANCHOR_COMMUNITIES: AnchorCommunity[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    place: 'Mparntwe (Alice Springs), Northern Territory. Arrernte and Eastern Arrernte Country.',
    summary:
      'Aboriginal-led mentorship, cultural healing, and service navigation across seven Central Australian language groups.',
    ilikePattern: 'oonchiumpa',
    fallback: { state: 'NT', isIndigenousOrg: true },
  },
  {
    slug: 'palm-island-community-company',
    name: 'Palm Island Community Company',
    place: 'Palm Island, Queensland. Bwgcolman Country. Operations also at The Centre, Townsville.',
    summary:
      'Community-owned organisation running services, infrastructure, and employment on and beyond Palm Island.',
    ilikePattern: 'palm island community company',
    fallback: { state: 'QLD', isIndigenousOrg: true },
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    place: 'Mount Isa, Queensland, with Doomadgee outreach.',
    summary:
      'Fitness, cultural camps, and remote outreach that keep young people connected and out of contact with police.',
    ilikePattern: 'bg fit',
    fallback: { state: 'QLD', isIndigenousOrg: true },
  },
  {
    slug: 'mmeic',
    name: 'Minjerribah Moorgumpin Elders-in-Council',
    place: 'Minjerribah (North Stradbroke Island), Queensland. Quandamooka Country.',
    summary:
      'Elder governance continuous on Quandamooka Country since 1993, holding cultural authority for young people and families.',
    ilikePattern: 'minjerribah moorgumpin elders-in-council%',
    fallback: { state: 'QLD', isIndigenousOrg: true },
  },
];

/** Look up an anchor by its public slug. */
export function getAnchorBySlug(slug: string): AnchorCommunity | undefined {
  return ANCHOR_COMMUNITIES.find((a) => a.slug === slug);
}
