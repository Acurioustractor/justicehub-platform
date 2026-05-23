/**
 * Hook content for the kiosk attract loop.
 *
 * The cold-start screen plays the first entry. After 60s of idle, the rotator
 * cycles through all entries every 10s. Each tap resets to the lens grid.
 *
 * To swap in real Empathy Ledger photos: replace `image` with a path under
 * /public/images/ or an EL CDN URL. The slug field links the tap target to
 * the org's /sites/[slug] page.
 */

export type HookKind = 'portrait' | 'number' | 'live_counts';

export interface HookEntry {
  /** Display name as the visitor sees it. */
  name: string;
  /** Org name. */
  org: string;
  /** Place name; uses Indigenous name first per CLAUDE.md rules. */
  place: string;
  /** Their voice — a real or attributed quote. Keep <140 chars. */
  quote: string;
  /** Image URL or local /public path. */
  image: string;
  /** Org slug for the "Stay with X" CTA on screen 2. Null = no org page. */
  slug: string | null;
  /** State code (used for sorting / Adelaide-soft-highlight). */
  state: 'NT' | 'QLD' | 'NSW' | 'VIC' | 'WA' | 'SA' | 'TAS' | 'ACT' | null;
  /** Render variant. Default 'portrait'. */
  kind?: HookKind;
  /**
   * For 'live_counts' kind: dynamic numbers shown as a typographic moment.
   * Populated server-side at render time.
   */
  liveCounts?: {
    triangulated: number;
    totalClaims: number;
    accos: number;
    tier1: number;
  };
}

const SUPABASE_MEDIA = 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained/gallery';

export const HOOK_ENTRIES: HookEntry[] = [
  {
    name: 'Oonchiumpa',
    org: 'Oonchiumpa Consultancy & Services',
    place: 'Mparntwe (Alice Springs)',
    quote: 'We have been doing this work for twelve years. The data is finally catching up.',
    image: `${SUPABASE_MEDIA}/oonchiumpa-hero.jpg`,
    slug: 'oonchiumpa',
    state: 'NT',
  },
  {
    name: 'Palm Island Community Company',
    org: 'PICC',
    place: 'Bwgcolman (Palm Island) · Townsville',
    quote: 'When the community runs the program, the children stay home.',
    image: '/images/orgs/picc/stretch-bed-build.jpg',
    slug: 'palm-island-community-company',
    state: 'QLD',
  },
  {
    name: 'BG Fit',
    org: 'BG Fit',
    place: 'Bundaberg',
    quote: 'Fitness is the door we open. Belonging is what we offer behind it.',
    image: `${SUPABASE_MEDIA}/bgfit-hero.jpg`,
    slug: 'bg-fit',
    state: 'QLD',
  },
  {
    name: 'Minjerribah Moorgumpin Elders',
    org: 'MMEIC',
    place: 'Minjerribah (North Stradbroke Island)',
    quote: 'The Elders speak first. Then everyone else.',
    image: '',
    slug: 'minjerribah-moorgumpin-elders-in-council-aboriginal-corporation',
    state: 'QLD',
  },
  {
    name: 'Olabud Doogethu',
    org: 'Olabud Doogethu Aboriginal Corporation',
    place: 'Halls Creek (Kimberley)',
    quote: 'Place-based justice. Our young people, our way, on our Country.',
    image: '',
    slug: 'olabud-doogethu',
    state: 'WA',
  },
  {
    name: 'The Number',
    org: 'The cost asymmetry',
    place: 'Australia',
    quote: '$1,330,000 to lock up one child for one year. $36,869 to support them in community. 32× cheaper.',
    image: '',
    slug: null,
    state: null,
    kind: 'number',
  },
  {
    name: 'The Centre',
    org: 'Centre of Excellence',
    place: 'Australia',
    quote: 'Every fact here earns its headline by multiple independent sources.',
    image: '',
    slug: null,
    state: null,
    kind: 'live_counts',
  },
];

/** Sorted with the kiosk's "soft Adelaide highlight" applied: SA → NT → QLD → others. */
export function sortedForAdelaide(): HookEntry[] {
  const order: Record<string, number> = { SA: 0, NT: 1, QLD: 2, WA: 3, NSW: 4, VIC: 5, TAS: 6, ACT: 7 };
  return [...HOOK_ENTRIES].sort((a, b) => {
    const aRank = a.state ? (order[a.state] ?? 99) : 99;
    const bRank = b.state ? (order[b.state] ?? 99) : 99;
    return aRank - bRank;
  });
}
